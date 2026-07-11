const prisma = require('../config/db');
const schedulingService = require('../services/schedulingService');
const conflictService = require('../services/conflictService');

const generate = async (req, res, next) => {
  try {
    const { semesters, departmentIds, classrooms } = req.body;

    if (!semesters || !departmentIds || !classrooms || classrooms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: semesters, departmentIds, and classrooms are required.'
      });
    }

    const result = await schedulingService.generateTimetable(semesters, departmentIds, classrooms);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'TIMETABLE_GENERATE',
        details: `Generated timetable for semesters [${semesters.join(', ')}] and departments [${departmentIds.join(', ')}].`
      }
    });

    res.json({
      success: true,
      message: 'Timetable generated successfully!',
      details: result
    });
  } catch (error) {
    next(error);
  }
};

const getClassTimetable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timetable = await prisma.timetable.findMany({
      where: { classId: parseInt(id) },
      include: {
        class: { include: { department: true } },
        subject: { include: { faculty: true } },
        faculty: true
      }
    });
    res.json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

const getFacultyTimetable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timetable = await prisma.timetable.findMany({
      where: { facultyId: parseInt(id) },
      include: {
        class: { include: { department: true } },
        subject: true,
        faculty: true
      }
    });
    res.json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

const detectConflicts = async (req, res, next) => {
  try {
    const reports = await conflictService.detectAllConflicts();
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const autoResolveConflicts = async (req, res, next) => {
  try {
    const result = await conflictService.autoResolveConflicts();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const createTemporarySubstitution = async (req, res, next) => {
  try {
    const { absentFacultyId, replacementFacultyId, date } = req.body;

    if (!absentFacultyId || !replacementFacultyId || !date) {
      return res.status(400).json({ success: false, error: 'Parameters absentFacultyId, replacementFacultyId, and date are required.' });
    }

    const absId = parseInt(absentFacultyId);
    const repId = parseInt(replacementFacultyId);

    if (isNaN(absId) || isNaN(repId)) {
      return res.status(400).json({ success: false, error: 'Faculty IDs must be valid numbers.' });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Provided date is invalid.' });
    }

    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = daysOfWeek[dateObj.getDay()];

    if (dayName === 'SUNDAY') {
      return res.status(400).json({ success: false, error: 'Cannot schedule substitutions on Sunday' });
    }

    const originalSlots = await prisma.timetable.findMany({
      where: {
        facultyId: absId,
        dayOfWeek: dayName
      }
    });

    if (originalSlots.length === 0) {
      return res.status(400).json({ success: false, error: 'Absent faculty has no lectures scheduled on this day of the week.' });
    }

    const subs = [];
    for (const slot of originalSlots) {
      // Check if replacement faculty is free
      const replacementBusy = await prisma.timetable.findFirst({
        where: {
          facultyId: repId,
          dayOfWeek: dayName,
          startTime: slot.startTime
        }
      });

      if (replacementBusy) {
        return res.status(400).json({
          success: false,
          error: `Selected replacement faculty is already busy during slot ${slot.startTime} on ${dayName}.`
        });
      }

      subs.push({
        date,
        timetableId: slot.id,
        replacementFacultyId: repId,
        modifiedPeriod: `${slot.startTime}-${slot.endTime}`
      });
    }

    await prisma.temporaryTimetable.createMany({
      data: subs
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'TEMPORARY_TIMETABLE_CREATE',
        details: `Substituted Faculty ID ${absId} with ${repId} on ${date}.`
      }
    });

    res.json({
      success: true,
      message: 'Temporary timetable substitution created successfully!',
      count: subs.length
    });
  } catch (error) {
    next(error);
  }
};

const getTemporaryTimetable = async (req, res, next) => {
  try {
    const { date } = req.query;
    const tempSlots = await prisma.temporaryTimetable.findMany({
      where: date ? { date } : {},
      include: {
        timetable: {
          include: {
            class: { include: { department: true } },
            subject: true,
            faculty: true
          }
        },
        replacementFaculty: true
      }
    });
    res.json({ success: true, data: tempSlots });
  } catch (error) {
    next(error);
  }
};

const adjustWorkload = async (req, res, next) => {
  try {
    const { facultyId, type, amount } = req.body;

    const facId = parseInt(facultyId);
    const amt = parseInt(amount);

    const faculty = await prisma.faculty.findUnique({ where: { id: facId } });
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }

    let newLimit = faculty.workloadLimit;
    if (type === 'INCREASE') {
      newLimit += amt;
    } else if (type === 'DECREASE') {
      newLimit = Math.max(1, newLimit - amt);
    }

    await prisma.faculty.update({
      where: { id: facId },
      data: { workloadLimit: newLimit }
    });

    let suggestion = '';
    if (type === 'INCREASE') {
      suggestion = `AI Suggestion: Faculty ${faculty.name} workload limit raised to ${newLimit} classes/week. They can absorb pending lectures.`;
    } else {
      suggestion = `AI Suggestion: Faculty ${faculty.name} workload reduced to ${newLimit} classes/week. Redistribute excess ${amt} lectures to other department peers.`;
    }

    const request = await prisma.workloadRequest.create({
      data: {
        facultyId: facId,
        type,
        amount: amt,
        status: 'APPROVED',
        suggestion
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'WORKLOAD_ADJUST',
        details: `Adjusted workload for ${faculty.name}: New limit ${newLimit}`
      }
    });

    res.json({
      success: true,
      message: 'Workload adjusted successfully!',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

const getWorkloadRequests = async (req, res, next) => {
  try {
    const requests = await prisma.workloadRequest.findMany({
      include: { faculty: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const facultyCount = await prisma.faculty.count();
    const classCount = await prisma.class.count();
    const subjectCount = await prisma.subject.count();

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = days[new Date().getDay()];
    const dayFilter = (todayName === 'SUNDAY' || todayName === 'SATURDAY') ? 'MONDAY' : todayName;

    const todayLectures = await prisma.timetable.count({
      where: { dayOfWeek: dayFilter }
    });

    const pendingRequests = await prisma.workloadRequest.count({
      where: { status: 'PENDING' }
    });

    const conflicts = await prisma.conflictReport.count({
      where: { status: 'UNRESOLVED' }
    });

    res.json({
      success: true,
      data: {
        totalFaculty: facultyCount,
        totalClasses: classCount,
        totalSubjects: subjectCount,
        todayLectures,
        pendingRequests,
        conflictsDetected: conflicts
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generate,
  getClassTimetable,
  getFacultyTimetable,
  detectConflicts,
  autoResolveConflicts,
  createTemporarySubstitution,
  getTemporaryTimetable,
  adjustWorkload,
  getWorkloadRequests,
  getDashboardStats,
  getAuditLogs
};
