
// const mongoose = require('mongoose');

// const contactSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String },
//   area: { type: String },
//   message: { type: String }
// });

// module.exports = mongoose.model('Contact', contactSchema);



const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  area: { type: String },
  message: { type: String }
});

// ✅ Helper: Convert string to Title Case (e.g., "noida sector" → "Noida Sector")
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ✅ Helper: Convert all string fields to Title Case except email
function formatStringFields(obj) {
  for (const key in obj) {
    if (!obj[key]) continue;

    const value = obj[key];

    // Handle arrays (future-proof)
    if (Array.isArray(value)) {
      obj[key] = value.map(v =>
        typeof v === 'string' ? toTitleCase(v) : v
      );
      continue;
    }

    // Handle normal string fields
    if (typeof value === 'string') {
      if (key === 'email') {
        obj[key] = value.toLowerCase(); // email always lowercase
      } else {
        obj[key] = toTitleCase(value); // everything else Title Case
      }
    } 
    // Handle nested objects recursively
    else if (typeof value === 'object') {
      formatStringFields(value);
    }
  }
}

// 🟢 Before saving
contactSchema.pre('save', function (next) {
  formatStringFields(this);
  next();
});

// 🟢 Before updating
contactSchema.pre('findOneAndUpdate', function (next) {
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

module.exports = mongoose.model('Contact', contactSchema);
