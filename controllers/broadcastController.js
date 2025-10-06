const Broadcast = require("../models/broadcast");

// ✅ Create Broadcast (Admin only)
exports.createBroadcast = async (req, res) => {
  try {
    const { groupId, message } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!groupId || !message) {
      return res.status(400).json({ success: false, message: "Group ID and message are required" });
    }

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const attachmentType = req.file ? req.file.mimetype : null;

    const broadcast = await Broadcast.create({
      group: groupId,
      message,
      attachmentUrl,
      attachmentType,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    io.emit("newBroadcast", broadcast);

    res.status(201).json({ success: true, broadcast });
  } catch (err) {
    console.error("Error creating broadcast:", err);
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
    console.error("Error fetching broadcasts:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
