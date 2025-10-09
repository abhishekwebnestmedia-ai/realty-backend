const mongoose = require('mongoose');
const User = require('./models/user'); // Ensure correct case: 'User.js', not 'user.js'

(async () => {
  try {
    // 🔗 Connect to your MongoDB
    await mongoose.connect('mongodb://admin:StrongPassword123@localhost:27017/realtyexpo?authSource=admin');
    console.log('✅ Connected to MongoDB');

    // ✉️ Replace with your actual email
    const email = 'your@email.com';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found with that email.');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅ User promoted to admin: ${user.email}`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error promoting user to admin:', err);
    process.exit(1);
  }
})();
