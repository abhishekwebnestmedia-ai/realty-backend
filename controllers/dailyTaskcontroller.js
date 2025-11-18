

const DailyPerformance = require('../models/DailyTask');
const User = require("../models/user");


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



exports.getTodaysPlans = async (req, res) => {
  try {
    // Define start and end of the current day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all users
    const users = await User.find().select("name email role");

    // Fetch all today's records
    const records = await DailyPerformance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });

    // Group performance data by user name
    const groupedRecords = records.reduce((acc, record) => {
      if (!acc[record.name]) acc[record.name] = [];
      acc[record.name].push(record);
      return acc;
    }, {});

    // Combine users with their records
    const result = {};
    users.forEach((user) => {
      result[user.name] = groupedRecords[user.name] || [
        {
          morningCommitment: {
            onlinePortalChecked: false,
            whatsappStatus: false,
            emailWorking: 0,
            buyersWorking: 0,
            sellersWorking: 0,
          },
          eveningAchievements: {
            onlinePortalChecked: false,
            whatsappStatus: false,
          },
          name: user.name,
          date: new Date().toISOString().split("T")[0],
          meetingVisits: 0,
          planstatus: 0,
        },
      ];
    });

    res.status(200).json({
      success: true,
      count: Object.keys(result).length,
      data: result,
    });
  } catch (err) {
    console.error("Error fetching today's daily plans:", err);
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







