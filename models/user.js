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

      // Leads Section (Sub Permissions)
      rentalLeads: { type: Boolean, default: false },
      buyerLeads: { type: Boolean, default: false },
      deadLeads: { type: Boolean, default: false },
      completedLeads: { type: Boolean, default: false },

      // Inventory Section (Sub Permissions)
      rentalInventory: { type: Boolean, default: false },
      saleInventory: { type: Boolean, default: false },
      completedInventory: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// ✅ Helper: Convert to Title Case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ✅ Helper: Format string fields recursively
// ✅ Safe recursive formatter (Title Case + lowercase email)
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;

  // Prevent infinite recursion on circular references
  if (seen.has(obj)) return;
  seen.add(obj);

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    if (key.startsWith('_')) continue; // skip mongoose internals

    const value = obj[key];

    // Handle arrays
    if (Array.isArray(value)) {
      obj[key] = value.map(v => {
        if (typeof v === 'string') return toTitleCase(v);
        if (typeof v === 'object') {
          formatStringFields(v, seen);
        }
        return v;
      });
      continue;
    }

    // Handle strings
    if (typeof value === 'string' && value.trim()) {
      if (key === 'email') {
        obj[key] = value.toLowerCase();
      } else {
        obj[key] = toTitleCase(value);
      }
      continue;
    }

    // Recurse only for plain objects (not mongoose docs)
    if (value && typeof value === 'object' && value.constructor === Object) {
      formatStringFields(value, seen);
    }
  }
}


// 🟢 Before saving a new user
userSchema.pre('save', function (next) {
  formatStringFields(this);
  next();
});

// 🟢 Before updating an existing user
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

module.exports = mongoose.model('User', userSchema);
