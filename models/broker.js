const mongoose = require("mongoose");
const { parseFollowupInput } = require("../utils/followupTime");

const validStatuses = ["Ok", "Hot", "Thanda", "Visit"];

const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
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

const brokerRequirementSchema = new mongoose.Schema(
  {
    brokerName: { type: String, required: true },
    companyName: { type: String },   // ✅ NEW FIELD ADDED
    contactNumber: { type: String, required: true },
    followUpDate: { type: Date },
    followUpUtc: { type: Date, default: null },
    status: { type: String, enum: validStatuses },
    source: { type: String },
  
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

        const rawFollow = ret.followUpUtc || ret.followUpDate;
        if (rawFollow) {
          ret.followUpDateRaw = new Date(rawFollow).toISOString();
        } else {
          ret.followUpDateRaw = null;
        }

        ret.followUpDate = formatIstString(ret.followUpDate);
        ret.followUpUtc = ret.followUpUtc ? new Date(ret.followUpUtc).toISOString() : null;

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

    if (typeof value === "object") {
      if (value instanceof Date) continue;
      formatStringFields(value, seen);
    }
  }
}

function normalizeFollowUp(target) {
  if (!target) return;
  if (!target.followUpDate) return;
  const parsed = parseFollowupInput(target.followUpDate);
  if (parsed && !Number.isNaN(parsed.getTime())) {
    target.followUpDate = parsed;
    target.followUpUtc = parsed;
  }
}

// Hooks
brokerRequirementSchema.pre("save", function (next) {
  formatStringFields(this);
  normalizeFollowUp(this);
  next();
});

brokerRequirementSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatStringFields(target);
    normalizeFollowUp(target);
  }
  next();
});

module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);
