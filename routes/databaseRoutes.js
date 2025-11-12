const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const {
  createDatabase,
  getAllDatabases,
  getDatabaseById,
  updateDatabase,
  deleteDatabase,
   bulkUploadDatabase,
} = require("../controllers/databaseController");

// ➕ Create new database record
router.post("/", authMiddleware, createDatabase);
router.post("/bulk", authMiddleware, bulkUploadDatabase);

// 📄 Get all records
router.get("/", authMiddleware, getAllDatabases);

// 🔍 Get single record
router.get("/:id", authMiddleware, getDatabaseById);

// ✏️ Update record
router.put("/:id", authMiddleware, updateDatabase);

// ❌ Delete record
router.delete("/:id", authMiddleware, deleteDatabase);

module.exports = router;
