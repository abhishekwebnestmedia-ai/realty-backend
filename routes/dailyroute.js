const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/dailyTaskcontroller');

router.get('/task', performanceController.getAllPerformances);
router.post('/task', performanceController.addPerformance);
router.get('/task/:id', performanceController.getPerformanceById);
router.put('/task/:id', performanceController.updatePerformance);
router.delete('/task/:id', performanceController.deletePerformance);

module.exports = router;
