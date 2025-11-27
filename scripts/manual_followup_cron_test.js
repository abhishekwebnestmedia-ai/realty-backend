#!/usr/bin/env node

/**
 * Manual follow-up cron test runner
 *
 * - Connects to your real MongoDB (uses normal config)
 * - Creates 1 lead + 1 inventory + 1 broker with follow-ups ~30s in the future
 * - Waits, then calls processLeadFollowups / processInventoryFollowups / processBrokerFollowups directly
 * - Logs how many notifications were created
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Attempt to load a local .env (falls back to process env if missing)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Lead = require('../models/leadModel');
const Inventory = require('../models/inventryModel');
const Broker = require('../models/broker');
const Notification = require('../models/notification');
const { processLeadFollowups, processInventoryFollowups, processBrokerFollowups } = require('../services/followupCronService');
const dbConfig = require('../config/db');

(async () => {
  try {
    console.log('\n🔁 Connecting to MongoDB for manual follow-up cron test...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined. Set it in environment or .env file.');
    }
    await dbConfig();

    // Clean only our test docs from previous runs
    await Notification.deleteMany({ 'meta.testTag': 'manual_cron_test' });
    await Lead.deleteMany({ email: 'cron.test.lead@example.com' });
    await Inventory.deleteMany({ sellerName: 'Cron Test Inventory' });
    await Broker.deleteMany({ brokerName: 'Cron Test Broker' });

    const now = Date.now();
    const leadDueAt = new Date(now + 30_000);
    const inventoryDueAt = new Date(now + 35_000);
    const brokerDueAt = new Date(now + 40_000);

    console.log('🕒 Scheduling follow-ups at:', {
      leadDueAt,
      inventoryDueAt,
      brokerDueAt,
    });

    const lead = await Lead.create({
      customerName: 'Cron Test Lead',
      contactNumber: '9998887770',
      email: 'cron.test.lead@example.com',
      status: 'Hot',
      leadType: 'Buyer',
      followUpUtc: leadDueAt,
      followUp: leadDueAt.toISOString(),
    });

    const inventory = await Inventory.create({
      sellerName: 'Cron Test Inventory',
      contactNumbers: ['8887776665'],
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      followUpUtc: inventoryDueAt,
      followUpDate: inventoryDueAt,
    });

    const broker = await Broker.create({
      brokerName: 'Cron Test Broker',
      contactNumber: '7776665554',
      requirement: 'Cron test',
      followUpUtc: brokerDueAt,
      followUpDate: brokerDueAt,
    });

    console.log('\n✅ Seeded test docs:', {
      leadId: lead._id.toString(),
      inventoryId: inventory._id.toString(),
      brokerId: broker._id.toString(),
    });

    console.log('\n⏳ Waiting ~50 seconds for follow-up window...');
    await new Promise((resolve) => setTimeout(resolve, 50_000));

    const windowStart = new Date(Date.now() - 20_000);
    const windowEnd = new Date(Date.now() + 20_000);

    console.log('\n🔍 Processing follow-ups in window:', { windowStart, windowEnd });

    const leadCount = await processLeadFollowups(windowStart, windowEnd, 'due');
    const inventoryCount = await processInventoryFollowups(windowStart, windowEnd, 'due');
    const brokerCount = await processBrokerFollowups(windowStart, windowEnd, 'due');

    console.log('\n📬 Emitted follow-up notifications:', {
      leads: leadCount,
      inventory: inventoryCount,
      brokers: brokerCount,
    });

    const notifs = await Notification.find({ 'meta.event': 'followup' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log('\n🔔 Sample followup notifications:');
    notifs.forEach((n) => {
      console.log({
        _id: n._id,
        type: n.type,
        message: n.message,
        meta: n.meta,
        createdAt: n.createdAt,
      });
    });

    console.log('\n✅ Manual follow-up cron test finished');
  } catch (err) {
    console.error('\n❌ Manual follow-up cron test failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
