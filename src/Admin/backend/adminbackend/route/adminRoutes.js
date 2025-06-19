const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  addAdmin,
  deleteAdmin,
} = require('../adminController/adminController');

// Admin management routes
router.get('/all', getAllAdmins); // Fetch all admins
router.get('/:id', getAdminById); // Fetch admin by ID
router.put('/:id', updateAdmin); // Update admin details
router.post('/', addAdmin); // Add a new admin
router.delete('/:id', deleteAdmin); // Delete an admin

module.exports = router;