
const mongoose = require('mongoose');
const { parseFollowupInput } = require('../utils/followupTime');

const validStatuses = [
  "Hot",
  "Not Connected",
  "Serious",
  "Potential",
  "Futuristic",
  "Dead Lead",
  "Completed"
];



const validLeadTypes = ["Buyer", "Rental"];

// ✅ Helper: Generate IST date-time string (YYYY-MM-DD HH:mm:ss)
function getISTDateTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hrs in ms
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().replace('T', ' ').substring(0, 19);
}

// ✅ Helper: Convert a Date (or parseable input) to IST DB string (YYYY-MM-DD HH:mm:ss)
const leadSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },

    status: {
      type: String,
      required: true,
      enum: validStatuses,
    },

    leadType: {
      type: String,
      required: true,
      enum: validLeadTypes,
    },

    followUp: {
      type: Date,
      default: Date.now,
    },
    followUpUtc: {
      type: Date,
      default: null,
    },

    requirement: { type: String },
    remark: { type: String },

    date: {
      type: String,
      default: getISTDateTime,
    },

    capturedBy: { type: String },
    assignTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    transferTo: { type: String,default: null },
    source: { type: String },
    Budget: { type: String },
  },
  { timestamps: true }
);

//
// ✅ Ensure both dates are set before saving
//
function normalizeFollowupFields(target) {
  if (!target) return;
  const candidates = [target.followUp, target.followUpUtc];
  for (const value of candidates) {
    const parsed = parseFollowupInput(value);
    if (parsed && !Number.isNaN(parsed.getTime())) {
      target.followUp = parsed;
      target.followUpUtc = parsed;
      return;
    }
  }
  if (!target.followUp) target.followUp = new Date();
  if (!target.followUpUtc) target.followUpUtc = target.followUp;
}

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

leadSchema.pre('save', function (next) {
  if (!this.date) this.date = getISTDateTime();
  normalizeFollowupFields(this);
  next();
});

//
// ✅ Helper: Convert a string to Title Case
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
// ✅ Helper: Format string fields (Title Case except email)
//
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;
  if (seen.has(obj)) return;
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    if (!value) continue;

    // 🔹 Handle normal strings
    if (typeof value === 'string') {
      if (key === 'email') {
        obj[key] = value.toLowerCase().trim();
      } else {
        obj[key] = toTitleCase(value);
      }
      continue;
    }

    // 🔹 Handle string arrays
    if (Array.isArray(value)) {
      obj[key] = value.map(v => (typeof v === 'string' ? toTitleCase(v) : v));
      continue;
    }

    // 🔹 Handle nested objects
    if (value && typeof value === 'object') {
      formatStringFields(value, seen);
    }
  }
}

//
// 🟢 Before saving a new lead
//
leadSchema.pre('save', function (next) {
  formatStringFields(this);
  next();
});

//
// 🟢 Before updating an existing lead
//
leadSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    // Normalize string fields
    formatStringFields(target);
    // If followUp is present in update, normalize to IST DB string
    normalizeFollowupFields(target);
  }
  next();
});

//
// ✅ Convert timestamps to IST in JSON responses
//
leadSchema.methods.toJSON = function () {
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
  
  // Provide raw ISO format for frontend parsing
  const rawFollow = obj.followUpUtc || obj.followUp;
  if (rawFollow) {
    obj.followUpRaw = new Date(rawFollow).toISOString();
  } else {
    obj.followUpRaw = null;
  }
  
  if (obj.followUpUtc) {
    obj.followUpUtc = new Date(obj.followUpUtc).toISOString();
  }
  obj.followUp = formatIstString(obj.followUp);

  return obj;
};

leadSchema.index({ followUpUtc: 1 });

module.exports = mongoose.model("Lead", leadSchema);




