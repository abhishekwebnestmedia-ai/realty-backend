



// const mongoose = require("mongoose");

// const validStatuses = [
//   "Ok",
//   "Hot",
//   "Thanda",
//   "Visit",
// ];

// const brokerRequirementSchema = new mongoose.Schema(
//   {
//     brokerName: { type: String, required: true },
//     contactNumber: { type: String, required: true },
//     followUpDate: { type: Date },
//     status: { type: String, enum: validStatuses },
//     source: { type: String },
//     capturedBy: { type: String },
//     requirement: { type: String },
//     remark: { type: String }
//   },
//   { 
//     timestamps: true,
//     toJSON: {
//       virtuals: true,
//       transform: function (doc, ret) {
//         const formatDate = (date) => {
//           if (!date) return null;
//           return new Date(date).toLocaleString("en-IN", {
//             timeZone: "Asia/Kolkata",
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true
//           });
//         };

//         // Format createdAt, updatedAt, followUpDate
//         ret.createdAt = formatDate(ret.createdAt);
//         ret.updatedAt = formatDate(ret.updatedAt);
//         ret.followUpDate = formatDate(ret.followUpDate);

//         return ret;
//       }
//     }
//   }
// );

// module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);

const mongoose = require("mongoose");

const validStatuses = ["Ok", "Hot", "Thanda", "Visit"];

const brokerRequirementSchema = new mongoose.Schema(
  {
    brokerName: { type: String, required: true },
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

        // ✅ Format timestamps to IST
        ret.createdAt = formatDate(ret.createdAt);
        ret.updatedAt = formatDate(ret.updatedAt);
        ret.followUpDate = formatDate(ret.followUpDate);
        return ret;
      },
    },
  }
);

//
// ✅ Helper: Convert to Title Case
// e.g. "new delhi south" → "New Delhi South"
//
function toTitleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/) // handles multiple spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

//
// ✅ Recursive string formatter with recursion safety
// Converts all string fields to Title Case except email (lowercase)
//
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== "object") return;
  if (seen.has(obj)) return; // prevent circular reference loops
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value == null) continue;

    // 🔹 Handle strings
    if (typeof value === "string") {
      if (key === "email") {
        obj[key] = value.toLowerCase().trim();
      } else {
        obj[key] = toTitleCase(value);
      }
      continue;
    }

    // 🔹 Handle arrays (future-safe)
    if (Array.isArray(value)) {
      obj[key] = value.map(v => {
        if (typeof v === "string") return toTitleCase(v);
        if (typeof v === "object") formatStringFields(v, seen);
        return v;
      });
      continue;
    }

    // 🔹 Handle nested objects
    if (typeof value === "object") {
      formatStringFields(value, seen);
    }
  }
}

//
// 🟢 Before saving
//
brokerRequirementSchema.pre("save", function (next) {
  formatStringFields(this);
  next();
});

//
// 🟢 Before updating
//
brokerRequirementSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatStringFields(target);
  }
  next();
});

module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);
