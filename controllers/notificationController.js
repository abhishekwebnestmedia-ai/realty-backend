const Notification = require("../models/notification");
const mongoose = require("mongoose");

/**
 * ✅ Get all notifications (global)
 */
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

/**
 * ✅ Delete a single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Notification not found" });

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ success: false, message: "Error deleting notification" });
  }
};

/**
 * ✅ Delete all notifications (global)
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({});
    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted`,
    });
  } catch (err) {
    console.error("deleteAllNotifications error:", err);
    res.status(500).json({ success: false, message: "Error deleting all notifications" });
  }
};
