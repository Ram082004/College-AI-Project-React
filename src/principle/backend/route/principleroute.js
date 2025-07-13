const express = require('express');
const router = express.Router();
const { principleLogin, forgotPrinciplePassword, getDepartmentsList, getDepartmentDetails } = require('../controllers/principlecontroller');

// Public routes
router.post('/login', principleLogin);
router.post('/forgot-password', forgotPrinciplePassword);
router.get('/departments-list', getDepartmentsList);
router.get('/department-details/:deptId', getDepartmentDetails);

module.exports = router;