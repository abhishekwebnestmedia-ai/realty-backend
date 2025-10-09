const mongoose = require('mongoose');
const express = require('express');
const app = express();
const User = require('./models/user'); // ✅ Make sure "U" is uppercase (matches your model filename)

// ✅ Connect to MongoDB first
mongoose.connect('mongodb://admin:StrongPassword123@localhost:27017/realtyexpo?authSource=admin')
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // 🔹 Temporary: Promote Abhishek Singh to admin (only once)
    try {
      const userId = '68e64108ccfbe146fe1b5ba6';
      const user = await User.findById(userId);

      if (!user) {
        console.log('❌ User not found');
      } else if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`✅ User promoted to admin: ${user.name} (${user.email})`);
      } else {
        console.log('ℹ️ User is already admin.');
      }
    } catch (err) {
      console.error('❌ Error promoting user to admin:', err);
    }

    // 🟩 Start your server normally after promotion
    app.listen(5000, () => {
      console.log('🚀 Server running on port 5000');
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
