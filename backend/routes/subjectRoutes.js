const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, subjectSchema } = require('../utils/validation');

router.get('/', authenticate, subjectController.getSubjects);
router.post('/', authenticate, authorize('ADMIN'), validateBody(subjectSchema), subjectController.createSubject);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(subjectSchema), subjectController.updateSubject);
router.delete('/:id', authenticate, authorize('ADMIN'), subjectController.deleteSubject);

module.exports = router;
