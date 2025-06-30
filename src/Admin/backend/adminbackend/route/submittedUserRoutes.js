const express = require('express');
const router = express.Router();
const {
  getAllSubmittedData,
  toggleLockSubmittedData
} = require('../adminController/submittedUserController');

// GET all submitted data
router.get('/', getAllSubmittedData);

// PATCH lock/unlock
router.patch('/:id/lock', toggleLockSubmittedData);

module.exports = router;