


const mongoose = require("mongoose");

// We store dates in UTC (Date.now). Formatting to IST is done in toJSON for responses.

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Lead", "Inventory"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: null,
    },
    changedBy: {
      type: String,
    },

    // optional metadata
    meta: {
      type: Object,
      default: () => ({}),
    },
     read: {
      type: Boolean,
      default: false
    },

    // store as UTC timestamp
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },


  },
  { versionKey: false }
);

// Prevent duplicate
notificationSchema.index({ type: 1, itemId: 1, message: 1 }, { unique: true });

// Return createdAt as ISO UTC string for frontend to parse and format correctly
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // Return ISO UTC string; frontend will convert to IST as needed
  if (obj.createdAt && obj.createdAt instanceof Date) {
    obj.createdAt = obj.createdAt.toISOString();
  }
  return obj;
};

// Ensure meta.unit.mobileNumbers is normalized to an array before saving/updating
function normalizeMobileNumbers(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (typeof raw === 'object') {
    try {
      return Object.values(raw).flat().map(String).map(s => s.trim()).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
  return [];
}

notificationSchema.pre('save', function (next) {
  try {
    if (this.meta && typeof this.meta === 'object') {
      if (this.meta.unit && typeof this.meta.unit === 'object') {
        this.meta.unit.mobileNumbers = normalizeMobileNumbers(this.meta.unit.mobileNumbers);
      }
      // ensure hierarchy exists as object
      if (this.meta.hierarchy && typeof this.meta.hierarchy !== 'object') {
        this.meta.hierarchy = {};
      }
    }
  } catch (e) {
    // swallow — be defensive in production
  }
  next();
});

notificationSchema.pre('findOneAndUpdate', function (next) {
  try {
    const update = this.getUpdate();
    const meta = (update && (update.$set ? update.$set.meta : update.meta)) || null;
    if (meta && typeof meta === 'object') {
      if (meta.unit && typeof meta.unit === 'object') {
        meta.unit.mobileNumbers = normalizeMobileNumbers(meta.unit.mobileNumbers);
      }
      if (meta.hierarchy && typeof meta.hierarchy !== 'object') {
        meta.hierarchy = {};
      }
      if (update.$set) update.$set.meta = meta; else update.meta = meta;
      this.setUpdate(update);
    }
  } catch (e) {}
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);








