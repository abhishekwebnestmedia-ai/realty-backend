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

//         // ✅ FIXED: Match DailyPerformance by user.name instead of user._id
//         const performance = await DailyPerformance.findOne({
//           name: user.name, // previously user._id.toString()
//           date: { $gte: startOfDay, $lte: endOfDay }
//         });

//         return {
//           name: user.name,
//           userId: user._id,
//           email: user.email,
//           leadStats: { ...leadStats, totalLeads },
//           DailyPlanStatus : performance?.planstatus || 0,
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
    // 🧾 Get all users
    const users = await User.find({}, "_id name email");

    // 📅 Define date range (today or requested)
    const today = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 🧮 Fetch unassigned leads safely using raw MongoDB driver
    const unassignedLeads = await Lead.collection
      .find({
        $or: [
          { assignTo: { $exists: false } },
          { assignTo: null },
          { assignTo: "" }
        ]
      })
      .project({
        customerName: 1,
        contactNumber: 1,
        status: 1,
        leadType: 1,
        createdAt: 1
      })
      .toArray();

    const unassignedLeadCount = unassignedLeads.length;

    // 🧾 Generate report for each user
    const reports = await Promise.all(
      users.map(async (user) => {
        // ⚙️ Use raw collection aggregation to avoid ObjectId casting
        const leadCounts = await Lead.collection
          .aggregate([
            {
              $match: {
                assignTo: {
                  $type: "objectId",
                  $eq: new mongoose.Types.ObjectId(user._id)
                }
              }
            },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ])
          .toArray();

        // 🧮 Build lead stats
        const leadStats = {};
        let totalLeads = 0;

        validStatuses.forEach((status) => {
          const found = leadCounts.find((l) => l._id === status);
          const count = found ? found.count : 0;
          leadStats[status.replace(/\s+/g, '')] = count;
          totalLeads += count;
        });

        // 📊 Fetch Daily Performance
        const performance = await DailyPerformance.findOne({
          name: user.name,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        return {
          name: user.name,
          userId: user._id,
          email: user.email,
          leadStats: { ...leadStats, totalLeads },
          DailyPlanStatus: performance?.planstatus || 0,
          meetingVisits: performance?.meetingVisits || 0,
        };
      })
    );

    // ✅ Send final response
    return res.status(200).json({
      success: true,
      data: reports,
      unassignedLeads: unassignedLeadCount,
      unassignedLeadDetails: unassignedLeads,
    });

  } catch (error) {
    console.error("❌ Error generating combined report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
