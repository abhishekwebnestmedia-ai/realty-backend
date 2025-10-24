



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

        // Format createdAt, updatedAt, followUpDate to IST
        ret.createdAt = formatDate(ret.createdAt);
        ret.updatedAt = formatDate(ret.updatedAt);
        ret.followUpDate = formatDate(ret.followUpDate);

        return ret;
      },
    },
  }
);

// ✅ Helper: Convert to Title Case (e.g., "noida sector" → "Noida Sector")
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ✅ Helper: Format all string fields (Title Case except email)
function formatStringFields(obj) {
  for (const key in obj) {
    if (!obj[key]) continue;

    const value = obj[key];

    // Handle string arrays (future-safe)
    if (Array.isArray(value)) {
      obj[key] = value.map(v =>
        typeof v === "string" ? toTitleCase(v) : v
      );
      continue;
    }

    // Handle normal string fields
    if (typeof value === "string") {
      if (key === "email") {
        obj[key] = value.toLowerCase(); // email → lowercase
      } else {
        obj[key] = toTitleCase(value); // all others → Title Case
      }
    }
    // Handle nested objects recursively
    else if (typeof value === "object") {
      formatStringFields(value);
    }
  }
}

// 🟢 Before saving a new broker requirement
brokerRequirementSchema.pre("save", function (next) {
  formatStringFields(this);
  next();
});

// 🟢 Before updating an existing broker requirement
brokerRequirementSchema.pre("findOneAndUpdate", function (next) {
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

module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);
