

// const mongoose = require('mongoose');

// // Valid Enums
// const validInventoryTypes = ["Sales", "Rent"];
// const validRegistryTypes = ["Registry", "Transferred"];

// // Helper to get IST time in desired format
// function getISTDateTime() {
//   const now = new Date();
//   const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours in ms
//   const istDate = new Date(now.getTime() + istOffset);
//   return istDate.toISOString().replace('T', ' ').substring(0, 19); // "YYYY-MM-DD HH:mm:ss"
// }

// const inventorySchema = new mongoose.Schema(
//   {
//     sellerName: { type: String, required: true },
//     inventoryType: { type: String, enum: validInventoryTypes },
//     sector: { type: String },
//     unitNo: { type: String },
//     towerNo: { type: String },
//     typology: { type: [String] },
//     size: { type: String },
//     demand: { type: String },
//     Project: { type: [String], required: true },
//     contactNumbers: { type: [String], required: true },
//     email: { type: String },
//     paymentStatus: { type: [String] },
//     registryType: { type: String, enum: validRegistryTypes },
//     requirement: { type: String },
//     date: {
//       type: String,
//       default: getISTDateTime, // auto-set to current IST time when created
//     },
//     capturedBy: { type: String },
//     assignTo: { type: String },
//     transferTo: { type: String },
//     followUpDate: {
//       type: String,
//       default: getISTDateTime, // auto-set to current IST time
//     },
//     source: { type: [String] },
//     loanStatus: { type: String },
//     remarks: { type: String },
//   },
//   {
//     timestamps: true, // createdAt & updatedAt in UTC (Mongo default)
//   }
// );

// // Optional — Format timestamps into IST before saving or returning
// inventorySchema.pre('save', function (next) {
//   if (!this.date) this.date = getISTDateTime();
//   if (!this.followUpDate) this.followUpDate = getISTDateTime();
//   next();
// });

// // Optional — convert timestamps when converting to JSON
// inventorySchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   if (obj.createdAt) {
//     obj.createdAt = new Date(
//       new Date(obj.createdAt).getTime() + istOffset
//     )
//       .toISOString()
//       .replace('T', ' ')
//       .substring(0, 19);
//   }
//   if (obj.updatedAt) {
//     obj.updatedAt = new Date(
//       new Date(obj.updatedAt).getTime() + istOffset
//     )
//       .toISOString()
//       .replace('T', ' ')
//       .substring(0, 19);
//   }
//   return obj;
// };

// module.exports = mongoose.model('Inventory', inventorySchema);

const mongoose = require('mongoose');

// Valid Enums
const validInventoryTypes = ["Sales", "Rent"];
const validRegistryTypes = ["Registry", "Transferred"];

// ✅ Helper to get IST time in "YYYY-MM-DD HH:mm:ss" format
function getISTDateTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours in ms
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().replace('T', ' ').substring(0, 19);
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
      default: getISTDateTime, // Auto-set to IST when created
    },
    capturedBy: { type: String },
    assignTo: { type: String },
    transferTo: { type: String },
    followUpDate: {
      type: String,
      default: getISTDateTime, // Auto-set to IST when created
    },
    source: { type: [String] },
    loanStatus: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

// ✅ Convert string to Title Case (e.g., "noida sector" → "Noida Sector")
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ✅ Helper: Convert all strings (and string arrays) to Title Case except email
function formatStringFields(obj) {
  for (const key in obj) {
    if (!obj[key]) continue;

    const value = obj[key];

    // Handle arrays of strings (like Project, typology, etc.)
    if (Array.isArray(value)) {
      obj[key] = value.map(v =>
        typeof v === 'string' ? toTitleCase(v) : v
      );
      continue;
    }

    // Handle normal strings
    if (typeof value === 'string') {
      if (key === 'email') {
        obj[key] = value.toLowerCase(); // email always lowercase
      } else {
        obj[key] = toTitleCase(value); // all others Title Case
      }
    }
    // Recursively process nested objects if any
    else if (typeof value === 'object') {
      formatStringFields(value);
    }
  }
}

// 🟢 Before saving
inventorySchema.pre('save', function (next) {
  // Auto-set IST time
  if (!this.date) this.date = getISTDateTime();
  if (!this.followUpDate) this.followUpDate = getISTDateTime();

  // Format string fields
  formatStringFields(this);
  next();
});

// 🟢 Before updating
inventorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.$set) {
      formatStringFields(update.$set);
    } else {
      formatStringFields(update);
    }
  }
  next();
});

// ✅ Convert timestamps to IST when sending JSON response
inventorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  const istOffset = 5.5 * 60 * 60 * 1000;

  if (obj.createdAt) {
    obj.createdAt = new Date(new Date(obj.createdAt).getTime() + istOffset)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }

  if (obj.updatedAt) {
    obj.updatedAt = new Date(new Date(obj.updatedAt).getTime() + istOffset)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }

  return obj;
};

module.exports = mongoose.model('Inventory', inventorySchema);
