const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, temporaryTimetableSchema, workloadRequestSchema } = require('../utils/validation');

router.post('/generate', authenticate, authorize('ADMIN'), timetableController.generate);
router.get('/class/:id', authenticate, timetableController.getClassTimetable);
router.get('/faculty/:id', authenticate, timetableController.getFacultyTimetable);

router.post('/temporary', authenticate, authorize('ADMIN'), validateBody(temporaryTimetableSchema), timetableController.createTemporarySubstitution);
router.get('/temporary', authenticate, timetableController.getTemporaryTimetable);

router.post('/adjust-workload', authenticate, authorize('ADMIN'), validateBody(workloadRequestSchema), timetableController.adjustWorkload);
router.get('/adjust-workload', authenticate, timetableController.getWorkloadRequests);

router.post('/detect-conflicts', authenticate, timetableController.detectConflicts);
router.post('/auto-resolve', authenticate, authorize('ADMIN'), timetableController.autoResolveConflicts);

router.get('/dashboard-stats', authenticate, timetableController.getDashboardStats);
router.get('/audit-logs', authenticate, authorize('ADMIN'), timetableController.getAuditLogs);

module.exports = router;
