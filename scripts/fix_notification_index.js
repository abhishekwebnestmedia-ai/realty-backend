/**
 * Script to fix the notification index that's causing duplicate key errors
 * 
 * Run on VPS: node scripts/fix_notification_index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

async function fixNotificationIndex() {
  await connectDB();
  
  console.log('===========================================');
  console.log('  FIX NOTIFICATION INDEX SCRIPT');
  console.log('===========================================\n');
  
  const Notification = require('../models/notification');
  const collection = Notification.collection;
  
  // List current indexes
  console.log('📋 Current indexes on notifications collection:');
  const indexes = await collection.indexes();
  indexes.forEach(idx => {
    console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
  });
  console.log('');
  
  // Check if the problematic index exists
  const problematicIndex = indexes.find(idx => 
    idx.key && idx.key.type === 1 && idx.key.itemId === 1 && idx.key.message === 1
  );
  
  if (problematicIndex) {
    console.log('⚠️  Found problematic unique index: type_1_itemId_1_message_1');
    console.log('   This index prevents followup notifications from being created');
    console.log('');
    
    try {
      console.log('🗑️  Dropping the problematic index...');
      await collection.dropIndex('type_1_itemId_1_message_1');
      console.log('✅ Index dropped successfully!');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index already dropped or doesn\'t exist');
      } else {
        console.error('❌ Error dropping index:', err.message);
      }
    }
  } else {
    console.log('✅ Problematic index not found (already fixed or never existed)');
  }
  
  console.log('');
  
  // Also clean up old followup notifications to allow fresh ones
  console.log('🧹 Cleaning up old followup notifications (older than 1 day)...');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deleted = await Notification.deleteMany({
    'meta.event': 'followup',
    createdAt: { $lt: oneDayAgo }
  });
  console.log(`   Deleted ${deleted.deletedCount} old followup notifications`);
  
  console.log('');
  
  // List updated indexes
  console.log('📋 Updated indexes on notifications collection:');
  const newIndexes = await collection.indexes();
  newIndexes.forEach(idx => {
    console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
  });
  
  console.log('');
  console.log('===========================================');
  console.log('  DONE - Restart your server now!');
  console.log('===========================================');
  
  process.exit(0);
}

fixNotificationIndex().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
