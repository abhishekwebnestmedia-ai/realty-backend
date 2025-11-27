/**
 * Test script to debug inventory followUpDate update
 * 
 * Run with: node scripts/test_inventory_update.js <inventory_id> [new_followup_date]
 * Example: node scripts/test_inventory_update.js 678abc123def "2025-01-20T15:30:00+05:30"
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Inventory = require("../models/inventryModel");

async function testInventoryUpdate() {
  const inventoryId = process.argv[2];
  const newFollowUpDate = process.argv[3] || `${new Date().toISOString().split('T')[0]}T14:00:00+05:30`;

  if (!inventoryId) {
    console.log("Usage: node scripts/test_inventory_update.js <inventory_id> [new_followup_date]");
    console.log("Example: node scripts/test_inventory_update.js 678abc123def '2025-01-20T15:30:00+05:30'");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // 1. Get current record
    const before = await Inventory.findById(inventoryId).lean();
    if (!before) {
      console.log("❌ Inventory not found with ID:", inventoryId);
      process.exit(1);
    }

    console.log("\n📦 BEFORE UPDATE:");
    console.log("   followUpDate:", before.followUpDate);
    console.log("   followUpUtc:", before.followUpUtc);
    console.log("   sellerName:", before.sellerName);

    // 2. Prepare update data (mimicking frontend payload)
    console.log("\n📤 UPDATE PAYLOAD:");
    console.log("   followUpDate:", newFollowUpDate);

    // Parse the date as the controller does
    const parsedDate = new Date(newFollowUpDate);
    console.log("   Parsed as Date:", parsedDate);
    console.log("   Parsed timestamp:", parsedDate.getTime());
    console.log("   Is valid:", !isNaN(parsedDate.getTime()));

    const updateData = {
      followUpDate: parsedDate,
      followUpUtc: parsedDate
    };

    // 3. Perform the update
    console.log("\n🔄 Performing update...");
    const result = await Inventory.findByIdAndUpdate(
      inventoryId,
      updateData,
      { new: true }
    );

    console.log("\n📦 AFTER UPDATE (from findByIdAndUpdate result):");
    console.log("   followUpDate:", result.followUpDate);
    console.log("   followUpUtc:", result.followUpUtc);

    // 4. Fresh fetch from DB
    const after = await Inventory.findById(inventoryId).lean();
    console.log("\n📦 FRESH FETCH FROM DB:");
    console.log("   followUpDate:", after.followUpDate);
    console.log("   followUpUtc:", after.followUpUtc);

    // 5. Check JSON output (what API returns)
    const doc = await Inventory.findById(inventoryId);
    const jsonOutput = doc.toJSON();
    console.log("\n📦 JSON OUTPUT (what API returns):");
    console.log("   followUpDate:", jsonOutput.followUpDate);
    console.log("   followUpUtc:", jsonOutput.followUpUtc);

    console.log("\n✅ Test completed!");

  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

testInventoryUpdate();
