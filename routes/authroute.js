const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);

// Forgot Password route - send reset link
router.post('/forgot-password', authController.forgotPassword);

// Reset Password route - submit new password along with token
router.post('/reset-password', authController.resetPassword);



module.exports = router;
