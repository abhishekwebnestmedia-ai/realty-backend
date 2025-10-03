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
  { timestamps: true }
);

module.exports = mongoose.model("BrokerRequirement", brokerRequirementSchema);
