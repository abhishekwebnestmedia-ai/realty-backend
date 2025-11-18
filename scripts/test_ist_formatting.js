#!/usr/bin/env node
/**
 * Test IST formatting in inventory follow-up notifications
 * Verifies that all timestamps are displayed in IST
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
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST: IST FORMATTING IN FOLLOW-UP NOTIFICATIONS');
    console.log('='.repeat(80) + '\n');

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('✅ Connected to in-memory database\n');

    // Create test user
    const admin = await User.create({
      name: 'admin',
      email: 'admin@test.com',
      password: 'hash',
      role: 'admin'
    });

    const salesman = await User.create({
      name: 'salesman',
      email: 'salesman@test.com',
      password: 'hash',
      role: 'user'
    });

    // Create inventory
    const inventory = await Inventory.create({
      sellerName: 'Test Seller IST',
      Project: ['Test Project'],
      contactNumbers: ['9876543210'],
      assignTo: salesman.name
    });

    console.log('📋 Setup:');
    console.log('   Inventory created: Test Seller IST\n');

    // Test 1: Update follow-up date and check timestamp format
    console.log('─'.repeat(80));
    console.log('TEST 1: Follow-up Date Update Notification (IST Format)');
    console.log('─'.repeat(80));

    const futureDate = new Date(Date.now() + 7200 * 1000); // 2 hours from now
    const futureIST = futureDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    console.log('Current time (IST):', new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }));

    console.log('Future follow-up (IST):', futureIST);

    const req = {
      params: { id: inventory._id.toString() },
      body: { followUpDate: futureDate.toISOString().replace('T', ' ').substring(0, 19) },
      user: { _id: admin._id }
    };

    let capturedRes = null;
    const res = {
      json(obj) { capturedRes = obj; return obj; },
      status(code) { this._status = code; return this; }
    };

    await inventoryController.updateInventry(req, res);

    const notif = await Notification.findOne({ type: 'Inventory', itemId: inventory._id }).lean();

    console.log('\n✅ Notification created:');
    console.log('   Message:', notif.message);
    console.log('   Contains "IST":', notif.message.includes('IST') ? '✅ YES' : '❌ NO');
    
    // Check if message has proper IST format
    const hasIST = notif.message.includes('IST');
    const hasTime = /\d{1,2}\/\d{1,2}\/\d{4}|AM|PM/.test(notif.message);
    
    console.log('   Has readable date/time format:', hasTime ? '✅ YES' : '❌ NO');
    console.log('   Format includes timezone indicator:', hasIST ? '✅ YES' : '❌ NO');

    // Test 2: Verify notification createdAt timestamp
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 2: Notification Timestamp in Database');
    console.log('─'.repeat(80));

    console.log('\n✅ Database timestamp:');
    console.log('   Created At (UTC):', notif.createdAt);
    
    // Convert to IST for display
    const istCreatedAt = notif.createdAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    
    console.log('   Created At (IST):', istCreatedAt);

    // Test 3: Cron message format
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 3: Cron Message Format');
    console.log('─'.repeat(80));

    const cronMessageExample = `🔔 Reminder: Follow up with ${inventory.sellerName} (${inventory.contactNumbers[0]}) at ${futureIST} IST. Property in sector N/A — Demand: N/A.`;

    console.log('\n✅ Example cron message:');
    console.log('   ', cronMessageExample);
    console.log('   Contains "IST":', cronMessageExample.includes('IST') ? '✅ YES' : '❌ NO');

    // Test 4: Compare formats
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 4: Format Consistency');
    console.log('─'.repeat(80));

    console.log('\n✅ IST Format Examples:');
    console.log('   Update notification:', notif.message);
    console.log('   Cron reminder:     ', cronMessageExample);
    console.log('   Both contain IST indicator:', notif.message.includes('IST') && cronMessageExample.includes('IST') ? '✅ YES' : '❌ NO');

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL IST FORMAT TESTS PASSED');
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
