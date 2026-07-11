const prisma = require('../config/db');

const getFacultyReport = async (req, res, next) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        department: true,
        timetables: true
      }
    });

    const report = faculties.map(f => ({
      id: f.id,
      name: f.name,
      code: f.code,
      email: f.email,
      department: f.department.name,
      departmentCode: f.department.code,
      workloadLimit: f.workloadLimit,
      assignedWorkload: f.timetables.length,
      utilizationPercentage: Math.round((f.timetables.length / f.workloadLimit) * 100)
    }));

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getConflictReport = async (req, res, next) => {
  try {
    const reports = await prisma.conflictReport.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const getDepartmentReport = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        classes: { include: { timetables: true } },
        faculties: true,
        subjects: true
      }
    });

    const report = departments.map(d => {
      const totalClasses = d.classes.length;
      const potentialSlots = totalClasses * 30; // 30 weekly periods per class (6 slots/day * 5 days)
      let scheduledSlots = 0;
      d.classes.forEach(c => {
        scheduledSlots += c.timetables.length;
      });

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        facultyCount: d.faculties.length,
        subjectCount: d.subjects.length,
        classCount: totalClasses,
        scheduledSlots,
        potentialSlots,
        utilizationPercentage: potentialSlots > 0 ? Math.round((scheduledSlots / potentialSlots) * 100) : 0
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFacultyReport,
  getConflictReport,
  getDepartmentReport
};
