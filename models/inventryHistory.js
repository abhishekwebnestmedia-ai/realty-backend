const mongoose = require("mongoose");

const inventoryHistorySchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
  changedBy: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String
  },
  field: { type: String, required: true },
  oldValue: String,
  newValue: String,
  changedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InventoryHistory", inventoryHistorySchema);
