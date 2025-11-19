
const mongoose = require('mongoose');

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
function formatToISTDBString(input) {
  if (!input) return null;
  let d = null;
  if (input instanceof Date) d = input;
  else {
    // Replace space-with-T for common 'YYYY-MM-DD HH:mm:ss' -> ISO
    try {
      const maybe = String(input).trim();
      const tryVals = [maybe.replace(' ', 'T'), maybe, new Date(maybe)];
      for (const t of tryVals) {
        const dt = new Date(t);
        if (!isNaN(dt.getTime())) { d = dt; break; }
      }
    } catch {
      d = null;
    }
  }
  if (!d) return null;
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + istOffset);
  return ist.toISOString().replace('T', ' ').substring(0, 19);
}

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
      type: String,
      default: getISTDateTime,
    },

  

    requirement: { type: String },
    remark: { type: String },

    date: {
      type: String,
      default: getISTDateTime,
    },

    capturedBy: { type: String },
    assignTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    transferTo: { type: String },
    source: { type: String },
    Budget: { type: String },
  },
  { timestamps: true }
);

//
// ✅ Ensure both dates are set before saving
//
leadSchema.pre('save', function (next) {
  if (!this.date) this.date = getISTDateTime();
  // Normalize followUp to IST DB string when possible
  if (!this.followUp) {
    this.followUp = getISTDateTime();
  } else {
    const normalized = formatToISTDBString(this.followUp);
    if (normalized) this.followUp = normalized;
  }
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
    if (target.followUp) {
      const normalized = formatToISTDBString(target.followUp);
      if (normalized) target.followUp = normalized;
    }
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

  return obj;
};

module.exports = mongoose.model("Lead", leadSchema);




