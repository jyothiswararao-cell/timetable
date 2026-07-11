const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, academicCalendarSchema } = require('../utils/validation');

router.get('/', authenticate, calendarController.getCalendarEvents);
router.post('/', authenticate, authorize('ADMIN'), validateBody(academicCalendarSchema), calendarController.createOrUpdateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), calendarController.deleteEvent);

module.exports = router;
