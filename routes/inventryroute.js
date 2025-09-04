const express = require('express');
const router = express.Router();
const inventrycontroller = require('../controllers/inventrycontroller');


router.post('/createinventry',inventrycontroller.createInventry);
router.get('/inventrylist',inventrycontroller.getAllInventry);
router.put('/update/:id',inventrycontroller.updateInventry);
router.delete('/delete/:id',inventrycontroller.deleteInventry);

module.exports = router;

