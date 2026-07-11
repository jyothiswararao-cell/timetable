const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, departmentController.getDepartments);
router.post('/', authenticate, authorize('ADMIN'), departmentController.createDepartment);
router.delete('/:id', authenticate, authorize('ADMIN'), departmentController.deleteDepartment);

module.exports = router;
