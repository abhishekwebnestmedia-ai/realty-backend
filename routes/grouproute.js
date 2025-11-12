const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const {
  createGroup,
  getAllGroups,
  updateGroup,
  deleteGroup,
} = require("../controllers/groupController");

// ✅ Create a new group (Admin only)
router.post("/", authMiddleware, createGroup);

// ✅ Get all groups (Visible to logged-in user)
router.get("/", authMiddleware, getAllGroups);

// ✅ Update group (Admin only)
router.put("/:groupId", authMiddleware, updateGroup);

// ✅ Delete group (Admin only)
router.delete("/:groupId", authMiddleware, deleteGroup);

module.exports = router;



