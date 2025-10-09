
const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/dailyTaskcontroller');
const authMiddleware = require('../middleware/authmiddleware');

router.get('/task', authMiddleware, performanceController.getAllPerformances);
router.post('/task', authMiddleware, performanceController.addPerformance);
router.get('/task/:id', authMiddleware, performanceController.getPerformanceById);
router.put('/task/:id', authMiddleware, performanceController.updatePerformance);
router.delete('/task/:id', authMiddleware, performanceController.deletePerformance);
router.post('/task/byname', authMiddleware, performanceController.getPerformanceByName);
router.post('/task/today', authMiddleware, performanceController.getTodayPerformanceByName);
router.get('/task/alltoday', authMiddleware, performanceController.getTodaysPlans);



module.exports = router;


