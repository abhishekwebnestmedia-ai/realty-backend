const Notification = require("../models/notification");

// ✅ Get notifications for logged-in user
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ forUser: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("getUserNotifications error:", err);
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
};

// ✅ Mark one notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, forUser: req.user._id },
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

// ✅ Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ forUser: req.user._id }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ success: false, message: "Error marking all as read" });
  }
};

// ✅ Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findOneAndDelete({
      _id: id,
      forUser: req.user._id,
    });

    if (!deleted)
      return res.status(404).json({ success: false, message: "Notification not found" });

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ success: false, message: "Error deleting notification" });
  }
};
