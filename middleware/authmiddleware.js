// const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'No token, authorization denied' });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Attach user info to request
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// module.exports = authMiddleware;


const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 🧠 1️⃣ Check header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Authorization denied.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 🧠 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Your token contains "userId" field (as per earlier payload)
    const userId = decoded.userId || decoded._id || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token structure — userId not found",
      });
    }

    // 🧠 3️⃣ Fetch full user from DB
    const user = await User.findById(userId).select("_id name email role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or deleted",
      });
    }

    // ✅ 4️⃣ Attach user object to request
    req.user = user;

    // Optional: log who made the request (for debugging)
    console.log("🔐 Authenticated User:", req.user.name, "| Role:", req.user.role);

    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
