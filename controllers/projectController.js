
// const ProjectType = require("../models/project"); // projectTypeSchema

// // ✅ Step 1 - Create a ProjectType (root)
// exports.createProjectType = async (req, res) => {
//   try {
//     const { projectType } = req.body;

//     const allowed = ["Residential", "Commercial", "UnderConstruction", "ReadyToMove"];
//     if (!allowed.includes(projectType)) {
//       return res.status(400).json({ error: "Invalid projectType" });
//     }

//     let typeDoc = await ProjectType.findOne({ projectType });
//     if (typeDoc) {
//       return res.status(200).json(typeDoc); // already exists
//     }

//     typeDoc = new ProjectType({ projectType, cities: [] });
//     await typeDoc.save();

//     res.status(201).json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 2 - Create City
// exports.createCity = async (req, res) => {
//   try {
//     const { projectType } = req.params;
//     const { cityName } = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     typeDoc.cities.push({ cityName });
//     await typeDoc.save();

//     res.status(201).json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 3 - Add Division
// exports.addDivision = async (req, res) => {
//   try {
//     const { projectType, cityId } = req.params;
//     const { divisionName } = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     if (!city) return res.status(404).json({ error: "City not found" });

//     city.divisions.push({ divisionName });
//     await typeDoc.save();

//     res.json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 4 - Add Sector
// exports.addSector = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId } = req.params;
//     const { sectorName } = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     if (!city) return res.status(404).json({ error: "City not found" });

//     const division = city.divisions.id(divisionId);
//     if (!division) return res.status(404).json({ error: "Division not found" });

//     division.sectors.push({ sectorName });
//     await typeDoc.save();

//     res.json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 5 - Add Project (FIXED)
// exports.addProject = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId, sectorId } = req.params;
//     const { projectName } = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     if (!city) return res.status(404).json({ error: "City not found" });

//     const division = city.divisions.id(divisionId);
//     if (!division) return res.status(404).json({ error: "Division not found" });

//     const sector = division.sectors.id(sectorId);
//     if (!sector) return res.status(404).json({ error: "Sector not found" });

//     sector.projects.push({ projectName, towers: [] });
//     await typeDoc.save();

//     res.status(201).json(typeDoc); // ✅ return full hierarchy
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 6 - Add Tower
// exports.addTower = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId, sectorId, projectId } = req.params;
//     const { towerName } = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);

//     project.towers.push({ towerName });
//     await typeDoc.save();

//     res.json(typeDoc); // ✅ full hierarchy
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// exports.addUnit = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId, sectorId, projectId, towerId } = req.params;
//     const unitData = req.body; // 👈 get full unit data

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);

  
//     tower.units.push(unitData);
//     await typeDoc.save();

//     res.json(typeDoc); 
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// exports.updateUnit = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId, sectorId, projectId, towerId, unitId } = req.params;
//     const updateData = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);
//     const unit = tower.units.id(unitId);

//     if (!unit) return res.status(404).json({ error: "Unit not found" });

//     Object.assign(unit, updateData);
//     await typeDoc.save();

//     res.json(typeDoc); 
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



const ProjectType = require("../models/project"); // projectTypeSchema

// ✅ Step 1 - Create a ProjectType (root)
exports.createProjectType = async (req, res) => {
  try {
    const { category, projectcategory } = req.body;

    const allowedCategory = ["Residential", "Commercial"];
    const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

    if (!allowedCategory.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (!allowedProjectCategory.includes(projectcategory)) {
      return res.status(400).json({ error: "Invalid projectcategory" });
    }

    // ✅ Ensure uniqueness of combo
    let typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (typeDoc) {
      return res.status(200).json(typeDoc); // already exists
    }

    typeDoc = new ProjectType({ category, projectcategory, cities: [] });
    await typeDoc.save();

    res.status(201).json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 2 - Create City
exports.createCity = async (req, res) => {
  try {
    const { category, projectcategory } = req.params;
    const { cityName } = req.body;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    typeDoc.cities.push({ cityName });
    await typeDoc.save();

    res.status(201).json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 3 - Add Division
exports.addDivision = async (req, res) => {
  try {
    const { category, projectcategory, cityId } = req.params;
    const { divisionName } = req.body;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    if (!city) return res.status(404).json({ error: "City not found" });

    city.divisions.push({ divisionName });
    await typeDoc.save();

    res.json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 4 - Add Sector
exports.addSector = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId } = req.params;
    const { sectorName } = req.body;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    if (!city) return res.status(404).json({ error: "City not found" });

    const division = city.divisions.id(divisionId);
    if (!division) return res.status(404).json({ error: "Division not found" });

    division.sectors.push({ sectorName });
    await typeDoc.save();

    res.json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 5 - Add Project
exports.addProject = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId, sectorId } = req.params;
    const { projectName } = req.body;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    if (!city) return res.status(404).json({ error: "City not found" });

    const division = city.divisions.id(divisionId);
    if (!division) return res.status(404).json({ error: "Division not found" });

    const sector = division.sectors.id(sectorId);
    if (!sector) return res.status(404).json({ error: "Sector not found" });

    sector.projects.push({ projectName, towers: [] });
    await typeDoc.save();

    res.status(201).json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 6 - Add Tower
exports.addTower = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId, sectorId, projectId } = req.params;
    const { towerName } = req.body;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);

    project.towers.push({ towerName });
    await typeDoc.save();

    res.json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 7 - Add Unit
exports.addUnit = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId, sectorId, projectId, towerId } = req.params;
    const unitData = req.body; // 👈 full unit data

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);
    const tower = project.towers.id(towerId);

    tower.units.push(unitData);
    await typeDoc.save();

    res.json(typeDoc); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 8 - Update Unit
exports.updateUnit = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId, sectorId, projectId, towerId, unitId } = req.params;
    const updateData = req.body;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);
    const tower = project.towers.id(towerId);
    const unit = tower.units.id(unitId);

    if (!unit) return res.status(404).json({ error: "Unit not found" });

    Object.assign(unit, updateData);
    await typeDoc.save();

    res.json(typeDoc); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Delete an entity at any level from ProjectType down to Unit
exports.deleteEntity = async (req, res) => {
  try {
    const {
      category,
      projectcategory,
      cityId,
      divisionId,
      sectorId,
      projectId,
      towerId,
      unitId,
    } = req.params;

    const typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) {
      return res.status(404).json({ error: "ProjectType not found" });
    }

    // ---- Delete entire ProjectType ----
    if (!cityId) {
      await ProjectType.deleteOne({ category, projectcategory });
      return res.json({ message: "ProjectType deleted" });
    }

    // ---- City ----
    const city = typeDoc.cities.id(cityId);
    if (!city) return res.status(404).json({ error: "City not found" });

    if (!divisionId) {
      await city.deleteOne();
      await typeDoc.save();
      return res.json({ message: "City deleted" });
    }

    // ---- Division ----
    const division = city.divisions.id(divisionId);
    if (!division) return res.status(404).json({ error: "Division not found" });

    if (!sectorId) {
      await division.deleteOne();
      await typeDoc.save();
      return res.json({ message: "Division deleted" });
    }

    // ---- Sector ----
    const sector = division.sectors.id(sectorId);
    if (!sector) return res.status(404).json({ error: "Sector not found" });

    if (!projectId) {
      await sector.deleteOne();
      await typeDoc.save();
      return res.json({ message: "Sector deleted" });
    }

    // ---- Project ----
    const project = sector.projects.id(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (!towerId) {
      await project.deleteOne();
      await typeDoc.save();
      return res.json({ message: "Project deleted" });
    }

    // ---- Tower ----
    const tower = project.towers.id(towerId);
    if (!tower) return res.status(404).json({ error: "Tower not found" });

    if (!unitId) {
      await tower.deleteOne();
      await typeDoc.save();
      return res.json({ message: "Tower deleted" });
    }

    // ---- Unit ----
    const unit = tower.units.id(unitId);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    await unit.deleteOne();
    await typeDoc.save();

    return res.json({ message: "Unit deleted" });
  } catch (err) {
    console.error("❌ deleteEntity error:", err);
    res.status(500).json({ error: err.message });
  }
};



