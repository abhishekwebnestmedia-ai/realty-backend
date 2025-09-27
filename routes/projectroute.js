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





// const express = require("express");
// const router = express.Router();
// const projectController = require("../controllers/projectController");

// // Step 1 - Create ProjectType (root)
// router.post("/project-types", projectController.createProjectType);

// // Step 2 - Cities
// router.post("/project-types/:projectType/cities", projectController.createCity);

// // Step 3 - Divisions
// router.post("/project-types/:projectType/cities/:cityId/divisions", projectController.addDivision);

// // Step 4 - Sectors
// router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors", projectController.addSector);

// // Step 5 - Projects
// router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects", projectController.addProject);

// // Step 6 - Towers
// router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers", projectController.addTower);

// // Step 7 - Units
// router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units", projectController.addUnit);

// // Step 8 - Update Unit
// router.patch("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId", projectController.updateUnit);

// module.exports = router;


const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// ==========================
// CREATE / ADD ROUTES
// ==========================

// Step 1 - Create ProjectType (root)
router.post("/project-types", projectController.createProjectType);

// Step 2 - Cities
router.post("/project-types/:projectType/cities", projectController.createCity);

// Step 3 - Divisions
router.post("/project-types/:projectType/cities/:cityId/divisions", projectController.addDivision);

// Step 4 - Sectors
router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors", projectController.addSector);

// Step 5 - Projects
router.post(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects",
  projectController.addProject
);

// Step 6 - Towers
router.post(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers",
  projectController.addTower
);

// Step 7 - Units
router.post(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units",
  projectController.addUnit
);

// Step 8 - Update Unit
router.patch(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId",
  projectController.updateUnit
);

// ==========================
// READ ROUTES (GET APIs)
// ==========================

// Get ALL projectTypes with hierarchy
router.get("/project-types", async (req, res) => {
  try {
    const ProjectType = require("../models/project");
    const docs = await ProjectType.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single projectType with hierarchy
router.get("/project-types/:projectType", async (req, res) => {
  try {
    const ProjectType = require("../models/project");
    const doc = await ProjectType.findOne({ projectType: req.params.projectType });
    if (!doc) return res.status(404).json({ error: "ProjectType not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single project inside a sector
router.get(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId",
  async (req, res) => {
    try {
      const ProjectType = require("../models/project");
      const { projectType, cityId, divisionId, sectorId, projectId } = req.params;

      const typeDoc = await ProjectType.findOne({ projectType });
      if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

      const city = typeDoc.cities.id(cityId);
      if (!city) return res.status(404).json({ error: "City not found" });

      const division = city.divisions.id(divisionId);
      if (!division) return res.status(404).json({ error: "Division not found" });

      const sector = division.sectors.id(sectorId);
      if (!sector) return res.status(404).json({ error: "Sector not found" });

      const project = sector.projects.id(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });

      res.json(project);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get towers of a project
router.get(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers",
  async (req, res) => {
    try {
      const ProjectType = require("../models/project");
      const { projectType, cityId, divisionId, sectorId, projectId } = req.params;

      const typeDoc = await ProjectType.findOne({ projectType });
      if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

      const city = typeDoc.cities.id(cityId);
      const division = city.divisions.id(divisionId);
      const sector = division.sectors.id(sectorId);
      const project = sector.projects.id(projectId);

      res.json(project.towers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get units of a tower
router.get(
  "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units",
  async (req, res) => {
    try {
      const ProjectType = require("../models/project");
      const { projectType, cityId, divisionId, sectorId, projectId, towerId } = req.params;

      const typeDoc = await ProjectType.findOne({ projectType });
      if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

      const city = typeDoc.cities.id(cityId);
      const division = city.divisions.id(divisionId);
      const sector = division.sectors.id(sectorId);
      const project = sector.projects.id(projectId);
      const tower = project.towers.id(towerId);

      res.json(tower.units);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
