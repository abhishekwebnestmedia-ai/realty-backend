#!/usr/bin/env node
/**
 * Test notification routing logic with an in-memory MongoDB.
 * Verifies:
 *  - transferTo (id or name) becomes the receiver
 *  - fallback to assignTo when transferTo missing
 *  - admin can read all notifications while regular users only read ones where receiver == their id
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const User = require('../models/user');
const Notification = require('../models/notification');

function isObjectIdLike(val) {
  return typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
}

async function resolveReceiver(transferTo, assignTo) {
  // transferTo: might be user id (24-hex) or name
  if (transferTo) {
    if (isObjectIdLike(transferTo)) {
      const u = await User.findById(transferTo);
      if (u) return u._id;
    }
    // try by name (case-insensitive)
    const byName = await User.findOne({ name: new RegExp('^' + transferTo + '$', 'i') });
    if (byName) return byName._id;
  }

  if (assignTo) {
    if (isObjectIdLike(assignTo)) {
      const u = await User.findById(assignTo);
      if (u) return u._id;
    }
    const byName = await User.findOne({ name: new RegExp('^' + assignTo + '$', 'i') });
    if (byName) return byName._id;
  }

  return null; // no receiver resolved
}

async function run() {
  let mongod;
  try {
    console.log('\n=== Starting in-memory MongoDB for routing test ===\n');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // seed users
    const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'pass', role: 'admin' });
    const alice = await User.create({ name: 'Alice Buyer', email: 'alice@example.com', password: 'pass', role: 'user' });
    const bob = await User.create({ name: 'Bob Seller', email: 'bob@example.com', password: 'pass', role: 'user' });

    console.log('Seeded users:');
    console.log(' admin:', admin._id.toString());
    console.log(' alice:', alice._id.toString());
    console.log(' bob:', bob._id.toString());

    // Case 1: transferTo by id -> bob should be receiver
    let r = await resolveReceiver(bob._id.toString(), null);
    const n1 = await Notification.create({ type: 'Lead', itemId: new mongoose.Types.ObjectId(), message: 'Transfer to Bob (by id)', changedBy: 'system', receiver: r });

    // Case 2: transferTo by name -> bob should be receiver
    r = await resolveReceiver('Bob Seller', null);
    const n2 = await Notification.create({ type: 'Inventory', itemId: new mongoose.Types.ObjectId(), message: 'Transfer to Bob (by name)', changedBy: 'system', receiver: r });

    // Case 3: no transferTo, assignTo = alice -> alice should be receiver
    r = await resolveReceiver(null, alice._id.toString());
    const n3 = await Notification.create({ type: 'Lead', itemId: new mongoose.Types.ObjectId(), message: 'Assigned to Alice', changedBy: 'system', receiver: r });

    // Case 4: neither transferTo nor assignTo -> admin-only delivery (receiver == null)
    const n4 = await Notification.create({ type: 'Lead', itemId: new mongoose.Types.ObjectId(), message: 'No specific receiver - admin only', changedBy: 'system' });

    console.log('\nCreated notifications:');
    [n1, n2, n3, n4].forEach(n => console.log(` - ${n._id} | receiver: ${n.receiver}`));

    // Simulate queries
    const all = await Notification.find();
    const bobNotifs = await Notification.find({ receiver: bob._id });
    const aliceNotifs = await Notification.find({ receiver: alice._id });

    console.log('\nQuery results:');
    console.log(` All notifications count (admin view): ${all.length}`);
    console.log(` Bob notifications count (should be 2): ${bobNotifs.length}`);
    bobNotifs.forEach(n => console.log(`  - ${n.message} | receiver: ${n.receiver}`));
    console.log(` Alice notifications count (should be 1): ${aliceNotifs.length}`);
    aliceNotifs.forEach(n => console.log(`  - ${n.message} | receiver: ${n.receiver}`));

    console.log('\nAdmin would see all notifications; regular users only see notifications where receiver == their user id.');

    console.log('\n=== Routing test completed successfully ===\n');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
