#!/usr/bin/env node
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const ProjectType = require('../models/project');
const Inventory = require('../models/inventryModel');
const User = require('../models/user');
const Notification = require('../models/notification');
const projectController = require('../controllers/projectController');

async function run() {
  let mongod;
  try {
    console.log('\n=== Starting in-memory MongoDB for updateUnit notification test ===\n');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Create a test user (will be req.user)
    const admin = await User.create({ name: 'Tester', email: 'tester@example.com', password: 'pass', role: 'admin' });

    // Create ProjectType with full hierarchy and one unit
    const proj = new ProjectType({ category: 'Residential', projectcategory: 'ReadyToMove', cities: [
      {
        cityName: 'TestCity',
        divisions: [
          {
            divisionName: 'Div1',
            sectors: [
              {
                sectorName: 'Sec1',
                projects: [
                  {
                    projectName: 'P1',
                    towers: [
                      {
                        towerName: 'T1',
                        units: [
                          { unitNumber: 'U1', ownerName: 'Owner1', mobileNumbers: ['9999999999'], status: 'Vacant', assignTo: null }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]});

    await proj.save();

    const cityId = proj.cities[0]._id.toString();
    const divisionId = proj.cities[0].divisions[0]._id.toString();
    const sectorId = proj.cities[0].divisions[0].sectors[0]._id.toString();
    const projectId = proj.cities[0].divisions[0].sectors[0].projects[0]._id.toString();
    const towerId = proj.cities[0].divisions[0].sectors[0].projects[0].towers[0]._id.toString();
    const unitId = proj.cities[0].divisions[0].sectors[0].projects[0].towers[0].units[0]._id.toString();

    console.log('Created project hierarchy ids:', { cityId, divisionId, sectorId, projectId, towerId, unitId });

    // Prepare fake req/res
    const req = {
      params: {
        category: 'Residential',
        projectcategory: 'ReadyToMove',
        cityId,
        divisionId,
        sectorId,
        projectId,
        towerId,
        unitId
      },
      body: { status: 'Interested in calling' },
      user: { name: admin.name, _id: admin._id }
    };

    let captured;
    const res = {
      json(obj) { captured = obj; console.log('Response:', obj); return obj; },
      status(code) { this._status = code; return this; }
    };

    // Call updateUnit
    await projectController.updateUnit(req, res);

    const inv = await Inventory.findOne({ unitId });
    if (!inv) {
      console.error('❌ Inventory record was not created for the unit');
    } else {
      console.log('✅ Inventory created with type:', inv.inventoryType, ' assignTo:', inv.assignTo);
    }

    // Check notifications linked to the inventory record
    const notifs = await Notification.find({ type: 'Inventory', itemId: inv?._id });
    console.log('Notifications found for inventory:', notifs.length);
    notifs.forEach(n => console.log(' -', n.message, ' action:', n.action, ' receiver:', n.receiver));

    if (notifs.some(n => n.action === 'inventory_auto_sync')) console.log('✅ Auto-sync notification created');
    else console.error('❌ Expected auto-sync notification not found');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
