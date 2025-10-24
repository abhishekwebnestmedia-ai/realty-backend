

// const mongoose = require("mongoose");

// // --- UNIT ---
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

// // --- TOWER ---
// const towerSchema = new mongoose.Schema({
//   towerName: { type: String, required: true },
//   units: [unitSchema],
// });

// // --- PROJECT ---
// const projectSchema = new mongoose.Schema({
//   projectName: { type: String, required: true },
//   towers: [towerSchema],
// });

// // --- SECTOR ---
// const sectorSchema = new mongoose.Schema({
//   sectorName: { type: String, required: true },
//   projects: [projectSchema],
// });

// // --- DIVISION ---
// const divisionSchema = new mongoose.Schema({
//   divisionName: { type: String, required: true },
//   sectors: [sectorSchema],
// });

// // --- CITY ---
// const citySchema = new mongoose.Schema({
//   cityName: { type: String, required: true },
//   divisions: [divisionSchema],
// });



// const projectTypeSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     enum: ["Residential", "Commercial"],
//     required: true
//   },
//   projectcategory: {
//     type: String,
//     enum: ["UnderConstruction", "ReadyToMove"],
//     required: true
//   },
//   cities: [citySchema]
// });

// module.exports = mongoose.model("ProjectType", projectTypeSchema);

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
    default: "Vacant",
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

// --- PROJECT TYPE ---
const projectTypeSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["Residential", "Commercial"],
    required: true,
  },
  projectcategory: {
    type: String,
    enum: ["UnderConstruction", "ReadyToMove"],
    required: true,
  },
  cities: [citySchema],
});


// ✅ Helper: Convert to Title Case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ✅ Helper: Format string fields recursively
function formatStringFields(obj) {
  for (const key in obj) {
    if (!obj[key]) continue;
    const value = obj[key];

    // Handle arrays (like mobileNumbers, etc.)
    if (Array.isArray(value)) {
      obj[key] = value.map(v =>
        typeof v === "string" ? toTitleCase(v) : v
      );
      continue;
    }

    if (typeof value === "string") {
      if (key === "email") {
        obj[key] = value.toLowerCase(); // email → lowercase
      } else {
        obj[key] = toTitleCase(value); // all others → Title Case
      }
    } else if (typeof value === "object") {
      formatStringFields(value); // recurse for nested
    }
  }
}

// 🟢 Before saving
projectTypeSchema.pre("save", function (next) {
  formatStringFields(this);
  next();
});

// 🟢 Before updating
projectTypeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.$set) {
      formatStringFields(update.$set);
    } else {
      formatStringFields(update);
    }
  }
  next();
});

module.exports = mongoose.model("ProjectType", projectTypeSchema);
