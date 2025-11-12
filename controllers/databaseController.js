const Database = require("../models/databaseModel");
const User = require("../models/user");

// ✅ Create new database record
exports.createDatabase = async (req, res) => {
  try {
    const {
      projectName,
      divisionName,
      typology,
      sector,
      price,
      size,
      pdfLink,
      type,
      constructionType,
    } = req.body;

    // Create new record
    const record = new Database({
      projectName,
      divisionName,
      typology,
      sector,
      price,
      size,
      pdfLink,
      type,
      constructionType,
      createdBy: req.user._id,
    });

    await record.save();

    // ✅ Populate createdBy with name and email
    await record.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Database entry created successfully ✅",
      record,
    });
  } catch (error) {
    console.error("❌ Error creating database record:", error);
    res.status(500).json({
      success: false,
      message: "Error creating database entry",
      error: error.message,
    });
  }
};

// ✅ Get all database records
exports.getAllDatabases = async (req, res) => {
  try {
    const data = await Database.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ Error fetching database records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching database records",
      error: error.message,
    });
  }
};

// ✅ Get single record by ID
exports.getDatabaseById = async (req, res) => {
  try {
    const record = await Database.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found ❌" });
    }

    res.status(200).json({ success: true, record });
  } catch (error) {
    console.error("❌ Error fetching database record:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching database record",
      error: error.message,
    });
  }
};

// ✅ Update record by ID
exports.updateDatabase = async (req, res) => {
  try {
    const updated = await Database.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("createdBy", "name email");

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found ❌" });
    }

    res.status(200).json({
      success: true,
      message: "Database entry updated successfully ✅",
      updated,
    });
  } catch (error) {
    console.error("❌ Error updating database record:", error);
    res.status(500).json({
      success: false,
      message: "Error updating database record",
      error: error.message,
    });
  }
};

// ✅ Delete record by ID
exports.deleteDatabase = async (req, res) => {
  try {
    const deleted = await Database.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found ❌" });
    }

    res.status(200).json({
      success: true,
      message: "Database record deleted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Error deleting database record:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting database record",
      error: error.message,
    });
  }
};


