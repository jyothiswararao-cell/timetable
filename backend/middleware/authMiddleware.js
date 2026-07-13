const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[AUTH FAILURE] ${new Date().toISOString()} - No Authorization token provided or invalid format.`);
      return res.status(401).json({ success: false, message: 'Unauthorized', error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
    } catch (err) {
      console.warn(`[AUTH FAILURE] ${new Date().toISOString()} - Invalid or expired token: ${err.message}`);
      return res.status(401).json({ success: false, message: 'Unauthorized', error: 'Unauthorized: Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { faculty: true }
    });

    if (!user) {
      console.warn(`[AUTH FAILURE] ${new Date().toISOString()} - User associated with token not found (ID: ${decoded.id}).`);
      return res.status(401).json({ success: false, message: 'Unauthorized', error: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[AUTH ERROR] ${new Date().toISOString()} - Exception: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Unauthorized', error: 'Unauthorized: Authentication error' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
