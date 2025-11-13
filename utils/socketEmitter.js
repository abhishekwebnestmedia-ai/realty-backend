exports.emitNotification = (userId, payload, options = {}) => {
  try {
    if (!global.io) {
      console.warn("⚠️ Socket.IO not initialized — cannot emit notification");
      return;
    }

    const room = `notif_${userId}`;
    global.io.to(room).emit("notification_received", payload);
    console.log(`📩 Notification emitted to ${room}`);
    
    // ✅ Also emit to admin room if specified
    if (options.emitToAdmin) {
      global.io.to("notif_admin").emit("notification_received", payload);
      console.log(`📩 Notification also emitted to notif_admin`);
    }
  } catch (err) {
    console.error("❌ emitNotification error:", err);
  }
};

// ✅ New helper: emit to admin room only
exports.emitToAdmins = (payload) => {
  try {
    if (!global.io) {
      console.warn("⚠️ Socket.IO not initialized — cannot emit to admins");
      return;
    }

    global.io.to("notif_admin").emit("notification_received", payload);
    console.log(`📩👑 Notification emitted to notif_admin`);
  } catch (err) {
    console.error("❌ emitToAdmins error:", err);
  }
};
