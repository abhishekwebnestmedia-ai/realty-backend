

const DailyPerformance = require('../models/DailyTask');


function calculatePlanStatus(data) {
  let count = 0;

  const mc = data.morningCommitment || {};


  // ✅ Morning commitment
  if (mc.onlinePortalChecked === true) count++;
  if (mc.whatsappStatus === true) count++;
  if (mc.emailWorking && mc.emailWorking > 0) count++;
  if (mc.buyersWorking && mc.buyersWorking > 0) count++;
  if (mc.sellersWorking && mc.sellersWorking > 0) count++;
  if (data.meetingVisits && data.meetingVisits > 0) count++;

  return count;
}


exports.getAllPerformances = async (req, res) => {
  try {
    const records = await DailyPerformance.find().sort({ date: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Add new performance record
 * Auto-calculates planstatus before saving
 */
exports.addPerformance = async (req, res) => {
  try {
    const body = req.body;

    // ✅ Calculate planstatus before saving
    body.planstatus = calculatePlanStatus(body);

    const newRecord = new DailyPerformance(body);
    await newRecord.save();

    res.status(201).json({
      success: true,
      message: "Performance record added successfully",
      data: newRecord
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A record for this user and date already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

/**
 * 🔹 Get performance record by ID
 */
exports.getPerformanceById = async (req, res) => {
  try {
    const record = await DailyPerformance.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * 🔹 Update performance record
 * Recalculates planstatus dynamically before saving
 */
exports.updatePerformance = async (req, res) => {

  try {
    const record = await DailyPerformance.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    // Merge new fields into existing record
    Object.assign(record, req.body);

    // ✅ Recalculate planstatus
    record.planstatus = calculatePlanStatus(record);

    await record.save();

    res.status(200).json({
      success: true,
      message: "Performance record updated successfully",
      data: record
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * 🔹 Delete performance record
 */
exports.deletePerformance = async (req, res) => {
  try {
    const deleted = await DailyPerformance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * 🔹 Get performance by name
 * Returns all records (sorted) and the latest record
 */
exports.getPerformanceByName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required in request body" });
    }

    const records = await DailyPerformance.find({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    }).sort({ date: -1, _id: -1 });

    if (!records || records.length === 0) {
      return res.status(404).json({ message: `No records found for ${name}` });
    }

    res.status(200).json({
      success: true,
      latest: records[0],
      count: records.length,
      data: records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};









