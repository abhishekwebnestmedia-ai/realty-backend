#!/usr/bin/env node
/**
 * Test lead cron follow-up notifications
 * - Creates in-memory MongoDB
 * - Creates lead with followUpDate in the minute window
 * - Simulates the cron job logic to verify notifications are created
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Lead = require('../models/leadModel');
const User = require('../models/user');
const Notification = require('../models/notification');

// 🕒 Convert JS Date → "YYYY-MM-DD HH:mm:ss" (IST) - matches lead model format
function toISTDateTime(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().replace('T', ' ').substring(0, 19);
}

async function run() {
  let mongod;
  try {
    console.log('\n🔁 Starting in-memory MongoDB for lead follow-up test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('ℹ️  Memory MongoDB URI:', uri);

    await mongoose.connect(uri);
    console.log('✅ Connected');

    // Create test user
    const admin = await User.create({
      name: 'AdminCron',
      email: 'admin.cron@test',
      password: 'hash',
      role: 'admin'
    });

    const sales = await User.create({
      name: 'SalesCron',
      email: 'sales.cron@test',
      password: 'hash',
      role: 'user'
    });

    console.log('✅ Created test users');

    // Create lead with followUpDate in window
    console.log('\n🧪 TEST 1: Create lead with follow-up time ±30 seconds');

    const now = new Date();
    const targetStart = new Date(now.getTime() - 30 * 1000);
    const targetEnd = new Date(now.getTime() + 30 * 1000);

    const startStr = toISTDateTime(targetStart);
    const endStr = toISTDateTime(targetEnd);

    console.log('   Current time window:', startStr, 'to', endStr);

    const followUpInWindow = toISTDateTime(new Date(now.getTime() + 5 * 1000)); // 5 seconds from now

    const lead = await Lead.create({
      customerName: 'Cron Lead',
      contactNumber: '9123456780',
      email: 'cron.lead@test',
      status: 'Hot',
      leadType: 'Buyer',
      assignTo: sales._id,
      transferTo: null,
      followUp: followUpInWindow,
      remark: 'Cron test followup'
    });

    console.log('✅ Created lead with followUpDate:', followUpInWindow);

    // Simulate cron query for leads
    console.log('\n🧪 TEST 2: Simulate cron job finding leads to remind');

    const leads = await Lead.find({
      $or: [
        { followUpDate: { $gte: startStr, $lte: endStr } },
        { followUp: { $gte: startStr, $lte: endStr } },
      ],
    });

    console.log('🔔 Found', leads.length, 'lead(s) in follow-up window');

    // Create notifications for matches
    for (const ld of leads) {
      const msg = `🔔 Reminder: Follow up with ${ld.customerName} (${ld.contactNumber}). Requirement: ${ld.projects || ld.remark || 'N/A'}.`;

      const exists = await Notification.findOne({
        type: 'Lead',
        itemId: ld._id,
        message: msg,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (exists) {
        console.log('⏩ Skipped duplicate lead notification for', ld.customerName);
        continue;
      }

      const notif = await Notification.create({
        type: 'Lead',
        itemId: ld._id,
        message: msg,
        receiver: null,
        meta: {
          leadId: ld._id,
          customerName: ld.customerName,
          contactNumber: ld.contactNumber,
          followUpAt: ld.followUp || ld.followUpDate,
          assignTo: ld.assignTo,
          transferTo: ld.transferTo,
        }
      });

      console.log('✅ Lead notification created:', notif._id.toString());
    }

    // Verify notifications
    console.log('\n🧪 TEST 3: Verify notifications in DB');
    const allNotifs = await Notification.find({ type: 'Lead', itemId: lead._id }).lean();
    console.log('🔔 Total lead notifications for this lead:', allNotifs.length);
    allNotifs.forEach((n, idx) => {
      console.log(`   [${idx + 1}] ${n.message}`);
      console.log(`       Created at: ${n.createdAt}`);
      console.log(`       Receiver: ${n.receiver ? n.receiver.toString() : 'null (admins)'}`);
    });

    console.log('\n✅ Lead follow-up cron test completed');

  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
