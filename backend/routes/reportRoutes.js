const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/faculty-report', authenticate, reportController.getFacultyReport);
router.get('/conflict-report', authenticate, reportController.getConflictReport);
router.get('/department-report', authenticate, reportController.getDepartmentReport);

module.exports = router;
