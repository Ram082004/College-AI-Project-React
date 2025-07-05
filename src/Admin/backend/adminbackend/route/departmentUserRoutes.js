const express = require('express');
const router = express.Router();
const {
  getAllDepartmentUsers,
  getDepartmentUserById,
  addDepartmentUser,
  updateDepartmentUser,
  deleteDepartmentUser,
  toggleLockDepartmentUser,
  getDistinctAcademicYears,
  getStudentEnrollmentSummary,
  getStudentExaminationSummary,
} = require('../adminController/departmentUserController');

// Department user management routes
router.get('/', getAllDepartmentUsers); // Fetch all department users
router.get('/:id', getDepartmentUserById); // Fetch a department user by ID
router.post('/', addDepartmentUser); // Create department user
router.put('/:id', updateDepartmentUser); // Update an existing department user
router.delete('/:id', deleteDepartmentUser); // Delete a department user
router.patch('/:id/lock', toggleLockDepartmentUser); // Lock or unlock a department user
router.get('/distinct/years', getDistinctAcademicYears); // Get distinct academic years
router.get('/student-enrollment/summary', getStudentEnrollmentSummary); // Get student enrollment summary
router.get('/student-examination/summary', getStudentExaminationSummary); // Get student examination summary

module.exports = router;