const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/cardController");

router.get("/", getDashboardData);

module.exports = router;
