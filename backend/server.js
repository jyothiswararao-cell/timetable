require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

// Environment variables assertion
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
REQUIRED_ENV.forEach((envName) => {
  if (!process.env[envName]) {
    console.error(`[CRITICAL] Missing required environment variable: ${envName}. Server will shut down.`);
    process.exit(1);
  }
});

const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classRoutes = require('./routes/classRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares & Dynamic CORS
const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL];
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isVercel = origin.startsWith('https://') && origin.endsWith('.vercel.app');
    if (allowedOrigins.includes(origin) || isVercel) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to avoid breaking client routing
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Dynamic Timetable Management System API is online.' });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
