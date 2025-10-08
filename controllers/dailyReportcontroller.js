// const mongoose = require('mongoose');
// const Lead = require('../models/leadModel');
// const DailyPerformance = require('../models/DailyTask');
// const User = require('../models/user');

// const validStatuses = [
//   "Hot", "Not Connected", "Serious", "Potential", "Futuristic", "Dead Lead", "Completed"
// ];

// exports.getCombinedReport = async (req, res) => {
//   try {
//     const users = await User.find({}, "_id name email");

//     const today = req.query.date ? new Date(req.query.date) : new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     const reports = await Promise.all(
//       users.map(async (user) => {
//         // 🧮 Count all leads per status
//         const leadCounts = await Lead.aggregate([
//           { $match: { assignTo: new mongoose.Types.ObjectId(user._id) } },
//           { $group: { _id: "$status", count: { $sum: 1 } } }
//         ]);

//         const leadStats = {};
//         let totalLeads = 0;
//         validStatuses.forEach(status => {
//           const found = leadCounts.find(l => l._id === status);
//           const count = found ? found.count : 0;
//           leadStats[status.replace(/\s+/g, '')] = count;
//           totalLeads += count;
//         });

//         // 📅 Get today's DailyPerformance
//         const performance = await DailyPerformance.findOne({
//           name: user._id.toString(),
//           date: { $gte: startOfDay, $lte: endOfDay }
//         });

//         return {
//           name: user.name,
//           userId: user._id,
//           email: user.email,
//           leadStats: { ...leadStats, totalLeads },
//           planstatus: performance?.planstatus || 0,
//           meetingVisits: performance?.meetingVisits || 0,
//           addNotes: performance?.addNotes || ""
//         };
//       })
//     );

//     res.status(200).json({ success: true, data: reports });
//   } catch (error) {
//     console.error("Error generating combined report:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


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

    const reports = await Promise.all(
      users.map(async (user) => {
        // 🧮 Count all leads per status
        const leadCounts = await Lead.aggregate([
          { $match: { assignTo: new mongoose.Types.ObjectId(user._id) } },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const leadStats = {};
        let totalLeads = 0;
        validStatuses.forEach(status => {
          const found = leadCounts.find(l => l._id === status);
          const count = found ? found.count : 0;
          leadStats[status.replace(/\s+/g, '')] = count;
          totalLeads += count;
        });

        // ✅ FIXED: Match DailyPerformance by user.name instead of user._id
        const performance = await DailyPerformance.findOne({
          name: user.name, // previously user._id.toString()
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        return {
          name: user.name,
          userId: user._id,
          email: user.email,
          leadStats: { ...leadStats, totalLeads },
          planstatus: performance?.planstatus || 0,
          meetingVisits: performance?.meetingVisits || 0,
          addNotes: performance?.addNotes || ""
        };
      })
    );

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("Error generating combined report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
