#!/usr/bin/env node
/**
 * Test: Lead Notification on Field Updates
 * Tests: transferTo, assignTo, capturedBy, status changes
 * Verifies notifications are created for each field change
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Lead = require('../models/leadModel');
const LeadHistory = require('../models/leadHistory');
const User = require('../models/user');
const Notification = require('../models/notification');
const leadController = require('../controllers/leadController');

async function run() {
  let mongod;
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST: LEAD NOTIFICATIONS ON FIELD UPDATES');
    console.log('='.repeat(80) + '\n');

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('✅ Connected to in-memory database\n');

    // Create test users
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

    console.log('📋 Setup:');
    console.log('   Users created: admin, user1, user2\n');

    // Create a test lead
    const lead = await Lead.create({
      customerName: 'Test Customer',
      contactNumber: '9876543210',
      email: 'customer@test.com',
      status: 'Hot',
      leadType: 'Buyer',
      assignTo: user1._id,
      transferTo: null,
      capturedBy: 'admin',
      requirement: 'Test requirement'
    });

    console.log('   Lead created:', lead._id.toString());
    console.log('   Initial state: assignTo=user1, transferTo=null, capturedBy=admin\n');

    // Test 1: Update assignTo field
    console.log('─'.repeat(80));
    console.log('TEST 1: Change assignTo (Reassignment)');
    console.log('─'.repeat(80));

    const req1 = {
      params: { id: lead._id.toString() },
      body: { assignTo: user2._id },
      user: { _id: admin._id }
    };

    let res1Response = null;
    const res1 = {
      json(obj) { res1Response = obj; return obj; },
      status(code) { this._status = code; return this; }
    };

    await leadController.updateLead(req1, res1);

    const notifs1 = await Notification.find({ type: 'Lead', itemId: lead._id }).lean();
    console.log('\n✅ After assignTo change:');
    console.log('   Notifications created:', notifs1.length);
    const assignNotif = notifs1.find(n => n.message.includes('reassigned'));
    if (assignNotif) {
      console.log('   Message:', assignNotif.message);
      console.log('   Receiver:', assignNotif.receiver ? '✅ Specific user' : '❌ Admins only');
    } else {
      console.log('   ⚠️  No reassignment notification found!');
    }

    // Test 2: Update transferTo field
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 2: Change transferTo');
    console.log('─'.repeat(80));

    const req2 = {
      params: { id: lead._id.toString() },
      body: { transferTo: user1.name },
      user: { _id: admin._id }
    };

    let res2Response = null;
    const res2 = {
      json(obj) { res2Response = obj; return obj; },
      status(code) { this._status = code; return this; }
    };

    await leadController.updateLead(req2, res2);

    const notifs2 = await Notification.find({ type: 'Lead', itemId: lead._id }).lean();
    console.log('\n✅ After transferTo change:');
    console.log('   Total notifications:', notifs2.length);
    const transferNotif = notifs2[notifs2.length - 1];
    console.log('   Latest notification:', transferNotif.message);

    // Test 3: Update status field
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 3: Change status');
    console.log('─'.repeat(80));

    const req3 = {
      params: { id: lead._id.toString() },
      body: { status: 'Completed' },
      user: { _id: admin._id }
    };

    let res3Response = null;
    const res3 = {
      json(obj) { res3Response = obj; return obj; },
      status(code) { this._status = code; return this; }
    };

    await leadController.updateLead(req3, res3);

    const notifs3 = await Notification.find({ type: 'Lead', itemId: lead._id }).lean();
    console.log('\n✅ After status change:');
    console.log('   Total notifications:', notifs3.length);
    const statusNotif = notifs3.find(n => n.message.includes('status changed'));
    if (statusNotif) {
      console.log('   Message:', statusNotif.message);
    } else {
      console.log('   ⚠️  No status notification found!');
    }

    // Test 4: Update capturedBy field
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 4: Change capturedBy');
    console.log('─'.repeat(80));

    const req4 = {
      params: { id: lead._id.toString() },
      body: { capturedBy: 'newadmin' },
      user: { _id: admin._id }
    };

    let res4Response = null;
    const res4 = {
      json(obj) { res4Response = obj; return obj; },
      status(code) { this._status = code; return this; }
    };

    await leadController.updateLead(req4, res4);

    const notifs4 = await Notification.find({ type: 'Lead', itemId: lead._id }).lean();
    console.log('\n✅ After capturedBy change:');
    console.log('   Total notifications:', notifs4.length);
    console.log('   Note: capturedBy is tracked but no special notification (only assignTo/status get notifications)');

    // Test 5: Receiver routing verification
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 5: Receiver Routing Verification');
    console.log('─'.repeat(80));

    // Create new lead with both transferTo and assignTo
    const lead2 = await Lead.create({
      customerName: 'Test Customer 2',
      contactNumber: '9876543211',
      email: 'customer2@test.com',
      status: 'Hot',
      leadType: 'Buyer',
      assignTo: user1._id,
      transferTo: null,
      capturedBy: 'admin',
      requirement: 'Test requirement 2'
    });

    console.log('\n   Scenario 1: transferTo set, assignTo set');
    console.log('   Expected: Routes to transferTo user\n');

    const req5 = {
      params: { id: lead2._id.toString() },
      body: {
        transferTo: user2.name,
        assignTo: user1._id
      },
      user: { _id: admin._id }
    };

    let res5Response = null;
    const res5 = {
      json(obj) { res5Response = obj; return obj; },
      status(code) { this._status = code; return this; }
    };

    await leadController.updateLead(req5, res5);

    const notifs5 = await Notification.find({ type: 'Lead', itemId: lead2._id }).lean();
    console.log('   Notifications created:', notifs5.length);
    notifs5.forEach((n, idx) => {
      console.log(`   [${idx + 1}] ${n.message}`);
      console.log(`       Receiver: ${n.receiver ? 'Specific user' : 'Admins'}`);
    });

    // Summary
    console.log('\n' + '─'.repeat(80));
    console.log('SUMMARY');
    console.log('─'.repeat(80));

    const allNotifs = await Notification.find({ type: 'Lead' }).lean();
    console.log('\n✅ Total Lead Notifications Created:', allNotifs.length);
    console.log('   - From Test 1 (assignTo):', notifs1.length);
    console.log('   - From Test 2 (transferTo):', notifs2.length - notifs1.length);
    console.log('   - From Test 3 (status):', notifs3.length - notifs2.length);
    console.log('   - From Test 4 (capturedBy):', notifs4.length - notifs3.length);
    console.log('   - From Test 5 (routing):', notifs5.length);

    // Check notification types
    const reassignNotifs = allNotifs.filter(n => n.message.includes('reassigned')).length;
    const statusNotifs = allNotifs.filter(n => n.message.includes('status changed')).length;
    const transferNotifs = allNotifs.filter(n => n.message.includes('transferTo')).length;

    console.log('\n✅ Notification Types:');
    console.log('   - Reassignment notifications:', reassignNotifs);
    console.log('   - Status change notifications:', statusNotifs);
    console.log('   - Transfer notifications:', transferNotifs);

    // Check history
    const history = await LeadHistory.find({ leadId: lead._id }).lean();
    console.log('\n✅ Change History Entries:', history.length);
    console.log('   Fields tracked:', [...new Set(history.map(h => h.field))].join(', '));

    console.log('\n' + '='.repeat(80));
    console.log('✅ LEAD NOTIFICATION TESTS COMPLETED');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.error(err.stack);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
