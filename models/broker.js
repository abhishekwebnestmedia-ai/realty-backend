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
//   { timestamps: true }
// );

// module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);





const mongoose = require("mongoose");

const validStatuses = [
  "Ok",
  "Hot",
  "Thanda",
  "Visit",
];

const brokerRequirementSchema = new mongoose.Schema(
  {
    brokerName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    followUpDate: { type: Date },
    status: { type: String, enum: validStatuses },
    source: { type: String },
    capturedBy: { type: String },
    requirement: { type: String },
    remark: { type: String }
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
            hour12: true
          });
        };

        // Format createdAt, updatedAt, followUpDate
        ret.createdAt = formatDate(ret.createdAt);
        ret.updatedAt = formatDate(ret.updatedAt);
        ret.followUpDate = formatDate(ret.followUpDate);

        return ret;
      }
    }
  }
);

module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);
