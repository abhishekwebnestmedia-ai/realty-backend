/**
 * Test script to manually trigger a followup notification
 * 
 * Usage: 
 *   node scripts/test_followup_trigger.js
 * 
 * This will:
 * 1. Find a lead/inventory/broker or create a test one
 * 2. Set its followup time to NOW
 * 3. Manually run the cron logic to trigger the notification
 */

const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

async function testFollowupTrigger() {
  await connectDB();
  
  const Lead = require('../models/leadModel');
  const Inventory = require('../models/inventryModel');
  const Broker = require('../models/broker');
  const Notification = require('../models/notification');
  const { processLeadFollowups, processInventoryFollowups, processBrokerFollowups } = require('../services/followupCronService');
  
  const now = new Date();
  const nowIST = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  console.log('===========================================');
  console.log('  FOLLOWUP NOTIFICATION TEST SCRIPT');
  console.log('===========================================');
  console.log('Current time UTC:', now.toISOString());
  console.log('Current time IST:', nowIST);
  console.log('');
  
  // Find an existing lead to test with
  let testLead = await Lead.findOne({ assignTo: { $exists: true, $ne: null } }).lean();
  
  if (!testLead) {
    console.log('❌ No leads found with assignTo. Creating a test lead...');
    // You may need to adjust this based on your User collection
    testLead = await Lead.create({
      customerName: 'Test Followup Customer',
      contactNumber: '9999999999',
      email: 'test@example.com',
      status: 'Hot',
      leadType: 'Buyer',
      requirement: 'Test requirement for followup',
      followUp: now,
      followUpUtc: now,
    });
    console.log('✅ Created test lead:', testLead._id);
  } else {
    console.log('✅ Found existing lead:', testLead.customerName, '(', testLead._id, ')');
  }
  
  // Update the lead's followup time to NOW
  console.log('');
  console.log('📝 Setting followup time to NOW...');
  await Lead.updateOne(
    { _id: testLead._id },
    { 
      $set: { 
        followUp: now,
        followUpUtc: now 
      } 
    }
  );
  console.log('✅ Updated lead followup to:', now.toISOString());
  
  // Delete any existing notifications for this lead to avoid duplicate suppression
  console.log('');
  console.log('🗑️  Clearing old notifications for this lead...');
  const deleted = await Notification.deleteMany({ 
    itemId: testLead._id,
    'meta.event': 'followup'
  });
  console.log(`   Deleted ${deleted.deletedCount} old followup notifications`);
  
  // Now manually trigger the followup processing
  console.log('');
  console.log('🚀 Triggering followup notification processing...');
  console.log('');
  
  // Create a window around now
  const windowStart = new Date(now.getTime() - 60 * 1000); // 1 min ago
  const windowEnd = new Date(now.getTime() + 60 * 1000);   // 1 min from now
  
  console.log('Window: ', windowStart.toISOString(), ' to ', windowEnd.toISOString());
  console.log('');
  
  try {
    const leadCount = await processLeadFollowups(windowStart, windowEnd, 'due');
    console.log('');
    console.log('===========================================');
    console.log(`✅ Lead followup notifications sent: ${leadCount}`);
    console.log('===========================================');
    
    if (leadCount > 0) {
      // Check what notification was created
      const notif = await Notification.findOne({ 
        itemId: testLead._id,
        'meta.event': 'followup'
      }).sort({ createdAt: -1 }).lean();
      
      if (notif) {
        console.log('');
        console.log('📩 Notification created:');
        console.log('   ID:', notif._id);
        console.log('   Type:', notif.type);
        console.log('   Message:', notif.message);
        console.log('   Receiver:', notif.receiver);
        console.log('   Meta:', JSON.stringify(notif.meta, null, 2));
      }
    } else {
      console.log('');
      console.log('⚠️  No notifications were sent. Possible reasons:');
      console.log('   1. The lead has no assignTo or transferTo');
      console.log('   2. A duplicate notification exists within suppression window');
      console.log('   3. The followUpUtc value is not being matched');
      
      // Debug: check the actual lead data
      const freshLead = await Lead.findById(testLead._id).lean();
      console.log('');
      console.log('📋 Current lead data:');
      console.log('   followUp:', freshLead.followUp);
      console.log('   followUpUtc:', freshLead.followUpUtc);
      console.log('   assignTo:', freshLead.assignTo);
      console.log('   transferTo:', freshLead.transferTo);
    }
    
  } catch (err) {
    console.error('❌ Error during processing:', err);
  }
  
  console.log('');
  console.log('===========================================');
  console.log('  TEST COMPLETE');
  console.log('===========================================');
  
  process.exit(0);
}

testFollowupTrigger().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
