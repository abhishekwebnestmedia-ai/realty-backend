// const City = require("../models/project");

// // ✅ Create City
// exports.createCity = async (req, res) => {
//   try {
//     const city = new City({ cityName: req.body.cityName });
//     await city.save();
//     res.status(201).json(city);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Add Division to City
// exports.addDivision = async (req, res) => {
//   try {
//     const { cityId } = req.params;
//     const { divisionName } = req.body;

//     const city = await City.findById(cityId);
//     city.divisions.push({ divisionName });
//     await city.save();

//     res.json(city);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Add Sector to Division
// exports.addSector = async (req, res) => {
//   try {
//     const { cityId, divisionId } = req.params;
//     const { sectorName } = req.body;

//     const city = await City.findById(cityId);
//     const division = city.divisions.id(divisionId);
//     division.sectors.push({ sectorName });
//     await city.save();

//     res.json(city);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Add Project to Sector
// exports.addProject = async (req, res) => {
//   try {
//     const { cityId, divisionId, sectorId } = req.params;
//     const { projectName, projectType } = req.body;

//     const city = await City.findById(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);

//     sector.projects.push({ projectName, projectType });
//     await city.save();

//     res.json(city);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Add Tower to Project
// exports.addTower = async (req, res) => {
//   try {
//     const { cityId, divisionId, sectorId, projectId } = req.params;
//     const { towerName } = req.body;

//     const city = await City.findById(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);

//     project.towers.push({ towerName });
//     await city.save();

//     res.json(city);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Add Unit to Tower
// exports.addUnit = async (req, res) => {
//   try {
//     const { cityId, divisionId, sectorId, projectId, towerId } = req.params;
//     const { unitNumber } = req.body;

//     const city = await City.findById(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);

//     tower.units.push({ unitNumber });
//     await city.save();

//     res.json(city);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Update Unit Details (form submission)
// exports.updateUnit = async (req, res) => {
//   try {
//     const { cityId, divisionId, sectorId, projectId, towerId, unitId } = req.params;
//     const updateData = req.body;

//     const city = await City.findById(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);
//     const unit = tower.units.id(unitId);

//     Object.assign(unit, updateData); // update fields
//     await city.save();

//     res.json(unit);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };






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

// // ✅ Step 5 - Add Project
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

//     const newProject = { projectName, towers: [] };
//     sector.projects.push(newProject);
//     await typeDoc.save();

//     const project = sector.projects[sector.projects.length - 1];

//     res.status(201).json({
//       projectType: typeDoc.projectType,
//       projectName: project.projectName,
//       _id: project._id,
//       towers: project.towers
//     });
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

//     res.json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 7 - Add Unit
// exports.addUnit = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId, sectorId, projectId, towerId } = req.params;
//     const { unitNumber } = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);

//     tower.units.push({ unitNumber });
//     await typeDoc.save();

//     res.json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Step 8 - Update Unit
// exports.updateUnit = async (req, res) => {
//   try {
//     const { projectType, cityId, divisionId, sectorId, projectId, towerId, unitId } = req.params;
//     const updateData = req.body;

//     const typeDoc = await ProjectType.findOne({ projectType });
//     if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

//     const city = typeDoc.cities.id(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(divisionId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);
//     const unit = tower.units.id(unitId);

//     Object.assign(unit, updateData);
//     await typeDoc.save();

//     res.json(unit);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



const ProjectType = require("../models/project"); // projectTypeSchema

// ✅ Step 1 - Create a ProjectType (root)
exports.createProjectType = async (req, res) => {
  try {
    const { projectType } = req.body;

    const allowed = ["Residential", "Commercial", "UnderConstruction", "ReadyToMove"];
    if (!allowed.includes(projectType)) {
      return res.status(400).json({ error: "Invalid projectType" });
    }

    let typeDoc = await ProjectType.findOne({ projectType });
    if (typeDoc) {
      return res.status(200).json(typeDoc); // already exists
    }

    typeDoc = new ProjectType({ projectType, cities: [] });
    await typeDoc.save();

    res.status(201).json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 2 - Create City
exports.createCity = async (req, res) => {
  try {
    const { projectType } = req.params;
    const { cityName } = req.body;

    const typeDoc = await ProjectType.findOne({ projectType });
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
    const { projectType, cityId } = req.params;
    const { divisionName } = req.body;

    const typeDoc = await ProjectType.findOne({ projectType });
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
    const { projectType, cityId, divisionId } = req.params;
    const { sectorName } = req.body;

    const typeDoc = await ProjectType.findOne({ projectType });
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

// ✅ Step 5 - Add Project (FIXED)
exports.addProject = async (req, res) => {
  try {
    const { projectType, cityId, divisionId, sectorId } = req.params;
    const { projectName } = req.body;

    const typeDoc = await ProjectType.findOne({ projectType });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    if (!city) return res.status(404).json({ error: "City not found" });

    const division = city.divisions.id(divisionId);
    if (!division) return res.status(404).json({ error: "Division not found" });

    const sector = division.sectors.id(sectorId);
    if (!sector) return res.status(404).json({ error: "Sector not found" });

    sector.projects.push({ projectName, towers: [] });
    await typeDoc.save();

    res.status(201).json(typeDoc); // ✅ return full hierarchy
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 6 - Add Tower
exports.addTower = async (req, res) => {
  try {
    const { projectType, cityId, divisionId, sectorId, projectId } = req.params;
    const { towerName } = req.body;

    const typeDoc = await ProjectType.findOne({ projectType });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);

    project.towers.push({ towerName });
    await typeDoc.save();

    res.json(typeDoc); // ✅ full hierarchy
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 7 - Add Unit
// ✅ Step 7 - Add Unit (fixed)
exports.addUnit = async (req, res) => {
  try {
    const { projectType, cityId, divisionId, sectorId, projectId, towerId } = req.params;
    const unitData = req.body; // 👈 get full unit data

    const typeDoc = await ProjectType.findOne({ projectType });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);
    const tower = project.towers.id(towerId);

    // ✅ push the full unit data
    tower.units.push(unitData);
    await typeDoc.save();

    res.json(typeDoc); // return updated hierarchy
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 8 - Update Unit (FIXED sectorId bug)
exports.updateUnit = async (req, res) => {
  try {
    const { projectType, cityId, divisionId, sectorId, projectId, towerId, unitId } = req.params;
    const updateData = req.body;

    const typeDoc = await ProjectType.findOne({ projectType });
    if (!typeDoc) return res.status(404).json({ error: "ProjectType not found" });

    const city = typeDoc.cities.id(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId); // ✅ fixed
    const project = sector.projects.id(projectId);
    const tower = project.towers.id(towerId);
    const unit = tower.units.id(unitId);

    if (!unit) return res.status(404).json({ error: "Unit not found" });

    Object.assign(unit, updateData);
    await typeDoc.save();

    res.json(typeDoc); // ✅ return full hierarchy after update
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




