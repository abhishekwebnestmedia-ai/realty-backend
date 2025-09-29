const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);

 
router.post('/forgot-password', authController.forgotPassword);
router.get('/profile', authMiddleware, authController.getProfile);


router.post('/reset-password', authController.resetPassword);
router.get('/alluser', authMiddleware,authController.getAllUsers);
router.get('/loggedinUser', authMiddleware, authController.getLoggedInUsers);
router.get('/activeuser', authMiddleware, authController.getUsersLoginStatusSimple);
router.put('/change-role/:userId', authMiddleware, authController.changeUserRole);

// Delete entire ProjectType (root)

router.delete(
  "/projectType/:category/:projectcategory",
  projectController.deleteEntity
);

// Delete City

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId",
  projectController.deleteEntity
);

// Delete Division

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId",
  projectController.deleteEntity
);

// Delete Sector

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId",
  projectController.deleteEntity
);

// Delete Project
router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId",
  projectController.deleteEntity
);

// Delete Tower

router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId",
  projectController.deleteEntity
);

// Delete Unit


router.delete(
  "/projectType/:category/:projectcategory/cities/:cityId/divisions/:divisionId/sectors/:sectorId/projects/:projectId/towers/:towerId/units/:unitId",
  projectController.deleteEntity
);


module.exports = router;
