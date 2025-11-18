
const Inventory = require('../models/inventryModel'); 
const InventoryHistory = require("../models/inventryHistory");
const User = require('../models/user');
const Notification = require("../models/notification");
const { emitToAdmins, emitNotification } = require('../utils/socketEmitter');


const mongoose = require("mongoose");

// 🕒 Helper: Format date to IST readable format
function formatIST(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

exports.createInventry = async (req, res) => {
  try {
    const record = new Inventory(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getDropdownOptions = async (req, res) => {
  try {
    const typology = await Inventory.distinct("typology");
    const source = await Inventory.distinct("source");
    const paymentStatus = await Inventory.distinct("paymentStatus");

    res.json({
      typology,
      source,
      paymentStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInventryById = async (req, res) => {
  try {
    const record = await Inventory.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.bulkUploadInventry = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "Records array is required" });
    }

    // Insert many inventory records
    const insertedRecords = await Inventory.insertMany(records, { ordered: false });

    res.status(201).json({
      message: "Bulk upload successful",
      insertedCount: insertedRecords.length,
      insertedRecords,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);

    res.status(500).json({
      message: "Error during bulk upload",
      error: err.message,
    });
  }
};



exports.updateInventry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Get old record
    const oldRecord = await Inventory.findById(id).populate("assignTo", "name email");
    if (!oldRecord) {
      return res.status(404).json({ success: false, message: "Inventory record not found" });
    }

    // Update record
    const updatedRecord = await Inventory.findByIdAndUpdate(id, updateData, { new: true })
      .populate("assignTo", "name email");

    const trackedFields = ["capturedBy", "assignTo", "transferTo", "followUpDate", "remarks", "requirement"];

    // Identify editor user
    let changedBy = null;
    if (req.user) {
      const userId = req.user.userId || req.user._id || req.user.id;
      const user = await User.findById(userId).select("name email");
      if (user) {
        changedBy = { _id: user._id, name: user.name, email: user.email };
      }
    }

    for (const field of trackedFields) {
      const oldValue = oldRecord[field];
      const newValue = updatedRecord[field];

      if (String(oldValue || "") !== String(newValue || "")) {
        // Create history entry
        await InventoryHistory.create({
          inventoryId: id,
          changedBy,
          field,
          oldValue,
          newValue,
        });

        // 🔹 Notification Handling (same structure as Lead)
        try {
          let receiverId = null;

          // Priority: transferTo → assignTo
          if (updatedRecord.transferTo) {
            const r = await User.findOne({ name: updatedRecord.transferTo });
            if (r) receiverId = r._id;
          }

          if (!receiverId && updatedRecord.assignTo) {
            if (mongoose.Types.ObjectId.isValid(String(updatedRecord.assignTo))) {
              receiverId = updatedRecord.assignTo;
            } else {
              const r2 = await User.findOne({ name: updatedRecord.assignTo });
              if (r2) receiverId = r2._id;
            }
          }

          // AssignTo Notification
          if (field === "assignTo") {
            const msg = `👤 Inventory "${oldRecord.sellerName}" was reassigned to ${newValue || "N/A"} by ${changedBy?.name || "System"}`;
            const notif = await Notification.create({
              type: "Inventory",
              itemId: id,
              message: msg,
              changedBy: changedBy?.name || "System",
              receiver: receiverId || null,
            });

            const payload = { ...notif.toJSON(), inventoryId: id };
            receiverId ? await emitNotification(receiverId.toString(), payload, { emitToAdmin: true }) : emitToAdmins(payload);
          }

          // Follow-up Reminder Notification
          if (field === "followUpDate") {
            const istTime = formatIST(newValue);
            const msg = `📅 Follow-up scheduled for Inventory "${oldRecord.sellerName}" on ${istTime} IST by ${changedBy?.name || "System"}`;

            const notif = await Notification.create({
              type: "Inventory",
              itemId: id,
              message: msg,
              changedBy: changedBy?.name || "System",
              receiver: receiverId || null,
            });

            const payload = { ...notif.toJSON(), inventoryId: id };
            receiverId ? await emitNotification(receiverId.toString(), payload, { emitToAdmin: true }) : emitToAdmins(payload);
          }

        } catch (e) {
          console.warn("⚠ Notification failed:", e.message);
        }
      }
    }

    // 🔥 AUTO REMINDER WHEN FOLLOW-UP DATE == CURRENT TIME
    if (updatedRecord.followUpDate) {
      const now = new Date();
      const followUp = new Date(updatedRecord.followUpDate);

      // Compare only date + hour + minute
      if (
        followUp.getFullYear() === now.getFullYear() &&
        followUp.getMonth() === now.getMonth() &&
        followUp.getDate() === now.getDate() &&
        followUp.getHours() === now.getHours() &&
        followUp.getMinutes() === now.getMinutes()
      ) {
        const receiverId = updatedRecord.assignTo?._id;

        const autoMsg = `⏰ Reminder: Follow-up call scheduled now for inventory "${updatedRecord.sellerName}".`;

        const notif = await Notification.create({
          type: "Inventory",
          itemId: id,
          message: autoMsg,
          changedBy: "System",
          receiver: receiverId || null,
        });

        const payload = { ...notif.toJSON(), inventoryId: id };
        receiverId ? await emitNotification(receiverId.toString(), payload, { emitToAdmin: true }) : emitToAdmins(payload);
      }
    }

    return res.json({ success: true, message: "Inventory updated successfully", data: updatedRecord });

  } catch (err) {
    console.error("updateInventry error:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating inventory",
      error: err.message,
    });
  }
};


exports.deleteInventry = async (req, res) => {
  try {
    const record = await Inventory.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// exports.getAllInventry = async (req, res) => {
//   try {
//     const records = await Inventory.find().sort({ createdAt: -1 }); // Sort by createdAt descending
//     res.json(records);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.getAllInventry = async (req, res) => {
  try {
    // ✅ Step 1 - Ensure user is authenticated
    if (!req.user || !req.user.name) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access — user info missing",
      });
    }

    const userRole = req.user.role || "user";
    const userName = req.user.name; // 🟢 Match against transferTo (string)
    let filter = {};

    // ✅ Step 2 - Restrict access for non-admin users
    if (userRole !== "admin") {
      filter = { transferTo: userName };
    }

    // ✅ Step 3 - Fetch filtered inventory
    const records = await Inventory.find(filter).sort({ createdAt: -1 }).lean();

    // ✅ Step 4 - Respond
    res.status(200).json({
      success: true,
      role: userRole,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error("❌ getAllInventry error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching inventory",
    });
  }
};

// exports.getInventryByAssignTo = async (req, res) => {
//   try {
//     const { assignTo } = req.query; // pass ?assignTo=Abhishek

//     let filter = {};
//     if (assignTo) {
//       filter.assignTo = { $regex: new RegExp("^" + assignTo + "$", "i") }; // case-insensitive
//     }

//     const records = await Inventory.find(filter).sort({ createdAt: -1 });

//     res.status(200).json(records);
//   } catch (err) {
//     console.error("Error fetching inventory:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.getInventoryByTransferTo = async (req, res) => {
  try {
    const { transferTo } = req.query; // pass ?transferTo=Abhishek

    let filter = {};
    if (transferTo) {
      // 🔍 Case-insensitive match for transferTo
      filter.transferTo = { $regex: new RegExp("^" + transferTo + "$", "i") };
    }

    const records = await Inventory.find(filter).sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ message: "No inventory found for this user" });
    }

    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching inventory by transferTo:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getInventryByCapturedBy = async (req, res) => {
  try {
    const { capturedBy } = req.query; // pass ?capturedBy=Abhishek

    let filter = {};
    if (capturedBy) {
      filter.capturedBy = { $regex: new RegExp("^" + capturedBy + "$", "i") }; // case-insensitive
    }

    const records = await Inventory.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      capturedBy: capturedBy || "All",
      totalRecords: records.length,
      records
    });
  } catch (err) {
    console.error("❌ Error fetching inventory by capturedBy:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// Get all change logs for a specific inventory record
exports.getInventoryChangeHistory = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
      return res.status(400).json({ success: false, message: "Invalid inventory ID" });
    }

    const history = await InventoryHistory.find({ inventoryId }).sort({ changedAt: -1 });

    return res.status(200).json({
      success: true,
      totalChanges: history.length,
      data: history
    });
  } catch (err) {
    console.error("getInventoryChangeHistory error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching inventory history",
      error: err.message
    });
  }
};




