const express = require("express");
const router = express.Router();
const brokerRequirementController = require("../controllers/brokerController");

// Create
router.post("/", brokerRequirementController.createRequirement);

// Get All
router.get("/", brokerRequirementController.getAllRequirements);

// Get by ID
router.get("/:id", brokerRequirementController.getRequirementById);

// Update
router.put("/:id", brokerRequirementController.updateRequirement);

// Delete
router.delete("/:id", brokerRequirementController.deleteRequirement);

module.exports = router;
