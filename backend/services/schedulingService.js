const prisma = require('../config/db');

// Defined standard time slots
const TIME_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' }
];

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const generateTimetable = async (semesters, departmentIds, classrooms) => {
  // 1. Fetch Classes
  const classes = await prisma.class.findMany({
    where: {
      semester: { in: semesters.map(s => parseInt(s)) },
      departmentId: { in: departmentIds.map(d => parseInt(d)) }
    },
    include: { department: true }
  });

  if (classes.length === 0) {
    throw new Error('No classes found for the selected departments and semesters');
  }

  // 2. Fetch Subjects and assigned Faculty
  const subjects = await prisma.subject.findMany({
    where: {
      semester: { in: semesters.map(s => parseInt(s)) },
      departmentId: { in: departmentIds.map(d => parseInt(d)) }
    },
    include: { faculty: { include: { availabilities: true } } }
  });

  // 3. Clear existing timetables for these classes
  const classIds = classes.map(c => c.id);
  await prisma.timetable.deleteMany({
    where: { classId: { in: classIds } }
  });

  // Keep track of faculty workloads and busy slots during generation
  const facultyWorkload = {};
  const facultyBusy = {}; // key: `${facultyId}-${day}-${slot}`
  const roomBusy = {}; // key: `${classroom}-${day}-${slot}`
  const classBusy = {}; // key: `${classId}-${day}-${slot}`

  const generatedSlots = [];
  const conflictsFound = [];

  // Helper to check availability according to Faculty calendar constraints
  const isFacultyCalendarAvailable = (faculty, day, startTime, endTime) => {
    if (!faculty || !faculty.availabilities || faculty.availabilities.length === 0) {
      return true;
    }
    const av = faculty.availabilities.find(a => 
      a.dayOfWeek === day && 
      a.startTime <= startTime && 
      a.endTime >= endTime
    );
    return av ? av.isAvailable : false;
  };

  // Process schedule class by class
  for (const cls of classes) {
    const classSubjects = subjects.filter(s => 
      s.departmentId === cls.departmentId && 
      s.semester === cls.semester
    );

    // Create scheduling tasks: each subject needs to be scheduled "credits" times
    const tasks = [];
    for (const sub of classSubjects) {
      if (!sub.facultyId) {
        conflictsFound.push({
          type: 'SUBJECT',
          description: `Subject ${sub.name} (${sub.code}) has no faculty assigned. Cannot schedule automatically.`,
          severity: 'YELLOW'
        });
        continue;
      }
      for (let i = 0; i < sub.credits; i++) {
        tasks.push(sub);
      }
    }

    // Sort tasks: Schedule subjects with faculties having less available slots first (MRV constraint heuristic)
    tasks.sort((a, b) => {
      const aAvail = (a?.faculty?.availabilities || []).filter(av => av?.isAvailable).length;
      const bAvail = (b?.faculty?.availabilities || []).filter(av => av?.isAvailable).length;
      return aAvail - bAvail;
    });

    // Fit tasks into calendar slots
    for (const subject of tasks) {
      const faculty = subject.faculty;
      const facultyId = faculty.id;

      if (!facultyWorkload[facultyId]) {
        facultyWorkload[facultyId] = 0;
      }

      let scheduled = false;

      for (const day of DAYS) {
        if (scheduled) break;

        for (const slot of TIME_SLOTS) {
          if (scheduled) break;

          const slotKey = `${day}-${slot.start}`;
          const facBusyKey = `${facultyId}-${slotKey}`;
          const classBusyKey = `${cls.id}-${slotKey}`;

          // Constraint Checks
          if (classBusy[classBusyKey]) continue;
          if (facultyWorkload[facultyId] >= faculty.workloadLimit) continue;
          if (!isFacultyCalendarAvailable(faculty, day, slot.start, slot.end)) continue;
          if (facultyBusy[facBusyKey]) continue;

          // Find an unoccupied room
          for (const room of classrooms) {
            const roomBusyKey = `${room}-${slotKey}`;
            if (roomBusy[roomBusyKey]) continue;

            // Reserve slot
            classBusy[classBusyKey] = true;
            facultyBusy[facBusyKey] = true;
            roomBusy[roomBusyKey] = true;
            facultyWorkload[facultyId] += 1;

            generatedSlots.push({
              classroom: room,
              dayOfWeek: day,
              startTime: slot.start,
              endTime: slot.end,
              classId: cls.id,
              subjectId: subject.id,
              facultyId: facultyId
            });

            scheduled = true;
            break;
          }
        }
      }

      // If greedy constraint fit fails, force-schedule in the first slot where the class itself is free,
      // and flag it as a conflict.
      if (!scheduled) {
        let forceScheduled = false;
        for (const day of DAYS) {
          if (forceScheduled) break;
          for (const slot of TIME_SLOTS) {
            const slotKey = `${day}-${slot.start}`;
            const classBusyKey = `${cls.id}-${slotKey}`;

            if (!classBusy[classBusyKey]) {
              const room = classrooms[0] || 'Room 101';
              const facultyId = subject.facultyId;

              generatedSlots.push({
                classroom: room,
                dayOfWeek: day,
                startTime: slot.start,
                endTime: slot.end,
                classId: cls.id,
                subjectId: subject.id,
                facultyId: facultyId
              });

              const facBusyKey = `${facultyId}-${slotKey}`;
              const roomBusyKey = `${room}-${slotKey}`;

              if (facultyBusy[facBusyKey]) {
                conflictsFound.push({
                  type: 'FACULTY',
                  description: `Faculty conflict: ${faculty?.name || 'N/A'} is double-booked on ${day} at ${slot.start} (Semester ${cls?.semester || ''}-${cls?.section || ''}).`,
                  severity: 'RED'
                });
              }
              if (roomBusy[roomBusyKey]) {
                conflictsFound.push({
                  type: 'ROOM',
                  description: `Room conflict: Classroom ${room} is double-booked on ${day} at ${slot.start} (Semester ${cls?.semester || ''}-${cls?.section || ''}).`,
                  severity: 'ORANGE'
                });
              }

              classBusy[classBusyKey] = true;
              facultyBusy[facBusyKey] = true;
              roomBusy[roomBusyKey] = true;
              facultyWorkload[facultyId] += 1;

              forceScheduled = true;
              break;
            }
          }
        }
      }
    }
  }

  // Insert generated periods
  if (generatedSlots.length > 0) {
    await prisma.timetable.createMany({
      data: generatedSlots
    });
  }

  // Save detected conflicts
  await prisma.conflictReport.deleteMany({ where: { status: 'UNRESOLVED' } });
  if (conflictsFound.length > 0) {
    await prisma.conflictReport.createMany({
      data: conflictsFound.map(c => ({
        type: c.type,
        description: c.description,
        severity: c.severity,
        status: 'UNRESOLVED'
      }))
    });
  }

  return {
    success: true,
    scheduledPeriods: generatedSlots.length,
    conflictsDetected: conflictsFound.length
  };
};

module.exports = {
  generateTimetable,
  TIME_SLOTS,
  DAYS
};
