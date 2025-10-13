// const express = require("express");
// const router = express.Router();
// const authMiddleware = require("../middleware/authmiddleware");
// const notificationController = require("../controllers/notificationController");

// router.get("/", authMiddleware, notificationController.getUserNotifications);
// router.put("/:id/read", authMiddleware, notificationController.markAsRead);
// router.put("/read-all", authMiddleware, notificationController.markAllAsRead);
// router.delete("/:id", authMiddleware, notificationController.deleteNotification);

// module.exports = router;

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
