
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
// exports.createProjectType = async (req, res) => {
//   try {
//     const { category, projectcategory } = req.body;

//     const allowedCategory = ["Residential", "Commercial"];
//     const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

//     if (!allowedCategory.includes(category)) {
//       return res.status(400).json({ error: "Invalid category" });
//     }
//     if (!allowedProjectCategory.includes(projectcategory)) {
//       return res.status(400).json({ error: "Invalid projectcategory" });
//     }

//     // ✅ Ensure uniqueness of combo
//     let typeDoc = await ProjectType.findOne({ category, projectcategory });
//     if (typeDoc) {
//       return res.status(200).json(typeDoc); // already exists
//     }

//     typeDoc = new ProjectType({ category, projectcategory, cities: [] });
//     await typeDoc.save();

//     res.status(201).json(typeDoc);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

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

    const typeDoc = new ProjectType({ category, projectcategory, cities: [] });
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


exports.deleteProjectTypeById = async (req, res) => {
  try {
    const deleted = await ProjectType.findByIdAndDelete(req.params.projectid);
    if (!deleted) {
      return res.status(404).json({ error: "ProjectType not found" });
    }
    res.json({ message: "ProjectType deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -----------------------------
// Delete City by ID
// -----------------------------
exports.deleteCityById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({ "cities._id": req.params.cityId });
    if (!typeDoc) return res.status(404).json({ error: "City not found" });

    typeDoc.cities.id(req.params.cityId).deleteOne();
    await typeDoc.save();

    res.json({ message: "City deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Delete Division by ID
// -----------------------------
exports.deleteDivisionById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({ "cities.divisions._id": req.params.divisionId });
    if (!typeDoc) return res.status(404).json({ error: "Division not found" });

    for (const city of typeDoc.cities) {
      const division = city.divisions.id(req.params.divisionId);
      if (division) {
        division.deleteOne();
        await typeDoc.save();
        return res.json({ message: "Division deleted successfully" });
      }
    }

    res.status(404).json({ error: "Division not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Delete Sector by ID
// -----------------------------
exports.deleteSectorById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({ "cities.divisions.sectors._id": req.params.sectorId });
    if (!typeDoc) return res.status(404).json({ error: "Sector not found" });

    for (const city of typeDoc.cities) {
      for (const division of city.divisions) {
        const sector = division.sectors.id(req.params.sectorId);
        if (sector) {
          sector.deleteOne();
          await typeDoc.save();
          return res.json({ message: "Sector deleted successfully" });
        }
      }
    }

    res.status(404).json({ error: "Sector not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Delete Project by ID
// -----------------------------
exports.deleteProjectById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({ "cities.divisions.sectors.projects._id": req.params.projectId });
    if (!typeDoc) return res.status(404).json({ error: "Project not found" });

    for (const city of typeDoc.cities) {
      for (const division of city.divisions) {
        for (const sector of division.sectors) {
          const project = sector.projects.id(req.params.projectId);
          if (project) {
            project.deleteOne();
            await typeDoc.save();
            return res.json({ message: "Project deleted successfully" });
          }
        }
      }
    }

    res.status(404).json({ error: "Project not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Delete Tower by ID
// -----------------------------
exports.deleteTowerById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({ "cities.divisions.sectors.projects.towers._id": req.params.towerId });
    if (!typeDoc) return res.status(404).json({ error: "Tower not found" });

    for (const city of typeDoc.cities) {
      for (const division of city.divisions) {
        for (const sector of division.sectors) {
          for (const project of sector.projects) {
            const tower = project.towers.id(req.params.towerId);
            if (tower) {
              tower.deleteOne();
              await typeDoc.save();
              return res.json({ message: "Tower deleted successfully" });
            }
          }
        }
      }
    }

    res.status(404).json({ error: "Tower not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------
// Delete Unit by ID
// -----------------------------
exports.deleteUnitById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({ "cities.divisions.sectors.projects.towers.units._id": req.params.unitId });
    if (!typeDoc) return res.status(404).json({ error: "Unit not found" });

    for (const city of typeDoc.cities) {
      for (const division of city.divisions) {
        for (const sector of division.sectors) {
          for (const project of sector.projects) {
            for (const tower of project.towers) {
              const unit = tower.units.id(req.params.unitId);
              if (unit) {
                unit.deleteOne();
                await typeDoc.save();
                return res.json({ message: "Unit deleted successfully" });
              }
            }
          }
        }
      }
    }

    res.status(404).json({ error: "Unit not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





exports.createFullHierarchy = async (req, res) => {
  try {
    const { category, projectcategory, cities = [] } = req.body;

    const allowedCategory = ["Residential", "Commercial"];
    const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

    if (!allowedCategory.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (!allowedProjectCategory.includes(projectcategory)) {
      return res.status(400).json({ error: "Invalid projectcategory" });
    }

    const normalizedCities = cities.map(city => ({
      cityName: city.cityName,
      divisions: (city.divisions || []).map(division => ({
        divisionName: division.divisionName,
        sectors: (division.sectors || []).map(sector => ({
          sectorName: sector.sectorName,
          projects: (sector.projects || []).map(project => ({
            projectName: project.projectName,
            towers: (project.towers || []).map(tower => ({
              towerName: tower.towerName,
              units: tower.units || []
            }))
          }))
        }))
      }))
    }));

    const typeDoc = new ProjectType({ category, projectcategory, cities: normalizedCities });
    await typeDoc.save();

    res.status(201).json(typeDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Full hierarchy update (replace everything)
exports.updateFullHierarchy = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { category, projectcategory, cities = [] } = req.body;

    const allowedCategory = ["Residential", "Commercial"];
    const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

    if (!allowedCategory.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (!allowedProjectCategory.includes(projectcategory)) {
      return res.status(400).json({ error: "Invalid projectcategory" });
    }

    const normalizedCities = cities.map(city => ({
      cityName: city.cityName,
      divisions: (city.divisions || []).map(division => ({
        divisionName: division.divisionName,
        sectors: (division.sectors || []).map(sector => ({
          sectorName: sector.sectorName,
          projects: (sector.projects || []).map(project => ({
            projectName: project.projectName,
            towers: (project.towers || []).map(tower => ({
              towerName: tower.towerName,
              units: tower.units || []
            }))
          }))
        }))
      }))
    }));

    const updated = await ProjectType.findByIdAndUpdate(
      projectId,
      { category, projectcategory, cities: normalizedCities },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "ProjectType not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Bulk Upload API (always inserts)
exports.bulkUploadProjectTypes = async (req, res) => {
  try {
    const docs = req.body;
    if (!Array.isArray(docs)) {
      return res.status(400).json({ error: "Expected an array of project types" });
    }

    const allowedCategory = ["Residential", "Commercial"];
    const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

    const normalizedDocs = docs.map(doc => {
      const { category, projectcategory, cities = [] } = doc;

      if (!allowedCategory.includes(category)) {
        throw new Error(`Invalid category: ${category}`);
      }
      if (!allowedProjectCategory.includes(projectcategory)) {
        throw new Error(`Invalid projectcategory: ${projectcategory}`);
      }

      return {
        category,
        projectcategory,
        cities: cities.map(city => ({
          cityName: city.cityName,
          divisions: (city.divisions || []).map(division => ({
            divisionName: division.divisionName,
            sectors: (division.sectors || []).map(sector => ({
              sectorName: sector.sectorName,
              projects: (sector.projects || []).map(project => ({
                projectName: project.projectName,
                towers: (project.towers || []).map(tower => ({
                  towerName: tower.towerName,
                  units: tower.units || []
                }))
              }))
            }))
          }))
        }))
      };
    });

    const inserted = await ProjectType.insertMany(normalizedDocs, { ordered: false });
    res.status(201).json({ message: "Bulk upload successful", data: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};