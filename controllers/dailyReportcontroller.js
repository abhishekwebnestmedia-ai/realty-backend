


const mongoose = require('mongoose');
const Lead = require('../models/leadModel');
const DailyPerformance = require('../models/DailyTask');
const User = require('../models/user');

const validStatuses = [
  "Hot", "Not Connected", "Serious", "Potential", "Futuristic", "Dead Lead", "Completed"
];

exports.getCombinedReport = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email");

    const today = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 🧾 Generate per-user reports
    const reports = await Promise.all(
      users.map(async (user) => {
        // ⚙️ Get all leads assigned to this user
        const assignedLeads = await Lead.collection
          .find({
            assignTo: {
              $type: "objectId",
              $eq: new mongoose.Types.ObjectId(user._id)
            }
          })
          .project({ status: 1 })
          .toArray();

        const assignedLeadCount = assignedLeads.length;

        // 🧮 Count leads per status
        const leadStats = {};
        validStatuses.forEach((status) => (leadStats[status.replace(/\s+/g, '')] = 0));

        assignedLeads.forEach((lead) => {
          if (lead.status && leadStats.hasOwnProperty(lead.status.replace(/\s+/g, ''))) {
            leadStats[lead.status.replace(/\s+/g, '')]++;
          }
        });

        const totalLeads = assignedLeadCount;

        // 📊 Fetch daily performance
        const performance = await DailyPerformance.findOne({
          name: user.name,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        return {
          name: user.name,
          userId: user._id,
          email: user.email,
          assignedLeadCount, // ✅ total assigned leads for this user
          leadStats: { ...leadStats, totalLeads },
          DailyPlanStatus: performance?.planstatus || 0,
          meetingVisits: performance?.meetingVisits || 0,
        };
      })
    );

    // ✅ Send only user data (no unassigned leads section)
    res.status(200).json({
      success: true,
      data: reports,
    });

  } catch (error) {
    console.error("Error generating combined report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
