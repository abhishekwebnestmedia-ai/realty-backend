const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
   role: { 
    type: String, 
    enum: ['admin' ,'sales', 'user'], 
    default: 'user',                  
    required: true
  },
  registeredAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  lastLogoutAt: { type: Date },
  isLoggedIn: { type: Boolean, default: false }

  
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
