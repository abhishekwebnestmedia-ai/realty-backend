
const express = require("express");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();
const {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
 
} = require("../controllers/notificationController");

// ✅ Routes
router.get("/", authMiddleware, getAllNotifications);
router.put("/:id/read", authMiddleware, markAsRead);
router.put("/read-all", authMiddleware, markAllAsRead);


module.exports = router;






// const express = require("express");
// const router = express.Router();
// const {
//   getAllNotifications,
//   markAsRead,
//   markAllAsRead,
// } = require("../controllers/notificationController");
// const auth = require("../middleware/authmiddleware");

// // Routes
// router.get("/", auth, getAllNotifications);
// router.put("/:id/read", auth, markAsRead);
// router.put("/read-all", auth, markAllAsRead);

// module.exports = router;
