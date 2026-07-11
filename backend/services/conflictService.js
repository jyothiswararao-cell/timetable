const prisma = require('../config/db');

const detectAllConflicts = async () => {
  const timetables = await prisma.timetable.findMany({
    include: {
      class: { include: { department: true } },
      subject: true,
      faculty: { include: { availabilities: true } }
    }
  });

  const conflicts = [];
  const facultyBusy = {}; // key: facultyId-day-start
  const roomBusy = {}; // key: classroom-day-start
  const classBusy = {}; // key: classId-day-start

  for (const slot of timetables) {
    const slotKey = `${slot?.dayOfWeek || ''}-${slot?.startTime || ''}`;
    const facKey = `${slot?.facultyId || ''}-${slotKey}`;
    const roomKey = `${slot?.classroom || ''}-${slotKey}`;
    const clsKey = `${slot?.classId || ''}-${slotKey}`;

    // 1. Faculty Conflict
    if (facultyBusy[facKey]) {
      const other = facultyBusy[facKey];
      conflicts.push({
        type: 'FACULTY',
        description: `Faculty ${slot?.faculty?.name || 'N/A'} is scheduled for multiple sessions on ${slot?.dayOfWeek || ''} at ${slot?.startTime || ''} (Class ${slot?.class?.semester || ''}-${slot?.class?.section || ''} in ${slot?.classroom || ''} vs Class ${other?.class?.semester || ''}-${other?.class?.section || ''} in ${other?.classroom || ''}).`,
        severity: 'RED'
      });
    } else {
      facultyBusy[facKey] = slot;
    }

    // 2. Room Conflict
    if (roomBusy[roomKey]) {
      const other = roomBusy[roomKey];
      conflicts.push({
        type: 'ROOM',
        description: `Classroom ${slot?.classroom || ''} is double-booked on ${slot?.dayOfWeek || ''} at ${slot?.startTime || ''} (Class ${slot?.class?.semester || ''}-${slot?.class?.section || ''} vs Class ${other?.class?.semester || ''}-${other?.class?.section || ''}).`,
        severity: 'ORANGE'
      });
    } else {
      roomBusy[roomKey] = slot;
    }

    // 3. Class Conflict
    if (classBusy[clsKey]) {
      const other = classBusy[clsKey];
      conflicts.push({
        type: 'SUBJECT',
        description: `Class Semester ${slot?.class?.semester || ''}-${slot?.class?.section || ''} has multiple subjects scheduled in the same slot: ${slot?.subject?.name || 'N/A'} and ${other?.subject?.name || 'N/A'}.`,
        severity: 'YELLOW'
      });
    } else {
      classBusy[clsKey] = slot;
    }

    // 4. Faculty Availability Conflict
    const avail = (slot?.faculty?.availabilities || []).find(a => 
      a?.dayOfWeek === slot?.dayOfWeek && 
      a?.startTime <= slot?.startTime && 
      a?.endTime >= slot?.endTime
    );
    if (avail && !avail.isAvailable) {
      conflicts.push({
        type: 'FACULTY',
        description: `Faculty ${slot?.faculty?.name || 'N/A'} is scheduled on ${slot?.dayOfWeek || ''} at ${slot?.startTime || ''} but is marked as UNAVAILABLE in their calendar.`,
        severity: 'RED'
      });
    }
  }

  // Update conflict table
  await prisma.conflictReport.deleteMany({ where: { status: 'UNRESOLVED' } });
  if (conflicts.length > 0) {
    await prisma.conflictReport.createMany({
      data: conflicts.map(c => ({
        type: c.type,
        description: c.description,
        severity: c.severity,
        status: 'UNRESOLVED'
      }))
    });
  }

  return conflicts;
};

const autoResolveConflicts = async () => {
  const conflicts = await detectAllConflicts();
  if (conflicts.length === 0) return { resolved: 0, total: 0 };

  const timetables = await prisma.timetable.findMany({
    include: { class: true, subject: true, faculty: true }
  });

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const TIME_SLOTS = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' }
  ];

  let resolvedCount = 0;

  for (const slot of timetables) {
    const isConflicting = timetables.some(other => 
      other.id !== slot.id && 
      other.dayOfWeek === slot.dayOfWeek && 
      other.startTime === slot.startTime && 
      (other.facultyId === slot.facultyId || other.classroom === slot.classroom || other.classId === slot.classId)
    );

    if (isConflicting) {
      let found = false;
      for (const day of DAYS) {
        if (found) break;
        for (const slotTime of TIME_SLOTS) {
          if (found) break;

          const hasOverlap = timetables.some(other => 
            other.dayOfWeek === day && 
            other.startTime === slotTime.start && 
            (other.classId === slot.classId || other.facultyId === slot.facultyId || other.classroom === slot.classroom)
          );

          if (!hasOverlap) {
            await prisma.timetable.update({
              where: { id: slot.id },
              data: {
                dayOfWeek: day,
                startTime: slotTime.start,
                endTime: slotTime.end
              }
            });
            slot.dayOfWeek = day;
            slot.startTime = slotTime.start;
            slot.endTime = slotTime.end;
            resolvedCount++;
            found = true;
          }
        }
      }
    }
  }

  // Recalculate conflicts
  await detectAllConflicts();

  return {
    resolved: resolvedCount,
    total: conflicts.length
  };
};

module.exports = {
  detectAllConflicts,
  autoResolveConflicts
};
