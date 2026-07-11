const prisma = require('../config/db');

const getFaculty = async (req, res, next) => {
  try {
    const { search, departmentId, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Filters
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    }

    const total = await prisma.faculty.count({ where });
    const facultyList = await prisma.faculty.findMany({
      where,
      include: {
        department: true,
        subjects: true,
        availabilities: true
      },
      orderBy: {
        [sortBy]: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc'
      },
      skip: offset,
      take: limitNum
    });

    res.json({
      success: true,
      data: facultyList,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

const createFaculty = async (req, res, next) => {
  try {
    const { name, code, email, workloadLimit, departmentId } = req.body;

    const deptId = parseInt(departmentId);
    const limit = parseInt(workloadLimit) || 16;

    // Validate unique email/code
    const existingEmail = await prisma.faculty.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: 'Email already exists for another faculty' });
    }

    const existingCode = await prisma.faculty.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ success: false, error: 'Faculty code already exists' });
    }

    // Check if user table has this email, if so link it
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const faculty = await prisma.faculty.create({
      data: {
        name,
        code,
        email,
        workloadLimit: limit,
        departmentId: deptId,
        userId: existingUser ? existingUser.id : null
      },
      include: {
        department: true
      }
    });

    // Create default availability: MONDAY to FRIDAY, 09:00 to 16:00
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const availabilities = days.map(day => ({
      facultyId: faculty.id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '16:00',
      isAvailable: true
    }));

    await prisma.facultyAvailability.createMany({
      data: availabilities
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'FACULTY_CREATE',
        details: `Faculty created: ${name} (${code})`
      }
    });

    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

const updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, email, workloadLimit, departmentId } = req.body;

    const facId = parseInt(id);

    const faculty = await prisma.faculty.findUnique({ where: { id: facId } });
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }

    // Verify unique email/code
    if (email && email !== faculty.email) {
      const existingEmail = await prisma.faculty.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
    }
    if (code && code !== faculty.code) {
      const existingCode = await prisma.faculty.findUnique({ where: { code } });
      if (existingCode) {
        return res.status(400).json({ success: false, error: 'Faculty code already exists' });
      }
    }

    const updated = await prisma.faculty.update({
      where: { id: facId },
      data: {
        name,
        code,
        email,
        workloadLimit: workloadLimit ? parseInt(workloadLimit) : undefined,
        departmentId: departmentId ? parseInt(departmentId) : undefined
      },
      include: {
        department: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'FACULTY_UPDATE',
        details: `Faculty updated: ${updated.name} (${updated.code})`
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facId = parseInt(id);

    const faculty = await prisma.faculty.findUnique({ where: { id: facId } });
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }

    await prisma.faculty.delete({ where: { id: facId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'FACULTY_DELETE',
        details: `Faculty deleted: ${faculty.name} (${faculty.code})`
      }
    });

    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facId = parseInt(id);
    const dbAvailabilities = await prisma.facultyAvailability.findMany({
      where: { facultyId: facId }
    });

    const STANDARD_SLOTS = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '13:00', end: '14:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' }
    ];
    const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    const expandedAvailabilities = [];

    for (const day of DAYS) {
      for (const slot of STANDARD_SLOTS) {
        const matchingDb = dbAvailabilities.find(a => 
          a.dayOfWeek === day && 
          a.startTime <= slot.start && 
          a.endTime >= slot.end
        );

        expandedAvailabilities.push({
          id: matchingDb ? matchingDb.id : `temp-${day}-${slot.start}`,
          facultyId: facId,
          dayOfWeek: day,
          startTime: slot.start,
          endTime: slot.end,
          isAvailable: matchingDb ? matchingDb.isAvailable : true
        });
      }
    }

    res.json({ success: true, data: expandedAvailabilities });
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availabilities } = req.body;

    const facultyId = parseInt(id);

    // Delete existing availabilities
    await prisma.facultyAvailability.deleteMany({
      where: { facultyId }
    });

    // Insert new
    await prisma.facultyAvailability.createMany({
      data: availabilities.map(av => ({
        facultyId,
        dayOfWeek: av.dayOfWeek,
        startTime: av.startTime,
        endTime: av.endTime,
        isAvailable: av.isAvailable !== undefined ? av.isAvailable : true
      }))
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'FACULTY_AVAILABILITY_UPDATE',
        details: `Updated availability calendar for Faculty ID ${facultyId}`
      }
    });

    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getAvailability,
  updateAvailability
};
