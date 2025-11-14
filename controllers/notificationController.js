
//its leadd and inventry notification 

const Notification = require("../models/notification");
const mongoose = require("mongoose");

// exports.getAllNotifications = async (req, res) => {
//   try {
//     const notifications = await Notification.find().sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       total: notifications.length,
//       data: notifications,
//     });
//   } catch (err) {
//     console.error("getAllNotifications error:", err);
//     res.status(500).json({ success: false, message: "Error fetching notifications" });
//   }
// };







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

// ---- MARK ONE NOTIFICATION READ/UNREAD ----
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { read = true } = req.body; // default to true if not sent

    const notif = await Notification.findByIdAndUpdate(
      id,
      { read },
      { new: true }
    );

    if (!notif)
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });

    res.json({
      success: true,
      message: `Notification updated (read = ${read})`,
      data: notif,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: err.message,
    });
  }
};

// ---- MARK ALL AS READ ----
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({}, { read: true });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: err.message,
    });
  }
};