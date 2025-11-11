const Group = require("../models/group");
const User = require("../models/user");

// ✅ Create a new group (Admin only)
exports.createGroup = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide at least one member name" });
    }

    const matchedUsers = await User.find({
      name: { $in: members.map((n) => new RegExp(`^${n}$`, "i")) },
    });

    if (matchedUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid users found with the provided names",
      });
    }

    // ✅ Create group
    let group = await Group.create({
      name,
     createdBy: req.user.userId,
      members: matchedUsers.map((u) => u._id),
    });

    
    // ✅ Populate members & createdBy before sending response
    group = await group.populate("members", "name email role");
    group = await group.populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    console.error("❌ Error creating group:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✅ Get groups visible to the logged-in user
exports.getAllGroups = async (req, res) => {
  try {
    let query = {};

    // 🧭 If user (not admin), show only groups they belong to
    if (req.user.role !== "admin") {
      query = { members: req.user._id };
    }

    const groups = await Group.find(query)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update group (Admin only)
exports.updateGroup = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { groupId } = req.params;
    const { name, members } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // ✅ Update name if provided
    if (name) group.name = name;

    // ✅ Update members if provided
    if (Array.isArray(members) && members.length > 0) {
      const matchedUsers = await User.find({
        name: { $in: members.map((n) => new RegExp(`^${n}$`, "i")) },
      });

      if (matchedUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid users found with the provided names",
        });
      }

      group.members = matchedUsers.map((u) => u._id);
    }

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    res.json({
      success: true,
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("❌ Error updating group:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete group (Admin only)
exports.deleteGroup = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    await group.deleteOne();

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting group:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
