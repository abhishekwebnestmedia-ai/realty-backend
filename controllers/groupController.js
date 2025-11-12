// const Group = require("../models/group");
// const User = require("../models/user");


// // ✅ Create a new group (Admin only)
// exports.createGroup = async (req, res) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     const { name, members } = req.body;

//     if (!name) {
//       return res.status(400).json({ success: false, message: "Group name is required" });
//     }
//     if (!Array.isArray(members) || members.length === 0) {
//       return res.status(400).json({ success: false, message: "Please provide at least one member name" });
//     }

//     const matchedUsers = await User.find({
//       name: { $in: members.map((n) => new RegExp(`^${n}$`, "i")) },
//     });

//     if (matchedUsers.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid users found with the provided names",
//       });
//     }

//     // ✅ Create group
//     let group = await Group.create({
//       name,
//      createdBy: req.user.userId,
//       members: matchedUsers.map((u) => u._id),
//     });

    
//     // ✅ Populate members & createdBy before sending response
//     group = await group.populate("members", "name email role");
//     group = await group.populate("createdBy", "name email role");

//     res.status(201).json({
//       success: true,
//       message: "Group created successfully",
//       group,
//     });
//   } catch (error) {
//     console.error("❌ Error creating group:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// // ✅ Get groups visible to the logged-in user
// exports.getAllGroups = async (req, res) => {
//   try {
//     let query = {};

//     // 🧭 If user (not admin), show only groups they belong to
//     if (req.user.role !== "admin") {
//       query = { members: req.user._id };
//     }

//     const groups = await Group.find(query)
//       .populate("createdBy", "name email role")
//       .populate("members", "name email role");

//     res.json({ success: true, count: groups.length, groups });
//   } catch (error) {
//     console.error("❌ Error fetching groups:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Update group (Admin only)
// exports.updateGroup = async (req, res) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     const { groupId } = req.params;
//     const { name, members } = req.body;

//     const group = await Group.findById(groupId);
//     if (!group) {
//       return res.status(404).json({ success: false, message: "Group not found" });
//     }

//     // ✅ Update name if provided
//     if (name) group.name = name;

//     // ✅ Update members if provided
//     if (Array.isArray(members) && members.length > 0) {
//       const matchedUsers = await User.find({
//         name: { $in: members.map((n) => new RegExp(`^${n}$`, "i")) },
//       });

//       if (matchedUsers.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "No valid users found with the provided names",
//         });
//       }

//       group.members = matchedUsers.map((u) => u._id);
//     }

//     await group.save();

//     const updatedGroup = await Group.findById(group._id)
//       .populate("createdBy", "name email role")
//       .populate("members", "name email role");

//     res.json({
//       success: true,
//       message: "Group updated successfully",
//       group: updatedGroup,
//     });
//   } catch (error) {
//     console.error("❌ Error updating group:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Delete group (Admin only)
// exports.deleteGroup = async (req, res) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     const { groupId } = req.params;

//     const group = await Group.findById(groupId);
//     if (!group) {
//       return res.status(404).json({ success: false, message: "Group not found" });
//     }

//     await group.deleteOne();

//     res.json({
//       success: true,
//       message: "Group deleted successfully",
//     });
//   } catch (error) {
//     console.error("❌ Error deleting group:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };



const Group = require("../models/group");
const User = require("../models/user");
const Broadcast = require("../models/broadcast");

// ✅ Create a new group (Admin only)
exports.createGroup = async (req, res) => {
  try {
    // 🔒 Only admin can create groups
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied — only admins can create groups",
      });
    }

    const { name, members } = req.body;

    // 🧩 Validate input
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Group name is required and must be a string",
      });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one member name",
      });
    }

    // 🔍 Match users by name (case-insensitive)
    const matchedUsers = await User.find({
      name: { $in: members.map((n) => new RegExp(`^${n}$`, "i")) },
    });

    if (matchedUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid users found with the provided names",
      });
    }

    // ✅ Create the group
    let group = await Group.create({
      name,
      createdBy: req.user._id, // ✅ Fixed: use _id (not userId)
      members: matchedUsers.map((u) => u._id),
    });

    // ✅ Populate members & createdBy
    group = await group
      .populate("members", "name email role")
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    console.error("❌ Error creating group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating group",
      error: error.message,
    });
  }
};

// ✅ Get all groups visible to the logged-in user
exports.getAllGroups = async (req, res) => {
  try {
    // 🧠 Ensure "All" group exists and stays synced
    let allGroup = await Group.findOne({ name: "All" });
    const allUsers = await User.find({}, "_id");

    if (!allGroup) {
      allGroup = await Group.create({
        name: "All",
        members: allUsers.map((u) => u._id),
        createdBy: req.user?._id || null,
      });
      console.log("✅ Default 'All' group created automatically");
    } else {
      const allUserIds = allUsers.map((u) => u._id.toString());
      const missingUsers = allUserIds.filter(
        (uid) => !allGroup.members.map((m) => m.toString()).includes(uid)
      );
      if (missingUsers.length > 0) {
        allGroup.members.push(...missingUsers);
        await allGroup.save();
        console.log(`🔄 Synced ${missingUsers.length} new users into 'All' group`);
      }
    }

    // 📋 Build query for normal users
    let query = {};
    if (!req.user || req.user.role !== "admin") {
      query = { members: req.user._id };
    }

    // 📦 Fetch all groups
    let groups = await Group.find(query)
      .populate("createdBy", "name email role")
      .populate("members", "name email role")
      .lean();

    // 🧩 Always include the "All" group at the top
    const hasAllGroup = groups.some((g) => g.name === "All");
    if (!hasAllGroup) {
      const populatedAllGroup = await Group.findOne({ name: "All" })
        .populate("createdBy", "name email role")
        .populate("members", "name email role")
        .lean();
      if (populatedAllGroup) groups.unshift(populatedAllGroup);
    }

    if (!groups || groups.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          req.user?.role === "admin"
            ? "No groups found"
            : "You are not part of any group",
      });
    }

    // 🕐 Attach latest broadcast
    const groupsWithBroadcasts = await Promise.all(
      groups.map(async (group) => {
        const latestBroadcast = await Broadcast.findOne({ group: group._id })
          .sort({ createdAt: -1 })
          .populate("createdBy", "name email role")
          .lean();

        return {
          ...group,
          latestBroadcast: latestBroadcast
            ? {
                message: latestBroadcast.message,
                attachmentUrl: latestBroadcast.attachmentUrl,
                attachmentType: latestBroadcast.attachmentType,
                createdBy: latestBroadcast.createdBy,
                createdAt: latestBroadcast.createdAt,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: groupsWithBroadcasts.length,
      groups: groupsWithBroadcasts,
    });
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching groups",
      error: error.message,
    });
  }
};

// ✅ Update group (Admin only)
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, members } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied — only admins can update groups",
      });
    }

    let group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (name && typeof name === "string") group.name = name.trim();

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

    // ✅ Repopulate
    group = await Group.findById(group._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      group,
    });
  } catch (error) {
    console.error("❌ Error updating group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating group",
      error: error.message,
    });
  }
};

// ✅ Delete group (Admin only)
exports.deleteGroup = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied — only admins can delete groups",
      });
    }

    const { groupId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    await group.deleteOne();

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting group",
      error: error.message,
    });
  }
};
