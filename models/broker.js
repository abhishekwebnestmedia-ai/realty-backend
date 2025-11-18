
const mongoose = require("mongoose");

const validStatuses = ["Ok", "Hot", "Thanda", "Visit"];

const brokerRequirementSchema = new mongoose.Schema(
  {
    brokerName: { type: String, required: true },
    companyName: { type: String },   // ✅ NEW FIELD ADDED
    contactNumber: { type: String, required: true },
    followUpDate: { type: Date },
    status: { type: String, enum: validStatuses },
    source: { type: String },
    capturedBy: { type: String },
    requirement: { type: String },
    remark: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        const formatDate = (date) => {
          if (!date) return null;
          return new Date(date).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        };

        ret.createdAt = formatDate(ret.createdAt);
        ret.updatedAt = formatDate(ret.updatedAt);
        ret.followUpDate = formatDate(ret.followUpDate);
        return ret;
      },
    },
  }
);

// Helper: Title case formatter
function toTitleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== "object") return;
  if (seen.has(obj)) return;
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];

    if (value == null) continue;

    if (typeof value === "string") {
      if (key === "email") obj[key] = value.toLowerCase().trim();
      else obj[key] = toTitleCase(value);
      continue;
    }

    if (Array.isArray(value)) {
      obj[key] = value.map(v => {
        if (typeof v === "string") return toTitleCase(v);
        if (typeof v === "object") formatStringFields(v, seen);
        return v;
      });
      continue;
    }

    if (typeof value === "object") formatStringFields(value, seen);
  }
}

// Hooks
brokerRequirementSchema.pre("save", function (next) {
  formatStringFields(this);
  next();
});

brokerRequirementSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatStringFields(target);
  }
  next();
});

module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);
