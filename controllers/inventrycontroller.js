// controllers/recordController.js
const Inventory = require('../models/inventryModel'); // Correct model name and casing

// Create
exports.createInventry = async (req, res) => {
  try {
    const record = new Inventory(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updateInventry = async (req, res) => {
  try {
    const record = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteInventry = async (req, res) => {
  try {
    const record = await Inventory.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Fetch all records
exports.getAllInventry = async (req, res) => {
  try {
    const records = await Inventory.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
