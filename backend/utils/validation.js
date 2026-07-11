const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('ADMIN', 'FACULTY').default('FACULTY'),
});

const facultySchema = Joi.object({
  name: Joi.string().min(2).required(),
  code: Joi.string().required(),
  email: Joi.string().email().required(),
  workloadLimit: Joi.number().integer().min(1).max(40).default(16),
  departmentId: Joi.number().integer().required(),
});

const subjectSchema = Joi.object({
  name: Joi.string().min(2).required(),
  code: Joi.string().required(),
  credits: Joi.number().integer().min(1).max(6).default(3),
  semester: Joi.number().integer().min(1).max(8).required(),
  departmentId: Joi.number().integer().required(),
  facultyId: Joi.number().integer().allow(null).optional(),
});

const classSchema = Joi.object({
  departmentId: Joi.number().integer().required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  section: Joi.string().required(),
  strength: Joi.number().integer().min(1).required(),
});

const availabilitySchema = Joi.object({
  facultyId: Joi.number().integer().required(),
  dayOfWeek: Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY').required(),
  startTime: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/).required(),
  endTime: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/).required(),
  isAvailable: Joi.boolean().default(true),
});

const academicCalendarSchema = Joi.object({
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
  type: Joi.string().valid('WORKING_DAY', 'HOLIDAY', 'EXAM_DAY', 'SPECIAL_EVENT').required(),
  description: Joi.string().allow('', null).optional(),
});

const workloadRequestSchema = Joi.object({
  facultyId: Joi.number().integer().required(),
  type: Joi.string().valid('INCREASE', 'DECREASE', 'TRANSFER').required(),
  amount: Joi.number().integer().min(1).required(),
});

const temporaryTimetableSchema = Joi.object({
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
  timetableId: Joi.number().integer().required(),
  replacementFacultyId: Joi.number().integer().required(),
});

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ success: false, error: details });
    }
    next();
  };
};

module.exports = {
  loginSchema,
  registerSchema,
  facultySchema,
  subjectSchema,
  classSchema,
  availabilitySchema,
  academicCalendarSchema,
  workloadRequestSchema,
  temporaryTimetableSchema,
  validateBody
};
