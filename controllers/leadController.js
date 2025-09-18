// const Lead = require('../models/leadModel');

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


// const isValidEmail = (email) => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };


// const isValidPhone = (phone) => {
//   return /^\d{7,15}$/.test(phone);
// };


// exports.createLead = async (req, res) => {
//   try {
//     const {
//       customerName,
//       contactNumber,
//       email,
//       status,
//       leadType,
//       followUp,
//       requirement,
//       remark,
//       date,
//       capturedBy,
//       assignTo,
//       transferTo,
//       source,
//       Budget
//     } = req.body;

//     // Validations
//     if (!customerName || customerName.trim() === '') {
//       return res.status(400).json({ success: false, message: "Customer Name is required" });
//     }
//     if (!contactNumber || !isValidPhone(contactNumber)) {
//       return res.status(400).json({ success: false, message: "Invalid or missing Contact Number" });
//     }
//     if (!email || !isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: "Invalid or missing Email" });
//     }
//     if (!status || !validStatuses.includes(status)) {
//       return res.status(400).json({ success: false, message: "Invalid or missing Status" });
//     }
//     if (!leadType || !validLeadTypes.includes(leadType)) {
//       return res.status(400).json({ success: false, message: "Invalid or missing Lead Type" });
//     }

//     const lead = new Lead({
//       customerName,
//       contactNumber,
//       email,
//       status,
//       leadType,
//       followUp,
//       requirement,
//       remark,
//       date,
//       capturedBy,
//       assignTo,
//       transferTo,
//       source,
//       Budget
//     });

//     await lead.save();
//     res.status(201).json({ success: true, data: lead });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// exports.getLeads = async (req, res) => {
//   try {
//     const leads = await Lead.find();
//     res.json({ success: true, data: leads });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error fetching leads" });
//   }
// };


// exports.updateLead = async (req, res) => {
//   try {
//     const {
//       customerName,
//       contactNumber,
//       email,
//       status,
//       leadType,
//       followUp,
//       requirement,
//       remark,
//       date,
//       capturedBy,
//       assignTo,
//       transferTo,
//       source,
//       Budget
//     } = req.body;

//     if (customerName !== undefined && customerName.trim() === '') {
//       return res.status(400).json({ success: false, message: "Customer Name cannot be empty" });
//     }
//     if (contactNumber !== undefined && !isValidPhone(contactNumber)) {
//       return res.status(400).json({ success: false, message: "Invalid Contact Number" });
//     }
//     if (email !== undefined && !isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: "Invalid Email" });
//     }
//     if (status !== undefined && !validStatuses.includes(status)) {
//       return res.status(400).json({ success: false, message: "Invalid Status" });
//     }
//     if (leadType !== undefined && !validLeadTypes.includes(leadType)) {
//       return res.status(400).json({ success: false, message: "Invalid Lead Type" });
//     }

//     const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!lead) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }
//     res.json({ success: true, data: lead });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error updating lead" });
//   }
// };

// exports.deleteLead = async (req, res) => {
//   try {
//     const lead = await Lead.findByIdAndDelete(req.params.id);
//     if (!lead) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }
//     res.json({ success: true, message: "Lead deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error deleting lead" });
//   }
// };


// exports.bulkUploadLeads = async (req, res) => {
//   try {
//     const { leads } = req.body;

//     if (!Array.isArray(leads) || leads.length === 0) {
//       return res.status(400).json({ message: "Leads array is required" });
//     }

//     // Insert many leads at once
//     const insertedLeads = await Lead.insertMany(leads, { ordered: false }); 
//     // ordered:false → continues inserting even if some docs fail (e.g., duplicate emails)

//     res.status(201).json({
//       message: "Bulk upload successful",
//       insertedCount: insertedLeads.length,
//       insertedLeads,
//     });
//   } catch (error) {
//     console.error("Bulk upload error:", error);

//     res.status(500).json({
//       message: "Error during bulk upload",
//       error: error.message,
//     });
//   }
// };




const Lead = require('../models/leadModel');
const User = require('../models/user'); // 👈 import User model

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

// Helper to validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper to validate phone number (7-15 digits)
const isValidPhone = (phone) => /^\d{7,15}$/.test(phone);

// Create Lead
exports.createLead = async (req, res) => {
  try {
    const {
      customerName,
      contactNumber,
      email,
      status,
      leadType,
      followUp,
      requirement,
      remark,
      date,
      capturedBy,
      assignTo,
      transferTo,
      source,
      Budget
    } = req.body;

    // Validations
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ success: false, message: "Customer Name is required" });
    }
    if (!contactNumber || !isValidPhone(contactNumber)) {
      return res.status(400).json({ success: false, message: "Invalid or missing Contact Number" });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid or missing Email" });
    }
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid or missing Status" });
    }
    if (!leadType || !validLeadTypes.includes(leadType)) {
      return res.status(400).json({ success: false, message: "Invalid or missing Lead Type" });
    }

    // ✅ validate assignTo user
    if (assignTo) {
      const userExists = await User.findById(assignTo);
      if (!userExists) {
        return res.status(400).json({ success: false, message: "Invalid assignTo user" });
      }
    }

    const lead = new Lead({
      customerName,
      contactNumber,
      email,
      status,
      leadType,
      followUp,
      requirement,
      remark,
      date,
      capturedBy,
      assignTo,
      transferTo,
      source,
      Budget
    });

    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get All Leads (with assigned user populated)
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate("assignTo", "name email");
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching leads" });
  }
};

// Update Lead
exports.updateLead = async (req, res) => {
  try {
    const {
      customerName,
      contactNumber,
      email,
      status,
      leadType,
      followUp,
      requirement,
      remark,
      date,
      capturedBy,
      assignTo,
      transferTo,
      source,
      Budget
    } = req.body;

    if (customerName !== undefined && customerName.trim() === '') {
      return res.status(400).json({ success: false, message: "Customer Name cannot be empty" });
    }
    if (contactNumber !== undefined && !isValidPhone(contactNumber)) {
      return res.status(400).json({ success: false, message: "Invalid Contact Number" });
    }
    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid Email" });
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid Status" });
    }
    if (leadType !== undefined && !validLeadTypes.includes(leadType)) {
      return res.status(400).json({ success: false, message: "Invalid Lead Type" });
    }

    // ✅ validate assignTo user if updating
    if (assignTo !== undefined) {
      const userExists = await User.findById(assignTo);
      if (!userExists) {
        return res.status(400).json({ success: false, message: "Invalid assignTo user" });
      }
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("assignTo", "name email");
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating lead" });
  }
};

// Delete Lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting lead" });
  }
};

// Bulk Upload Leads
exports.bulkUploadLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "Leads array is required" });
    }

    // ✅ Optional: validate assignTo for each lead
    for (const lead of leads) {
      if (lead.assignTo) {
        const userExists = await User.findById(lead.assignTo);
        if (!userExists) {
          return res.status(400).json({ message: `Invalid assignTo user for lead: ${lead.customerName}` });
        }
      }
    }

    const insertedLeads = await Lead.insertMany(leads, { ordered: false });

    res.status(201).json({
      message: "Bulk upload successful",
      insertedCount: insertedLeads.length,
      insertedLeads,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      message: "Error during bulk upload",
      error: error.message,
    });
  }
};
