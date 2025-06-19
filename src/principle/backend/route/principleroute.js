const express = require('express');
const router = express.Router();
const { principleLogin, forgotPrinciplePassword } = require('../controllers/principlecontroller');

// Public routes
router.post('/login', principleLogin);
router.post('/forgot-password', forgotPrinciplePassword);

module.exports = router;