const BrokerRequirement = require("../models/broker");

// ✅ Create Requirement
exports.createRequirement = async (req, res) => {
  try {
    const newRequirement = new BrokerRequirement(req.body);
    await newRequirement.save();
    res.status(201).json(newRequirement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get All Requirements
exports.getAllRequirements = async (req, res) => {
  try {
    const requirements = await BrokerRequirement.find().sort({ createdAt: -1 });
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Single Requirement by ID
exports.getRequirementById = async (req, res) => {
  try {
    const requirement = await BrokerRequirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ error: "Requirement not found" });
    res.json(requirement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Requirement
exports.updateRequirement = async (req, res) => {
  try {
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

// ✅ Delete Requirement
exports.deleteRequirement = async (req, res) => {
  try {
    const deletedRequirement = await BrokerRequirement.findByIdAndDelete(req.params.id);
    if (!deletedRequirement) return res.status(404).json({ error: "Requirement not found" });
    res.json({ message: "Requirement deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
