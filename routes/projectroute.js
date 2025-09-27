const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// Cities
router.post("/cities", projectController.createCity);

// Divisions
router.post("/cities/:cityId/divisions", projectController.addDivision);

// Sectors
router.post("/cities/:cityId/divisions/:divisionId/sectors", projectController.addSector);

// Projects
router.post("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects", projectController.addProject);

// Towers
router.post("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers", projectController.addTower);

// Units
router.post("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units", projectController.addUnit);

// Update Unit (Form Submit)
router.patch("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId", projectController.updateUnit);

module.exports = router;
