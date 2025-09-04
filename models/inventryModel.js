// models/Inventory.js
const mongoose = require('mongoose');

const validInventoryTypes = [
  "Sales",
  "Rent"
];

const validRegistryTypes = [
  "Registry",
  "Transferred"
];

const inventorySchema = new mongoose.Schema({
  sellerName: { type: String, required: true },
  inventoryType: {
    type: String,
    enum: validInventoryTypes
  },
  sector: { type: String },
  unitNo: { type: String },
  towerNo: { type: String },
  typology: { type: String },
  size: { type: String },
  demand: { type: String },
  contactNumbers: { type: [String], required: true },
  email: { type: String },
  paymentStatus: { type: [String] },
  registryType: {
    type: String,
    enum: validRegistryTypes
  },
  requirement: { type: String },
  date: { type: String },
  capturedBy: { type: String },
  assignTo: { type: String },
  transferTo: { type: String },
  followUpDate: { type: String },
  source: { type: String },
  loanStatus: { type: String },
  remarks: { type: String }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Inventory', inventorySchema);
