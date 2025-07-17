const express = require('express');
const router = express.Router();
const { officeLogin, forgotOfficePassword } = require('../controllers/officeController');
const basicInformationController = require('../controllers/basicInformationController');

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

// Basic Information routes
router.get('/basic-information', basicInformationController.getBasicInformation);
router.post('/basic-information', basicInformationController.saveBasicInformation);

// Office Details routes
router.get('/office-details', basicInformationController.getOfficeDetails);
router.post('/office-details', basicInformationController.saveOfficeDetails);
router.get('/institution-address', basicInformationController.getInstitutionAddress);
router.post('/institution-address', basicInformationController.saveInstitutionAddress);

module.exports = router;