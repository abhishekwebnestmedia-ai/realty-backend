
const express = require("express");
const router = express.Router();
const {
  getAllNotifications,
 
} = require("../controllers/notificationController");

// ✅ Routes
router.get("/", getAllNotifications);


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
