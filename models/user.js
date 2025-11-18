
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
      superAdmin: { type: Boolean, default: false },
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
      rentalLeads: { type: Boolean, default: false },
      buyerLeads: { type: Boolean, default: false },
      deadLeads: { type: Boolean, default: false },
      completedLeads: { type: Boolean, default: false },
      rentalInventory: { type: Boolean, default: false },
      saleInventory: { type: Boolean, default: false },
      completedInventory: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

//
// ✅ Helper: Convert a string to Title Case
//
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

//
// ✅ Helper: Format all relevant string fields
//
function formatUserFields(userObj) {
  if (!userObj) return;

  if (userObj.name) userObj.name = toTitleCase(userObj.name);
  if (userObj.email) userObj.email = userObj.email.toLowerCase().trim();
  if (userObj.designation) userObj.designation = toTitleCase(userObj.designation);
  if (userObj.address) userObj.address = toTitleCase(userObj.address);
  if (userObj.empid) userObj.empid = toTitleCase(userObj.empid);
}

//
// 🟢 Apply formatting before saving
//
userSchema.pre('save', function (next) {
  formatUserFields(this);
  next();
});

//
// 🟢 Apply formatting before updating
//
userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatUserFields(target);
  }
  next();
});

//
// 🟢 Apply formatting before inserting many
//
userSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => formatUserFields(doc));
  }
  next();
});

module.exports = mongoose.model('User', userSchema);

