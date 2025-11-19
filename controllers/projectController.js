const ProjectType = require("../models/project"); // projectTypeSchema
// shashakn


const Inventory = require('../models/inventryModel');
const Notification = require('../models/notification');
const { emitNotification, emitToAdmins } = require('../utils/socketEmitter');
const {
  determineInventoryIntent,
  buildHierarchyMeta,
  upsertInventoryFromUnit,
  notifyAdminsForApproval,
  createInventoryNotification,
} = require('../services/unitInventorySync');

const User = require("../models/user");


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

    const cityDoc = updatedDoc.cities.id(cityId);
    const divisionDoc = cityDoc?.divisions.id(divisionId);
    const sectorDoc = divisionDoc?.sectors.id(sectorId);
    const projectDoc = sectorDoc?.projects.id(projectId);
    const towerDoc = projectDoc?.towers.id(towerId);
    const addedUnit = towerDoc?.units.slice(-1)[0];

    if (!cityDoc || !divisionDoc || !sectorDoc || !projectDoc || !towerDoc || !addedUnit) {
      return res.status(404).json({ error: "Unable to resolve unit hierarchy" });
    }

    console.log("📌 Extracted Unit Data From DB:", addedUnit);

    const hierarchyMeta = buildHierarchyMeta({
      category,
      projectcategory,
      city: cityDoc,
      division: divisionDoc,
      sector: sectorDoc,
      project: projectDoc,
      tower: towerDoc,
      unit: addedUnit,
    });

    const intent = determineInventoryIntent(addedUnit.status);
    const actor = req.user
      ? { _id: req.user._id || req.user.userId, name: req.user.name, email: req.user.email }
      : null;

    if (intent.shouldSync) {
      if (req.user?.role === 'admin') {
        const { inventory, isNew } = await upsertInventoryFromUnit({
          unit: addedUnit,
          hierarchy: hierarchyMeta,
          targetType: intent.targetType,
          actor,
        });

        addedUnit.isApproved = true;
        await updatedDoc.save();

        const message = isNew
          ? `Inventory created from unit "${addedUnit.unitNumber}" (${intent.label})`
          : `Inventory for unit "${addedUnit.unitNumber}" updated (${intent.label})`;

        await createInventoryNotification({
          inventory,
          message,
          action: 'inventory_auto_sync',
          meta: { hierarchy: hierarchyMeta },
          changedBy: actor?.name || 'System',
        });
      } else {
        addedUnit.isApproved = false;
        await updatedDoc.save();
        await notifyAdminsForApproval({
          unit: addedUnit,
          hierarchy: hierarchyMeta,
          targetType: intent.targetType,
          requestedBy: actor,
        });
      }
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










// ✅ Step 8 - Update Unit (uses $set)


exports.approveUnit = async (req, res) => {
  try {
    const confirm = req.body.confirm?.toLowerCase();

    if (!confirm) {
      return res.status(400).json({ message: "Please confirm: yes or no" });
    }

    if (confirm === 'no') {
      return res.json({ message: "Approval cancelled. Unit stays in Projects." });
    }

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

    const proj = await ProjectType.findOne({ category, projectcategory });
    if (!proj) return res.status(404).json({ error: "ProjectType not found" });

    const cityDoc = proj.cities.id(cityId);
    const divisionDoc = cityDoc?.divisions.id(divisionId);
    const sectorDoc = divisionDoc?.sectors.id(sectorId);
    const projectDoc = sectorDoc?.projects.id(projectId);
    const towerDoc = projectDoc?.towers.id(towerId);
    const unitDoc = towerDoc?.units.id(unitId);

    if (!cityDoc || !divisionDoc || !sectorDoc || !projectDoc || !towerDoc || !unitDoc) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const hierarchyMeta = buildHierarchyMeta({
      category,
      projectcategory,
      city: cityDoc,
      division: divisionDoc,
      sector: sectorDoc,
      project: projectDoc,
      tower: towerDoc,
      unit: unitDoc,
    });

    if (unitDoc.isApproved) {
      const existing = await Inventory.findOne({ unitId: hierarchyMeta.unitId });
      return res.json({
        success: true,
        alreadyApproved: true,
        message: "Unit already approved & synced to inventory",
        inventoryId: existing?._id || null,
      });
    }

    const intent = determineInventoryIntent(unitDoc.status);
    if (!intent.shouldSync) {
      return res.status(400).json({ error: "Unit status is not eligible for inventory sync" });
    }

    unitDoc.isApproved = true;
    await proj.save();

    const actor = req.user
      ? { _id: req.user._id || req.user.userId, name: req.user.name, email: req.user.email }
      : null;

    const { inventory, isNew } = await upsertInventoryFromUnit({
      unit: unitDoc,
      hierarchy: hierarchyMeta,
      targetType: intent.targetType,
      actor,
    });

    const message = isNew
      ? `Unit ${unitDoc.unitNumber} approved and moved to inventory (${intent.label}).`
      : `Unit ${unitDoc.unitNumber} inventory refreshed (${intent.label}).`;

    await createInventoryNotification({
      inventory,
      message,
      action: 'inventory_approval_result',
      meta: { hierarchy: hierarchyMeta },
      changedBy: req.user?.name || 'Admin',
    });

    let requesterNotified = false;
    const { notificationId } = req.body;
    if (notificationId) {
      try {
        const approvalNotif = await Notification.findById(notificationId);
        if (approvalNotif) {
          approvalNotif.read = true;
          approvalNotif.meta = {
            ...(approvalNotif.meta || {}),
            resolvedAt: new Date().toISOString(),
            resolvedBy: req.user?.name || 'Admin',
            inventoryId: inventory?._id,
          };
          await approvalNotif.save();

          const requester = approvalNotif.meta?.requestedBy;
          if (requester?.id && mongoose.Types.ObjectId.isValid(String(requester.id))) {
            const receipt = await Notification.create({
              type: 'Inventory',
              itemId: inventory._id,
              message: `Your unit "${unitDoc.unitNumber}" request (${intent.label}) was approved by ${req.user?.name || 'Admin'}.`,
              action: 'inventory_approval_result',
              changedBy: req.user?.name || 'Admin',
              receiver: requester.id,
              meta: { hierarchy: hierarchyMeta, inventoryId: inventory._id },
            });
            await emitNotification(requester.id.toString(), receipt.toJSON(), { emitToAdmin: true });
            requesterNotified = true;
          }
        }
      } catch (err) {
        console.warn('Failed to finalize approval notification:', err.message);
      }
    }

    return res.json({
      success: true,
      message,
      inventory,
      requesterNotified,
    });

  } catch (err) {
    console.error("approveUnit error:", err);
    res.status(500).json({ error: err.message });
  }
};



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

    const updates = { ...req.body };

    const proj = await ProjectType.findOne({ category, projectcategory });
    if (!proj) return res.status(404).json({ error: "Project structure not found" });

    const cityDoc = proj.cities.id(cityId);
    const divisionDoc = cityDoc?.divisions.id(divisionId);
    const sectorDoc = divisionDoc?.sectors.id(sectorId);
    const projectDoc = sectorDoc?.projects.id(projectId);
    const towerDoc = projectDoc?.towers.id(towerId);
    const unitDoc = towerDoc?.units.id(unitId);

    if (!cityDoc || !divisionDoc || !sectorDoc || !projectDoc || !towerDoc || !unitDoc) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const beforeUpdate = unitDoc.toObject();

    // Normalize status if provided
    if (updates.status) {
      const allowedStatuses = ["Vacant", "Rental", "Self Occupied", "Interested in calling"];
      updates.status = allowedStatuses.find(
        (s) => s.toLowerCase() === String(updates.status).toLowerCase().trim()
      ) || unitDoc.status;
    }

    // Resolve assignTo if provided
    if (Object.prototype.hasOwnProperty.call(updates, 'assignTo')) {
      if (!updates.assignTo) {
        unitDoc.assignTo = null;
      } else {
        const resolved = await resolveAssign(updates.assignTo);
        if (!resolved) {
          return res.status(400).json({ error: "assignTo user not found" });
        }
        unitDoc.assignTo = resolved;
      }
    }

    const mutableFields = [
      'unitNumber',
      'ownerName',
      'email',
      'status',
      'remarks',
      'followUpDate',
      'mobileNumbers',
    ];

    mutableFields.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) return;
      if (field === 'mobileNumbers') {
        unitDoc.mobileNumbers = Array.isArray(updates.mobileNumbers)
          ? updates.mobileNumbers
          : [];
      } else {
        unitDoc[field] = updates[field];
      }
    });

    await proj.save();

    const hierarchyMeta = buildHierarchyMeta({
      category,
      projectcategory,
      city: cityDoc,
      division: divisionDoc,
      sector: sectorDoc,
      project: projectDoc,
      tower: towerDoc,
      unit: unitDoc,
    });

    const intent = determineInventoryIntent(unitDoc.status);
    const actor = req.user
      ? { _id: req.user._id || req.user.userId, name: req.user.name, email: req.user.email }
      : null;

    if (intent.shouldSync) {
      if (req.user?.role === 'admin') {
        const { inventory, isNew } = await upsertInventoryFromUnit({
          unit: unitDoc,
          hierarchy: hierarchyMeta,
          targetType: intent.targetType,
          actor,
        });
        unitDoc.isApproved = true;
        await proj.save();

        await createInventoryNotification({
          inventory,
          message: isNew
            ? `Inventory created from unit "${unitDoc.unitNumber}" (${intent.label}).`
            : `Inventory for unit "${unitDoc.unitNumber}" updated (${intent.label}).`,
          action: 'inventory_auto_sync',
          meta: { hierarchy: hierarchyMeta },
          changedBy: actor?.name || 'System',
        });
      } else {
        unitDoc.isApproved = false;
        await proj.save();
        await notifyAdminsForApproval({
          unit: unitDoc,
          hierarchy: hierarchyMeta,
          targetType: intent.targetType,
          requestedBy: actor,
        });
      }
    }

    const statusChanged = beforeUpdate.status !== unitDoc.status;

    res.json({
      success: true,
      message: statusChanged
        ? `Unit status updated to ${unitDoc.status}`
        : 'Unit updated successfully',
      unit: unitDoc,
    });

  } catch (error) {
    console.error("Update Unit Error:", error);
    res.status(500).json({ error: error.message });
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
    const { unitId } = req.params;

    const typeDoc = await ProjectType.findOne({ 
      "cities.divisions.sectors.projects.towers.units._id": unitId 
    });

    if (!typeDoc) return res.status(404).json({ error: "Unit not found" });

    for (const city of typeDoc.cities) {
      for (const division of city.divisions) {
        for (const sector of division.sectors) {
          for (const project of sector.projects) {
            for (const tower of project.towers) {
              const unit = tower.units.id(unitId);
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


 




// Helper to remove all _id & __v
function removeIds(obj) {
  if (Array.isArray(obj)) return obj.map(removeIds);
  if (obj && typeof obj === "object") {
    const cleaned = {};
    for (const key in obj) {
      if (key !== "_id" && key !== "__v") {
        cleaned[key] = removeIds(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

// Resolve assignTo user (name, email or id)
async function resolveAssign(assignToValue) {
  if (!assignToValue) return null;

  // If ObjectId check
  if (mongoose.Types.ObjectId.isValid(assignToValue)) {
    const user = await User.findById(assignToValue);
    if (user) return user._id;
  }

  // Search by name or email
  const user = await User.findOne({
    $or: [{ name: assignToValue }, { email: assignToValue }]
  });

  return user ? user._id : null;
}

exports.bulkUploadProjectTypes = async (req, res) => {
  try {
    const docs = req.body;
    if (!Array.isArray(docs)) {
      return res.status(400).json({ success: false, message: "Expected an array" });
    }

    const allowedCategory = ["Residential", "Commercial"];
    const allowedProjectCategory = ["UnderConstruction", "ReadyToMove"];

    const finalDocs = [];

    for (const doc of docs) {
      const { category, projectcategory } = doc;

      if (!allowedCategory.includes(category))
        return res.status(400).json({ success: false, message: `Invalid category: ${category}` });

      if (!allowedProjectCategory.includes(projectcategory))
        return res.status(400).json({ success: false, message: `Invalid projectcategory: ${projectcategory}` });

      // Clean _id values
      const cleanedDoc = removeIds(doc);

      // Resolve assignTo in deeply nested structure
      for (const city of cleanedDoc.cities || []) {
        for (const division of city.divisions || []) {
          for (const sector of division.sectors || []) {
            for (const project of sector.projects || []) {
              for (const tower of project.towers || []) {
                for (const unit of tower.units || []) {
                  if (unit.assignTo) {
                    const resolvedUserId = await resolveAssign(unit.assignTo);
                    if (!resolvedUserId) {
                      return res.status(400).json({
                        success: false,
                        message: `assignTo user not found: ${unit.assignTo}`
                      });
                    }
                    unit.assignTo = resolvedUserId;
                  }
                }
              }
            }
          }
        }
      }

      finalDocs.push(cleanedDoc);
    }

    const inserted = await ProjectType.insertMany(finalDocs, { ordered: false });

    res.status(201).json({
      success: true,
      message: "Bulk upload successful",
      insertedCount: inserted.length
    });

  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Helper to remove all _id and __v recursively













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

//     const addedUnitsDetails = [];

//     const allowedStatuses = [
//       "Vacant",
//       "Rental",
//       "Self Occupied",
//       "Interested in calling"
//     ];

//     // ----------- MERGE STARTS HERE -----------
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

//                 // normalize status
//                 unit.status =
//                   allowedStatuses.find(
//                     s => s.toLowerCase() === (unit.status || "").toLowerCase().trim()
//                   ) || "Vacant";

//                 const existingUnit = existingTower.units.find(
//                   u => u.unitNumber === unit.unitNumber
//                 );

//                 // ------ IF UNIT ALREADY EXISTS ------
//                 if (existingUnit) {
//                   // only update assignTo if original is empty
//                   if (!existingUnit.assignTo && unit.assignTo) {
//                     existingUnit.assignTo = unit.assignTo;
//                   }
//                   continue;
//                 }

//                 // ------ NEW UNIT ------
//                 const newUnit = {
//                   ...unit,
//                   assignTo: unit.assignTo || null,
//                   _id: new mongoose.Types.ObjectId()
//                 };

//                 existingTower.units.push(newUnit);

//                 // ---- Create Inventory Automatically ----
//                 const createdInventory = await Inventory.create({
//                   sellerName: newUnit.ownerName || "AutoImported",
//                   Project: [existingProj.projectName],
//                   contactNumbers: newUnit.mobileNumbers || [],

//                   category,
//                   projectcategory,
//                   cityId: existingCity._id,
//                   divisionId: existingDiv._id,
//                   sectorId: existingSec._id,
//                   projectId: existingProj._id,
//                   towerId: existingTower._id,
//                   unitId: newUnit._id,
//                   unitNumber: newUnit.unitNumber,
//                   status: newUnit.status,
//                   createdBy: req.user?._id || null,
//                   assignTo: newUnit.assignTo || null, // FINAL VALUE

//                   meta: {
//                     cityName: existingCity.cityName,
//                     divisionName: existingDiv.divisionName,
//                     sectorName: existingSec.sectorName,
//                     projectName: existingProj.projectName,
//                     towerName: existingTower.towerName
//                   }
//                 });

//                 addedUnitsDetails.push({
//                   ...createdInventory.toJSON(),
//                   unitNumber: newUnit.unitNumber,
//                   notification: newUnit.status === "Interested in calling"
//                 });
//               }
//             }
//           }
//         }
//       }
//     }

//     await typeDoc.save();

//     // ----------- NOTIFICATIONS -----------
//     const changedBy = req.user?.name || "System";
//     const isRequesterAdmin = req.user?.role === "admin";
//     let createdNotifCount = 0;

//     for (const entry of addedUnitsDetails.filter(u => u.notification)) {

//       if (isRequesterAdmin) {
//         await Inventory.findByIdAndUpdate(entry._id, {
//           capturedBy: req.user?.name || "Admin",
//           inventoryType: "Sales",
//           approvedAt: new Date(),
//           approvedBy: req.user?._id || null
//         });
//         continue;
//       }

//       const existsNotif = await Notification.findOne({
//         type: "Inventory",
//         itemId: entry._id
//       });

//       if (!existsNotif) {
//         const notif = await Notification.create({
//           type: "Inventory",
//           itemId: entry._id,
//           message: `🏢 Unit "${entry.unitNumber}" marked as "Interested in calling" during merge by ${changedBy}`,
//           changedBy,
//           receiver: null,
//           meta: {
//             ...entry.meta,
//             assignedTo: entry.assignTo || null,
//             fullHierarchyPath: `${entry.meta.cityName} > ${entry.meta.divisionName} > ${entry.meta.sectorName} > ${entry.meta.projectName} > ${entry.meta.towerName} > ${entry.unitNumber}`
//           }
//         });

//         if (global.io && typeof emitToAdmins === "function") {
//           emitToAdmins(notif.toJSON());
//         }

//         createdNotifCount++;
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Hierarchy merged successfully",
//       totalAdded: addedUnitsDetails.length,
//       notificationsTriggered: createdNotifCount,
//       inventoryCreated: addedUnitsDetails,
//       data: typeDoc
//     });

//   } catch (err) {
//     console.error("❌ mergeOrCreateHierarchy error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


async function resolveAssignTo(assignTo) {
  if (!assignTo) return null;

  // If it's already a valid ObjectId → check user
  if (mongoose.Types.ObjectId.isValid(assignTo)) {
    const user = await User.findById(assignTo);
    if (user) return user;
  }

  // Search by name or email
  return await User.findOne({
    $or: [{ name: assignTo }, { email: assignTo }]
  });
}


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

    const addedUnitsDetails = [];

    const allowedStatuses = [
      "Vacant",
      "Rental",
      "Self Occupied",
      "Interested in calling"
    ];

    // ----------- MERGE STARTS HERE -----------
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

                // normalize status
                unit.status =
                  allowedStatuses.find(
                    s => s.toLowerCase() === (unit.status || "").toLowerCase().trim()
                  ) || "Vacant";

                const existingUnit = existingTower.units.find(
                  u => u.unitNumber === unit.unitNumber
                );

                // -------- Resolve assignTo (name/email/id allowed) --------
                let resolvedUser = null;
                if (unit.assignTo) {
                  resolvedUser = await resolveAssignTo(unit.assignTo);
                }

                // ------ IF UNIT ALREADY EXISTS ------
                if (existingUnit) {
                  if (!existingUnit.assignTo && resolvedUser) {
                    existingUnit.assignTo = resolvedUser._id;
                  }
                  continue;
                }

                // ------ NEW UNIT ------
                const newUnit = {
                  ...unit,
                  assignTo: resolvedUser ? resolvedUser._id : null,
                  _id: new mongoose.Types.ObjectId()
                };

                existingTower.units.push(newUnit);

                // ---- Create Inventory Automatically ----
                const createdInventory = await Inventory.create({
                  sellerName: newUnit.ownerName || "AutoImported",
                  Project: [existingProj.projectName],
                  contactNumbers: newUnit.mobileNumbers || [],

                  category,
                  projectcategory,
                  cityId: existingCity._id,
                  divisionId: existingDiv._id,
                  sectorId: existingSec._id,
                  projectId: existingProj._id,
                  towerId: existingTower._id,
                  unitId: newUnit._id,
                  unitNumber: newUnit.unitNumber,
                  status: newUnit.status,
                  createdBy: req.user?._id || null,
                  assignTo: resolvedUser ? resolvedUser._id : null,

                  meta: {
                    cityName: existingCity.cityName,
                    divisionName: existingDiv.divisionName,
                    sectorName: existingSec.sectorName,
                    projectName: existingProj.projectName,
                    towerName: existingTower.towerName
                  }
                });

                addedUnitsDetails.push({
                  ...createdInventory.toJSON(),
                  unitNumber: newUnit.unitNumber,
                  notification: newUnit.status === "Interested in calling"
                });
              }
            }
          }
        }
      }
    }

    await typeDoc.save();

    // ----------- NOTIFICATIONS -----------
    const changedBy = req.user?.name || "System";
    const isRequesterAdmin = req.user?.role === "admin";
    let createdNotifCount = 0;

    for (const entry of addedUnitsDetails.filter(u => u.notification)) {

      if (isRequesterAdmin) {
        await Inventory.findByIdAndUpdate(entry._id, {
          capturedBy: req.user?.name || "Admin",
          inventoryType: "Sales",
          approvedAt: new Date(),
          approvedBy: req.user?._id || null
        });
        // continue;
      }

      const existsNotif = await Notification.findOne({
        type: "Inventory",
        itemId: entry._id
      });

      if (!existsNotif) {
        const notif = await Notification.create({
          type: "Inventory",
          itemId: entry._id,
          message: `🏢 Unit "${entry.unitNumber}" marked as "Interested in calling" during merge by ${changedBy}`,
          changedBy,
          receiver: null,
          meta: {
            ...entry.meta,
            assignedTo: entry.assignTo || null,
            fullHierarchyPath: `${entry.meta.cityName} > ${entry.meta.divisionName} > ${entry.meta.sectorName} > ${entry.meta.projectName} > ${entry.meta.towerName} > ${entry.unitNumber}`
          }
        });

        if (global.io && typeof emitToAdmins === "function") {
          emitToAdmins(notif.toJSON());
        }

        createdNotifCount++;
      }
    }

    return res.json({
      success: true,
      message: "Hierarchy merged successfully",
      totalAdded: addedUnitsDetails.length,
      notificationsTriggered: createdNotifCount,
      inventoryCreated: addedUnitsDetails,
      data: typeDoc
    });

  } catch (err) {
    console.error("❌ mergeOrCreateHierarchy error:", err);
    res.status(500).json({ error: err.message });
  }
};







