
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  area: { type: String },
  message: { type: String }
});

module.exports = mongoose.model('Contact', contactSchema);


