const express = require('express');
const router = express.Router();
const inventrycontroller = require('../controllers/inventrycontroller');
const authMiddleware = require('../middleware/authmiddleware')


router.post('/createinventry',authMiddleware,inventrycontroller.createInventry);
router.get('/dropdown', authMiddleware, inventrycontroller.getDropdownOptions);

router.get('/inventrylist', authMiddleware ,inventrycontroller.getAllInventry);
router.get('/inventrylist/:id',authMiddleware , inventrycontroller.getInventryById);
router.put('/update/:id', authMiddleware,inventrycontroller.updateInventry);
router.get("/:inventoryId/history", authMiddleware, inventrycontroller.getInventoryChangeHistory);

router.delete('/delete/:id', authMiddleware,inventrycontroller.deleteInventry);
router.post("/bulk-upload", authMiddleware, inventrycontroller.bulkUploadInventry);
router.get('/userbasedinventry',authMiddleware,inventrycontroller.getInventoryByTransferTo);

router.get('/captured', authMiddleware, inventrycontroller.getInventryByCapturedBy);




module.exports = router;

