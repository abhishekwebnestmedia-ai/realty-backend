const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const nodemailer = require('nodemailer');


exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

 
    let missingFields = [];
    if (!name) missingFields.push('Name is missing');
    if (!email) missingFields.push('Email is missing');
    if (!password) missingFields.push('Password is missing');

    if (missingFields.length > 0) {
      return res.status(400).json({ message: missingFields.join(', ') });
    }

    if (name.length < 3) {
      return res.status(400).json({ message: 'Name must be at least 3 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Save user ---
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.login = async (req, res) => {
//   try {
   
//     const { email, password } = req.body;

//     // --- Field-specific validation ---
//     let missingFields = [];
//     if (!email) missingFields.push('Email is missing');
//     if (!password) missingFields.push('Password is missing');

//     if (missingFields.length > 0) {
//       return res.status(400).json({ message: missingFields.join(', ') });
//     }

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     user.lastLoginAt = new Date();
//     await user.save();

//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({ token, message: 'Login successful' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Field-specific validation ---
    let missingFields = [];
    if (!email) missingFields.push('Email is missing');
    if (!password) missingFields.push('Password is missing');

    if (missingFields.length > 0) {
      return res.status(400).json({ message: missingFields.join(', ') });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    user.lastLoginAt = new Date();
    user.isLoggedIn = true;   // <-- Set login status to true
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, message: 'Login successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};



exports.logout = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: 'User not found' });

    user.lastLogoutAt = new Date();
    await user.save();

    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all users (only id, name, email)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, name: 1, email: 1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fullstackdeveloperabhi1@gmail.com',
    pass: 'geoe oqaq ngth kpfm'
  }
});



async function sendResetEmail(email, token) {
  const resetUrl = `https://realtyxpo.in/reset-password?token=${token}`;
  const mailOptions = {
    from: '"Realtyxpo" <fullstackdeveloperabhi1@gmail.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to set a new password.</p>`
  };

  await transporter.sendMail(mailOptions);
}


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is missing' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Generate reset token and expiration
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    // Send email with reset link
    await sendResetEmail(email, resetToken);

    res.json({ message: 'Password reset link sent to your email' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token and new password are required' });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired reset token' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Remove reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getLoggedInUsers = async (req, res) => {
  try {
    // Find all users who are currently logged in
    const loggedInUsers = await User.find({ isLoggedIn: true }).select('-password'); 
    // Exclude the password field for security

    res.json({
      success: true,
      count: loggedInUsers.length,
      users: loggedInUsers
    });
  } catch (err) {
    console.error("❌ getLoggedInUsers error:", err);
    res.status(500).json({ success: false, message: 'Server error fetching logged-in users' });
  }
};




