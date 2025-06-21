const express = require('express');
const router = express.Router();
const { 
  departmentLogin, 
  forgotDepartmentPassword,
  addEnrollmentData,
  getStudentDetails,
  addExaminationData,
  getExaminationDetails,
  updateEnrollmentStatus,
  updateExaminationStatus,
  submitEnrollmentDeclaration,
  submitExaminationDeclaration,
  getEnrollmentYearStatuses,
  getEnrollmentYearCompletionStatus,
  getExaminationYearCompletionStatus
} = require('../controllers/deptcontroller');
const { pool } = require('../../../Admin/backend/config/db'); // <-- Add this line

// Debug middleware
router.use((req, res, next) => {
  console.log(`Department Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Fixed routes - ensure POST method for enrollment-summary
router.post('/department-login', departmentLogin);
router.post('/department-forgot-password', forgotDepartmentPassword);
router.post('/enrollment-summary', addEnrollmentData); // This endpoint is used for adding data
router.get('/student-enrollment/department/:deptId', getStudentDetails);
router.post('/examination-summary', addExaminationData);
router.get('/student-examination/department/:deptId', getExaminationDetails);
router.post('/student-enrollment/update-status', updateEnrollmentStatus);
router.post('/student-examination/update-status', updateExaminationStatus);
router.post('/student-enrollment/submit-declaration', submitEnrollmentDeclaration);
router.post('/student-examination/submit-declaration', submitExaminationDeclaration);
router.get('/student-enrollment/year-statuses/:deptId', getEnrollmentYearStatuses);

// Add this route:
router.get('/department-user/academic-year/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    const [rows] = await pool.query(
      'SELECT academic_year FROM department_users WHERE dept_id = ?',
      [deptId]
    );
    if (rows.length === 0) {
      return res.json({ success: false, years: [] });
    }
    res.json({ success: true, years: rows.map(r => r.academic_year) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic year' });
  }
});

router.get('/student-enrollment/submit-declaration', (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Method not allowed. Use POST request instead.'
  });
});

// Add this route for year completion status
router.get('/student-enrollment/year-completion-status/:deptId', getEnrollmentYearCompletionStatus);
router.get('/student-examination/year-completion-status/:deptId', getExaminationYearCompletionStatus);

module.exports = router;