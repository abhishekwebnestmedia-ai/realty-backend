
//its leadd and inventry notification 

const Notification = require("../models/notification");
const mongoose = require("mongoose");
const User = require("../models/user");
const { emitNotification, emitToAdmins } = require("../utils/socketEmitter");


exports.getAllNotifications = async (req, res) => {
  try {
    // If user is admin, return all notifications. Otherwise return only notifications addressed to the user.
    const userRole = req.user?.role || 'user';
    const userId = req.user?._id;

    let filter = {};
    if (userRole !== 'admin') {
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      filter = { receiver: userId };
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

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
    const userRole = req.user?.role || 'user';
    const userId = req.user?._id;

    const filter = userRole === 'admin' ? {} : { receiver: userId };
    await Notification.updateMany(filter, { read: true });

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


// ---- TEST: create a notification (protected) ----
exports.createTestNotification = async (req, res) => {
  try {
    const { type = 'Lead', itemId, message = 'Test notification', transferTo, assignTo } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required' });
    }

    // Resolve receiver: transferTo (name) -> assignTo (id or name)
    let receiverId = null;
    if (transferTo) {
      const r = await User.findOne({ name: transferTo });
      if (r) receiverId = r._id;
    }

    if (!receiverId && assignTo) {
      if (mongoose.Types.ObjectId.isValid(String(assignTo))) {
        receiverId = assignTo;
      } else {
        const r2 = await User.findOne({ name: assignTo });
        if (r2) receiverId = r2._id;
      }
    }

    const notif = await Notification.create({
      type,
      itemId,
      message,
      changedBy: req.user?.name || 'System',
      receiver: receiverId || null,
    });

    const payload = { ...notif.toJSON(), itemId };

    if (receiverId) {
      await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
    } else {
      emitToAdmins(payload);
    }

    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    console.error('createTestNotification error:', err);
    res.status(500).json({ success: false, message: 'Error creating test notification', error: err.message });
  }
};


