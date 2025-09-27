const City = require("../models/project");

// ✅ Create City
exports.createCity = async (req, res) => {
  try {
    const city = new City({ cityName: req.body.cityName });
    await city.save();
    res.status(201).json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add Division to City
exports.addDivision = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { divisionName } = req.body;

    const city = await City.findById(cityId);
    city.divisions.push({ divisionName });
    await city.save();

    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add Sector to Division
exports.addSector = async (req, res) => {
  try {
    const { cityId, divisionId } = req.params;
    const { sectorName } = req.body;

    const city = await City.findById(cityId);
    const division = city.divisions.id(divisionId);
    division.sectors.push({ sectorName });
    await city.save();

    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add Project to Sector
exports.addProject = async (req, res) => {
  try {
    const { cityId, divisionId, sectorId } = req.params;
    const { projectName, projectType } = req.body;

    const city = await City.findById(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);

    sector.projects.push({ projectName, projectType });
    await city.save();

    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add Tower to Project
exports.addTower = async (req, res) => {
  try {
    const { cityId, divisionId, sectorId, projectId } = req.params;
    const { towerName } = req.body;

    const city = await City.findById(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);

    project.towers.push({ towerName });
    await city.save();

    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add Unit to Tower
exports.addUnit = async (req, res) => {
  try {
    const { cityId, divisionId, sectorId, projectId, towerId } = req.params;
    const { unitNumber } = req.body;

    const city = await City.findById(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);
    const tower = project.towers.id(towerId);

    tower.units.push({ unitNumber });
    await city.save();

    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Unit Details (form submission)
exports.updateUnit = async (req, res) => {
  try {
    const { cityId, divisionId, sectorId, projectId, towerId, unitId } = req.params;
    const updateData = req.body;

    const city = await City.findById(cityId);
    const division = city.divisions.id(divisionId);
    const sector = division.sectors.id(sectorId);
    const project = sector.projects.id(projectId);
    const tower = project.towers.id(towerId);
    const unit = tower.units.id(unitId);

    Object.assign(unit, updateData); // update fields
    await city.save();

    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
