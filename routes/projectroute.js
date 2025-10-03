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





// const express = require("express");
// const router = express.Router();
// const projectController = require("../controllers/projectController");


// router.post("/project-types", projectController.createProjectType);


// router.post("/project-types/:projectType/cities", projectController.createCity);


// router.post("/project-types/:projectType/cities/:cityId/divisions", projectController.addDivision);


// router.post("/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors", projectController.addSector);


// router.post(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects",
//   projectController.addProject
// );


// router.post(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers",
//   projectController.addTower
// );


// router.post(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units",
//   projectController.addUnit
// );


// router.patch(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId",
//   projectController.updateUnit
// );


// router.get("/project-types", async (req, res) => {
//   try {
//     const ProjectType = require("../models/project");
//     const docs = await ProjectType.find();
//     res.json(docs);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// router.get("/project-types/:projectType", async (req, res) => {
//   try {
//     const ProjectType = require("../models/project");
//     const doc = await ProjectType.findOne({ projectType: req.params.projectType });
//     if (!doc) return res.status(404).json({ error: "ProjectType not found" });
//     res.json(doc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// router.get(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId",
//   async (req, res) => {
//     try {
//       const ProjectType = require("../models/project");
//       const { projectType, cityId, divisionId, sectorId, projectId } = req.params;

//       const typeDoc = await ProjectType.findOne({ projectType });
//       if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//       const city = typeDoc.cities.id(cityId);
//       if (!city) return res.status(404).json({ error: "City not found" });

//       const division = city.divisions.id(divisionId);
//       if (!division) return res.status(404).json({ error: "Division not found" });

//       const sector = division.sectors.id(sectorId);
//       if (!sector) return res.status(404).json({ error: "Sector not found" });

//       const project = sector.projects.id(projectId);
//       if (!project) return res.status(404).json({ error: "Project not found" });

//       res.json(project);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );


// router.get(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers",
//   async (req, res) => {
//     try {
//       const ProjectType = require("../models/project");
//       const { projectType, cityId, divisionId, sectorId, projectId } = req.params;

//       const typeDoc = await ProjectType.findOne({ projectType });
//       if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//       const city = typeDoc.cities.id(cityId);
//       const division = city.divisions.id(divisionId);
//       const sector = division.sectors.id(sectorId);
//       const project = sector.projects.id(projectId);

//       res.json(project.towers);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );


// router.get(
//   "/project-types/:projectType/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units",
//   async (req, res) => {
//     try {
//       const ProjectType = require("../models/project");
//       const { projectType, cityId, divisionId, sectorId, projectId, towerId } = req.params;

//       const typeDoc = await ProjectType.findOne({ projectType });
//       if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//       const city = typeDoc.cities.id(cityId);
//       const division = city.divisions.id(divisionId);
//       const sector = division.sectors.id(sectorId);
//       const project = sector.projects.id(projectId);
//       const tower = project.towers.id(towerId);

//       res.json(tower.units);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// module.exports = router;









// latest one 




const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middleware/authmiddleware");


// Step 1 - Create ProjectType (root)
router.post("/project-types", authMiddleware, projectController.createProjectType);

// Step 2 - Cities
router.post(
  "/project-types/:category/:projectcategory/cities",
  authMiddleware,
  projectController.createCity
);

// Step 3 - Divisions
router.post(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions",
  authMiddleware,
  projectController.addDivision
);

// Step 4 - Sectors
router.post(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors",
  authMiddleware,
  projectController.addSector
);

// Step 5 - Projects
router.post(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects",
  authMiddleware,
  projectController.addProject
);

// Step 6 - Towers
router.post(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers",
  authMiddleware,
  projectController.addTower
);

// Step 7 - Units
router.post(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units",
  authMiddleware,
  projectController.addUnit
);

// Step 8 - Update Unit
router.patch(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId",
  authMiddleware,
  projectController.updateUnit
);

// ==========================
// READ ROUTES (GET APIs)
// ==========================

// Get ALL projectTypes with hierarchy
router.get("/project-types", authMiddleware, async (req, res) => {
  try {
    const ProjectType = require("../models/project");
    const docs = await ProjectType.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single projectType with hierarchy
router.get("/project-types/:category/:projectcategory", authMiddleware, async (req, res) => { 
  try {
    const ProjectType = require("../models/project");
    const { category, projectcategory } = req.params;

    const doc = await ProjectType.findOne({ category, projectcategory });
    if (!doc) return res.status(404).json({ error: "ProjectType not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single project inside a sector
router.get(
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const ProjectType = require("../models/project");
      const { category, projectcategory, cityId, divisionId, sectorId, projectId } = req.params;

      const typeDoc = await ProjectType.findOne({ category, projectcategory });
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
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers",
  authMiddleware,
  async (req, res) => {
    try {
      const ProjectType = require("../models/project");
      const { category, projectcategory, cityId, divisionId, sectorId, projectId } = req.params;

      const typeDoc = await ProjectType.findOne({ category, projectcategory });
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
  "/project-types/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units",
  authMiddleware,
  async (req, res) => {
    try {
      const ProjectType = require("../models/project");
      const { category, projectcategory, cityId, divisionId, sectorId, projectId, towerId } = req.params;

      const typeDoc = await ProjectType.findOne({ category, projectcategory });
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


// Delete entire ProjectType (root)


router.delete(
  "/projectType/:category/:projectcategory",
    authMiddleware,
  projectController.deleteEntity
);

// Delete City

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId",
    authMiddleware,
  projectController.deleteEntity
);

// Delete Division

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId",
    authMiddleware,
  projectController.deleteEntity
);

// Delete Sector

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId",
    authMiddleware,
  projectController.deleteEntity
);

// Delete Project
router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId",
    authMiddleware,
  projectController.deleteEntity
);

// Delete Tower

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId",
    authMiddleware,
  projectController.deleteEntity
);

// Delete Unit


router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId",
    authMiddleware,
  projectController.deleteEntity
);


router.delete(
  "/projectType/:projectid",
  authMiddleware,
  projectController.deleteProjectTypeById
);

// Delete City by ID
router.delete(
  "/city/:cityId",
  authMiddleware,
  projectController.deleteCityById
);

// Delete Division by ID
router.delete(
  "/division/:divisionId",
  authMiddleware,
  projectController.deleteDivisionById
);

// Delete Sector by ID
router.delete(
  "/sector/:sectorId",
  authMiddleware,
  projectController.deleteSectorById
);

// Delete Project by ID
router.delete(
  "/project/:projectId",
  authMiddleware,
  projectController.deleteProjectById
);

// Delete Tower by ID
router.delete(
  "/tower/:towerId",
  authMiddleware,
  projectController.deleteTowerById
);

// Delete Unit by ID
router.delete(
  "/unit/:unitId",
  authMiddleware,
  projectController.deleteUnitById
);


router.post("/project-types/full", authMiddleware, projectController.createFullHierarchy);

// Full hierarchy update
router.put("/project-types/full/:projectId", authMiddleware, projectController.updateFullHierarchy);

// Bulk upload (array of projectTypes)
router.post("/project-types/bulk", authMiddleware, projectController.bulkUploadProjectTypes);



module.exports = router;