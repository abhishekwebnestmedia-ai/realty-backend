#!/usr/bin/env node
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const ProjectType = require('../models/project');
const Notification = require('../models/notification');
const projectController = require('../controllers/projectController');

async function run() {
  let mongod;
  try {
    console.log('\n🔁 Starting in-memory MongoDB for admin merge flow test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('ℹ️  Memory MongoDB URI:', uri);

    await mongoose.connect(uri);
    console.log('✅ Connected');

    const seed = new ProjectType({
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      cities: [
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
                      projectName: 'Proj1',
                      towers: [
                        { towerName: 'TowerA', units: [] }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    await seed.save();
    console.log('✅ Seeded ProjectType', seed._id.toString());

    const req = {
      body: {
        category: 'Residential',
        projectcategory: 'ReadyToMove',
        cities: [
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
                        projectName: 'Proj1',
                        towers: [
                          {
                            towerName: 'TowerA',
                            units: [
                              {
                                unitNumber: 'U-202',
                                status: 'Interested in calling',
                                assignTo: null,
                                transferTo: null
                              }
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
        ]
      },
      user: { name: 'admin', role: 'admin' }
    };

    let captured = null;
    const res = {
      status(code) { this._status = code; return this; },
      json(obj) { captured = obj; console.log('\n📣 Controller response:', obj); return obj; }
    };

    console.log('\n🚀 Invoking mergeOrCreateHierarchy as admin...');
    await projectController.mergeOrCreateHierarchy(req, res);

    const notifs = await Notification.find({}).lean();
    console.log('\n🔔 Notifications found:', notifs.length);
    notifs.forEach(n => {
      console.log('-', n.message, '| receiver:', n.receiver, '| createdAt:', n.createdAt);
      console.log('  Meta:', JSON.stringify(n.meta, null, 2));
    });

    const updated = await ProjectType.findOne({ category: 'Residential', projectcategory: 'ReadyToMove' });
    console.log('\n📦 Units in TowerA:', updated.cities[0].divisions[0].sectors[0].projects[0].towers[0].units.length);

    console.log('\n✅ Admin merge flow test completed');
  } catch (err) {
    console.error('❌ Admin Merge flow test error:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
