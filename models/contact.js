
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  area: { type: String },
  message: { type: String }
});

//
// ✅ Helper: Convert string to Title Case (e.g., "noida sector" → "Noida Sector")
//
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/) // split by one or more spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

//
// ✅ Helper: Format all string fields (Title Case except email)
//
function formatStringFields(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;
  if (seen.has(obj)) return; // prevent infinite recursion
  seen.add(obj);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value == null) continue;

    // 🔹 Handle string fields
    if (typeof value === 'string') {
      if (key === 'email') {
        obj[key] = value.toLowerCase().trim(); // email → lowercase
      } else {
        obj[key] = toTitleCase(value); // others → Title Case
      }
      continue;
    }

    // 🔹 Handle arrays (future-proof)
    if (Array.isArray(value)) {
      obj[key] = value.map(v => {
        if (typeof v === 'string') return toTitleCase(v);
        if (typeof v === 'object') formatStringFields(v, seen);
        return v;
      });
      continue;
    }

    // 🔹 Handle nested objects
    if (typeof value === 'object') {
      formatStringFields(value, seen);
    }
  }
}

//
// 🟢 Before saving
//
contactSchema.pre('save', function (next) {
  formatStringFields(this);
  next();
});

//
// 🟢 Before updating
//
contactSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set ? update.$set : update;
    formatStringFields(target);
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
