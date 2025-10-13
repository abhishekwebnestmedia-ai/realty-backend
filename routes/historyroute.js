const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getCombinedHistory,
  getChangeHistory
} = require("../controllers/historyController");


router.get("/combined", authMiddleware, getCombinedHistory);

router.get("/:id", authMiddleware, getChangeHistory);

module.exports = router;
