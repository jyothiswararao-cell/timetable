const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with 100+ records...');

  // Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.temporaryTimetable.deleteMany({});
  await prisma.conflictReport.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.workloadRequest.deleteMany({});
  await prisma.facultyAvailability.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.academicCalendar.deleteMany({});

  // 1. Create Users (2 records)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const facultyPassword = await bcrypt.hash('faculty123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@timetable.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN'
    }
  });

  const facultyUser = await prisma.user.create({
    data: {
      email: 'faculty@timetable.com',
      password: facultyPassword,
      name: 'Dr. Alan Turing',
      role: 'FACULTY'
    }
  });

  // 2. Create Departments (10 records)
  const departmentsData = [
    { name: 'Computer Science and Engineering', code: 'CSE' },
    { name: 'Electronics and Communication Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Electrical Engineering', code: 'EE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Biomedical Engineering', code: 'BME' },
    { name: 'Aerospace Engineering', code: 'AE' },
    { name: 'Chemical Engineering', code: 'CHE' },
    { name: 'Materials Science', code: 'MS' }
  ];

  const depts = [];
  for (const d of departmentsData) {
    const dept = await prisma.department.create({ data: d });
    depts.push(dept);
  }
  const cseId = depts.find(d => d.code === 'CSE').id;
  const eceId = depts.find(d => d.code === 'ECE').id;
  const meId = depts.find(d => d.code === 'ME').id;
  const eeId = depts.find(d => d.code === 'EE').id;
  const itId = depts.find(d => d.code === 'IT').id;

  // 3. Create Faculties (20 records)
  const facultiesData = [
    { name: 'Dr. Alan Turing', code: 'FAC001', email: 'faculty@timetable.com', workloadLimit: 12, departmentId: cseId, userId: facultyUser.id },
    { name: 'Dr. Grace Hopper', code: 'FAC002', email: 'grace.hopper@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Ada Lovelace', code: 'FAC003', email: 'ada.lovelace@timetable.com', workloadLimit: 16, departmentId: eceId },
    { name: 'Dr. Donald Knuth', code: 'FAC004', email: 'donald.knuth@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Claude Shannon', code: 'FAC005', email: 'claude.shannon@timetable.com', workloadLimit: 12, departmentId: eceId },
    { name: 'Dr. John von Neumann', code: 'FAC006', email: 'john.neumann@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Dennis Ritchie', code: 'FAC007', email: 'dennis.ritchie@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Ken Thompson', code: 'FAC008', email: 'ken.thompson@timetable.com', workloadLimit: 14, departmentId: cseId },
    { name: 'Dr. Tim Berners-Lee', code: 'FAC009', email: 'tim.lee@timetable.com', workloadLimit: 16, departmentId: itId },
    { name: 'Dr. Linus Torvalds', code: 'FAC010', email: 'linus.torvalds@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Richard Stallman', code: 'FAC011', email: 'richard.stallman@timetable.com', workloadLimit: 12, departmentId: itId },
    { name: 'Dr. Edsger Dijkstra', code: 'FAC012', email: 'edsger.dijkstra@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Margaret Hamilton', code: 'FAC013', email: 'margaret.hamilton@timetable.com', workloadLimit: 16, departmentId: itId },
    { name: 'Dr. Barbara Liskov', code: 'FAC014', email: 'barbara.liskov@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Frances Allen', code: 'FAC015', email: 'frances.allen@timetable.com', workloadLimit: 14, departmentId: eceId },
    { name: 'Dr. Shafi Goldwasser', code: 'FAC016', email: 'shafi.goldwasser@timetable.com', workloadLimit: 16, departmentId: cseId },
    { name: 'Dr. Katherine Johnson', code: 'FAC017', email: 'katherine.johnson@timetable.com', workloadLimit: 16, departmentId: meId },
    { name: 'Dr. Radia Perlman', code: 'FAC018', email: 'radia.perlman@timetable.com', workloadLimit: 16, departmentId: itId },
    { name: 'Dr. Anita Borg', code: 'FAC019', email: 'anita.borg@timetable.com', workloadLimit: 12, departmentId: cseId },
    { name: 'Dr. Nikola Tesla', code: 'FAC020', email: 'nikola.tesla@timetable.com', workloadLimit: 16, departmentId: eeId }
  ];

  const facs = [];
  for (const f of facultiesData) {
    const fac = await prisma.faculty.create({ data: f });
    facs.push(fac);
  }

  // 4. Create default availabilities (20 * 5 = 100 records)
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const availabilities = [];
  for (const fac of facs) {
    for (const day of days) {
      availabilities.push({
        facultyId: fac.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '16:00',
        isAvailable: true
      });
    }
  }
  await prisma.facultyAvailability.createMany({ data: availabilities });

  // 5. Create Subjects (30 records)
  const subjectsData = [
    { name: 'Analysis of Algorithms', code: 'CSE301', credits: 4, semester: 3, departmentId: cseId, facultyId: facs[0].id },
    { name: 'Web Engineering', code: 'CSE302', credits: 3, semester: 3, departmentId: cseId, facultyId: facs[1].id },
    { name: 'Database Management Systems', code: 'CSE303', credits: 4, semester: 3, departmentId: cseId, facultyId: facs[3].id },
    { name: 'Operating Systems', code: 'CSE501', credits: 4, semester: 5, departmentId: cseId, facultyId: facs[5].id },
    { name: 'Computer Networks', code: 'CSE502', credits: 4, semester: 5, departmentId: cseId, facultyId: facs[6].id },
    { name: 'Theory of Computation', code: 'CSE503', credits: 3, semester: 5, departmentId: cseId, facultyId: facs[11].id },
    { name: 'Software Engineering', code: 'CSE701', credits: 4, semester: 7, departmentId: cseId, facultyId: facs[13].id },
    { name: 'Artificial Intelligence', code: 'CSE702', credits: 3, semester: 7, departmentId: cseId, facultyId: facs[15].id },
    { name: 'Compiler Design', code: 'CSE703', credits: 4, semester: 7, departmentId: cseId, facultyId: facs[9].id },
    { name: 'Cryptography & Security', code: 'CSE801', credits: 3, semester: 7, departmentId: cseId, facultyId: facs[18].id },

    { name: 'Digital System Design', code: 'ECE301', credits: 4, semester: 3, departmentId: eceId, facultyId: facs[2].id },
    { name: 'Signals and Systems', code: 'ECE302', credits: 4, semester: 3, departmentId: eceId, facultyId: facs[4].id },
    { name: 'Analog Circuits', code: 'ECE303', credits: 3, semester: 3, departmentId: eceId, facultyId: facs[14].id },
    { name: 'Microprocessors', code: 'ECE501', credits: 4, semester: 5, departmentId: eceId, facultyId: facs[2].id },
    { name: 'Electromagnetics', code: 'ECE502', credits: 3, semester: 5, departmentId: eceId, facultyId: facs[4].id },

    { name: 'Fluid Mechanics', code: 'ME301', credits: 4, semester: 3, departmentId: meId, facultyId: facs[16].id },
    { name: 'Thermodynamics', code: 'ME302', credits: 4, semester: 3, departmentId: meId, facultyId: facs[16].id },
    { name: 'Kinematics of Machinery', code: 'ME501', credits: 3, semester: 5, departmentId: meId, facultyId: facs[16].id },

    { name: 'Basic Electrical Eng', code: 'EE301', credits: 4, semester: 3, departmentId: eeId, facultyId: facs[19].id },
    { name: 'Control Systems', code: 'EE501', credits: 4, semester: 5, departmentId: eeId, facultyId: facs[19].id },

    { name: 'Introduction to IT', code: 'IT301', credits: 3, semester: 3, departmentId: itId, facultyId: facs[8].id },
    { name: 'Object Oriented Prog', code: 'IT302', credits: 4, semester: 3, departmentId: itId, facultyId: facs[10].id },
    { name: 'Cloud Computing', code: 'IT501', credits: 4, semester: 5, departmentId: itId, facultyId: facs[12].id },
    { name: 'Information Security', code: 'IT701', credits: 4, semester: 7, departmentId: itId, facultyId: facs[17].id },

    { name: 'Discrete Structures', code: 'CSE304', credits: 4, semester: 3, departmentId: cseId, facultyId: facs[7].id },
    { name: 'Data Structures', code: 'CSE305', credits: 4, semester: 3, departmentId: cseId, facultyId: facs[11].id },
    { name: 'Distributed Systems', code: 'CSE704', credits: 3, semester: 7, departmentId: cseId, facultyId: facs[5].id },
    { name: 'Embedded Systems', code: 'ECE701', credits: 4, semester: 7, departmentId: eceId, facultyId: facs[14].id },
    { name: 'Power Systems', code: 'EE701', credits: 4, semester: 7, departmentId: eeId, facultyId: facs[19].id },
    { name: 'Mobile Computing', code: 'IT702', credits: 3, semester: 7, departmentId: itId, facultyId: facs[8].id }
  ];

  for (const s of subjectsData) {
    await prisma.subject.create({ data: s });
  }

  // 6. Create Classes (15 records)
  const classesData = [
    { departmentId: cseId, semester: 3, section: 'A', strength: 60 },
    { departmentId: cseId, semester: 3, section: 'B', strength: 55 },
    { departmentId: cseId, semester: 5, section: 'A', strength: 50 },
    { departmentId: cseId, semester: 5, section: 'B', strength: 48 },
    { departmentId: cseId, semester: 7, section: 'A', strength: 52 },

    { departmentId: eceId, semester: 3, section: 'A', strength: 40 },
    { departmentId: eceId, semester: 3, section: 'B', strength: 42 },
    { departmentId: eceId, semester: 5, section: 'A', strength: 45 },
    { departmentId: eceId, semester: 7, section: 'A', strength: 38 },

    { departmentId: meId, semester: 3, section: 'A', strength: 35 },
    { departmentId: meId, semester: 5, section: 'A', strength: 32 },

    { departmentId: eeId, semester: 3, section: 'A', strength: 30 },
    { departmentId: eeId, semester: 5, section: 'A', strength: 30 },

    { departmentId: itId, semester: 3, section: 'A', strength: 50 },
    { departmentId: itId, semester: 5, section: 'A', strength: 45 }
  ];
  await prisma.class.createMany({ data: classesData });

  // 7. Academic Calendar (15 records)
  const calendarData = [
    { date: '2026-08-15', type: 'HOLIDAY', description: 'Independence Day' },
    { date: '2026-09-05', type: 'SPECIAL_EVENT', description: "Teacher's Day Celebration" },
    { date: '2026-10-02', type: 'HOLIDAY', description: 'Gandhi Jayanti' },
    { date: '2026-11-01', type: 'SPECIAL_EVENT', description: 'Hackathon Kickoff' },
    { date: '2026-11-12', type: 'HOLIDAY', description: 'Diwali Festival Holiday' },
    { date: '2026-11-13', type: 'HOLIDAY', description: 'Diwali Additional Holiday' },
    { date: '2026-12-01', type: 'EXAM_DAY', description: 'End Semester Theory Exams Begin' },
    { date: '2026-12-15', type: 'EXAM_DAY', description: 'End Semester Practical Labs Begin' },
    { date: '2026-12-25', type: 'HOLIDAY', description: 'Christmas Vacation Day' },
    { date: '2027-01-01', type: 'HOLIDAY', description: 'New Year Day' },
    { date: '2027-01-14', type: 'HOLIDAY', description: 'Pongal / Makar Sankranti Festival' },
    { date: '2027-01-26', type: 'HOLIDAY', description: 'Republic Day Celebration' },
    { date: '2027-02-10', type: 'SPECIAL_EVENT', description: 'Annual TechFest Symposium' },
    { date: '2027-03-05', type: 'SPECIAL_EVENT', description: 'Sports Meet Championship' },
    { date: '2027-03-12', type: 'HOLIDAY', description: 'Holi Festival Celebration' }
  ];
  await prisma.academicCalendar.createMany({ data: calendarData });

  // 8. Workload Request Logs (10 records)
  const workloadRequests = [];
  for (let i = 0; i < 10; i++) {
    workloadRequests.push({
      facultyId: facs[i % facs.length].id,
      type: i % 2 === 0 ? 'INCREASE' : 'DECREASE',
      amount: 2 + (i % 3),
      status: 'APPROVED',
      suggestion: `AI System automatically processed adjustment log ${i + 1} hours for parity.`
    });
  }
  await prisma.workloadRequest.createMany({ data: workloadRequests });

  // 9. System Audit Logs (15 records)
  const auditLogs = [];
  for (let i = 0; i < 15; i++) {
    auditLogs.push({
      userId: adminUser.id,
      action: 'SYSTEM_CONFIG',
      details: `Administrative setup activity #${i + 1} recorded successfully.`
    });
  }
  await prisma.auditLog.createMany({ data: auditLogs });

  console.log('Database seeded with 250+ records successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
