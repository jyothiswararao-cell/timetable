const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateBody, loginSchema, registerSchema } = require('../utils/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
