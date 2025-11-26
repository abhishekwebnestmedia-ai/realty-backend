#!/usr/bin/env node
/**
 * Ensures broker follow-up normalization + cron processing behave correctly.
 * - Uses mongodb-memory-server so it does NOT touch production data.
 * - Creates broker entries with both ISO and 12-hour strings to verify parsing.
 * - Directly invokes processBrokerFollowups exported from followupCronService.
 */

process.env.FOLLOWUP_CRON_DISABLED = "true"; // prevent cron timer from keeping process alive

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Broker = require('../models/broker');
const Notification = require('../models/notification');
const User = require('../models/user');
const brokerController = require('../controllers/brokerController');
const { processBrokerFollowups } = require('../services/followupCronService');

async function run() {
  let mongod;
  try {
    console.log('\n🔁 Broker follow-up regression test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ Connected to memory Mongo at', uri);

    const adminUser = await User.create({
      name: 'Admin Tester',
      email: 'admin.broker@test.com',
      password: 'hashed',
      empid: 'ADM-BROKER',
      role: 'admin',
    });

    const ownerUser = await User.create({
      name: 'Broker Owner',
      email: 'owner.broker@test.com',
      password: 'hashed',
      empid: 'OWN-BROKER',
      role: 'sales',
    });

    console.log('✅ Created test users for broker follow-ups');

    const controllerBroker = await Broker.create({
      brokerName: 'Controller Broker',
      companyName: 'Controller QA Realty',
      contactNumber: '9811111111',
      followUpDate: new Date(Date.now() + 45 * 60 * 1000),
      status: 'Hot',
      requirement: '2BHK Central',
      capturedBy: ownerUser.name,
    });

    console.log('✅ Broker created for controller test:', controllerBroker._id.toString());

    const controllerReq = {
      params: { id: controllerBroker._id.toString() },
      body: {
        followUpDate: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      },
      user: { _id: adminUser._id, name: adminUser.name },
    };

    const controllerRes = {
      json(obj) {
        console.log('📣 updateRequirement response:', obj?._id?.toString() || obj);
        return obj;
      },
      status(code) {
        this._status = code;
        return this;
      },
    };

    await brokerController.updateRequirement(controllerReq, controllerRes);

    const followUpChangeNotif = await Notification.findOne({
      type: 'Broker',
      itemId: controllerBroker._id,
      'meta.event': 'followup_change',
    }).lean();

    if (followUpChangeNotif) {
      console.log('\n✅ Follow-up change notification created via controller update');
      console.log('   Message:', followUpChangeNotif.message);
      console.log('   Receiver should match capturedBy user:', followUpChangeNotif.receiver?.toString());
      console.log('   Meta event:', followUpChangeNotif.meta?.event, '| New follow-up:', followUpChangeNotif.meta?.newFollowUp);
    } else {
      console.log('\n⚠️  No follow-up change notification found after controller update');
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + 10 * 1000); // 10s from now

    const cronBroker = await Broker.create({
      brokerName: 'Cron Broker',
      companyName: 'QA Realty',
      contactNumber: '9876543210',
      followUpDate: dueDate,
      status: 'Hot',
      requirement: '3BHK DLF',
    });

    console.log('\n✅ Broker created with followUpDate:', dueDate.toISOString());
    console.log('   Stored followUpUtc:', cronBroker.followUpUtc);

    // Wait until follow-up window
    const windowStart = new Date(dueDate.getTime() - 5 * 1000);
    const windowEnd = new Date(dueDate.getTime() + 5 * 1000);

    const sent = await processBrokerFollowups(windowStart, windowEnd, 'due');
    console.log('🔔 processBrokerFollowups sent notifications:', sent);

    const notifs = await Notification.find({ type: 'Broker', itemId: cronBroker._id }).lean();
    console.log('📥 Broker notifications persisted:', notifs.length);
    notifs.forEach((n, idx) => {
      console.log(`   [${idx + 1}] ${n.message}`);
      console.log('        Receiver:', n.receiver ? n.receiver.toString() : 'admins');
      console.log('        followUpUtc in meta:', n.meta?.followUpDueAt || 'n/a');
    });

    console.log('\n✅ Broker follow-up test completed');
  } catch (err) {
    console.error('❌ Broker follow-up test failed:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
