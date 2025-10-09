

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

// GET today's daily plans for all users
exports.getTodaysPlans = async (req, res) => {
  try {
    // Get the current date (00:00 to 23:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Query for records where date is within today
    const records = await DailyPerformance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate('userId', 'name email role'); // Optional: populate user info

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error('Error fetching today’s plans:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


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


exports.getPerformanceById = async (req, res) => {
  try {
    const record = await DailyPerformance.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


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


exports.deletePerformance = async (req, res) => {
  try {
    const deleted = await DailyPerformance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


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



/**
 * 🔹 Get today's performance by name
 * Returns only the record for the current date (IST)
 */
exports.getTodayPerformanceByName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required in request body" });
    }

    // ✅ Get current date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Get today's start and end in IST
    const startOfDayIST = new Date(istNow.setHours(0, 0, 0, 0) - istOffset);
    const endOfDayIST = new Date(istNow.setHours(23, 59, 59, 999) - istOffset);

    // ✅ Find record where date is today (IST)
    const record = await DailyPerformance.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      date: { $gte: startOfDayIST, $lte: endOfDayIST }
    });

    if (!record) {
      return res.status(404).json({ message: `No record found for ${name} today` });
    }

    res.status(200).json({
      success: true,
      data: record
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};







