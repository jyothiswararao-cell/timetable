const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateBody, classSchema } = require('../utils/validation');

router.get('/', authenticate, classController.getClasses);
router.post('/', authenticate, authorize('ADMIN'), validateBody(classSchema), classController.createClass);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(classSchema), classController.updateClass);
router.delete('/:id', authenticate, authorize('ADMIN'), classController.deleteClass);

module.exports = router;
