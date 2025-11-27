


const mongoose = require('mongoose');
const { parseFollowupInput } = require('../utils/followupTime');

// ✅ Valid Enums
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
      default: getISTDateTime,
    },
    capturedBy: { type: String },
    assignTo: { type: String },
    transferTo: { type: String , default: null },
    followUpDate: {
      type: Date,
      default: Date.now,
    },
    followUpUtc: {
      type: Date,
      default: null,
    },
    source: { type: [String] },
    loanStatus: { type: String },
    remarks: { type: String },
    category: { type: String },
    projectcategory: { type: String },
    cityId: { type: mongoose.Schema.Types.ObjectId },
    divisionId: { type: mongoose.Schema.Types.ObjectId },
    sectorId: { type: mongoose.Schema.Types.ObjectId },
    projectId: { type: mongoose.Schema.Types.ObjectId },
    towerId: { type: mongoose.Schema.Types.ObjectId },
    unitId: { type: mongoose.Schema.Types.ObjectId },
    unitNumber: { type: String },
    status: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId },
    meta: {
      cityName: { type: String },
      divisionName: { type: String },
      sectorName: { type: String },
      projectName: { type: String },
      towerName: { type: String }
    }
  },
  { timestamps: true }
);

//
// ✅ Helper: Convert to Title Case (e.g., "noida sector" → "Noida Sector")
//
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

//
// ✅ Recursive Formatter: Title Case all strings except emails
//
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;
  if (seen.has(obj)) return; // Prevent infinite recursion
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value == null) continue;

    // 🔹 Handle string values
    if (typeof value === 'string') {
      if (key === 'email') {
        obj[key] = value.toLowerCase().trim();
      } else {
        obj[key] = toTitleCase(value);
      }
      continue;
    }

    // 🔹 Handle arrays (like Project, typology, etc.)
    if (Array.isArray(value)) {
      obj[key] = value.map(v => {
        if (typeof v === 'string') return toTitleCase(v);
        if (typeof v === 'object') formatStringFields(v, seen);
        return v;
      });
      continue;
    }

    // 🔹 Handle nested objects
    if (typeof value === 'object') {
      formatStringFields(value, seen);
    }
  }
}

//
// 🟢 Before saving
//
const IST_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const formatIstString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = IST_FORMATTER.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

function normalizeFollowupDate(target) {
  if (!target) return;
  const candidates = [target.followUpDate, target.followUpUtc];
  for (const value of candidates) {
    const parsed = parseFollowupInput(value);
    if (parsed && !Number.isNaN(parsed.getTime())) {
      target.followUpDate = parsed;
      target.followUpUtc = parsed;
      return;
    }
  }
  if (!target.followUpDate) target.followUpDate = new Date();
  if (!target.followUpUtc) target.followUpUtc = target.followUpDate;
}

inventorySchema.pre('save', function (next) {
  if (!this.date) this.date = getISTDateTime();
  normalizeFollowupDate(this);
  formatStringFields(this);
  next();
});

//
// 🟢 Before updating
//
inventorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatStringFields(target);
    normalizeFollowupDate(target);
  }
  next();
});

//
// ✅ Convert timestamps to IST in JSON output
//
inventorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  const istOffset = 5.5 * 60 * 60 * 1000;

  const formatIST = (date) => {
    if (!date) return null;
    return new Date(new Date(date).getTime() + istOffset)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  };

  obj.createdAt = formatIST(obj.createdAt);
  obj.updatedAt = formatIST(obj.updatedAt);
  if (obj.followUpUtc) {
    obj.followUpUtc = new Date(obj.followUpUtc).toISOString();
  }
  obj.followUpDate = formatIstString(obj.followUpDate);

  return obj;
};

inventorySchema.index({ followUpUtc: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);


