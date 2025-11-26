require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../models/leadModel');
const Inventory = require('../models/inventryModel');
const Broker = require('../models/broker');
const { parseFollowupInput, formatIstDbString } = require('../utils/followupTime');

const BATCH_SIZE = 500;
const SLEEP_MS = 50;
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/realtyexpo';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillModel(Model, { rawField, utcField }) {
  let total = 0;

  while (true) {
    const docs = await Model.find({
      $and: [
        { [rawField]: { $exists: true, $ne: null, $ne: '' } },
        {
          $or: [
            { [utcField]: { $exists: false } },
            { [utcField]: null },
          ],
        },
      ],
    })
      .select(`${rawField}`)
      .limit(BATCH_SIZE)
      .lean();

    if (!docs.length) break;

    const ops = docs
      .map((doc) => {
        const dueAt = parseFollowupInput(doc[rawField]);
        if (!dueAt) return null;
        const istString = formatIstDbString(dueAt) || doc[rawField];
        return Model.updateOne(
          { _id: doc._id },
          { $set: { [utcField]: dueAt, [rawField]: istString } }
        );
      })
      .filter(Boolean);

    if (!ops.length) break;

    await Promise.allSettled(ops);
    total += ops.length;

    if (docs.length < BATCH_SIZE) break;
    await wait(SLEEP_MS);
  }

  return total;
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB (${mongoUri})`);

  const leadUpdated = await backfillModel(Lead, { rawField: 'followUp', utcField: 'followUpUtc' });
  console.log(`✔️ Leads updated: ${leadUpdated}`);

  const inventoryUpdated = await backfillModel(Inventory, { rawField: 'followUpDate', utcField: 'followUpUtc' });
  console.log(`✔️ Inventory updated: ${inventoryUpdated}`);

  const brokerUpdated = await backfillModel(Broker, { rawField: 'followUpDate', utcField: 'followUpUtc' });
  console.log(`✔️ Brokers updated: ${brokerUpdated}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exitCode = 1;
});
