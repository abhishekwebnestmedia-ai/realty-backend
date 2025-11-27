// Quick script to check followup data in database
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

async function checkFollowups() {
  await connectDB();
  
  const Lead = require('../models/leadModel');
  const Inventory = require('../models/inventryModel');
  const Broker = require('../models/broker');
  
  const now = new Date();
  console.log('=== Current Time ===');
  console.log('UTC:', now.toISOString());
  console.log('IST:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('');
  
  // Check leads
  console.log('=== LEADS with followUpUtc ===');
  const leads = await Lead.find({ followUpUtc: { $exists: true, $ne: null } })
    .select('customerName followUp followUpUtc assignTo transferTo')
    .sort({ followUpUtc: -1 })
    .limit(5)
    .lean();
  
  if (leads.length === 0) {
    console.log('No leads with followUpUtc found!');
  } else {
    leads.forEach(l => {
      console.log('  Name:', l.customerName);
      console.log('    followUp:', l.followUp, '(type:', typeof l.followUp, ')');
      console.log('    followUpUtc:', l.followUpUtc, '(type:', l.followUpUtc instanceof Date ? 'Date' : typeof l.followUpUtc, ')');
      console.log('    assignTo:', l.assignTo);
      console.log('    transferTo:', l.transferTo);
      console.log('');
    });
  }
  
  // Check inventory
  console.log('=== INVENTORY with followUpUtc ===');
  const inventories = await Inventory.find({ followUpUtc: { $exists: true, $ne: null } })
    .select('sellerName followUpDate followUpUtc assignTo transferTo')
    .sort({ followUpUtc: -1 })
    .limit(5)
    .lean();
  
  if (inventories.length === 0) {
    console.log('No inventory with followUpUtc found!');
  } else {
    inventories.forEach(i => {
      console.log('  Seller:', i.sellerName);
      console.log('    followUpDate:', i.followUpDate, '(type:', typeof i.followUpDate, ')');
      console.log('    followUpUtc:', i.followUpUtc, '(type:', i.followUpUtc instanceof Date ? 'Date' : typeof i.followUpUtc, ')');
      console.log('    assignTo:', i.assignTo);
      console.log('    transferTo:', i.transferTo);
      console.log('');
    });
  }
  
  // Check brokers
  console.log('=== BROKERS with followUpUtc ===');
  const brokers = await Broker.find({ followUpUtc: { $exists: true, $ne: null } })
    .select('brokerName followUpDate followUpUtc')
    .sort({ followUpUtc: -1 })
    .limit(5)
    .lean();
  
  if (brokers.length === 0) {
    console.log('No brokers with followUpUtc found!');
  } else {
    brokers.forEach(b => {
      console.log('  Broker:', b.brokerName);
      console.log('    followUpDate:', b.followUpDate, '(type:', typeof b.followUpDate, ')');
      console.log('    followUpUtc:', b.followUpUtc, '(type:', b.followUpUtc instanceof Date ? 'Date' : typeof b.followUpUtc, ')');
      console.log('');
    });
  }
  
  // Check upcoming followups in next 5 minutes
  const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000);
  console.log('=== UPCOMING FOLLOWUPS (next 5 min) ===');
  console.log('Window:', now.toISOString(), 'to', fiveMinLater.toISOString());
  
  const upcomingLeads = await Lead.find({
    followUpUtc: { $gte: now, $lte: fiveMinLater }
  }).select('customerName followUpUtc').lean();
  console.log('Leads:', upcomingLeads.length);
  
  const upcomingInventory = await Inventory.find({
    followUpUtc: { $gte: now, $lte: fiveMinLater }
  }).select('sellerName followUpUtc').lean();
  console.log('Inventory:', upcomingInventory.length);
  
  const upcomingBrokers = await Broker.find({
    followUpUtc: { $gte: now, $lte: fiveMinLater }
  }).select('brokerName followUpUtc').lean();
  console.log('Brokers:', upcomingBrokers.length);
  
  process.exit(0);
}

checkFollowups().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
