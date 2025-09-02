const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');


router.post('/create',leadController.createLead);
router.get('/getlead',leadController.getLeads);
router.put('/update/:id',leadController.updateLead );
router.delete('/delete/:id' ,leadController.deleteLead);

module.exports = router;
