const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');


router.post('/create',leadController.createLead);
router.get('/getlead',leadController.getLeads);
router.put('./update',leadController.updateLead );
router.delete('./delete' ,leadController.deleteLead);

module.exports = router;
