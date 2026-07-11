const prisma = require('../config/db');

const getCalendarEvents = async (req, res, next) => {
  try {
    const events = await prisma.academicCalendar.findMany({
      orderBy: { date: 'asc' }
    });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const createOrUpdateEvent = async (req, res, next) => {
  try {
    const { date, type, description } = req.body;

    const event = await prisma.academicCalendar.upsert({
      where: { date },
      update: { type, description },
      create: { date, type, description }
    });

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.academicCalendar.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCalendarEvents,
  createOrUpdateEvent,
  deleteEvent
};
