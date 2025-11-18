

const Broadcast = require("../models/broadcast");

// ✅ Create Broadcast (Admin only)
exports.createBroadcast = async (req, res) => {
  try {
    const { groupId, message } = req.body;

    // 🔒 Only admin users can send broadcasts
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // 🧩 groupId is required
    if (!groupId) {
      return res
        .status(400)
        .json({ success: false, message: "Group ID is required" });
    }

    // 🧩 At least one of message or attachment must be provided
    if (!message && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Either a message or an attachment must be provided",
      });
    }

    // 📎 Handle optional attachment
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const attachmentType = req.file ? req.file.mimetype : null;

    // 💾 Save broadcast to database
    const broadcast = await Broadcast.create({
      group: groupId,
      message: message || "", // allow empty message if only file
      attachmentUrl,
      attachmentType,
      createdBy: req.user.userId,
    });

    // ----------------------------------------
    // 📢 Emit socket event to the right group room
    // ----------------------------------------
    const io = global.io || req.app.get("io");
    if (io) {
      // emit to the group-specific room
      io.to(`broadcast_${groupId}`).emit("broadcast_message", broadcast);

      // optional: also emit to a global room (for admins / “All” group)
      io.to("broadcast_all").emit("broadcast_message", broadcast);

      console.log(`📢 Broadcast emitted to room broadcast_${groupId}`);
    } else {
      console.warn("⚠️ Socket.IO not initialized; broadcast not emitted");
    }

    // ✅ Respond with created broadcast
    res.status(201).json({ success: true, broadcast });
  } catch (err) {
    console.error("❌ Error creating broadcast:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get broadcasts for a group
exports.getGroupBroadcasts = async (req, res) => {
  try {
    const { groupId } = req.params;

    const broadcasts = await Broadcast.find({ group: groupId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, broadcasts });
  } catch (err) {
    console.error("❌ Error fetching broadcasts:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching broadcasts" });
  }
};
