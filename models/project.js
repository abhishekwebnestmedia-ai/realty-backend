

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
//     enum: ["Vacant", "Rental", "Self Occupied", "Interested In Calling"],
//     default: "Vacant",
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

// // --- PROJECT TYPE ---
// const projectTypeSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     enum: ["Residential", "Commercial"],
//     required: true,
//   },
//   projectcategory: {
//     type: String,
//     enum: ["UnderConstruction", "ReadyToMove"],
//     required: true,
//   },
//   cities: [citySchema],
// });

// //
// // ✅ Helper: Convert a string to Title Case
// //
// function toTitleCase(str) {
//   if (!str || typeof str !== "string") return str;
//   return str
//     .trim()
//     .toLowerCase()
//     .split(/\s+/)
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(" ");
// }

// //
// // ✅ Recursive Helper: Format all string fields (Title Case except emails)
// //
// function formatStringFields(obj, seen = new WeakSet()) {
//   if (!obj || typeof obj !== "object") return;
//   if (seen.has(obj)) return; // Prevent circular reference
//   seen.add(obj);

//   for (const key in obj) {
//     if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

//     const value = obj[key];
//     if (value == null) continue;

//     // 🔹 Strings
//     if (typeof value === "string") {
//       if (key === "email") {
//         obj[key] = value.toLowerCase().trim();
//       } else {
//         obj[key] = toTitleCase(value);
//       }
//       continue;
//     }

//     // 🔹 Arrays
//     if (Array.isArray(value)) {
//       obj[key] = value.map(v => {
//         if (typeof v === "string") return toTitleCase(v);
//         if (typeof v === "object") {
//           formatStringFields(v, seen);
//         }
//         return v;
//       });
//       continue;
//     }

//     // 🔹 Nested Objects
//     if (typeof value === "object") {
//       formatStringFields(value, seen);
//     }
//   }
// }

// //
// // 🟢 Apply auto-formatting before saving
// //
// projectTypeSchema.pre("save", function (next) {
//   formatStringFields(this);
//   next();
// });

// //
// // 🟢 Apply auto-formatting before updating
// //
// projectTypeSchema.pre("findOneAndUpdate", function (next) {
//   const update = this.getUpdate();
//   if (update) {
//     const target = update.$set ? update.$set : update;
//     formatStringFields(target);
//   }
//   next();
// });

// module.exports = mongoose.model("ProjectType", projectTypeSchema);
