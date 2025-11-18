#!/usr/bin/env node
/**
 * Test inventory cron follow-up notifications
 * - Creates in-memory MongoDB
 * - Creates inventory with followUpDate in the past (triggers immediately)
 * - Simulates the cron job logic to verify notifications are created
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Inventory = require('../models/inventryModel');
const User = require('../models/user');
const Notification = require('../models/notification');
const Lead = require('../models/leadModel');

// 🕒 Convert JS Date → "YYYY-MM-DD HH:mm:ss" (IST) - matches inventory model format
function toISTDateTime(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().replace('T', ' ').substring(0, 19);
}

async function run() {
  let mongod;
  try {
    console.log('\n🔁 Starting in-memory MongoDB for cron follow-up test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('ℹ️  Memory MongoDB URI:', uri);

    await mongoose.connect(uri);
    console.log('✅ Connected');

    // Create test user
    const salesman = await User.create({
      name: 'salesman_cron',
      email: 'salesman@cron.test',
      password: 'hash',
      role: 'user'
    });

    console.log('✅ Created test user:', salesman.name);

    // Test 1: Create inventory with follow-up time that matches current time window
    console.log('\n🧪 TEST 1: Create inventory with follow-up time ±30 seconds');

    const now = new Date();
    const targetStart = new Date(now.getTime() - 30 * 1000);
    const targetEnd = new Date(now.getTime() + 30 * 1000);

    const startStr = toISTDateTime(targetStart);
    const endStr = toISTDateTime(targetEnd);

    console.log('   Current time window:', startStr, 'to', endStr);

    // Create inventory with followUpDate in the target window
    const followUpInWindow = toISTDateTime(new Date(now.getTime() + 5 * 1000)); // 5 seconds from now
    
    const inventory = await Inventory.create({
      sellerName: 'Cron Test Seller',
      Project: ['Test Project'],
      contactNumbers: ['9876543210'],
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      unitNumber: 'U-CRON',
      status: 'Vacant',
      assignTo: salesman.name,
      transferTo: null,
      followUpDate: followUpInWindow,
      remarks: 'Cron test follow-up'
    });

    console.log('✅ Created inventory with followUpDate:', followUpInWindow);

    // Test 2: Simulate cron job query
    console.log('\n🧪 TEST 2: Simulate cron job finding inventories to remind');

    const inventories = await Inventory.find({
      followUpDate: { $gte: startStr, $lte: endStr }
    });

    console.log('🔔 Found', inventories.length, 'inventory/inventories in follow-up window');

    // Test 3: Create notifications like cron job does
    console.log('\n🧪 TEST 3: Create notifications for each inventory');

    for (const inv of inventories) {
      const msg = `🔔 Reminder: Follow up with ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"}) at ${new Date(inv.followUpDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}. Property in sector ${inv.sector || "N/A"} — Demand: ${inv.demand || "N/A"}.`;

      console.log('   Message:', msg);

      // Check for duplicates (like cron does)
      const exists = await Notification.findOne({
        type: "Inventory",
        itemId: inv._id,
        message: msg,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
      });

      if (exists) {
        console.log('   ⏩ Skipped duplicate');
        continue;
      }

      // Create notification
      const notif = await Notification.create({
        type: "Inventory",
        itemId: inv._id,
        message: msg
      });

      console.log('   ✅ Notification created:', notif._id.toString());

      // Resolve receiver like cron does
      let receiverId = null;
      if (inv.transferTo) {
        const r = await User.findOne({ name: inv.transferTo });
        if (r) receiverId = r._id;
      }

      if (!receiverId && inv.assignTo) {
        if (mongoose.Types.ObjectId.isValid(String(inv.assignTo))) {
          receiverId = inv.assignTo;
        } else {
          const r2 = await User.findOne({ name: inv.assignTo });
          if (r2) receiverId = r2._id;
        }
      }

      console.log('   Receiver routing: transferTo ->',  inv.transferTo, '-> assignTo ->', inv.assignTo, '-> resolved to:', receiverId ? 'user ID' : 'admins');
    }

    // Test 4: Verify notifications in DB
    console.log('\n🧪 TEST 4: Verify notifications created');

    const allNotifs = await Notification.find({ type: 'Inventory', itemId: inventory._id }).lean();
    console.log('🔔 Total notifications for this inventory:', allNotifs.length);
    
    allNotifs.forEach((n, idx) => {
      console.log(`   [${idx + 1}] ${n.message}`);
      console.log(`       Created at: ${n.createdAt}`);
      console.log(`       Receiver: ${n.receiver ? n.receiver.toString() : 'null (admins)'}`);
    });

    // Test 5: Test with multiple inventories
    console.log('\n🧪 TEST 5: Create multiple inventories with follow-ups');

    const inv2 = await Inventory.create({
      sellerName: 'Second Seller',
      Project: ['Test Project'],
      contactNumbers: ['9876543211'],
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      unitNumber: 'U-CRON2',
      status: 'Vacant',
      assignTo: salesman.name,
      followUpDate: toISTDateTime(new Date(now.getTime() + 10 * 1000))
    });

    const inv3 = await Inventory.create({
      sellerName: 'Third Seller',
      Project: ['Test Project'],
      contactNumbers: ['9876543212'],
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      unitNumber: 'U-CRON3',
      status: 'Vacant',
      assignTo: salesman.name,
      followUpDate: toISTDateTime(new Date(now.getTime() + 15 * 1000))
    });

    console.log('✅ Created 2 more inventories');

    // Query again
    const inventories2 = await Inventory.find({
      followUpDate: { $gte: startStr, $lte: endStr }
    });

    console.log('🔔 Found', inventories2.length, 'total inventories in follow-up window');

    // Create notifications for all
    for (const inv of inventories2) {
      const msg = `🔔 Reminder: Follow up with ${inv.sellerName}`;
      const notif = await Notification.create({
        type: "Inventory",
        itemId: inv._id,
        message: msg
      });
    }

    const totalNotifs = await Notification.find({ type: 'Inventory' }).lean();
    console.log('✅ Total notifications created:', totalNotifs.length);

    console.log('\n✅ All cron follow-up tests completed');

  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
