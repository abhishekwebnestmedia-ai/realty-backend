
const Inventory = require('../models/inventryModel'); 

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

// exports.updateInventry = async (req, res) => {
//   try {
//     const record = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!record) {
//       return res.status(404).json({ error: 'Record not found' });
//     }
//     res.json(record);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

exports.updateInventry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Find the existing record before updating
    const oldRecord = await Inventory.findById(id);
    if (!oldRecord) {
      return res.status(404).json({ success: false, message: "Inventory record not found" });
    }

    // Update the inventory record
    const updatedRecord = await Inventory.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "Inventory not found after update" });
    }

    // Define tracked fields
    const trackedFields = [
      "capturedBy",
      "assignTo",
      "transferTo",
      "followUpDate",
      "remarks",
      "requirement"
    ];

    // Identify who made the change
    let changedBy = null;
    if (req.user) {
      const userId = req.user.userId || req.user._id || req.user.id;
      const user = await User.findById(userId).select("name email");
      if (user) {
        changedBy = {
          _id: user._id,
          name: user.name,
          email: user.email
        };
      }
    }

    // Compare old vs new values for tracked fields
    for (const field of trackedFields) {
      const oldValue = oldRecord[field];
      const newValue = updatedRecord[field];

      if (String(oldValue || "") !== String(newValue || "")) {
        await InventoryHistory.create({
          inventoryId: id,
          changedBy,
          field,
          oldValue,
          newValue
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: updatedRecord
    });
  } catch (err) {
    console.error("updateInventry error:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating inventory",
      error: err.message
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


exports.getAllInventry = async (req, res) => {
  try {
    const records = await Inventory.find().sort({ createdAt: -1 }); // Sort by createdAt descending
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getInventryByAssignTo = async (req, res) => {
  try {
    const { assignTo } = req.query; // pass ?assignTo=Abhishek

    let filter = {};
    if (assignTo) {
      filter.assignTo = { $regex: new RegExp("^" + assignTo + "$", "i") }; // case-insensitive
    }

    const records = await Inventory.find(filter).sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching inventory:", err);
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




