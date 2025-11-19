

const mongoose = require("mongoose");

// --- UNIT ---
const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true },
  ownerName: String,
  mobileNumbers: [String],
  email: String,
  followUpDate: Date,
  status: { 
    type: String, 
    enum: ["Vacant", "Rental", "Self Occupied", "Interested in calling"], 
    default: "Vacant" 
  },
  remarks: String,
  isApproved: { type: Boolean, default: false },
  
 
  assignTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
});

// --- TOWER ---
const towerSchema = new mongoose.Schema({
  towerName: { type: String, required: true },
  units: [unitSchema],
});

// --- PROJECT ---
const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  towers: [towerSchema],
});

// --- SECTOR ---
const sectorSchema = new mongoose.Schema({
  sectorName: { type: String, required: true },
  projects: [projectSchema],
});

// --- DIVISION ---
const divisionSchema = new mongoose.Schema({
  divisionName: { type: String, required: true },
  sectors: [sectorSchema],
});

// --- CITY ---
const citySchema = new mongoose.Schema({
  cityName: { type: String, required: true },
  divisions: [divisionSchema],
});



const projectTypeSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["Residential", "Commercial"],
    required: true
  },
  projectcategory: {
    type: String,
    enum: ["UnderConstruction", "ReadyToMove"],
    required: true
  },
  cities: [citySchema]
});

module.exports = mongoose.model("ProjectType", projectTypeSchema);



