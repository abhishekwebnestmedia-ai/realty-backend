const DailyPerformance = require('../models/DailyTask');

exports.getAllPerformances = async (req, res) => {
  try {
    const records = await DailyPerformance.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPerformance = async (req, res) => {
  try {
    const newRecord = new DailyPerformance(req.body);
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    // Handle duplicate key error for unique constraint violation (code 11000)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A record for this user and date already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};


exports.getPerformanceById = async (req, res) => {
  try {
    const record = await DailyPerformance.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePerformance = async (req, res) => {
  try {
    const updated = await DailyPerformance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePerformance = async (req, res) => {
  try {
    const deleted = await DailyPerformance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
