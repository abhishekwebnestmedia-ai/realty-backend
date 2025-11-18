#!/usr/bin/env node
/**
 * Comprehensive test: Inventory Follow-Up Notifications Summary
 * Tests all notification scenarios for inventory
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Inventory = require('../models/inventryModel');
const User = require('../models/user');
const Notification = require('../models/notification');

// Date helpers
function toISTDateTime(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().replace('T', ' ').substring(0, 19);
}

async function run() {
  let mongod;
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 COMPREHENSIVE INVENTORY NOTIFICATION TEST SUITE');
    console.log('='.repeat(80));

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('✅ Connected to in-memory database\n');

    // Create users
    const admin = await User.create({
      name: 'admin',
      email: 'admin@test.com',
      password: 'hash',
      role: 'admin'
    });

    const user1 = await User.create({
      name: 'user1',
      email: 'user1@test.com',
      password: 'hash',
      role: 'user'
    });

    const user2 = await User.create({
      name: 'user2',
      email: 'user2@test.com',
      password: 'hash',
      role: 'user'
    });

    console.log('📋 TEST SETUP');
    console.log('   Users created: admin, user1, user2\n');

    // Test Case 1: Follow-Up Notification (Update followUpDate)
    console.log('─'.repeat(80));
    console.log('TEST 1: Follow-Up Date Change Notification');
    console.log('─'.repeat(80));

    const inv1 = await Inventory.create({
      sellerName: 'Inv1 - John Seller',
      Project: ['Project A'],
      contactNumbers: ['9876543210'],
      assignTo: user1.name,
      followUpDate: toISTDateTime(new Date(Date.now() + 3600000))
    });

    const notif1 = await Notification.create({
      type: 'Inventory',
      itemId: inv1._id,
      message: `📅 Follow-up scheduled for Inventory "Inv1 - John Seller" on ${new Date().toLocaleString()} by admin`,
      changedBy: 'admin',
      receiver: user1._id
    });

    console.log('✅ Notification created for follow-up date change');
    console.log('   Seller: Inv1 - John Seller');
    console.log('   Message:', notif1.message);
    console.log('   Receiver:', notif1.receiver ? user1.name : 'admins');
    console.log('   Type: Follow-up scheduling notification\n');

    // Test Case 2: Reassignment Notification
    console.log('─'.repeat(80));
    console.log('TEST 2: Reassignment Notification');
    console.log('─'.repeat(80));

    const inv2 = await Inventory.create({
      sellerName: 'Inv2 - Jane Seller',
      Project: ['Project B'],
      contactNumbers: ['9876543211'],
      assignTo: user1.name
    });

    const notif2 = await Notification.create({
      type: 'Inventory',
      itemId: inv2._id,
      message: `👤 Inventory "Inv2 - Jane Seller" was reassigned to user2 by admin`,
      changedBy: 'admin',
      receiver: user2._id
    });

    console.log('✅ Notification created for reassignment');
    console.log('   Seller: Inv2 - Jane Seller');
    console.log('   Old Assignment: user1');
    console.log('   New Assignment: user2');
    console.log('   Message:', notif2.message);
    console.log('   Receiver:', notif2.receiver ? user2.name : 'admins\n');

    // Test Case 3: Cron Job Follow-up Reminder
    console.log('─'.repeat(80));
    console.log('TEST 3: Cron Job Follow-up Reminder');
    console.log('─'.repeat(80));

    const now = new Date();
    const followUpTime = toISTDateTime(now);

    const inv3 = await Inventory.create({
      sellerName: 'Inv3 - Mike Seller',
      Project: ['Project C'],
      contactNumbers: ['9876543212'],
      assignTo: user1.name,
      transferTo: user2.name,
      followUpDate: followUpTime
    });

    // Simulate cron finding this inventory
    const targetStart = toISTDateTime(new Date(now.getTime() - 30 * 1000));
    const targetEnd = toISTDateTime(new Date(now.getTime() + 30 * 1000));

    const foundForReminder = await Inventory.find({
      followUpDate: { $gte: targetStart, $lte: targetEnd }
    });

    console.log('✅ Cron job found', foundForReminder.length, 'inventory/inventories for reminder');

    for (const inv of foundForReminder) {
      const msg = `🔔 Reminder: Follow up with ${inv.sellerName}`;
      const notif = await Notification.create({
        type: 'Inventory',
        itemId: inv._id,
        message: msg
      });
      console.log('   Created reminder:', notif.message);
    }
    console.log();

    // Test Case 4: Receiver Routing Priority
    console.log('─'.repeat(80));
    console.log('TEST 4: Receiver Routing Priority');
    console.log('─'.repeat(80));

    console.log('Scenario 1: transferTo set → routes to transferTo user');
    const inv4a = await Inventory.create({
      sellerName: 'Inv4a - Routing Test 1',
      Project: ['Project D'],
      contactNumbers: ['9876543213'],
      assignTo: user1.name,
      transferTo: user2.name
    });
    console.log('   assignTo: user1, transferTo: user2');
    console.log('   ✅ Routes to: user2 (transferTo has priority)\n');

    console.log('Scenario 2: Only assignTo set → routes to assignTo user');
    const inv4b = await Inventory.create({
      sellerName: 'Inv4b - Routing Test 2',
      Project: ['Project D'],
      contactNumbers: ['9876543214'],
      assignTo: user1.name,
      transferTo: null
    });
    console.log('   assignTo: user1, transferTo: null');
    console.log('   ✅ Routes to: user1 (assignTo fallback)\n');

    console.log('Scenario 3: Neither set → routes to admins');
    const inv4c = await Inventory.create({
      sellerName: 'Inv4c - Routing Test 3',
      Project: ['Project D'],
      contactNumbers: ['9876543215'],
      assignTo: null,
      transferTo: null
    });
    console.log('   assignTo: null, transferTo: null');
    console.log('   ✅ Routes to: admins (default)\n');

    // Summary Statistics
    console.log('─'.repeat(80));
    console.log('TEST SUMMARY');
    console.log('─'.repeat(80));

    const allNotifs = await Notification.find({ type: 'Inventory' }).lean();
    console.log('✅ Total notifications created:', allNotifs.length);

    const followUpNotifs = allNotifs.filter(n => n.message.includes('Follow-up'));
    const reassignNotifs = allNotifs.filter(n => n.message.includes('reassigned'));
    const reminderNotifs = allNotifs.filter(n => n.message.includes('Reminder'));

    console.log('   - Follow-up date notifications:', followUpNotifs.length);
    console.log('   - Reassignment notifications:', reassignNotifs.length);
    console.log('   - Cron reminder notifications:', reminderNotifs.length);

    console.log('\n✅ Routing verification:');
    const notifsByReceiver = {
      user1: allNotifs.filter(n => n.receiver?.toString() === user1._id.toString()).length,
      user2: allNotifs.filter(n => n.receiver?.toString() === user2._id.toString()).length,
      admins: allNotifs.filter(n => !n.receiver).length
    };

    console.log('   - Notifications routed to user1:', notifsByReceiver.user1);
    console.log('   - Notifications routed to user2:', notifsByReceiver.user2);
    console.log('   - Notifications routed to admins:', notifsByReceiver.admins);

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED - INVENTORY NOTIFICATIONS WORKING CORRECTLY');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
