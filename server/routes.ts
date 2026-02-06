import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertTrainingSchema, insertEnrollmentSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Students ───
  app.get("/api/students", async (_req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });

  app.get("/api/students/:id", async (req, res) => {
    const id = parseInt(req.params.id);
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

  app.post("/api/students", async (req, res) => {
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const student = await storage.createStudent(parsed.data);
    res.status(201).json(student);
  });

  // ─── Trainings ───
  app.get("/api/trainings", async (_req, res) => {
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

  app.get("/api/trainings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const training = await storage.getTraining(id);
    if (!training) return res.status(404).json({ message: "Training not found" });

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

  app.post("/api/trainings", async (req, res) => {
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
  app.post("/api/enrollments", async (req, res) => {
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
  app.get("/api/attendance/options", async (_req, res) => {
    const allTrainings = await storage.getTrainings();
    const options = await Promise.all(
      allTrainings.map(async (t) => {
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

  app.get("/api/attendance/:sessionId", async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    const session = await storage.getSession(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const allLevels = await Promise.all(
      (await storage.getTrainings()).map((t) => storage.getLevelsByTraining(t.id))
    );
    const flatLevels = allLevels.flat();
    const level = flatLevels.find((l) => l.id === session.levelId);
    if (!level) return res.status(404).json({ message: "Level not found" });

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

  app.post("/api/attendance/bulk", async (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ message: "records array is required" });
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
  app.get("/api/certificates", async (_req, res) => {
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

  app.get("/api/certificates/eligible", async (_req, res) => {
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

  app.post("/api/certificates", async (req, res) => {
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
      return res.status(400).json({ message: "Student has not completed all 4 levels and is not eligible for certification" });
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

  // ─── Dashboard ───
  app.get("/api/dashboard/stats", async (_req, res) => {
    const totalStudents = await storage.getStudentCount();
    const activeTrainings = await storage.getActiveTrainingCount();
    const certificatesIssued = await storage.getCertificateCount();
    const todayAttendance = await storage.getTodayAttendanceCount();

    const allTrainings = await storage.getTrainings();
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

    const recentActivity: Array<{
      id: number;
      studentName: string;
      action: string;
      detail: string;
      time: string;
    }> = [];

    res.json({
      totalStudents,
      activeTrainings,
      todayAttendance,
      certificatesIssued,
      trainingProgress,
      recentActivity,
    });
  });

  return httpServer;
}
