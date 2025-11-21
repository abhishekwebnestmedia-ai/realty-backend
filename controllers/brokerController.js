

const BrokerRequirement = require("../models/broker");

// Create Single Requirement
exports.createRequirement = async (req, res) => {
  try {
    // Normalize followUpDate if provided (accepts ISO or datetime-local)
    if (req.body.followUpDate) {
      const d = new Date(req.body.followUpDate);
      if (!isNaN(d.getTime())) req.body.followUpDate = d;
      else delete req.body.followUpDate;
    }

    const newRequirement = new BrokerRequirement(req.body);
    await newRequirement.save();
    res.status(201).json(newRequirement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All
exports.getAllRequirements = async (req, res) => {
  try {
    const requirements = await BrokerRequirement.find().sort({ createdAt: -1 });
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get by ID
exports.getRequirementById = async (req, res) => {
  try {
    const requirement = await BrokerRequirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ error: "Requirement not found" });
    res.json(requirement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateRequirement = async (req, res) => {
  try {
    // Normalize followUpDate when updating
    if (req.body.followUpDate) {
      const d = new Date(req.body.followUpDate);
      if (!isNaN(d.getTime())) req.body.followUpDate = d;
      else delete req.body.followUpDate;
    }

    const updatedRequirement = await BrokerRequirement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRequirement) return res.status(404).json({ error: "Requirement not found" });
    res.json(updatedRequirement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteRequirement = async (req, res) => {
  try {
    const deletedRequirement = await BrokerRequirement.findByIdAndDelete(req.params.id);
    if (!deletedRequirement) return res.status(404).json({ error: "Requirement not found" });
    res.json({ message: "Requirement deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk Upload
exports.bulkUpload = async (req, res) => {
  try {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Please send an array of broker requirements" });
    }

    const brokers = await BrokerRequirement.insertMany(data, { ordered: false });

    res.status(201).json({
      message: "Bulk upload successful",
      count: brokers.length,
      brokers
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


