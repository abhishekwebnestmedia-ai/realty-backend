// controllers/leadController.js
const Lead = require('../models/leadModel');

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
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper to validate phone number (7-15 digits)
const isValidPhone = (phone) => {
  return /^\d{7,15}$/.test(phone);
};

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

// Get All Leads
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find();
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

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
