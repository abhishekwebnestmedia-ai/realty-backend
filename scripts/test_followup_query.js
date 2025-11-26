/**
 * Test script to verify follow-up cron aggregation pipeline
 * Run: node crmbackend/scripts/test_followup_query.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../models/leadModel');
const Inventory = require('../models/inventryModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realtyexpo';

async function testFollowupQueries() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 1000);
    const windowEnd = new Date(now.getTime() + 30 * 1000);

    console.log('\n📅 Current time (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('🔍 Window:', windowStart.toISOString(), 'to', windowEnd.toISOString());

    // Sample lead with follow-up
    console.log('\n--- LEAD SAMPLES ---');
    const sampleLeads = await Lead.find({ followUp: { $exists: true, $ne: null, $ne: '' } }).limit(3).lean();
    sampleLeads.forEach((lead, i) => {
      console.log(`\nLead ${i + 1}:`);
      console.log('  ID:', lead._id);
      console.log('  Name:', lead.customerName);
      console.log('  followUp (raw):', lead.followUp);
      console.log('  Type:', typeof lead.followUp);
      console.log('  assignTo:', lead.assignTo);
      console.log('  transferTo:', lead.transferTo);
    });

    // Sample inventory
    console.log('\n--- INVENTORY SAMPLES ---');
    const sampleInv = await Inventory.find({ followUpDate: { $exists: true, $ne: null, $ne: '' } }).limit(3).lean();
    sampleInv.forEach((inv, i) => {
      console.log(`\nInventory ${i + 1}:`);
      console.log('  ID:', inv._id);
      console.log('  Seller:', inv.sellerName);
      console.log('  followUpDate (raw):', inv.followUpDate);
      console.log('  Type:', typeof inv.followUpDate);
      console.log('  assignTo:', inv.assignTo);
      console.log('  transferTo:', inv.transferTo);
    });

    console.log('\n✅ Test complete. Check if followUp/followUpDate match expected format (YYYY-MM-DD HH:mm:ss or Date objects).');
    
  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testFollowupQueries();
