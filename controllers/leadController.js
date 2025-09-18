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






// const Lead = require('../models/leadModel');
// const User = require('../models/user');
// const mongoose = require("mongoose");

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

// // Helper to validate email format
// const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// // Helper to validate phone number (7-15 digits)
// const isValidPhone = (phone) => /^\d{7,15}$/.test(phone);

// // 🔹 Resolve assignTo: accepts ObjectId, name, or email
// async function resolveAssignTo(assignTo) {
//   if (!assignTo) return null;

//   let user = null;

//   // If it's a valid ObjectId, try by ID first
//   if (mongoose.Types.ObjectId.isValid(assignTo)) {
//     user = await User.findById(assignTo);
//   }

//   // Otherwise, search by name or email
//   if (!user) {
//     user = await User.findOne({ $or: [{ name: assignTo }, { email: assignTo }] });
//   }

//   return user;
// }

// // Create Lead
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

//     // ✅ Resolve assignTo
//     let user = null;
//     if (assignTo) {
//       user = await resolveAssignTo(assignTo);
//       if (!user) {
//         return res.status(400).json({ success: false, message: "Invalid assignTo user" });
//       }
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
//       assignTo: user ? user._id : null,
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

// // Assign/Reassign Lead
// exports.assignLead = async (req, res) => {
//   try {
//     const { assignTo } = req.body;

//     if (!assignTo) {
//       return res.status(400).json({ success: false, message: "assignTo field is required" });
//     }

//     // ✅ Resolve assignTo
//     const user = await resolveAssignTo(assignTo);
//     if (!user) {
//       return res.status(400).json({ success: false, message: "Invalid assignTo user" });
//     }

//     const lead = await Lead.findByIdAndUpdate(
//       req.params.id,
//       { assignTo: user._id },
//       { new: true }
//     ).populate("assignTo", "name email");

//     if (!lead) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }

//     res.json({ success: true, message: "Lead assigned successfully", data: lead });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Error assigning lead" });
//   }
// };

// // Get All Leads
// exports.getLeads = async (req, res) => {
//   try {
//     const leads = await Lead.find().populate("assignTo", "name email");
//     res.json({ success: true, data: leads });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error fetching leads" });
//   }
// };

// // Update Lead
// exports.updateLead = async (req, res) => {
//   try {
//     const updateData = { ...req.body };

//     if (updateData.customerName !== undefined && updateData.customerName.trim() === '') {
//       return res.status(400).json({ success: false, message: "Customer Name cannot be empty" });
//     }
//     if (updateData.contactNumber !== undefined && !isValidPhone(updateData.contactNumber)) {
//       return res.status(400).json({ success: false, message: "Invalid Contact Number" });
//     }
//     if (updateData.email !== undefined && !isValidEmail(updateData.email)) {
//       return res.status(400).json({ success: false, message: "Invalid Email" });
//     }
//     if (updateData.status !== undefined && !validStatuses.includes(updateData.status)) {
//       return res.status(400).json({ success: false, message: "Invalid Status" });
//     }
//     if (updateData.leadType !== undefined && !validLeadTypes.includes(updateData.leadType)) {
//       return res.status(400).json({ success: false, message: "Invalid Lead Type" });
//     }

//     // ✅ Resolve assignTo if provided
//     if (updateData.assignTo !== undefined) {
//       const user = await resolveAssignTo(updateData.assignTo);
//       if (!user) {
//         return res.status(400).json({ success: false, message: "Invalid assignTo user" });
//       }
//       updateData.assignTo = user._id;
//     }

//     const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate("assignTo", "name email");
//     if (!lead) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }
//     res.json({ success: true, data: lead });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Error updating lead" });
//   }
// };

// // Delete Lead
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

// // Bulk Upload Leads
// exports.bulkUploadLeads = async (req, res) => {
//   try {
//     const { leads } = req.body;

//     if (!Array.isArray(leads) || leads.length === 0) {
//       return res.status(400).json({ message: "Leads array is required" });
//     }

//     const processedLeads = [];
//     for (const lead of leads) {
//       let user = null;
//       if (lead.assignTo) {
//         user = await resolveAssignTo(lead.assignTo);
//         if (!user) {
//           return res.status(400).json({ message: `Invalid assignTo user for lead: ${lead.customerName}` });
//         }
//       }
//       processedLeads.push({
//         ...lead,
//         assignTo: user ? user._id : null
//       });
//     }

//     const insertedLeads = await Lead.insertMany(processedLeads, { ordered: false });

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
const User = require('../models/user');
const mongoose = require("mongoose");

const validStatuses = [
  "Hot",
  "Not Connected",
  "Serious",
  "Potential",
  "Futuristic",
  "Dead Lead"
];

const validLeadTypes = ["Buyer", "Rental"];

// 🔹 Helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{7,15}$/.test(phone);

// 🔹 Resolve assignTo: accepts ObjectId, name, or email
async function resolveAssignTo(assignTo) {
  if (!assignTo) return null;

  // If it's a valid ObjectId, try by ID first
  if (mongoose.Types.ObjectId.isValid(assignTo)) {
    const user = await User.findById(assignTo);
    if (user) return user;
  }

  // Otherwise, search by name or email
  return await User.findOne({ $or: [{ name: assignTo }, { email: assignTo }] });
}

// 🔹 Validate Lead Data
function validateLeadData(data, isUpdate = false) {
  if (!isUpdate || data.customerName !== undefined) {
    if (!data.customerName || data.customerName.trim() === '') {
      return "Customer Name is required";
    }
  }
  if (!isUpdate || data.contactNumber !== undefined) {
    if (!data.contactNumber || !isValidPhone(data.contactNumber)) {
      return "Invalid or missing Contact Number";
    }
  }
  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !isValidEmail(data.email)) {
      return "Invalid or missing Email";
    }
  }
  if (!isUpdate || data.status !== undefined) {
    if (!data.status || !validStatuses.includes(data.status)) {
      return "Invalid or missing Status";
    }
  }
  if (!isUpdate || data.leadType !== undefined) {
    if (!data.leadType || !validLeadTypes.includes(data.leadType)) {
      return "Invalid or missing Lead Type";
    }
  }
  return null;
}

// 🔹 Create Lead
exports.createLead = async (req, res) => {
  try {
    const errorMsg = validateLeadData(req.body);
    if (errorMsg) {
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const { assignTo, ...leadData } = req.body;

    let user = null;
    if (assignTo) {
      user = await resolveAssignTo(assignTo);
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid assignTo user" });
      }
    }

    const lead = new Lead({
      ...leadData,
      assignTo: user ? user._id : null,
    });

    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error("❌ createLead error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 Assign/Reassign Lead
exports.assignLead = async (req, res) => {
  try {
    const { assignTo } = req.body;
    if (!assignTo) {
      return res.status(400).json({ success: false, message: "assignTo field is required" });
    }

    const user = await resolveAssignTo(assignTo);
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid assignTo user" });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignTo: user._id },
      { new: true }
    ).populate("assignTo", "name email");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, message: "Lead assigned successfully", data: lead });
  } catch (err) {
    console.error("❌ assignLead error:", err);
    res.status(500).json({ success: false, message: "Error assigning lead" });
  }
};

// 🔹 Get All Leads
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate("assignTo", "name email");
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error("❌ getLeads error:", err);
    res.status(500).json({ success: false, message: "Error fetching leads" });
  }
};

// 🔹 Update Lead
exports.updateLead = async (req, res) => {
  try {
    const errorMsg = validateLeadData(req.body, true);
    if (errorMsg) {
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const updateData = { ...req.body };

    if (updateData.assignTo !== undefined) {
      const user = await resolveAssignTo(updateData.assignTo);
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid assignTo user" });
      }
      updateData.assignTo = user._id;
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("assignTo", "name email");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error("❌ updateLead error:", err);
    res.status(500).json({ success: false, message: "Error updating lead" });
  }
};

// 🔹 Delete Lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    console.error("❌ deleteLead error:", err);
    res.status(500).json({ success: false, message: "Error deleting lead" });
  }
};

// 🔹 Bulk Upload Leads
exports.bulkUploadLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "Leads array is required" });
    }

    const processedLeads = [];
    for (const lead of leads) {
      const errorMsg = validateLeadData(lead);
      if (errorMsg) {
        return res.status(400).json({ message: `Validation failed for ${lead.customerName || "Unknown"}: ${errorMsg}` });
      }

      let user = null;
      if (lead.assignTo) {
        user = await resolveAssignTo(lead.assignTo);
        if (!user) {
          return res.status(400).json({ message: `Invalid assignTo user for lead: ${lead.customerName}` });
        }
      }

      processedLeads.push({
        ...lead,
        assignTo: user ? user._id : null
      });
    }

    const insertedLeads = await Lead.insertMany(processedLeads, { ordered: false });

    res.status(201).json({
      success: true,
      message: "Bulk upload successful",
      insertedCount: insertedLeads.length,
      insertedLeads,
    });
  } catch (error) {
    console.error("❌ bulkUploadLeads error:", error);
    res.status(500).json({
      success: false,
      message: "Error during bulk upload",
      error: error.message,
    });
  }
};
