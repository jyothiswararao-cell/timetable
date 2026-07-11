const prisma = require('../config/db');

const getSubjects = async (req, res, next) => {
  try {
    const { search, departmentId, semester } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ];
    }
    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    }
    if (semester) {
      where.semester = parseInt(semester);
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        department: true,
        faculty: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code, credits, semester, departmentId, facultyId } = req.body;

    const existingCode = await prisma.subject.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ success: false, error: 'Subject code already exists' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        credits: parseInt(credits) || 3,
        semester: parseInt(semester),
        departmentId: parseInt(departmentId),
        facultyId: facultyId ? parseInt(facultyId) : null
      },
      include: {
        department: true,
        faculty: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'SUBJECT_CREATE',
        details: `Subject created: ${name} (${code})`
      }
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, credits, semester, departmentId, facultyId } = req.body;
    const subId = parseInt(id);

    const subject = await prisma.subject.findUnique({ where: { id: subId } });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    if (code && code !== subject.code) {
      const existingCode = await prisma.subject.findUnique({ where: { code } });
      if (existingCode) {
        return res.status(400).json({ success: false, error: 'Subject code already exists' });
      }
    }

    const updated = await prisma.subject.update({
      where: { id: subId },
      data: {
        name,
        code,
        credits: credits ? parseInt(credits) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        facultyId: facultyId !== undefined ? (facultyId ? parseInt(facultyId) : null) : undefined
      },
      include: {
        department: true,
        faculty: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'SUBJECT_UPDATE',
        details: `Subject updated: ${updated.name} (${updated.code})`
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subId = parseInt(id);

    const subject = await prisma.subject.findUnique({ where: { id: subId } });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    await prisma.subject.delete({ where: { id: subId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'SUBJECT_DELETE',
        details: `Subject deleted: ${subject.name} (${subject.code})`
      }
    });

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
