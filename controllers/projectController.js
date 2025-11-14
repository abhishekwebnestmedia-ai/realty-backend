

const ProjectType = require("../models/project"); // projectTypeSchema



const Inventory = require('../models/inventryModel');
const Notification = require('../models/notification');
const { emitToAdmins } = require('../utils/socketEmitter');




const mongoose = require("mongoose");

// ✅ Step 1 - Create ProjectType (root)
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

    const result = await ProjectType.updateOne(
      { category, projectcategory },
      { $push: { cities: { cityName, divisions: [] } } }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "ProjectType not found" });

    res.json({ message: "City added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 3 - Add Division
exports.addDivision = async (req, res) => {
  try {
    const { category, projectcategory, cityId } = req.params;
    const { divisionName } = req.body;

    const result = await ProjectType.updateOne(
      { category, projectcategory, "cities._id": cityId },
      { $push: { "cities.$.divisions": { divisionName, sectors: [] } } }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "City not found" });

    res.json({ message: "Division added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 4 - Add Sector
exports.addSector = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId } = req.params;
    const { sectorName } = req.body;

    const result = await ProjectType.updateOne(
      { category, projectcategory },
      {
        $push: {
          "cities.$[city].divisions.$[div].sectors": { sectorName, projects: [] },
        },
      },
      {
        arrayFilters: [
          { "city._id": cityId },
          { "div._id": divisionId },
        ],
      }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "Division not found" });

    res.json({ message: "Sector added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 5 - Add Project
exports.addProject = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId, sectorId } = req.params;
    const { projectName } = req.body;

    const result = await ProjectType.updateOne(
      { category, projectcategory },
      {
        $push: {
          "cities.$[city].divisions.$[div].sectors.$[sec].projects": {
            projectName,
            towers: [],
          },
        },
      },
      {
        arrayFilters: [
          { "city._id": cityId },
          { "div._id": divisionId },
          { "sec._id": sectorId },
        ],
      }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "Sector not found" });

    res.json({ message: "Project added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Step 6 - Add Tower
exports.addTower = async (req, res) => {
  try {
    const { category, projectcategory, cityId, divisionId, sectorId, projectId } = req.params;
    const { towerName } = req.body;

    const result = await ProjectType.updateOne(
      { category, projectcategory },
      {
        $push: {
          "cities.$[city].divisions.$[div].sectors.$[sec].projects.$[proj].towers": {
            towerName,
            units: [],
          },
        },
      },
      {
        arrayFilters: [
          { "city._id": cityId },
          { "div._id": divisionId },
          { "sec._id": sectorId },
          { "proj._id": projectId },
        ],
      }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "Project not found" });

    res.json({ message: "Tower added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Step 7 - Add Floor



//✅ Step 7 - Add Unit
// exports.addUnit = async (req, res) => {
//   try {
//     const { category, projectcategory, cityId, divisionId, sectorId, projectId, towerId } =
//       req.params;
//     const unitData = req.body;

//     const result = await ProjectType.updateOne(
//       { category, projectcategory },
//       {
//         $push: {
//           "cities.$[city].divisions.$[div].sectors.$[sec].projects.$[proj].towers.$[tow].units":
//             unitData,
//         },
//       },
//       {
//         arrayFilters: [
//           { "city._id": cityId },
//           { "div._id": divisionId },
//           { "sec._id": sectorId },
//           { "proj._id": projectId },
//           { "tow._id": towerId },
//         ],
//       }
//     );

//     if (result.modifiedCount === 0)
//       return res.status(404).json({ error: "Tower not found" });

//     res.json({ message: "Unit added successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



// ✅ Step 7 - Add Unit WITH NOTIFICATION


// exports.addUnit = async (req, res) => {
//   try {
//     const {
//       category,
//       projectcategory,
//       cityId,
//       divisionId,
//       sectorId,
//       projectId,
//       towerId
//     } = req.params;

//     const unitData = req.body;

//     // Insert Unit
//     const result = await ProjectType.updateOne(
//       { category, projectcategory },
//       {
//         $push: {
//           "cities.$[city].divisions.$[div].sectors.$[sec].projects.$[proj].towers.$[tow].units":
//             unitData,
//         },
//       },
//       {
//         arrayFilters: [
//           { "city._id": cityId },
//           { "div._id": divisionId },
//           { "sec._id": sectorId },
//           { "proj._id": projectId },
//           { "tow._id": towerId },
//         ],
//       }
//     );

//     if (result.modifiedCount === 0)
//       return res.status(404).json({ error: "Tower not found" });

//     // Fetch inserted unit
//     const updated = await ProjectType.findOne({ category, projectcategory });
//     const city = updated.cities.id(cityId);
//     const division = city.divisions.id(divisionId);
//     const sector = division.sectors.id(sectorId);
//     const project = sector.projects.id(projectId);
//     const tower = project.towers.id(towerId);
//     const addedUnit = tower.units[tower.units.length - 1];

//     // 🔔 Auto Notification (Schema will emit real-time)
//   if (addedUnit.status?.toLowerCase() === "interested in calling") {
//   const message = `New unit ${addedUnit.unitNumber} created with status "Interested in calling". Approve to copy into Inventory?`;
//   const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

//   // Ensure correct objectId type
//   const itemId = new mongoose.Types.ObjectId(addedUnit._id);

//   const exists = await Notification.findOne({
//     type: "Inventory",
//     itemId,
//     createdAt: { $gte: tenMinAgo }
//   });

//   if (!exists) {
//     try {
//       const notif = await Notification.create({
//         type: "Inventory",
//         itemId,
//         message,
//         changedBy: req.user?.name || "admin"
//       });

//       emitToAdmins(notif.toJSON());
//       console.log("📢 Notification Sent:", notif);

//     } catch (err) {
//       if (err.code === 11000) {
//         console.log("⚠ Duplicate notification ignored");
//       } else {
//         console.error("❌ Notification create error:", err);
//       }
//     }
//   }
// }


//     res.json({ message: "Unit added successfully", unit: addedUnit });

//   } catch (err) {
//     console.error("addUnit error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };






exports.addUnit = async (req, res) => {
  try {
    console.log("\n==============================");
    console.log("➡️ addUnit() TRIGGERED");
    console.log("==============================");

    const {
      category,
      projectcategory,
      cityId,
      divisionId,
      sectorId,
      projectId,
      towerId
    } = req.params;

    console.log("📌 Route Params:", req.params);
    console.log("📦 Received Payload:", req.body);

    const unitData = req.body;

    // Normalize status
    const allowedStatuses = [
      "Vacant",
      "Rental",
      "Self Occupied",
      "Interested in calling"
    ];

    if (unitData.status) {
      console.log(`🔍 Status BEFORE Normalize: ${unitData.status}`);
      unitData.status =
        allowedStatuses.find(
          s => s.toLowerCase() === unitData.status.toLowerCase().trim()
        ) || "Vacant";
      console.log(`🎯 Status AFTER Normalize: ${unitData.status}`);
    }

    // Insert
    console.log("🛠 Inserting unit...");
    const updateResult = await ProjectType.updateOne(
      { category, projectcategory },
      {
        $push: {
          "cities.$[city].divisions.$[div].sectors.$[sec].projects.$[proj].towers.$[tow].units":
            unitData,
        },
      },
      {
        arrayFilters: [
          { "city._id": cityId },
          { "div._id": divisionId },
          { "sec._id": sectorId },
          { "proj._id": projectId },
          { "tow._id": towerId },
        ],
      }
    );

    console.log("🧾 Mongo Update Result:", updateResult);

    // Fetch newly added unit
    const updatedDoc = await ProjectType.findOne({ category, projectcategory });

    if (!updatedDoc) {
      console.log("❌ ERROR: updatedDoc NOT FOUND!");
      return res.status(500).json({ error: "Updated document not found" });
    }

    const addedUnit =
      updatedDoc.cities.id(cityId)
        .divisions.id(divisionId)
        .sectors.id(sectorId)
        .projects.id(projectId)
        .towers.id(towerId)
        .units.slice(-1)[0];

    console.log("📌 Extracted Unit Data From DB:", addedUnit);

    // Notification logic
    if (!addedUnit || !addedUnit.status) {
      console.log("⚠ No status found or unit not created. Skipping notification.");
    } else if (addedUnit.status.trim().toLowerCase() === "interested in calling") {
      console.log("🟢 Notification Condition MATCHED!");

      const changedBy = req.user?.name || "System";
      const msg = `🏢 New Unit "${addedUnit.unitNumber}" created with status → Interested in calling (${changedBy})`;

      console.log("📝 Notification message:", msg);

      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);

      console.log("🔍 Checking duplicate notification...");

      const alreadyExists = await Notification.findOne({
        type: "Inventory",
        itemId: addedUnit._id,
        message: msg,
        createdAt: { $gte: twoMinAgo },
      });

      console.log("🧪 Duplicate Check Result:", alreadyExists);

      if (!alreadyExists) {
        console.log("🚀 No duplicate found → Creating Notification Now...");
        try {
          const notif = await Notification.create({
            type: "Inventory",
            itemId: addedUnit._id,
            message: msg,
            changedBy
          });

          console.log("📦 Notification CREATED IN DB:", notif);

          // Emit to admins
          if (global.io) {
            emitToAdmins(notif.toJSON());
            console.log("📡 Real-time Notification Emitted to Admins!");
          } else {
            console.log("⚠ Socket.IO not initialized — cannot emit.");
          }

        } catch (err) {
          console.error("❌ Notification Create ERROR:", err);
        }
      } else {
        console.log("⚠ Duplicate notification detected → NOT inserted.");
      }

    } else {
      console.log(`🔴 Notification condition failed — Status is: "${addedUnit.status}"`);
    }

    console.log("✅ UNIT ADD PROCESS COMPLETED");

    return res.json({
      success: true,
      message: "Unit added successfully",
      unit: addedUnit
    });

  } catch (err) {
    console.error("\n❌ FATAL ERROR in addUnit():", err);
    res.status(500).json({ error: err.message });
  }
};




exports.approveUnit = async (req, res) => {
  try {
    const confirm = req.body.confirm;

    if (!confirm)
      return res.status(400).json({ message: "Please confirm: yes or no" });

    if (confirm === "no")
      return res.json({ message: "Approval cancelled. Unit stays in Projects." });

    const {
      category, projectcategory,
      cityId, divisionId, sectorId, projectId, towerId, unitId
    } = req.params;

    const proj = await ProjectType.findOne({ category, projectcategory });
    if (!proj) return res.status(404).json({ error: "ProjectType not found" });

    let foundUnit = null, projectName = "", sectorName = "", towerName = "";

    // Deep search
    proj.cities.forEach(city => {
      if (city._id.toString() !== cityId) return;
      city.divisions.forEach(div => {
        if (div._id.toString() !== divisionId) return;
        div.sectors.forEach(sec => {
          if (sec._id.toString() !== sectorId) return;
          sectorName = sec.sectorName;
          sec.projects.forEach(p => {
            if (p._id.toString() !== projectId) return;
            projectName = p.projectName;
            p.towers.forEach(t => {
              if (t._id.toString() !== towerId) return;
              towerName = t.towerName;
              t.units.forEach(u => {
                if (u._id.toString() === unitId) foundUnit = u;
              });
            });
          });
        });
      });
    });

    if (!foundUnit)
      return res.status(404).json({ error: "Unit not found" });

    if (foundUnit.isApproved)
      return res.status(400).json({ error: "Unit already approved" });

    if (foundUnit.status !== "Interested in calling")
      return res.status(400).json({ error: "Unit is not Interested in calling" });

    // Approve
    foundUnit.isApproved = true;
    await proj.save();

    // Copy to Inventory
    const payload = {
      sellerName: foundUnit.ownerName || "",
      inventoryType: "Sales",
      sector: sectorName,
      unitNo: foundUnit.unitNumber,
      towerNo: towerName,
      Project: [projectName],
      contactNumbers: foundUnit.mobileNumbers || [],
      email: foundUnit.email || "",
      remarks: foundUnit.remarks || "",
      capturedBy: req.user?.name || "Admin"
    };

    const newInv = await Inventory.create(payload);

    // 👍 Auto-emitted by schema
    const msg = `Unit ${foundUnit.unitNumber} approved and copied to Inventory.`;
    const notif = await Notification.create({
      type: "Inventory",
      itemId: newInv._id,
      message: msg,
      changedBy: req.user?.name || "admin"
    });

    emitToAdmins(notif.toJSON());

    return res.json({
      success: true,
      message: "Unit approved & copied to Inventory",
      inventory: newInv
    });

  } catch (err) {
    console.error("approveUnit error:", err);
    res.status(500).json({ error: err.message });
  }
};






// ✅ Step 8 - Update Unit (uses $set)
exports.updateUnit = async (req, res) => {
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
    const updateData = req.body;

    const result = await ProjectType.updateOne(
      { category, projectcategory },
      {
        $set: {
          "cities.$[city].divisions.$[div].sectors.$[sec].projects.$[proj].towers.$[tow].units.$[unit]":
            updateData,
        },
      },
      {
        arrayFilters: [
          { "city._id": cityId },
          { "div._id": divisionId },
          { "sec._id": sectorId },
          { "proj._id": projectId },
          { "tow._id": towerId },
          { "unit._id": unitId },
        ],
      }
    );

    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "Unit not found" });

    res.json({ message: "Unit updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};






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
// Delete Floor by ID
// -----------------------------


// -----------------------------
// Delete Unit by ID
// -----------------------------
// -----------------------------
// Delete Unit by ID (inside Floor)
// -----------------------------
exports.deleteUnitById = async (req, res) => {
  try {
    const typeDoc = await ProjectType.findOne({
      "cities.divisions.sectors.projects.towers.floors.units._id": req.params.unitId,
    });
    if (!typeDoc) return res.status(404).json({ error: "Unit not found" });

    for (const city of typeDoc.cities) {
      for (const division of city.divisions) {
        for (const sector of division.sectors) {
          for (const project of sector.projects) {
            for (const tower of project.towers) {
              for (const floor of tower.floors) {
                const unit = floor.units.id(req.params.unitId);
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

    (async () => {
  try {
    await ProjectType.collection.dropIndex("projectType_1");
    console.log("Index dropped successfully");
  } catch (err) {
    console.error("Error dropping index:", err.message);
  }
})();

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


// ✅ Merge or create hierarchy dynamically (smart insert)
// exports.mergeOrCreateHierarchy = async (req, res) => {
//   try {
//     const { category, projectcategory, cities = [] } = req.body;

//     // Validate input
//     if (!category || !projectcategory)
//       return res.status(400).json({ error: "Missing category or projectcategory" });

//     const allowedCategory = ["Residential", "Commercial"];
//     const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

//     if (!allowedCategory.includes(category))
//       return res.status(400).json({ error: "Invalid category" });
//     if (!allowedProjectCategory.includes(projectcategory))
//       return res.status(400).json({ error: "Invalid projectcategory" });

//     let typeDoc = await ProjectType.findOne({ category, projectcategory });
//     if (!typeDoc) {
//       typeDoc = new ProjectType({ category, projectcategory, cities: [] });
//     }

//     // Merge cities
//     for (const city of cities) {
//       let existingCity = typeDoc.cities.find((c) => c.cityName === city.cityName);
//       if (!existingCity) {
//         typeDoc.cities.push(city);
//         continue;
//       }

//       // Merge divisions
//       for (const div of city.divisions || []) {
//         let existingDiv = existingCity.divisions.find(
//           (d) => d.divisionName === div.divisionName
//         );
//         if (!existingDiv) {
//           existingCity.divisions.push(div);
//           continue;
//         }

//         // Merge sectors
//         for (const sec of div.sectors || []) {
//           let existingSec = existingDiv.sectors.find(
//             (s) => s.sectorName === sec.sectorName
//           );
//           if (!existingSec) {
//             existingDiv.sectors.push(sec);
//             continue;
//           }

//           // Merge projects
//           for (const proj of sec.projects || []) {
//             let existingProj = existingSec.projects.find(
//               (p) => p.projectName === proj.projectName
//             );
//             if (!existingProj) {
//               existingSec.projects.push(proj);
//               continue;
//             }

//             // Merge towers
//             for (const tower of proj.towers || []) {
//               let existingTower = existingProj.towers.find(
//                 (t) => t.towerName === tower.towerName
//               );
//               if (!existingTower) {
//                 existingProj.towers.push(tower);
//                 continue;
//               }

//               // Merge units
//               for (const unit of tower.units || []) {
//                 const exists = existingTower.units.some(
//                   (u) => u.unitNumber === unit.unitNumber
//                 );
//                 if (!exists) {
//                   existingTower.units.push(unit);
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     await typeDoc.save();

//     res.status(200).json({
//       success: true,
//       message: "Hierarchy merged successfully",
//       data: typeDoc,
//     });
//   } catch (err) {
//     console.error("❌ mergeOrCreateHierarchy error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



//========================================================




// exports.mergeOrCreateHierarchy = async (req, res) => {
//   try {
//     const { category, projectcategory, cities = [] } = req.body;

//     if (!category || !projectcategory)
//       return res.status(400).json({ error: "Missing category or projectcategory" });

//     const allowedCategory = ["Residential", "Commercial"];
//     const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

//     if (!allowedCategory.includes(category))
//       return res.status(400).json({ error: "Invalid category" });

//     if (!allowedProjectCategory.includes(projectcategory))
//       return res.status(400).json({ error: "Invalid projectcategory" });

//     let typeDoc = await ProjectType.findOne({ category, projectcategory });
//     if (!typeDoc) {
//       typeDoc = new ProjectType({ category, projectcategory, cities: [] });
//     }

//     const interestedUnits = []; // 🔍 Track units requiring notification

//     const allowedStatuses = [
//       "Vacant",
//       "Rental",
//       "Self Occupied",
//       "Interested in calling"
//     ];

//     // --- MERGE ---
//     for (const city of cities) {
//       let existingCity = typeDoc.cities.find(c => c.cityName === city.cityName);
//       if (!existingCity) {
//         typeDoc.cities.push(city);
//         continue;
//       }

//       for (const div of city.divisions || []) {
//         let existingDiv = existingCity.divisions.find(d => d.divisionName === div.divisionName);
//         if (!existingDiv) {
//           existingCity.divisions.push(div);
//           continue;
//         }

//         for (const sec of div.sectors || []) {
//           let existingSec = existingDiv.sectors.find(s => s.sectorName === sec.sectorName);
//           if (!existingSec) {
//             existingDiv.sectors.push(sec);
//             continue;
//           }

//           for (const proj of sec.projects || []) {
//             let existingProj = existingSec.projects.find(p => p.projectName === proj.projectName);
//             if (!existingProj) {
//               existingSec.projects.push(proj);
//               continue;
//             }

//             for (const tower of proj.towers || []) {
//               let existingTower = existingProj.towers.find(t => t.towerName === tower.towerName);
//               if (!existingTower) {
//                 existingProj.towers.push(tower);
//                 continue;
//               }

//               for (const unit of tower.units || []) {
//                 let exists = existingTower.units.some(u => u.unitNumber === unit.unitNumber);

//                 // Normalize status
//                 unit.status = allowedStatuses.find(
//                   s => s.toLowerCase() === (unit.status || "").toLowerCase().trim()
//                 ) || "Vacant";

//                 if (!exists) {
//                   // 🚨 Ensure unit gets MongoDB _id
//                   const newUnit = {
//                     ...unit,
//                     _id: new mongoose.Types.ObjectId()
//                   };

//                   existingTower.units.push(newUnit);

//                   if (newUnit.status === "Interested in calling") {
//                     interestedUnits.push({
//                       unitRef: newUnit,
//                       unitNumber: newUnit.unitNumber,
//                       projectName: proj.projectName
//                     });
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     await typeDoc.save();

//     // --- SEND NOTIFICATIONS ---
//     const changedBy = req.user?.name || "System";

//     for (const entry of interestedUnits) {
//       const existingNotif = await Notification.findOne({
//         type: "Inventory",
//         itemId: entry.unitRef._id
//       });

//       if (!existingNotif) {
//         const notif = await Notification.create({
//           type: "Inventory",
//           itemId: entry.unitRef._id,
//           message: `🏢 Unit "${entry.unitNumber}" marked as "Interested in calling" during merge by ${changedBy}`,
//           changedBy
//         });

//         // Real-time emit
//         if (global.io && typeof emitToAdmins === "function") {
//           emitToAdmins(notif.toJSON());
//           console.log("📩 Notification sent:", notif._id);
//         } else {
//           console.log("⚠ Socket not initialized.");
//         }
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Hierarchy merged successfully",
//       notifications: interestedUnits.length,
//       data: typeDoc
//     });

//   } catch (err) {
//     console.error("❌ mergeOrCreateHierarchy error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
 



// exports.mergeOrCreateHierarchy = async (req, res) => {
//   try {
//     const { category, projectcategory, cities = [] } = req.body;

//     if (!category || !projectcategory)
//       return res.status(400).json({ error: "Missing category or projectcategory" });

//     const allowedCategory = ["Residential", "Commercial"];
//     const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

//     if (!allowedCategory.includes(category))
//       return res.status(400).json({ error: "Invalid category" });

//     if (!allowedProjectCategory.includes(projectcategory))
//       return res.status(400).json({ error: "Invalid projectcategory" });

//     let typeDoc = await ProjectType.findOne({ category, projectcategory });
//     if (!typeDoc) {
//       typeDoc = new ProjectType({ category, projectcategory, cities: [] });
//     }

//     const interestedUnits = [];
//     const addedUnitsDetails = []; // 👈 RETURN THIS

//     const allowedStatuses = [
//       "Vacant",
//       "Rental",
//       "Self Occupied",
//       "Interested in calling"
//     ];

//     // ---- MERGE ----
//     for (const city of cities) {
//       let existingCity = typeDoc.cities.find(c => c.cityName === city.cityName);
//       if (!existingCity) {
//         typeDoc.cities.push(city);
//         continue;
//       }

//       for (const div of city.divisions || []) {
//         let existingDiv = existingCity.divisions.find(d => d.divisionName === div.divisionName);
//         if (!existingDiv) {
//           existingCity.divisions.push(div);
//           continue;
//         }

//         for (const sec of div.sectors || []) {
//           let existingSec = existingDiv.sectors.find(s => s.sectorName === sec.sectorName);
//           if (!existingSec) {
//             existingDiv.sectors.push(sec);
//             continue;
//           }

//           for (const proj of sec.projects || []) {
//             let existingProj = existingSec.projects.find(p => p.projectName === proj.projectName);
//             if (!existingProj) {
//               existingSec.projects.push(proj);
//               continue;
//             }

//             for (const tower of proj.towers || []) {
//               let existingTower = existingProj.towers.find(t => t.towerName === tower.towerName);
//               if (!existingTower) {
//                 existingProj.towers.push(tower);
//                 continue;
//               }

//               for (const unit of tower.units || []) {
//                 const exists = existingTower.units.some(u => u.unitNumber === unit.unitNumber);

//                 unit.status = allowedStatuses.find(
//                   s => s.toLowerCase() === (unit.status || "").toLowerCase().trim()
//                 ) || "Vacant";

//                 if (!exists) {
//                   const newUnit = { ...unit, _id: new mongoose.Types.ObjectId() };
//                   existingTower.units.push(newUnit);

//                   // 🧾 Store full readable + ID info
//                   addedUnitsDetails.push({
//                     ids: {
//                       category,
//                       projectcategory,
//                       cityId: existingCity._id,
//                       divisionId: existingDiv._id,
//                       sectorId: existingSec._id,
//                       projectId: existingProj._id,
//                       towerId: existingTower._id,
//                       unitId: newUnit._id
//                     },
//                     readable: {
//                       cityName: existingCity.cityName,
//                       divisionName: existingDiv.divisionName,
//                       sectorName: existingSec.sectorName,
//                       projectName: existingProj.projectName,
//                       towerName: existingTower.towerName,
//                       unitNumber: newUnit.unitNumber,
//                       status: newUnit.status
//                     },
//                     notification: newUnit.status === "Interested in calling"
//                   });

//                   if (newUnit.status === "Interested in calling") {
//                     interestedUnits.push({
//                       unitRef: newUnit,
//                       unitNumber: newUnit.unitNumber,
//                       projectName: existingProj.projectName
//                     });
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     await typeDoc.save();

//     // ---- SEND NOTIFICATIONS ----
//     const changedBy = req.user?.name || "System";

//     for (const entry of interestedUnits) {
//       const existsNotif = await Notification.findOne({
//         type: "Inventory",
//         itemId: entry.unitRef._id
//       });

//       if (!existsNotif) {
//         const notif = await Notification.create({
//           type: "Inventory",
//           itemId: entry.unitRef._id,
//           message: `🏢 Unit "${entry.unitNumber}" marked as "Interested in calling" during merge by ${changedBy}`,
//           changedBy
//         });

//         if (global.io && typeof emitToAdmins === "function") {
//           emitToAdmins(notif.toJSON());
//         }
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Hierarchy merged successfully",
//       totalAdded: addedUnitsDetails.length,
//       notificationsTriggered: interestedUnits.length,
//       mergedDetails: addedUnitsDetails, // 👈 MAIN OUTPUT
//       data: typeDoc
//     });

//   } catch (err) {
//     console.error("❌ mergeOrCreateHierarchy error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


exports.mergeOrCreateHierarchy = async (req, res) => {
  try {
    const { category, projectcategory, cities = [] } = req.body;

    if (!category || !projectcategory)
      return res.status(400).json({ error: "Missing category or projectcategory" });

    const allowedCategory = ["Residential", "Commercial"];
    const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

    if (!allowedCategory.includes(category))
      return res.status(400).json({ error: "Invalid category" });

    if (!allowedProjectCategory.includes(projectcategory))
      return res.status(400).json({ error: "Invalid projectcategory" });

    let typeDoc = await ProjectType.findOne({ category, projectcategory });
    if (!typeDoc) {
      typeDoc = new ProjectType({ category, projectcategory, cities: [] });
    }

    const interestedUnits = [];
    const addedUnitsDetails = [];

    const allowedStatuses = [
      "Vacant",
      "Rental",
      "Self Occupied",
      "Interested in calling"
    ];

    // ---- MERGE ----
    for (const city of cities) {
      let existingCity = typeDoc.cities.find(c => c.cityName === city.cityName);
      if (!existingCity) {
        typeDoc.cities.push(city);
        continue;
      }

      for (const div of city.divisions || []) {
        let existingDiv = existingCity.divisions.find(d => d.divisionName === div.divisionName);
        if (!existingDiv) {
          existingCity.divisions.push(div);
          continue;
        }

        for (const sec of div.sectors || []) {
          let existingSec = existingDiv.sectors.find(s => s.sectorName === sec.sectorName);
          if (!existingSec) {
            existingDiv.sectors.push(sec);
            continue;
          }

          for (const proj of sec.projects || []) {
            let existingProj = existingSec.projects.find(p => p.projectName === proj.projectName);
            if (!existingProj) {
              existingSec.projects.push(proj);
              continue;
            }

            for (const tower of proj.towers || []) {
              let existingTower = existingProj.towers.find(t => t.towerName === tower.towerName);
              if (!existingTower) {
                existingProj.towers.push(tower);
                continue;
              }

              for (const unit of tower.units || []) {
                const exists = existingTower.units.some(u => u.unitNumber === unit.unitNumber);

                unit.status = allowedStatuses.find(
                  s => s.toLowerCase() === (unit.status || "").toLowerCase().trim()
                ) || "Vacant";

                if (!exists) {
                  const newUnit = { ...unit, _id: new mongoose.Types.ObjectId() };
                  existingTower.units.push(newUnit);

                  addedUnitsDetails.push({
                    ids: {
                      category,
                      projectcategory,
                      cityId: existingCity._id,
                      divisionId: existingDiv._id,
                      sectorId: existingSec._id,
                      projectId: existingProj._id,
                      towerId: existingTower._id,
                      unitId: newUnit._id
                    },
                    readable: {
                      cityName: existingCity.cityName,
                      divisionName: existingDiv.divisionName,
                      sectorName: existingSec.sectorName,
                      projectName: existingProj.projectName,
                      towerName: existingTower.towerName,
                      unitNumber: newUnit.unitNumber,
                      status: newUnit.status
                    },
                    notification: newUnit.status === "Interested in calling"
                  });
                }
              }
            }
          }
        }
      }
    }

    await typeDoc.save();

    // ---- SEND NOTIFICATIONS (UPDATED) ----
    const changedBy = req.user?.name || "System";

    for (const entry of addedUnitsDetails.filter(u => u.notification)) {

      const existsNotif = await Notification.findOne({
        type: "Inventory",
        itemId: entry.ids.unitId
      });

      if (!existsNotif) {
        const notif = await Notification.create({
          type: "Inventory",
          itemId: entry.ids.unitId,
          message: `🏢 Unit "${entry.readable.unitNumber}" marked as "Interested in calling" during merge by ${changedBy}`,
          changedBy,

          // 👇 Meta inserted
          meta: {
            ...entry.ids,
            ...entry.readable
          }
        });

        if (global.io && typeof emitToAdmins === "function") {
          emitToAdmins(notif.toJSON());
        }
      }
    }

    return res.json({
      success: true,
      message: "Hierarchy merged successfully",
      totalAdded: addedUnitsDetails.length,
      notificationsTriggered: addedUnitsDetails.filter(u => u.notification).length,
      mergedDetails: addedUnitsDetails,
      data: typeDoc
    });

  } catch (err) {
    console.error("❌ mergeOrCreateHierarchy error:", err);
    res.status(500).json({ error: err.message });
  }
};



 







