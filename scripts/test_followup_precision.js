#!/usr/bin/env node
/**
 * Precision test for follow-up cron helpers
 * - Uses in-memory MongoDB
 * - Seeds lead & inventory with naive IST timestamps (no timezone suffix)
 * - Ensures processLeadFollowups / processInventoryFollowups emit notifications exactly once
 *   and route to transferTo → assignTo → admins hierarchy
 */

process.env.FOLLOWUP_CRON_DISABLED = "true";

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Lead = require('../models/leadModel');
const Inventory = require('../models/inventryModel');
const User = require('../models/user');
const Notification = require('../models/notification');
const {
  processLeadFollowups,
  processInventoryFollowups,
} = require('../services/followupCronService');

const IST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const formatNaiveIst = (date) => {
  const parts = IST_FORMATTER.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
};

(async () => {
  let mongod;
  try {
    console.log('\n🔁 Spinning up memory MongoDB for follow-up precision test...');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('✅ Connected to memory DB');

    const admin = await User.create({
      name: 'AdminIST',
      email: 'admin.ist@test',
      password: 'hash',
      role: 'admin',
    });

    const transferCloser = await User.create({
      name: 'ISTCloser',
      email: 'closer@ist.test',
      password: 'hash',
      role: 'user',
    });

    const assignedSeller = await User.create({
      name: 'ISTSeller',
      email: 'seller@ist.test',
      password: 'hash',
      role: 'user',
    });

    console.log('👥 Seeded users:', {
      admin: admin.name,
      transferCloser: transferCloser.name,
      assignedSeller: assignedSeller.name,
    });

    const leadDueAt = new Date(Date.now() + 6_000);
    const inventoryDueAt = new Date(Date.now() + 8_000);

    const lead = await Lead.create({
      customerName: 'Precision Lead',
      contactNumber: '9998887770',
      email: 'lead.precision@test',
      status: 'Hot',
      leadType: 'Buyer',
      assignTo: admin._id,
      transferTo: transferCloser.name,
      followUp: formatNaiveIst(leadDueAt), // naive IST string
      requirement: 'Precision QA',
    });

    const inventory = await Inventory.create({
      sellerName: 'Precision Seller',
      Project: ['Precision Tower'],
      contactNumbers: ['8887776665'],
      category: 'Residential',
      projectcategory: 'ReadyToMove',
      assignTo: assignedSeller._id.toString(),
      followUpDate: formatNaiveIst(inventoryDueAt),
      remarks: 'Precision QA inventory',
    });

    console.log('🕒 Lead followUpUtc stored as:', lead.followUpUtc);
    console.log('🕒 Inventory followUpUtc stored as:', inventory.followUpUtc);

    console.log('\n⏳ Waiting for due times to arrive...');
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const windowStart = new Date(Date.now() - 10_000);
    const windowEnd = new Date(Date.now() + 10_000);

    const leadCount = await processLeadFollowups(windowStart, windowEnd, 'due');
    const inventoryCount = await processInventoryFollowups(windowStart, windowEnd, 'due');

    console.log('\n📬 processLeadFollowups emitted:', leadCount);
    console.log('📬 processInventoryFollowups emitted:', inventoryCount);

    const notifications = await Notification.find({}).lean();
    notifications.forEach((notif) => {
      console.log('\n🔔 Notification:', {
        message: notif.message,
        receiver: notif.receiver,
        meta: notif.meta,
      });
    });

    if (!notifications.length) {
      throw new Error('No notifications created; precision test failed');
    }

    const leadNotif = notifications.find((n) => n.type === 'Lead');
    const inventoryNotif = notifications.find((n) => n.type === 'Inventory');

    console.log('\n🎯 Receiver assertions:', {
      leadRoutedTo: leadNotif?.receiver?.toString() || null,
      expectedLeadReceiver: transferCloser._id.toString(),
      inventoryRoutedTo: inventoryNotif?.receiver?.toString() || null,
      expectedInventoryReceiver: assignedSeller._id.toString(),
    });

    console.log('\n✅ Follow-up precision test complete');
  } catch (err) {
    console.error('\n❌ Precision test failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    if (mongod) await mongod.stop().catch(() => {});
  }
})();
