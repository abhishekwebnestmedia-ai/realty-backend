// const mongoose = require("mongoose");

// const unitSchema = new mongoose.Schema({
//   unitNumber: { type: String, required: true },
//   ownerName: String,
//   mobileNumbers: [String],
//   email: String,
//   followUpDate: Date,
//   status: { 
//     type: String, 
//     enum: ["Vacant", "Rental", "Self Occupied", "Interested in calling"], 
//     default: "Vacant" 
//   },
//   remarks: String,
// });

// const towerSchema = new mongoose.Schema({
//   towerName: { type: String, required: true },
//   units: [unitSchema],
// });

// const projectSchema = new mongoose.Schema({
//   projectName: { type: String, required: true },
//   projectType: { 
//     type: String, 
//     enum: ["Residential", "Commercial", "UnderConstruction", "ReadyToMove"], 
//     required: true 
//   },
//   towers: [towerSchema],
// });

// const sectorSchema = new mongoose.Schema({
//   sectorName: { type: String, required: true },
//   projects: [projectSchema],
// });

// const divisionSchema = new mongoose.Schema({
//   divisionName: { type: String, required: true },
//   sectors: [sectorSchema],
// });

// const citySchema = new mongoose.Schema({
//   cityName: { type: String, required: true },
//   divisions: [divisionSchema],
// });

// module.exports = mongoose.model("City", citySchema);


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

// --- PROJECT TYPE (ROOT) ---
const projectTypeSchema = new mongoose.Schema({
  projectType: { 
    type: String,
    enum: ["Residential", "Commercial", "UnderConstruction", "ReadyToMove"], 
    required: true,
    unique: true  // 👈 ensures one document per type
  },
  cities: [citySchema],
});

module.exports = mongoose.model("ProjectType", projectTypeSchema);
