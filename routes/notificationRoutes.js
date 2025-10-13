
const express = require("express");
const router = express.Router();
const {
  getAllNotifications,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

// ✅ Routes
router.get("/", getAllNotifications);
router.delete("/:id", deleteNotification);
router.delete("/", deleteAllNotifications);

module.exports = router;
