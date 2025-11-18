
const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    morningCommitment: {
      onlinePortalChecked: { type: Boolean, default: false },
      whatsappStatus: { type: Boolean, default: false },
      emailWorking: { type: Number },
      buyersWorking: { type: Number },
      sellersWorking: { type: Number },
    },
    eveningAchievements: {
      onlinePortalChecked: { type: Boolean, default: false },
      whatsappStatus: { type: Boolean, default: false },
      emailWorking: { type: Number },
      buyersWorking: { type: Number },
      sellersWorking: { type: Number },
    },
    meetingVisits: { type: Number },
    addNotes: { type: String },
    planstatus: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Unique index for name + date (so one record per user per day)
performanceSchema.index({ name: 1, date: 1 }, { unique: true });

//
// ✅ Helper: Convert to Title Case (e.g., "abhishek singh" → "Abhishek Singh")
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
// ✅ Helper: Format string fields recursively (Title Case except email)
//
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;
  if (seen.has(obj)) return; // prevent infinite recursion
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value == null) continue;

    // 🔹 Handle string fields
    if (typeof value === 'string') {
      if (key === 'email') {
        obj[key] = value.toLowerCase().trim();
      } else {
        obj[key] = toTitleCase(value);
      }
      continue;
    }

    // 🔹 Handle string arrays (future-proof)
    if (Array.isArray(value)) {
      obj[key] = value.map(v => (typeof v === 'string' ? toTitleCase(v) : v));
      continue;
    }

    // 🔹 Recurse into nested objects
    if (typeof value === 'object') {
      formatStringFields(value, seen);
    }
  }
}

//
// 🟢 Before saving
//
performanceSchema.pre('save', function (next) {
  formatStringFields(this);
  next();
});

//
// 🟢 Before updating
//
performanceSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatStringFields(target);
  }
  next();
});

//
// ✅ Convert date fields to Indian Standard Time (IST)
//    and format as YYYY-MM-DD
//
performanceSchema.set('toJSON', {
  transform: function (doc, ret) {
    const toIST = (utcDate) => {
      if (!utcDate) return null;
      const istOffset = 5.5 * 60 * 60 * 1000; // +05:30 offset in ms
      const istDate = new Date(utcDate.getTime() + istOffset);
      return istDate.toISOString().split('T')[0]; // format YYYY-MM-DD
    };

    ret.date = toIST(ret.date);
    ret.createdAt = toIST(ret.createdAt);
    ret.updatedAt = toIST(ret.updatedAt);

    return ret;
  },
});

module.exports = mongoose.model('DailyPerformance', performanceSchema);
