#!/usr/bin/env node
/**
 * Small test to ensure Notification pre-save normalization works
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Notification = require('../models/notification');

async function run() {
  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('MongoURI:', uri);
    await mongoose.connect(uri);

    const rawMeta = {
      unit: {
        unitNumber: 'U-TEST',
        mobileNumbers: '9999999999' // intentionally a string
      },
      hierarchy: 'not-an-object'
    };

    const notif = await Notification.create({
      type: 'Inventory',
      itemId: new mongoose.Types.ObjectId(),
      message: 'Normalization test',
      meta: rawMeta
    });

    console.log('Saved notification:', notif._id.toString());
    const fromDb = await Notification.findById(notif._id).lean();
    console.log('From DB meta.unit.mobileNumbers:', fromDb.meta?.unit?.mobileNumbers);
    console.log('From DB meta.hierarchy type:', typeof fromDb.meta?.hierarchy);

  } catch (err) {
    console.error(err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    try { if (mongod) await mongod.stop(); } catch (e) {}
    process.exit(0);
  }
}

run();
