const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');
const { getCombinedReport } = require('../controllers/dailyReportcontroller');

// GET combined data of leads + daily performance
router.get('/', authMiddleware, getCombinedReport);

module.exports = router;
