// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//    role: { 
//     type: String, 
//     enum: ['admin' ,'sales', 'user'], 
//     default: 'user',                  
//     required: true
//   },
//    phoneNumber: { type: String },  
//     profileImage: { type: String },  
//   designation: { type: String },   
// address: { type: String },
// empid: { type: String, unique: true },
//   registeredAt: { type: Date, default: Date.now },
//     firstLoginAt: { type: Date },
//     firstLogoutAt: { type: Date },
//   lastLoginAt: { type: Date },
//   lastLogoutAt: { type: Date },
//   isLoggedIn: { type: Boolean, default: false },
// passwordResetToken: { type: String },
//   passwordResetExpires: { type: Date },
//  permissions: {
//   // Core / Access Control
//   superAdmin: { type: Boolean, default: false },

//   // Main Menu Access
//   dashboard: { type: Boolean, default: false },
//   dailyPlans: { type: Boolean, default: false },
//   allLeads: { type: Boolean, default: false },
//   inventory: { type: Boolean, default: false },
//   projectsWorking: { type: Boolean, default: false },
//   brokersRequirements: { type: Boolean, default: false },
//   myTeam: { type: Boolean, default: false },
//   findOpportunity: { type: Boolean, default: false },
//   learnGrow: { type: Boolean, default: false },
//   dataBase: { type: Boolean, default: false },

//   // Leads Section (Sub Permissions)
//   rentalLeads: { type: Boolean, default: false },
//   buyerLeads: { type: Boolean, default: false },
//   deadLeads: { type: Boolean, default: false },
//   completedLeads: { type: Boolean, default: false },

//   // Inventory Section (Sub Permissions)
//   rentalInventory: { type: Boolean, default: false },
//   saleInventory: { type: Boolean, default: false },
//   completedInventory: { type: Boolean, default: false }
// }

  
// }, {

//   timestamps: true,
// });

// module.exports = mongoose.model('User', userSchema);




const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['admin', 'sales', 'user'],
      default: 'user',
      required: true,
    },

    phoneNumber: { type: String },
    profileImage: { type: String },
    designation: { type: String },
    address: { type: String },
    empid: { type: String, unique: true },

    registeredAt: { type: Date, default: Date.now },
    firstLoginAt: { type: Date },
    firstLogoutAt: { type: Date },
    lastLoginAt: { type: Date },
    lastLogoutAt: { type: Date },
    isLoggedIn: { type: Boolean, default: false },

    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    permissions: {
      // Core / Access Control
      superAdmin: { type: Boolean, default: false },

      // Main Menu Access
      dashboard: { type: Boolean, default: false },
      dailyPlans: { type: Boolean, default: false },
      allLeads: { type: Boolean, default: false },
      inventory: { type: Boolean, default: false },
      projectsWorking: { type: Boolean, default: false },
      brokersRequirements: { type: Boolean, default: false },
      myTeam: { type: Boolean, default: false },
      findOpportunity: { type: Boolean, default: false },
      learnGrow: { type: Boolean, default: false },
      dataBase: { type: Boolean, default: false },

      // Leads Section
      rentalLeads: { type: Boolean, default: false },
      buyerLeads: { type: Boolean, default: false },
      deadLeads: { type: Boolean, default: false },
      completedLeads: { type: Boolean, default: false },

      // Inventory Section
      rentalInventory: { type: Boolean, default: false },
      saleInventory: { type: Boolean, default: false },
      completedInventory: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

//
// ✅ Helper: Converts strings to Proper Title Case
//
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/) // handle multiple spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

//
// ✅ Recursive Formatter
// Converts all string fields to Title Case except email (lowercase)
//
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;

  // Avoid infinite recursion on circular objects
  if (seen.has(obj)) return;
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (key.startsWith('_')) continue; // skip Mongoose internals

    const value = obj[key];

    // 🔹 Handle string fields
    if (typeof value === 'string' && value.trim()) {
      if (key === 'email') {
        obj[key] = value.toLowerCase().trim();
      } else {
        obj[key] = toTitleCase(value);
      }
      continue;
    }

    // 🔹 Handle arrays
    if (Array.isArray(value)) {
      obj[key] = value.map(v =>
        typeof v === 'string' ? toTitleCase(v) : v
      );
      continue;
    }

    // 🔹 Handle nested objects recursively
    if (value && typeof value === 'object') {
      formatStringFields(value, seen);
    }
  }
}

//
// 🟢 Hooks: Auto-format before saving/updating/inserting
//
userSchema.pre('save', function (next) {
  formatStringFields(this);
  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
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

userSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => formatStringFields(doc));
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
