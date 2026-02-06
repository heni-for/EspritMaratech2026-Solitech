import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertTrainingSchema, insertEnrollmentSchema } from "@shared/schema";
import bcrypt from "bcrypt";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(req.session.role!)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Auth ───
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
    });
  });

  // ─── Users (Admin only) ───
  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    const allUsers = await storage.getUsers();
    const safeUsers = allUsers.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      studentId: u.studentId,
    }));
    res.json(safeUsers);
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    const { username, password, fullName, role, studentId } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ message: "username, password, fullName, and role are required" });
    }
    if (!["admin", "trainer", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be admin, trainer, or student" });
    }

    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await storage.createUser({
      username,
      password: hashed,
      fullName,
      role,
      studentId: studentId || null,
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
    });
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
    const { fullName, role, studentId, password } = req.body;
    const updateData: Record<string, any> = {};
    if (fullName) updateData.fullName = fullName;
    if (role && ["admin", "trainer", "student"].includes(role)) updateData.role = role;
    if (studentId !== undefined) updateData.studentId = studentId;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await storage.updateUser(req.params.id, updateData);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
    });
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  });

  // ─── Trainer Assignments (Admin only) ───
  app.get("/api/trainer-assignments", requireRole("admin"), async (_req, res) => {
    const allAssignments = await storage.getAllTrainerAssignments();
    const enriched = await Promise.all(
      allAssignments.map(async (a) => {
        const training = await storage.getTraining(a.trainingId);
        return { ...a, trainingName: training?.name || "Unknown" };
      })
    );
    res.json(enriched);
  });

  app.get("/api/trainer-assignments/:userId", requireRole("admin", "trainer"), async (req, res) => {
    const assignments = await storage.getTrainerAssignments(req.params.userId);
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const training = await storage.getTraining(a.trainingId);
        return { ...a, trainingName: training?.name || "Unknown" };
      })
    );
    res.json(enriched);
  });

  app.post("/api/trainer-assignments", requireRole("admin"), async (req, res) => {
    const { userId, trainingId } = req.body;
    if (!userId || !trainingId) {
      return res.status(400).json({ message: "userId and trainingId are required" });
    }
    const assignment = await storage.createTrainerAssignment({ userId, trainingId });
    res.status(201).json(assignment);
  });

  app.delete("/api/trainer-assignments/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteTrainerAssignment(parseInt(req.params.id));
    res.json({ message: "Assignment removed" });
  });

  // ─── Students ───
  app.get("/api/students", requireRole("admin", "trainer"), async (_req, res) => {
    const allStudents = await storage.getStudents();
    res.json(allStudents);
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);

    if (req.session.role === "student") {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.studentId !== id) {
        return res.status(403).json({ message: "You can only view your own profile" });
      }
    }

    const student = await storage.getStudent(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const studentEnrollments = await storage.getEnrollmentsByStudent(id);
    const enrichedEnrollments = [];

    for (const enrollment of studentEnrollments) {
      const training = await storage.getTraining(enrollment.trainingId);
      if (!training) continue;

      const trainingLevels = await storage.getLevelsByTraining(training.id);
      let totalSessions = 0;
      let attendedSessions = 0;
      let levelsCompleted = 0;

      for (const level of trainingLevels) {
        const levelSessions = await storage.getSessionsByLevel(level.id);
        totalSessions += levelSessions.length;

        let allAttended = true;
        for (const session of levelSessions) {
          const attendanceRecords = await storage.getAttendanceBySession(session.id);
          const studentAttendance = attendanceRecords.find(
            (a) => a.studentId === id && a.present
          );
          if (studentAttendance) {
            attendedSessions++;
          } else {
            allAttended = false;
          }
        }
        if (allAttended && levelSessions.length > 0) {
          levelsCompleted++;
        }
      }

      const eligible = levelsCompleted >= 4;

      enrichedEnrollments.push({
        enrollment,
        training,
        totalSessions,
        attendedSessions,
        levelsCompleted,
        totalLevels: 4,
        eligible,
      });
    }

    const studentAttendance = await storage.getAttendanceByStudent(id);
    const attendanceHistory = [];

    for (const record of studentAttendance) {
      const session = await storage.getSession(record.sessionId);
      if (!session) continue;

      const allLevels = await Promise.all(
        (await storage.getTrainings()).map(async (t) => {
          const lvls = await storage.getLevelsByTraining(t.id);
          return lvls.map((l) => ({ ...l, trainingName: t.name }));
        })
      );
      const flatLevels = allLevels.flat();
      const level = flatLevels.find((l) => l.id === session.levelId);

      attendanceHistory.push({
        sessionTitle: session.title,
        trainingName: level?.trainingName || "Unknown",
        levelName: level?.name || "Unknown",
        date: record.markedAt || "",
        present: record.present,
      });
    }

    res.json({ student, enrollments: enrichedEnrollments, attendanceHistory });
  });

  app.post("/api/students", requireRole("admin"), async (req, res) => {
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const student = await storage.createStudent(parsed.data);
    res.status(201).json(student);
  });

  // ─── Trainings ───
  app.get("/api/trainings", requireAuth, async (req, res) => {
    if (req.session.role === "trainer") {
      const assignments = await storage.getTrainerAssignments(req.session.userId!);
      const assignedIds = assignments.map((a) => a.trainingId);
      const allTrainings = await storage.getTrainings();
      const filtered = allTrainings.filter((t) => assignedIds.includes(t.id));
      const enriched = await Promise.all(
        filtered.map(async (t) => {
          const enrolled = await storage.getEnrollmentsByTraining(t.id);
          const lvls = await storage.getLevelsByTraining(t.id);
          return { ...t, enrolledCount: enrolled.length, levelsCount: lvls.length };
        })
      );
      return res.json(enriched);
    }

    const allTrainings = await storage.getTrainings();
    const enriched = await Promise.all(
      allTrainings.map(async (t) => {
        const enrolled = await storage.getEnrollmentsByTraining(t.id);
        const lvls = await storage.getLevelsByTraining(t.id);
        return { ...t, enrolledCount: enrolled.length, levelsCount: lvls.length };
      })
    );
    res.json(enriched);
  });

  app.get("/api/trainings/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const training = await storage.getTraining(id);
    if (!training) return res.status(404).json({ message: "Training not found" });

    if (req.session.role === "trainer") {
      const assignments = await storage.getTrainerAssignments(req.session.userId!);
      if (!assignments.some((a) => a.trainingId === id)) {
        return res.status(403).json({ message: "Not assigned to this training" });
      }
    }

    const trainingLevels = await storage.getLevelsByTraining(id);
    const levelsWithSessions = await Promise.all(
      trainingLevels.map(async (level) => {
        const levelSessions = await storage.getSessionsByLevel(level.id);
        return { ...level, sessions: levelSessions };
      })
    );

    const trainingEnrollments = await storage.getEnrollmentsByTraining(id);
    const enrolledStudents = await Promise.all(
      trainingEnrollments.map(async (enrollment) => {
        const student = await storage.getStudent(enrollment.studentId);
        if (!student) return null;

        let attendedSessions = 0;
        let totalSessions = 0;
        let levelsCompleted = 0;

        for (const level of trainingLevels) {
          const levelSessions = await storage.getSessionsByLevel(level.id);
          totalSessions += levelSessions.length;
          let allAttended = true;

          for (const session of levelSessions) {
            const records = await storage.getAttendanceBySession(session.id);
            const studentRecord = records.find(
              (a) => a.studentId === enrollment.studentId && a.present
            );
            if (studentRecord) attendedSessions++;
            else allAttended = false;
          }
          if (allAttended && levelSessions.length > 0) levelsCompleted++;
        }

        return {
          student,
          enrollment,
          attendedSessions,
          totalSessions,
          levelsCompleted,
          eligible: levelsCompleted >= 4,
        };
      })
    );

    res.json({
      training,
      levels: levelsWithSessions,
      enrolledStudents: enrolledStudents.filter(Boolean),
    });
  });

  app.post("/api/trainings", requireRole("admin"), async (req, res) => {
    const parsed = insertTrainingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const training = await storage.createTraining(parsed.data);

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

    res.status(201).json(training);
  });

  // ─── Enrollments ───
  app.post("/api/enrollments", requireRole("admin"), async (req, res) => {
    const { studentId, trainingId } = req.body;
    if (!studentId || !trainingId || typeof studentId !== "number" || typeof trainingId !== "number") {
      return res.status(400).json({ message: "Valid studentId and trainingId are required" });
    }

    const student = await storage.getStudent(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const training = await storage.getTraining(trainingId);
    if (!training) return res.status(404).json({ message: "Training not found" });

    const existing = await storage.getEnrollment(studentId, trainingId);
    if (existing) {
      return res.status(400).json({ message: "Student is already enrolled in this training" });
    }

    const enrollment = await storage.createEnrollment({
      studentId,
      trainingId,
      currentLevel: 1,
      enrolled: true,
    });
    res.status(201).json(enrollment);
  });

  // ─── Attendance ───
  app.get("/api/attendance/options", requireRole("admin", "trainer"), async (req, res) => {
    let trainingsList;
    if (req.session.role === "trainer") {
      const assignments = await storage.getTrainerAssignments(req.session.userId!);
      const assignedIds = assignments.map((a) => a.trainingId);
      const allTrainings = await storage.getTrainings();
      trainingsList = allTrainings.filter((t) => assignedIds.includes(t.id));
    } else {
      trainingsList = await storage.getTrainings();
    }

    const options = await Promise.all(
      trainingsList.map(async (t) => {
        const lvls = await storage.getLevelsByTraining(t.id);
        const levelsWithSessions = await Promise.all(
          lvls.map(async (l) => {
            const sess = await storage.getSessionsByLevel(l.id);
            return {
              id: l.id,
              levelNumber: l.levelNumber,
              name: l.name,
              sessions: sess.map((s) => ({
                id: s.id,
                sessionNumber: s.sessionNumber,
                title: s.title,
              })),
            };
          })
        );
        return { id: t.id, name: t.name, levels: levelsWithSessions };
      })
    );
    res.json(options);
  });

  app.get("/api/attendance/:sessionId", requireRole("admin", "trainer"), async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    const session = await storage.getSession(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const allLevels = await Promise.all(
      (await storage.getTrainings()).map((t) => storage.getLevelsByTraining(t.id))
    );
    const flatLevels = allLevels.flat();
    const level = flatLevels.find((l) => l.id === session.levelId);
    if (!level) return res.status(404).json({ message: "Level not found" });

    if (req.session.role === "trainer") {
      const assignments = await storage.getTrainerAssignments(req.session.userId!);
      if (!assignments.some((a) => a.trainingId === level.trainingId)) {
        return res.status(403).json({ message: "Not assigned to this training" });
      }
    }

    const trainingEnrollments = await storage.getEnrollmentsByTraining(level.trainingId);
    const existingAttendance = await storage.getAttendanceBySession(sessionId);

    const records = await Promise.all(
      trainingEnrollments.map(async (enrollment) => {
        const student = await storage.getStudent(enrollment.studentId);
        const attendanceRecord = existingAttendance.find(
          (a) => a.studentId === enrollment.studentId
        );
        return {
          studentId: enrollment.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          present: attendanceRecord?.present ?? false,
        };
      })
    );

    res.json(records);
  });

  app.post("/api/attendance/bulk", requireRole("admin", "trainer"), async (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ message: "records array is required" });
    }

    if (req.session.role === "trainer" && records.length > 0) {
      const assignments = await storage.getTrainerAssignments(req.session.userId!);
      const assignedTrainingIds = new Set(assignments.map((a) => a.trainingId));

      const allLevels = await Promise.all(
        (await storage.getTrainings()).map((t) => storage.getLevelsByTraining(t.id))
      );
      const flatLevels = allLevels.flat();

      for (const record of records) {
        const session = await storage.getSession(record.sessionId);
        if (!session) continue;
        const level = flatLevels.find((l) => l.id === session.levelId);
        if (!level || !assignedTrainingIds.has(level.trainingId)) {
          return res.status(403).json({ message: "Not assigned to this training" });
        }
      }
    }

    const now = new Date().toISOString();
    const results = await Promise.all(
      records.map((r: { studentId: number; sessionId: number; present: boolean }) =>
        storage.upsertAttendance({
          studentId: r.studentId,
          sessionId: r.sessionId,
          present: r.present,
          markedAt: now,
        })
      )
    );

    res.json(results);
  });

  // ─── Certificates ───
  app.get("/api/certificates", requireRole("admin"), async (_req, res) => {
    const certs = await storage.getCertificates();
    const enriched = await Promise.all(
      certs.map(async (cert) => {
        const student = await storage.getStudent(cert.studentId);
        const training = await storage.getTraining(cert.trainingId);
        return {
          ...cert,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          trainingName: training?.name || "Unknown",
        };
      })
    );
    res.json(enriched);
  });

  app.get("/api/certificates/eligible", requireRole("admin"), async (_req, res) => {
    const allTrainings = await storage.getTrainings();
    const eligibleStudents = [];

    for (const training of allTrainings) {
      const trainingEnrollments = await storage.getEnrollmentsByTraining(training.id);
      const trainingLevels = await storage.getLevelsByTraining(training.id);

      for (const enrollment of trainingEnrollments) {
        let levelsCompleted = 0;

        for (const level of trainingLevels) {
          const levelSessions = await storage.getSessionsByLevel(level.id);
          let allPresent = levelSessions.length > 0;

          for (const session of levelSessions) {
            const records = await storage.getAttendanceBySession(session.id);
            const studentRecord = records.find(
              (a) => a.studentId === enrollment.studentId && a.present
            );
            if (!studentRecord) {
              allPresent = false;
              break;
            }
          }
          if (allPresent) levelsCompleted++;
        }

        if (levelsCompleted >= 4) {
          const student = await storage.getStudent(enrollment.studentId);
          const existingCert = await storage.getCertificate(
            enrollment.studentId,
            training.id
          );

          eligibleStudents.push({
            studentId: enrollment.studentId,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : "Unknown",
            trainingId: training.id,
            trainingName: training.name,
            completedLevels: levelsCompleted,
            totalLevels: 4,
            alreadyCertified: !!existingCert,
            certificateNumber: existingCert?.certificateNumber,
          });
        }
      }
    }

    res.json(eligibleStudents);
  });

  app.post("/api/certificates", requireRole("admin"), async (req, res) => {
    const { studentId, trainingId } = req.body;
    if (!studentId || !trainingId || typeof studentId !== "number" || typeof trainingId !== "number") {
      return res.status(400).json({ message: "Valid studentId and trainingId are required" });
    }

    const student = await storage.getStudent(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const training = await storage.getTraining(trainingId);
    if (!training) return res.status(404).json({ message: "Training not found" });

    const existing = await storage.getCertificate(studentId, trainingId);
    if (existing) {
      return res.status(400).json({ message: "Certificate already issued" });
    }

    const trainingLevels = await storage.getLevelsByTraining(trainingId);
    let levelsCompleted = 0;
    for (const level of trainingLevels) {
      const levelSessions = await storage.getSessionsByLevel(level.id);
      let allPresent = levelSessions.length > 0;
      for (const session of levelSessions) {
        const records = await storage.getAttendanceBySession(session.id);
        const studentRecord = records.find((a) => a.studentId === studentId && a.present);
        if (!studentRecord) { allPresent = false; break; }
      }
      if (allPresent) levelsCompleted++;
    }

    if (levelsCompleted < 4) {
      return res.status(400).json({ message: "Student has not completed all 4 levels" });
    }

    const now = new Date();
    const certificateNumber = `ASTBA-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(studentId).padStart(3, "0")}${String(trainingId).padStart(3, "0")}`;

    const cert = await storage.createCertificate({
      studentId,
      trainingId,
      issuedAt: now.toISOString().split("T")[0],
      certificateNumber,
    });
    res.status(201).json(cert);
  });

  // ─── Student self-service endpoints ───
  app.get("/api/my/dashboard", requireRole("student"), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || !user.studentId) {
      return res.status(400).json({ message: "No student profile linked" });
    }

    const student = await storage.getStudent(user.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const myEnrollments = await storage.getEnrollmentsByStudent(user.studentId);
    const formations = [];

    for (const enrollment of myEnrollments) {
      const training = await storage.getTraining(enrollment.trainingId);
      if (!training) continue;

      const trainingLevels = await storage.getLevelsByTraining(training.id);
      let totalSessions = 0;
      let attendedSessions = 0;
      let levelsCompleted = 0;

      for (const level of trainingLevels) {
        const levelSessions = await storage.getSessionsByLevel(level.id);
        totalSessions += levelSessions.length;
        let allAttended = levelSessions.length > 0;

        for (const session of levelSessions) {
          const records = await storage.getAttendanceBySession(session.id);
          const myRecord = records.find((a) => a.studentId === user.studentId! && a.present);
          if (myRecord) attendedSessions++;
          else allAttended = false;
        }
        if (allAttended && levelSessions.length > 0) levelsCompleted++;
      }

      const eligible = levelsCompleted >= 4;
      const existingCert = await storage.getCertificate(user.studentId, training.id);

      let status = "In Progress";
      if (existingCert) status = "Certified";
      else if (eligible) status = "Eligible for Certification";

      formations.push({
        training,
        currentLevel: enrollment.currentLevel,
        totalSessions,
        attendedSessions,
        levelsCompleted,
        totalLevels: 4,
        progress: totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0,
        eligible,
        status,
        certificateNumber: existingCert?.certificateNumber,
      });
    }

    const allAttendance = await storage.getAttendanceByStudent(user.studentId);
    const attendanceHistory = [];
    for (const record of allAttendance) {
      const session = await storage.getSession(record.sessionId);
      if (!session) continue;
      const allLevels = await Promise.all(
        (await storage.getTrainings()).map(async (t) => {
          const lvls = await storage.getLevelsByTraining(t.id);
          return lvls.map((l) => ({ ...l, trainingName: t.name }));
        })
      );
      const flatLevels = allLevels.flat();
      const level = flatLevels.find((l) => l.id === session.levelId);
      attendanceHistory.push({
        sessionTitle: session.title,
        trainingName: level?.trainingName || "Unknown",
        levelName: level?.name || "Unknown",
        date: record.markedAt || "",
        present: record.present,
      });
    }

    const myCerts = await storage.getCertificatesByStudent(user.studentId);
    const enrichedCerts = await Promise.all(
      myCerts.map(async (c) => {
        const t = await storage.getTraining(c.trainingId);
        return { ...c, trainingName: t?.name || "Unknown" };
      })
    );

    res.json({
      student,
      formations,
      attendanceHistory,
      certificates: enrichedCerts,
    });
  });

  // ─── Trainer dashboard ───
  app.get("/api/trainer/dashboard", requireRole("trainer"), async (req, res) => {
    const assignments = await storage.getTrainerAssignments(req.session.userId!);
    const assignedTrainings = [];

    for (const assignment of assignments) {
      const training = await storage.getTraining(assignment.trainingId);
      if (!training) continue;

      const trainingEnrollments = await storage.getEnrollmentsByTraining(training.id);
      const trainingLevels = await storage.getLevelsByTraining(training.id);

      let totalPossible = 0;
      let totalAttended = 0;

      for (const enrollment of trainingEnrollments) {
        for (const level of trainingLevels) {
          const levelSessions = await storage.getSessionsByLevel(level.id);
          totalPossible += levelSessions.length;
          for (const session of levelSessions) {
            const records = await storage.getAttendanceBySession(session.id);
            const found = records.find((a) => a.studentId === enrollment.studentId && a.present);
            if (found) totalAttended++;
          }
        }
      }

      assignedTrainings.push({
        training,
        enrolledCount: trainingEnrollments.length,
        levelsCount: trainingLevels.length,
        avgAttendance: totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0,
      });
    }

    res.json({ assignedTrainings });
  });

  // ─── Dashboard (Admin) ───
  app.get("/api/dashboard/stats", requireRole("admin"), async (_req, res) => {
    const totalStudents = await storage.getStudentCount();
    const activeTrainings = await storage.getActiveTrainingCount();
    const certificatesIssued = await storage.getCertificateCount();
    const todayAttendance = await storage.getTodayAttendanceCount();

    const allTrainings = await storage.getTrainings();
    const allStudents = await storage.getStudents();
    const allCertificates = await storage.getCertificates();

    let totalPresent = 0;
    let totalAbsent = 0;
    let eligibleCount = 0;

    const trainingProgress = await Promise.all(
      allTrainings.map(async (t) => {
        const enrolled = await storage.getEnrollmentsByTraining(t.id);
        const trainingLevels = await storage.getLevelsByTraining(t.id);
        let totalPossible = 0;
        let totalAttended = 0;
        let completedCount = 0;

        for (const enrollment of enrolled) {
          let studentLevelsCompleted = 0;
          for (const level of trainingLevels) {
            const levelSessions = await storage.getSessionsByLevel(level.id);
            totalPossible += levelSessions.length;
            let allPresent = levelSessions.length > 0;

            for (const session of levelSessions) {
              const records = await storage.getAttendanceBySession(session.id);
              const studentRecord = records.find(
                (a) => a.studentId === enrollment.studentId && a.present
              );
              if (studentRecord) totalAttended++;
              else allPresent = false;
            }
            if (allPresent) studentLevelsCompleted++;
          }
          if (studentLevelsCompleted >= 4) completedCount++;
        }

        return {
          trainingId: t.id,
          trainingName: t.name,
          enrolledCount: enrolled.length,
          completedCount,
          avgProgress: totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0,
        };
      })
    );

    const attendanceChartData: { label: string; present: number; absent: number }[] = [];
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayRecords = await storage.getAttendanceByDate(dateStr);
      const presentCount = dayRecords.filter((r) => r.present).length;
      const absentCount = dayRecords.filter((r) => !r.present).length;
      totalPresent += presentCount;
      totalAbsent += absentCount;
      attendanceChartData.push({
        label: days[d.getDay()],
        present: presentCount,
        absent: absentCount,
      });
    }

    const attendanceRate = totalPresent + totalAbsent > 0
      ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
      : 0;

    const recentAttendance = await storage.getRecentAttendance(10);
    const recentActivity = await Promise.all(
      recentAttendance.map(async (record) => {
        const student = await storage.getStudent(record.studentId);
        const session = await storage.getSession(record.sessionId);
        let trainingName = "Inconnu";
        if (session) {
          const allLvls = await Promise.all(
            allTrainings.map((t) => storage.getLevelsByTraining(t.id))
          );
          const flatLvls = allLvls.flat();
          const lvl = flatLvls.find((l) => l.id === session.levelId);
          if (lvl) {
            const tr = allTrainings.find((t) => t.id === lvl.trainingId);
            if (tr) trainingName = tr.name;
          }
        }
        return {
          id: record.id,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Inconnu",
          trainingName,
          sessionTitle: session?.title || "",
          present: record.present,
          markedAt: record.markedAt || "",
        };
      })
    );

    for (const tp of trainingProgress) {
      eligibleCount += tp.completedCount;
    }
    const alreadyCertified = allCertificates.length;
    const eligibleNotCertified = Math.max(0, eligibleCount - alreadyCertified);

    const alerts: { type: string; message: string; severity: string }[] = [];

    for (const student of allStudents) {
      const studentAttendance = await storage.getAttendanceByStudent(student.id);
      const absentRecords = studentAttendance.filter((a) => !a.present);
      if (absentRecords.length >= 5) {
        alerts.push({
          type: "absence",
          message: `${student.firstName} ${student.lastName} a ${absentRecords.length} absences`,
          severity: absentRecords.length >= 10 ? "high" : "medium",
        });
      }
    }

    const allEnrollments = await Promise.all(
      allTrainings.map(async (t) => {
        const enrolled = await storage.getEnrollmentsByTraining(t.id);
        return enrolled.map((e) => ({ ...e, trainingName: t.name }));
      })
    );
    const flatEnrollments = allEnrollments.flat();

    for (const enrollment of flatEnrollments) {
      const trainingLevels = await storage.getLevelsByTraining(enrollment.trainingId);
      let sessionsAttended = 0;
      let totalSessions = 0;
      for (const level of trainingLevels) {
        const levelSessions = await storage.getSessionsByLevel(level.id);
        totalSessions += levelSessions.length;
        for (const session of levelSessions) {
          const records = await storage.getAttendanceBySession(session.id);
          if (records.find((a) => a.studentId === enrollment.studentId && a.present)) {
            sessionsAttended++;
          }
        }
      }
      const remaining = totalSessions - sessionsAttended;
      if (remaining > 0 && remaining <= 3 && sessionsAttended > 0) {
        const student = await storage.getStudent(enrollment.studentId);
        if (student) {
          alerts.push({
            type: "near_completion",
            message: `${student.firstName} ${student.lastName} - il reste ${remaining} seance(s) pour "${(enrollment as any).trainingName}"`,
            severity: "info",
          });
        }
      }
    }

    const allUsers = await storage.getUsers();
    const totalUsers = allUsers.length;
    const trainerCount = allUsers.filter((u) => u.role === "trainer").length;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const certificatesThisMonth = allCertificates.filter(
      (c) => c.issuedAt && c.issuedAt.startsWith(thisMonth)
    ).length;

    res.json({
      totalStudents,
      activeTrainings,
      todayAttendance,
      certificatesIssued,
      attendanceRate,
      eligibleCount: eligibleNotCertified,
      certificatesThisMonth,
      trainingProgress,
      attendanceChartData,
      recentActivity,
      alerts,
      totalUsers,
      trainerCount,
    });
  });

  return httpServer;
}
