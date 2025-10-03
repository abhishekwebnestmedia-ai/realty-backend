const express = require("express");
const router = express.Router();
const brokerRequirementController = require("../controllers/brokerController");
const authMiddleware = require("../middleware/authmiddleware");

// Create
router.post("/", authMiddleware, brokerRequirementController.createRequirement);

// Get All
router.get("/", authMiddleware, brokerRequirementController.getAllRequirements);

// Get by ID
router.get("/:id", authMiddleware, brokerRequirementController.getRequirementById);

// Update
router.put("/:id",authMiddleware, brokerRequirementController.updateRequirement);

// Delete
router.delete("/:id",authMiddleware, brokerRequirementController.deleteRequirement);
router.post("/bulupload",authMiddleware, brokerRequirementController.bulkUpload);

module.exports = router;






