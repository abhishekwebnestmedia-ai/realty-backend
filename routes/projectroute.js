// const express = require("express");
// const router = express.Router();
// const projectController = require("../controllers/projectController");

// // Cities
// router.post("/cities", projectController.createCity);

// // Divisions
// router.post("/cities/:cityId/divisions", projectController.addDivision);

// // Sectors
// router.post("/cities/:cityId/divisions/:divisionId/sectors", projectController.addSector);

// // Projects
// router.post("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects", projectController.addProject);

// // Towers
// router.post("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers", projectController.addTower);

// // Units
// router.post("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units", projectController.addUnit);

// // Update Unit (Form Submit)
// router.patch("/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId", projectController.updateUnit);

// module.exports = router;



const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// Step 1 - Create ProjectType (root)
router.post("/project-types", projectController.createProjectType);

// Step 2 - Cities
router.post("/project-types/:projectType/cities", projectController.createCity);

// Step 3 - Divisions
router.post("/project-types/:projectType/cities/:cityId/divisions", projectController.addDivision);

// Step 4 - Sectors
router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors", projectController.addSector);

// Step 5 - Projects
router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects", projectController.addProject);

// Step 6 - Towers
router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers", projectController.addTower);

// Step 7 - Units
router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units", projectController.addUnit);

// Step 8 - Update Unit
router.patch("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId", projectController.updateUnit);

module.exports = router;
