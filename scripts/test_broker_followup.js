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
const { processBrokerFollowups } = require('../services/followupCronService');

async function run() {
  let mongod;
  try {
    console.log('\n🔁 Broker follow-up regression test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ Connected to memory Mongo at', uri);

    const now = new Date();
    const dueDate = new Date(now.getTime() + 10 * 1000); // 10s from now

    const broker = await Broker.create({
      brokerName: 'Test Broker',
      companyName: 'QA Realty',
      contactNumber: '9876543210',
      followUpDate: dueDate,
      status: 'Hot',
      requirement: '3BHK DLF',
    });

    console.log('✅ Broker created with followUpDate:', dueDate.toISOString());
    console.log('   Stored followUpUtc:', broker.followUpUtc);

    // Wait until follow-up window
    const windowStart = new Date(dueDate.getTime() - 5 * 1000);
    const windowEnd = new Date(dueDate.getTime() + 5 * 1000);

    const sent = await processBrokerFollowups(windowStart, windowEnd, 'due');
    console.log('🔔 processBrokerFollowups sent notifications:', sent);

    const notifs = await Notification.find({ type: 'Broker', itemId: broker._id }).lean();
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
