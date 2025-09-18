
// const mongoose = require('mongoose');

// const validStatuses = [
//   "Hot",
//   "Not Connected",
//   "Serious",
//   "Potential",
//   "Futuristic",
//   "Dead Lead"
// ];

// const validLeadTypes = [
//   "Buyer",
//   "Rental"
// ];

// const leadSchema = new mongoose.Schema({
//   customerName: { type: String, required: true },
//   contactNumber: { type: String, required: true },
//   email: { type: String, required: true },
//   status: { 
//     type: String, 
//     required: true,
//     enum: validStatuses
//   },
//   leadType: { 
//     type: String,
//     required: true,
//     enum: validLeadTypes
//   },
//   followUp: { type: String },
//   requirement: { type: String },
//   remark: { type: String },
//   date: { type: String },
//   capturedBy: { type: String },
//   assignTo: { type: String },
//   transferTo: { type: String },
//   source: { type: String },
//   Budget: { type: String }
// } , { timestamps: true }); 


// module.exports = mongoose.model('Lead', leadSchema);



const mongoose = require('mongoose');

const validStatuses = [
  "Hot",
  "Not Connected",
  "Serious",
  "Potential",
  "Futuristic",
  "Dead Lead"
];

const validLeadTypes = [
  "Buyer",
  "Rental"
];

const leadSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: validStatuses
  },
  leadType: { 
    type: String,
    required: true,
    enum: validLeadTypes
  },
  followUp: { type: String },
  requirement: { type: String },
  remark: { type: String },
  date: { type: String },
  capturedBy: { type: String },

  // 👇 assignTo is now a reference to User collection
  assignTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  transferTo: { type: String },
  source: { type: String },
  Budget: { type: String }
}, { timestamps: true }); 

module.exports = mongoose.model('Lead', leadSchema);
