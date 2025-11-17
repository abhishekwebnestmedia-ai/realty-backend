// Quick syntax/load check for projectController
try {
  // require the controller to surface any syntax errors on load
  require('../controllers/projectController');
  console.log('OK: projectController loaded successfully');
  process.exit(0);
} catch (err) {
  console.error('ERROR: Failed to load projectController:', err);
  process.exit(1);
}
