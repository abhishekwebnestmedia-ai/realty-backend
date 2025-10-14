const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const DailyPerformance = require("../models/DailyTask");

exports.getDashboardData = async (req, res) => {
  try {
    // Run all DB queries in parallel
    const [
      siteVisit,
      saleInventory,
      hotLeads,
      tenants,
      buyers,
      rentInventory
    ] = await Promise.all([
      DailyPerformance.countDocuments({ meetingVisits: { $gt: 0 } }), // ✅ Site Visits
      Inventory.countDocuments({ inventoryType: "Sales" }),           // ✅ Sale Inventory
      Lead.countDocuments({ status: "Hot" }),                         // ✅ Hot Leads
      Lead.countDocuments({ leadType: "Rental" }),                    // ✅ Tenants
      Lead.countDocuments({ leadType: "Buyer" }),                     // ✅ Buyers
      Inventory.countDocuments({ inventoryType: "Rent" })             // ✅ Rent Inventory
    ]);

    // Send as array of objects (better for frontend)
    const dashboardData = [
      { title: "Site Visit", value: siteVisit || 0 },
      { title: "Sale Inventory", value: saleInventory || 0 },
      { title: "Hot Leads", value: hotLeads || 0 },
      { title: "Tenants", value: tenants || 0 },
      { title: "Buyers", value: buyers || 0 },
      { title: "Rent Inventory", value: rentInventory || 0 },
    ];

    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
