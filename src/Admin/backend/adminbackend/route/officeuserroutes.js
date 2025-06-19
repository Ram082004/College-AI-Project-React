const express = require('express');
const router = express.Router();
const {
  getAllOfficeUsers,
  addOfficeUser,
  updateOfficeUser,
  deleteOfficeUser,
  toggleLockOfficeUser
} = require('../adminController/officeusercontroller');

router.get('/office-users', getAllOfficeUsers);
router.post('/', addOfficeUser);
router.put('/:id', updateOfficeUser);
router.delete('/:id', deleteOfficeUser);
router.patch('/:id/lock', toggleLockOfficeUser);

module.exports = router;