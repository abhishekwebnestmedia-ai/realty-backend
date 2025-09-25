const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);

 link
router.post('/forgot-password', authController.forgotPassword);
router.get('/profile', authMiddleware, authController.getProfile);


router.post('/reset-password', authController.resetPassword);
router.get('/alluser', authMiddleware,authController.getAllUsers);
router.get('/loggedinUser', authMiddleware, authController.getLoggedInUsers);



module.exports = router;
