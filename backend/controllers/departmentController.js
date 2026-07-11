const prisma = require('../config/db');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    const existingCode = await prisma.department.findFirst({
      where: {
        OR: [
          { name },
          { code }
        ]
      }
    });

    if (existingCode) {
      return res.status(400).json({ success: false, error: 'Department name or code already exists' });
    }

    const dept = await prisma.department.create({
      data: { name, code }
    });

    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDepartments, createDepartment, deleteDepartment };
