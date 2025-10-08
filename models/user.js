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
  
}, {

  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
