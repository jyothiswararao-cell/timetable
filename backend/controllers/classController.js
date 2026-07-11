const prisma = require('../config/db');

const getClasses = async (req, res, next) => {
  try {
    const { departmentId, semester } = req.query;

    const where = {};
    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    }
    if (semester) {
      where.semester = parseInt(semester);
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        department: true
      },
      orderBy: [
        { semester: 'asc' },
        { section: 'asc' }
      ]
    });

    res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { departmentId, semester, section, strength } = req.body;

    const existingClass = await prisma.class.findFirst({
      where: {
        departmentId: parseInt(departmentId),
        semester: parseInt(semester),
        section: section
      }
    });

    if (existingClass) {
      return res.status(400).json({ success: false, error: 'Class section already exists for this semester and department' });
    }

    const newClass = await prisma.class.create({
      data: {
        departmentId: parseInt(departmentId),
        semester: parseInt(semester),
        section,
        strength: parseInt(strength)
      },
      include: {
        department: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'CLASS_CREATE',
        details: `Class created: Semester ${semester}-${section} (${newClass.department.code})`
      }
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId, semester, section, strength } = req.body;
    const classId = parseInt(id);

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    if (departmentId || semester || section) {
      const deptId = departmentId ? parseInt(departmentId) : cls.departmentId;
      const sem = semester ? parseInt(semester) : cls.semester;
      const sec = section || cls.section;

      const existingClass = await prisma.class.findFirst({
        where: {
          id: { not: classId },
          departmentId: deptId,
          semester: sem,
          section: sec
        }
      });

      if (existingClass) {
        return res.status(400).json({ success: false, error: 'Another class with this specification already exists' });
      }
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        section,
        strength: strength ? parseInt(strength) : undefined
      },
      include: {
        department: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'CLASS_UPDATE',
        details: `Class updated: Semester ${updated.semester}-${updated.section}`
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id);

    const cls = await prisma.class.findUnique({ where: { id: classId }, include: { department: true } });
    if (!cls) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    await prisma.class.delete({ where: { id: classId } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'CLASS_DELETE',
        details: `Class deleted: Semester ${cls.semester}-${cls.section} (${cls.department.code})`
      }
    });

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass
};
