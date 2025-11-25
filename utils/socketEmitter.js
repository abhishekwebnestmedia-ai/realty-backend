exports.emitNotification = (userId, payload, options = {}) => {
  try {
    if (!global.io) {
      console.warn("⚠️ Socket.IO not initialized — cannot emit notification");
      return;
    }

    const room = `notif_${userId}`;
    
    // Check if room has any connected sockets
    const roomSockets = global.io.sockets.adapter.rooms.get(room);
    const roomSize = roomSockets ? roomSockets.size : 0;
    
    global.io.to(room).emit("notification_received", payload);
    console.log(`📩 Notification emitted to ${room} (${roomSize} clients connected)`);
    
    // ✅ Also emit to admin room if specified
    if (options.emitToAdmin) {
      const adminRoomSockets = global.io.sockets.adapter.rooms.get("notif_admin");
      const adminRoomSize = adminRoomSockets ? adminRoomSockets.size : 0;
      global.io.to("notif_admin").emit("notification_received", payload);
      console.log(`📩 Notification also emitted to notif_admin (${adminRoomSize} clients connected)`);
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

    const adminRoomSockets = global.io.sockets.adapter.rooms.get("notif_admin");
    const adminRoomSize = adminRoomSockets ? adminRoomSockets.size : 0;
    global.io.to("notif_admin").emit("notification_received", payload);
    console.log(`📩👑 Notification emitted to notif_admin (${adminRoomSize} clients connected)`);
  } catch (err) {
    console.error("❌ emitToAdmins error:", err);
  }
};
