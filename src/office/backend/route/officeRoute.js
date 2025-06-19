const express = require('express');
const router = express.Router();
const { officeLogin, forgotOfficePassword } = require('../controllers/officeController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Office Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Office routes
router.post('/office-login', officeLogin);
router.post('/office-forgot-password', forgotOfficePassword);
// Add GET route to handle incorrect method
router.get('/office-forgot-password', (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Method not allowed. Use POST request instead.'
  });
});

module.exports = router;