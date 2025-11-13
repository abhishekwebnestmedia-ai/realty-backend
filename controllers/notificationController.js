
//its leadd and inventry notification 

const Notification = require("../models/notification");
const mongoose = require("mongoose");

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      total: notifications.length,
      data: notifications,
    });
  } catch (err) {
    console.error("getAllNotifications error:", err);
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
};







// exports.getAllNotifications = async (req, res) => {
//   try {
//     const userId = req.user._id.toString();

//     const notifications = await Notification.find().sort({ createdAt: -1 });

//     const formatted = notifications.map((n) => {
//       const obj = n.toJSON();
//       obj.read = n.readBy.includes(userId);
//       return obj;
//     });

//     res.json({ success: true, notifications: formatted });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };



// exports.markAsRead = async (req, res) => {
//   try {
//     const userId = req.user._id.toString();

//     await Notification.findByIdAndUpdate(req.params.id, {
//       $addToSet: { readBy: userId },
//     });

//     res.json({ success: true, message: "Notification marked as read" });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };




// exports.markAllAsRead = async (req, res) => {
//   try {
//     const userId = req.user._id.toString();

//     await Notification.updateMany(
//       { readBy: { $ne: userId } },
//       { $addToSet: { readBy: userId } }
//     );

//     res.json({ success: true, message: "All notifications marked as read" });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
