const Notification = require("../models/notification");
const mongoose = require("mongoose");

/**
 * ✅ Get all notifications (global, no user filter)
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

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
 * ✅ Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });

    res.json({ success: true, data: notification });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ success: false, message: "Error updating notification" });
  }
};

/**
 * ✅ Mark all notifications as read (global)
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ isRead: false }, { isRead: true });

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ success: false, message: "Error marking all as read" });
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

/**
 * ✅ Get count of unread notifications (global)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.json({ success: true, unreadCount: count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ success: false, message: "Error fetching unread count" });
  }
};
