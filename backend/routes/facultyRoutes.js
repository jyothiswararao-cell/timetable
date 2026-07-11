const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, facultySchema } = require('../utils/validation');

router.get('/', authenticate, facultyController.getFaculty);
router.post('/', authenticate, authorize('ADMIN'), validateBody(facultySchema), facultyController.createFaculty);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(facultySchema), facultyController.updateFaculty);
router.delete('/:id', authenticate, authorize('ADMIN'), facultyController.deleteFaculty);

router.get('/:id/availability', authenticate, facultyController.getAvailability);
router.put('/:id/availability', authenticate, facultyController.updateAvailability);

module.exports = router;
