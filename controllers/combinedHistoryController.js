const mongoose = require("mongoose");
const LeadHistory = require("../models/leadHistory");
const InventoryHistory = require("../models/InventoryHistory");

exports.getCombinedHistory = async (req, res) => {
  try {
    const { leadId, inventoryId } = req.query;

    if (!leadId && !inventoryId) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one of leadId or inventoryId",
      });
    }

    let leadHistory = [];
    let inventoryHistory = [];

    // ✅ Fetch Lead History
    if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
      leadHistory = await LeadHistory.find({ leadId })
        .sort({ changedAt: -1 })
        .lean();

      // Tag and structure each lead history entry
      leadHistory = leadHistory.map((item) => ({
        _id: item._id,
        entityType: "Lead",
        entityId: item.leadId,
        field: item.field,
        oldValue: item.oldValue || "",
        newValue: item.newValue || "",
        changedBy: item.changedBy || {},
        changedAt: item.changedAt,
      }));
    }

    // ✅ Fetch Inventory History
    if (inventoryId && mongoose.Types.ObjectId.isValid(inventoryId)) {
      inventoryHistory = await InventoryHistory.find({ inventoryId })
        .sort({ changedAt: -1 })
        .lean();

      // Tag and structure each inventory history entry
      inventoryHistory = inventoryHistory.map((item) => ({
        _id: item._id,
        entityType: "Inventory",
        entityId: item.inventoryId,
        field: item.field,
        oldValue: item.oldValue || "",
        newValue: item.newValue || "",
        changedBy: item.changedBy || {},
        changedAt: item.changedAt,
      }));
    }

    // ✅ Combine and sort by most recent first
    const combined = [...leadHistory, ...inventoryHistory].sort(
      (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
    );

    // ✅ Return structured response
    return res.status(200).json({
      success: true,
      totalChanges: combined.length,
      data: combined,
      breakdown: {
        leads: leadHistory.length,
        inventory: inventoryHistory.length,
      },
    });
  } catch (err) {
    console.error("getCombinedHistory error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching combined history",
      error: err.message,
    });
  }
};
