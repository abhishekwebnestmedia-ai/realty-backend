const mongoose = require('mongoose');
const User = require('./models/user');

(async () => {
  try {
    await mongoose.connect('mongodb://admin:StrongPassword123@localhost:27017/realtyexpo?authSource=admin');
    console.log('✅ Connected to MongoDB');

    const userId = '68e64108ccfbe146fe1b5ba6'; // Abhishek Singh's ID
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found');
      process.exit();
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅ User promoted to admin: ${user.name} (${user.email})`);
    process.exit();
  } catch (err) {
    console.error('❌ Error promoting user to admin:', err);
    process.exit(1);
  }
})();
