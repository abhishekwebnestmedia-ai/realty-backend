#!/usr/bin/env node
/**
 * Run IST notification test with an in-memory MongoDB (no local MongoDB required)
 * - Uses mongodb-memory-server to spin up a temporary DB
 * - Connects mongoose, runs the same create/read/format tests, then shuts down
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('../models/notification');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};
const log = {
  title: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}🧪 ${msg}${colors.reset}`),
};

function toISTString(utcDate) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Kolkata'
  });
  const parts = formatter.formatToParts(utcDate);
  const map = {};
  for (const part of parts) if (part.type !== 'literal') map[part.type]=part.value;
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

async function run() {
  let mongod;
  try {
    log.title('🔁 Starting in-memory MongoDB for test');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    log.info(`Memory MongoDB URI: ${uri}`);

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    log.success('Connected to in-memory MongoDB');

    log.test('\nCreate test notification (current time)');
    const now = new Date();
    const nowIST = toISTString(now);
    const notif = await Notification.create({ type: 'Lead', itemId: new mongoose.Types.ObjectId(), message: `MemoryDB test ${nowIST}`, changedBy: 'memtest' });
    log.success(`Created notification ${notif._id}`);
    log.info(`Stored createdAt (raw): ${notif.createdAt}`);

    const retrieved = await Notification.findById(notif._id);
    const apiObj = retrieved.toJSON();
    log.info(`API returned createdAt: ${apiObj.createdAt}`);

    // Validate ISO format
    const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(apiObj.createdAt);
    if (!isISO) throw new Error('API createdAt not in ISO UTC format');
    log.success('API createdAt is ISO UTC format');

    // Frontend simulation
    const parsed = new Date(apiObj.createdAt);
    const shownIST = toISTString(parsed);
    log.info(`Simulated frontend IST display: ${shownIST}`);
    log.success('Frontend IST display simulated OK');

    // Cleanup
    await Notification.deleteOne({ _id: notif._id });
    log.success('Deleted test notification');

    log.title('✅ In-memory DB test completed successfully');
  } catch (err) {
    log.error(`Test failed: ${err.message}`);
    console.error(err);
  } finally {
    try { await mongoose.disconnect(); } catch {}
    try { if (mongod) await mongod.stop(); } catch {}
    process.exit(0);
  }
}

run();
