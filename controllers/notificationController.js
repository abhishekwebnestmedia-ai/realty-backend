
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


// its lead and inventory notification

// const Notification = require("../models/notification");
// const User = require("../models/user");
// const mongoose = require("mongoose");

// function isAdminUser(user) {
//   if (!user) return false;
//   return user.role === "admin" || user.permissions?.superAdmin === true;
// }

// // ---- GET ALL NOTIFICATIONS (per user / admin) ----
// exports.getAllNotifications = async (req, res) => {
//   try {
//     const userId = req.user._id; // assuming auth middleware sets req.user
//     const user = await User.findById(userId).select("role permissions");

//     let filter = {};

//     // Admin / SuperAdmin → see all
//     if (!isAdminUser(user)) {
//       // Normal user → only own + global notifications
//       filter = {
//         $or: [
//           { receiver: userId },
//           { receiver: null },
//         ],
//       };
//     }

//     const notifications = await Notification.find(filter).sort({ createdAt: -1 });

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

// // ---- MARK ONE NOTIFICATION READ/UNREAD ----
// exports.markAsRead = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { read = true } = req.body; // default to true if not sent
//     const userId = req.user._id;

//     const user = await User.findById(userId).select("role permissions");
//     const isAdmin = isAdminUser(user);

//     let filter = { _id: id };

//     if (!isAdmin) {
//       // user can only update own/global notifications
//       filter.$or = [
//         { receiver: userId },
//         { receiver: null },
//       ];
//     }

//     const notif = await Notification.findOneAndUpdate(
//       filter,
//       { read },
//       { new: true }
//     );

//     if (!notif) {
//       return res.status(404).json({
//         success: false,
//         message: "Notification not found or not allowed",
//       });
//     }

//     res.json({
//       success: true,
//       message: `Notification updated (read = ${read})`,
//       data: notif,
//     });

//   } catch (err) {
//     console.error("markAsRead error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Error updating notification",
//       error: err.message,
//     });
//   }
// };

// // ---- MARK ALL AS READ ----
// exports.markAllAsRead = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const user = await User.findById(userId).select("role permissions");
//     const isAdmin = isAdminUser(user);

//     let filter = {};

//     if (!isAdmin) {
//       filter = {
//         $or: [
//           { receiver: userId },
//           { receiver: null },
//         ],
//       };
//     }

//     await Notification.updateMany(filter, { read: true });

//     res.json({
//       success: true,
//       message: "All notifications marked as read",
//     });
//   } catch (err) {
//     console.error("markAllAsRead error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Error updating notifications",
//       error: err.message,
//     });
//   }
// };
