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
    res.status(201).json({ success: true, message: "Database entry created", record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating entry", error });
  }
};

// ✅ Get all database records
exports.getAllDatabases = async (req, res) => {
  try {
    const data = await Database.find().populate("createdBy", "name email");
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching data", error });
  }
};

// ✅ Get single record
exports.getDatabaseById = async (req, res) => {
  try {
    const record = await Database.findById(req.params.id);
    if (!record)
      return res.status(404).json({ success: false, message: "Record not found" });

    res.status(200).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching record", error });
  }
};

// ✅ Update record
exports.updateDatabase = async (req, res) => {
  try {
    const updated = await Database.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({ success: true, message: "Database updated", updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating record", error });
  }
};

// ✅ Delete record
exports.deleteDatabase = async (req, res) => {
  try {
    await Database.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting record", error });
  }
};
