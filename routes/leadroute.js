const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const authMiddleware = require("../middleware/authmiddleware");


router.post('/create',authMiddleware,leadController.createLead);
router.get('/getlead',authMiddleware,leadController.getLeads);
router.put('/update/:id', authMiddleware,leadController.updateLead );
router.delete('/delete/:id' , authMiddleware,leadController.deleteLead);

module.exports = router;
