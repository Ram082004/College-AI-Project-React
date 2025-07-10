const express = require('express');
const router = express.Router();
const {
  getAllSubmittedData,
  toggleLockSubmittedData,
  deleteSubmittedData
} = require('../adminController/submittedUserController');

// GET all submitted data
router.get('/', getAllSubmittedData);

// PATCH lock/unlock
router.patch('/:id/lock', toggleLockSubmittedData);

// DELETE a submitted entry
router.delete('/:id', deleteSubmittedData);

module.exports = router;