const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const DailyPerformance = require("../models/DailyTask");

exports.getDashboardData = async (req, res) => {
  try {
    const [
      siteVisit,
      callingToBuyers,
      saleInventory,
      hotLeads,
      tenants,
      buyers,
      callingToSellers,
      rentInventory
    ] = await Promise.all([
      DailyPerformance.countDocuments({ meetingVisits: { $gt: 0 } }), // ✅ counts only if meetingVisits > 0
      Lead.countDocuments({ leadType: "Buyer" }),
      Inventory.countDocuments({ inventoryType: "Sales" }),
      Lead.countDocuments({ status: "Hot" }),
      Lead.countDocuments({ leadType: "Rental" }),
      Lead.countDocuments({ leadType: "Buyer" }),
      Lead.countDocuments({ status: "Potential" }),
      Inventory.countDocuments({ inventoryType: "Rent" }),
    ]);

    res.json({
      siteVisit: siteVisit || 0,
    //   callingToBuyers: callingToBuyers || 0,
      saleInventory: saleInventory || 0,
      hotLeads: hotLeads || 0,
      tenants: tenants || 0,
      buyers: buyers || 0,
    //   callingToSellers: callingToSellers || 0,
      rentInventory: rentInventory || 0,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
