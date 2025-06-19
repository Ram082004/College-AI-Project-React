const express = require('express');
const router = express.Router();
const {
  getAllDepartmentUsers,
  getDepartmentUserById,
  addDepartmentUser,
  updateDepartmentUser,
  deleteDepartmentUser,
  toggleLockDepartmentUser,
  getDistinctAcademicYears
} = require('../adminController/departmentUserController');

// Department user management routes
router.get('/', getAllDepartmentUsers); // Fetch all department users
router.get('/:id', getDepartmentUserById); // Fetch a department user by ID
router.post('/', addDepartmentUser); // Create department user
router.put('/:id', updateDepartmentUser); // Update an existing department user
router.delete('/:id', deleteDepartmentUser); // Delete a department user
router.patch('/:id/lock', toggleLockDepartmentUser); // Lock or unlock a department user
router.get('/distinct/years', getDistinctAcademicYears); // Get distinct academic years

module.exports = router;