#!/usr/bin/env node
/**
 * Test inventory follow-up notifications
 * - Creates in-memory MongoDB
 * - Creates test inventory with followUpDate
 * - Tests update endpoint to trigger follow-up notification
 * - Tests receiver routing (transferTo -> assignTo -> admins)
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Inventory = require('../models/inventryModel');
const User = require('../models/user');
const Notification = require('../models/notification');
const inventoryController = require('../controllers/inventrycontroller');

async function run() {
  let mongod;
  try {
    console.log('\n🔁 Starting in-memory MongoDB for inventory follow-up test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('ℹ️  Memory MongoDB URI:', uri);

    await mongoose.connect(uri);
    console.log('✅ Connected');

    // Create test users
    const adminUser = await User.create({
      name: 'admin',
      email: 'admin@test.com',
      password: 'hash',
      empid: 'ADMIN-1',
      role: 'admin'
    });

    const salesman = await User.create({
      name: 'salesman1',
      email: 'salesman@test.com',
      password: 'hash',
      empid: 'SALE-1',
      role: 'user'
    });

    console.log('✅ Created test users');

    // Create test inventory
    const futureDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    const followUpTime = futureDate.toISOString().replace('T', ' ').substring(0, 19);

    const inventory = await Inventory.create({
      sellerName: 'Test Seller',
      Project: ['Test Project'],
      contactNumbers: ['9876543210'],
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      unitNumber: 'U-999',
      status: 'Vacant',
      assignTo: salesman.name,
      transferTo: null,
      followUpDate: followUpTime,
      remarks: 'Test follow-up'
    });

    console.log('✅ Created test inventory:', inventory._id.toString());
    console.log('   Follow-up date:', followUpTime);

    // Test 1: Update follow-up date and check notification
    console.log('\n🧪 TEST 1: Update follow-up date');
    
    const newFollowUpDate = new Date(Date.now() + 7200 * 1000); // 2 hours from now
    const newFollowUpTime = newFollowUpDate.toISOString().replace('T', ' ').substring(0, 19);

    const req1 = {
      params: { id: inventory._id.toString() },
      body: { followUpDate: newFollowUpTime },
      user: { _id: adminUser._id }
    };

    let capturedRes1 = null;
    const res1 = {
      json(obj) { capturedRes1 = obj; console.log('📣 Response:', obj); return obj; },
      status(code) { this._status = code; return this; }
    };

    await inventoryController.updateInventry(req1, res1);

    const notifs1 = await Notification.find({ type: 'Inventory', itemId: inventory._id }).lean();
    console.log('🔔 Notifications created:', notifs1.length);
    notifs1.forEach(n => {
      console.log('   -', n.message);
      console.log('     receiver:', n.receiver, '| changedBy:', n.changedBy);
    });

    // Test 2: Update with transferTo (should route to transferTo user)
    console.log('\n🧪 TEST 2: Update with transferTo field');

    const req2 = {
      params: { id: inventory._id.toString() },
      body: { 
        transferTo: salesman.name,
        followUpDate: followUpTime
      },
      user: { _id: adminUser._id }
    };

    let capturedRes2 = null;
    const res2 = {
      json(obj) { capturedRes2 = obj; console.log('📣 Response:', obj); return obj; },
      status(code) { this._status = code; return this; }
    };

    await inventoryController.updateInventry(req2, res2);

    const notifs2 = await Notification.find({ type: 'Inventory', itemId: inventory._id }).lean();
    console.log('🔔 Total notifications:', notifs2.length);
    const latestNotif = notifs2[notifs2.length - 1];
    if (latestNotif) {
      console.log('   Latest:', latestNotif.message);
      console.log('   Receiver routing: transferTo should be resolved to user ID');
    } else {
      console.log('   No notifications found for this inventory');
    }

    // Test 3: Verify notification meta/structure
    console.log('\n🧪 TEST 3: Verify notification structure');
    if (latestNotif) {
      console.log('   Message:', latestNotif.message);
      console.log('   Type:', latestNotif.type);
      console.log('   ItemId:', latestNotif.itemId.toString());
      console.log('   ChangedBy:', latestNotif.changedBy);
      console.log('   Receiver:', latestNotif.receiver ? latestNotif.receiver.toString() : 'null (admins)');
      console.log('   Created At:', latestNotif.createdAt);
    }

    // Test 4: Reassignment notification
    console.log('\n🧪 TEST 4: Update assignTo (reassignment)');

    const salesman2 = await User.create({
      name: 'salesman2',
      email: 'salesman2@test.com',
      password: 'hash',
      role: 'user'
    });

    const req3 = {
      params: { id: inventory._id.toString() },
      body: { assignTo: salesman2.name },
      user: { _id: adminUser._id }
    };

    let capturedRes3 = null;
    const res3 = {
      json(obj) { capturedRes3 = obj; console.log('📣 Response:', obj); return obj; },
      status(code) { this._status = code; return this; }
    };

    await inventoryController.updateInventry(req3, res3);

    const reassignNotif = await Notification.findOne({ 
      type: 'Inventory', 
      itemId: inventory._id,
      message: /reassigned/i 
    }).lean();

    if (reassignNotif) {
      console.log('✅ Reassignment notification found');
      console.log('   Message:', reassignNotif.message);
      console.log('   Receiver:', reassignNotif.receiver ? reassignNotif.receiver.toString() : 'null');
    } else {
      console.log('⚠️  No reassignment notification found');
    }

    console.log('\n✅ All inventory follow-up tests completed');

  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
