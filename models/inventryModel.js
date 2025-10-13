
// const mongoose = require('mongoose');

// const validInventoryTypes = [
//   "Sales",
//   "Rent"
// ];

// const validRegistryTypes = [
//   "Registry",
//   "Transferred"
// ];



// const inventorySchema = new mongoose.Schema({
//   sellerName: { type: String, required: true },
//   inventoryType: {
//     type: String,
//     enum: validInventoryTypes
//   },
//   sector: { type: String },
//   unitNo: { type: String },
//   towerNo: { type: String },
//   typology: { type: [String]},
//   size: { type: String },
//   demand: { type: String },
//   Project: { type: [String], required: true },
//   contactNumbers: { type: [String], required: true },
//   email: { type: String },
//   paymentStatus: { type: [String]},
//   registryType: {
//     type: String,
//     enum: validRegistryTypes
//   },
//   requirement: { type: String },
//   date: { type: String },
//   capturedBy: { type: String },
//   assignTo: { type: String },
//   transferTo: { type: String },
//   followUpDate: { type: String },
//   source: { type: [String]},
//   loanStatus: { type: String },
//   remarks: { type: String } 
// }, {
//   timestamps: true 
// });

// module.exports = mongoose.model('Inventory', inventorySchema);

const mongoose = require('mongoose');

// Valid Enums
const validInventoryTypes = ["Sales", "Rent"];
const validRegistryTypes = ["Registry", "Transferred"];

// Helper to get IST time in desired format
function getISTDateTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours in ms
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().replace('T', ' ').substring(0, 19); // "YYYY-MM-DD HH:mm:ss"
}

const inventorySchema = new mongoose.Schema(
  {
    sellerName: { type: String, required: true },
    inventoryType: { type: String, enum: validInventoryTypes },
    sector: { type: String },
    unitNo: { type: String },
    towerNo: { type: String },
    typology: { type: [String] },
    size: { type: String },
    demand: { type: String },
    Project: { type: [String], required: true },
    contactNumbers: { type: [String], required: true },
    email: { type: String },
    paymentStatus: { type: [String] },
    registryType: { type: String, enum: validRegistryTypes },
    requirement: { type: String },
    date: {
      type: String,
      default: getISTDateTime, // auto-set to current IST time when created
    },
    capturedBy: { type: String },
    assignTo: { type: String },
    transferTo: { type: String },
    followUpDate: {
      type: String,
      default: getISTDateTime, // auto-set to current IST time
    },
    source: { type: [String] },
    loanStatus: { type: String },
    remarks: { type: String },
  },
  {
    timestamps: true, // createdAt & updatedAt in UTC (Mongo default)
  }
);

// Optional — Format timestamps into IST before saving or returning
inventorySchema.pre('save', function (next) {
  if (!this.date) this.date = getISTDateTime();
  if (!this.followUpDate) this.followUpDate = getISTDateTime();
  next();
});

// Optional — convert timestamps when converting to JSON
inventorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  const istOffset = 5.5 * 60 * 60 * 1000;
  if (obj.createdAt) {
    obj.createdAt = new Date(
      new Date(obj.createdAt).getTime() + istOffset
    )
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }
  if (obj.updatedAt) {
    obj.updatedAt = new Date(
      new Date(obj.updatedAt).getTime() + istOffset
    )
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }
  return obj;
};

module.exports = mongoose.model('Inventory', inventorySchema);
