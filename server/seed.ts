import { storage } from "./storage";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  const existingUsers = await storage.getUsers();

  if (existingUsers.length === 0) {
    console.log("Creating default admin user...");
    const hashedPassword = await bcrypt.hash("admin", 10);
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      fullName: "Administrator",
      role: "admin",
      studentId: null,
    });
    console.log("Default admin created (username: admin, password: admin123)");
  }

  const existingStudents = await storage.getStudents();
  if (existingStudents.length > 0) {
    await ensureDemoUsers(existingStudents);
    return;
  }

  console.log("Seeding database...");

  const students = await Promise.all([
    storage.createStudent({ firstName: "Ahmed", lastName: "Ben Ali", email: "ahmed.benali@email.com", phone: "+216 22 345 678", dateOfBirth: "2010-03-15", guardianName: "Mohamed Ben Ali", guardianPhone: "+216 98 765 432" }),
    storage.createStudent({ firstName: "Fatma", lastName: "Trabelsi", email: "fatma.trabelsi@email.com", phone: "+216 23 456 789", dateOfBirth: "2011-07-22", guardianName: "Salma Trabelsi", guardianPhone: "+216 97 654 321" }),
    storage.createStudent({ firstName: "Youssef", lastName: "Hammami", email: "youssef.h@email.com", phone: "+216 24 567 890", dateOfBirth: "2009-11-08", guardianName: "Karim Hammami", guardianPhone: "+216 96 543 210" }),
    storage.createStudent({ firstName: "Mariem", lastName: "Bouazizi", email: "mariem.b@email.com", phone: "+216 25 678 901", dateOfBirth: "2010-09-30", guardianName: "Nadia Bouazizi", guardianPhone: "+216 95 432 109" }),
    storage.createStudent({ firstName: "Amine", lastName: "Gharbi", email: "amine.gharbi@email.com", phone: "+216 26 789 012", dateOfBirth: "2011-01-14", guardianName: "Hichem Gharbi", guardianPhone: "+216 94 321 098" }),
  ]);

  const training1 = await storage.createTraining({ name: "Robotics Fundamentals", description: "Introduction to robotics, electronics, and programming for beginners", startDate: "2025-09-01", status: "active" });
  const training2 = await storage.createTraining({ name: "Web Development", description: "Learn HTML, CSS, JavaScript and build web applications", startDate: "2025-10-15", status: "active" });
  const training3 = await storage.createTraining({ name: "Arduino & IoT", description: "Hands-on projects with Arduino boards and IoT sensors", startDate: "2026-01-10", status: "active" });

  for (const training of [training1, training2, training3]) {
    for (let i = 1; i <= 4; i++) {
      const level = await storage.createLevel({
        trainingId: training.id,
        levelNumber: i,
        name: `Level ${i}`,
      });
      for (let j = 1; j <= 6; j++) {
        await storage.createSession({
          levelId: level.id,
          sessionNumber: j,
          title: `Session ${j}`,
          date: null,
        });
      }
    }
  }

  await storage.createEnrollment({ studentId: students[0].id, trainingId: training1.id, currentLevel: 1, enrolled: true });
  await storage.createEnrollment({ studentId: students[1].id, trainingId: training1.id, currentLevel: 1, enrolled: true });
  await storage.createEnrollment({ studentId: students[2].id, trainingId: training1.id, currentLevel: 1, enrolled: true });
  await storage.createEnrollment({ studentId: students[0].id, trainingId: training2.id, currentLevel: 1, enrolled: true });
  await storage.createEnrollment({ studentId: students[3].id, trainingId: training2.id, currentLevel: 1, enrolled: true });
  await storage.createEnrollment({ studentId: students[4].id, trainingId: training3.id, currentLevel: 1, enrolled: true });
  await storage.createEnrollment({ studentId: students[2].id, trainingId: training3.id, currentLevel: 1, enrolled: true });

  const t1Levels = await storage.getLevelsByTraining(training1.id);
  for (const level of t1Levels) {
    const levelSessions = await storage.getSessionsByLevel(level.id);
    for (const session of levelSessions) {
      await storage.upsertAttendance({ studentId: students[0].id, sessionId: session.id, present: true, markedAt: new Date().toISOString() });
      if (level.levelNumber <= 2) {
        await storage.upsertAttendance({ studentId: students[1].id, sessionId: session.id, present: true, markedAt: new Date().toISOString() });
      }
      if (session.sessionNumber <= 3) {
        await storage.upsertAttendance({ studentId: students[2].id, sessionId: session.id, present: true, markedAt: new Date().toISOString() });
      }
    }
  }

  const hashedTrainerPw = await bcrypt.hash("trainer123", 10);
  const trainerUser = await storage.createUser({
    username: "trainer1",
    password: hashedTrainerPw,
    fullName: "Mohamed Encadrant",
    role: "trainer",
    studentId: null,
  });
  await storage.createTrainerAssignment({ userId: trainerUser.id, trainingId: training1.id });
  await storage.createTrainerAssignment({ userId: trainerUser.id, trainingId: training2.id });

  const hashedStudentPw = await bcrypt.hash("student123", 10);
  await storage.createUser({
    username: "ahmed",
    password: hashedStudentPw,
    fullName: "Ahmed Ben Ali",
    role: "student",
    studentId: students[0].id,
  });

  console.log("Database seeded successfully!");
  console.log("Demo accounts: admin/admin123, trainer1/trainer123, ahmed/student123");
}

async function ensureDemoUsers(existingStudents: { id: number; firstName: string; lastName: string }[]) {
  const existingTrainer = await storage.getUserByUsername("trainer1");
  if (!existingTrainer) {
    console.log("Creating demo trainer user...");
    const hashedPw = await bcrypt.hash("trainer123", 10);
    const trainer = await storage.createUser({
      username: "trainer1",
      password: hashedPw,
      fullName: "Mohamed Encadrant",
      role: "trainer",
      studentId: null,
    });
    const trainings = await storage.getTrainings();
    for (const t of trainings.slice(0, 2)) {
      await storage.createTrainerAssignment({ userId: trainer.id, trainingId: t.id });
    }
    console.log("Demo trainer created (trainer1/trainer123)");
  }

  const existingStudent = await storage.getUserByUsername("ahmed");
  if (!existingStudent) {
    console.log("Creating demo student user...");
    const ahmed = existingStudents.find((s) => s.firstName === "Ahmed" && s.lastName === "Ben Ali");
    const hashedPw = await bcrypt.hash("student123", 10);
    await storage.createUser({
      username: "ahmed",
      password: hashedPw,
      fullName: "Ahmed Ben Ali",
      role: "student",
      studentId: ahmed?.id || null,
    });
    console.log("Demo student created (ahmed/student123)");
  }
}
