import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, storageType } from "./storage";
import { insertStudentSchema, insertTrainingSchema, insertEnrollmentSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

const asStorageId = (value: string | number) => {
  if (storageType === "mongo") return value.toString();
  const num = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isNaN(num) ? value : num;
};

async function buildTrainingProgress(trainingId: any, studentId: any) {
  const trainingLevels = await storage.getLevelsByTraining(trainingId);
  let totalSessions = 0;
  let attendedSessions = 0;
  let levelsCompleted = 0;
  let absentCount = 0;
  let anyFailed = false;
  let allFinalized = true;

  const levelStatuses = [];

  for (const level of trainingLevels) {
    const levelSessions = await storage.getSessionsByLevel(level.id);
    totalSessions += levelSessions.length;

    let levelMarked = 0;
    let levelPresent = 0;

    for (const session of levelSessions) {
      const records = await storage.getAttendanceBySession(session.id);
      const studentRecord = records.find((a: any) => a.studentId === studentId);
      if (studentRecord) {
        levelMarked++;
        if (studentRecord.present) {
          levelPresent++;
          attendedSessions++;
        } else {
          absentCount++;
        }
      }
    }

    let status: "in_progress" | "passed" | "failed" = "in_progress";
    if (levelSessions.length > 0 && levelMarked === levelSessions.length) {
      status = levelPresent === levelSessions.length ? "passed" : "failed";
    } else {
      allFinalized = false;
    }

    if (status === "passed") levelsCompleted++;
    if (status === "failed") anyFailed = true;

    levelStatuses.push({
      levelId: level.id,
      levelNumber: level.levelNumber,
      name: level.name,
      totalSessions: levelSessions.length,
      attendedSessions: levelPresent,
      status,
    });
  }

  let formationStatus: "in_progress" | "completed" | "failed" = "in_progress";
  if (trainingLevels.length > 0 && levelsCompleted === trainingLevels.length) {
    formationStatus = "completed";
  } else if (anyFailed && allFinalized) {
    formationStatus = "failed";
  }

  const eligible = formationStatus === "completed";
  const late = absentCount >= 5;

  return {
    totalSessions,
    attendedSessions,
    levelsCompleted,
    absentCount,
    totalLevels: trainingLevels.length,
    eligible,
    late,
    formationStatus,
    levelStatuses,
  };
}

async function computeCurrentLevelStrict(trainingId: any, studentId: any) {
  const trainingLevels = await storage.getLevelsByTraining(trainingId);
  const sortedLevels = [...trainingLevels].sort((a: any, b: any) => (a.levelNumber || 0) - (b.levelNumber || 0));
  if (sortedLevels.length === 0) {
    return { nextLevel: 1, completed: false };
  }
  let nextLevel = sortedLevels[0].levelNumber || 1;
  let allValidated = true;

  for (const level of sortedLevels) {
    const levelSessions = await storage.getSessionsByLevel(level.id);
    let presentCount = 0;
    for (const session of levelSessions) {
      const sessionRecords = await storage.getAttendanceBySession(session.id);
      const studentRecord = sessionRecords.find((a: any) => a.studentId === studentId);
      if (studentRecord?.present) presentCount++;
    }
    const levelValidated = levelSessions.length > 0 && presentCount === levelSessions.length;
    if (!levelValidated) {
      nextLevel = level.levelNumber || nextLevel;
      allValidated = false;
      break;
    }
    nextLevel = (level.levelNumber || nextLevel) + 1;
  }

  const maxLevel = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1].levelNumber : 1;
  if (allValidated) nextLevel = maxLevel;
  return { nextLevel: Math.max(1, Math.min(nextLevel, maxLevel)), completed: allValidated };
}

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

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const mapGoogleEncoding = (contentType: string) => {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("ogg")) return "OGG_OPUS";
  if (normalized.includes("webm")) return "WEBM_OPUS";
  if (normalized.includes("wav")) return "LINEAR16";
  if (normalized.includes("mpeg") || normalized.includes("mp3")) return "MP3";
  return null;
};

const generatePassword = (length = 8) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

const getMailer = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

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
      if (role === "trainer" && username && fullName && role) {
        // allow trainer without password (auto-generated)
      } else {
        return res.status(400).json({ message: "username, password, fullName, and role are required" });
      }
    }
    if (!["admin", "trainer", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be admin, trainer, or student" });
    }

    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const plainPassword = role === "trainer" && !password ? generatePassword(8) : password;
    const hashed = await bcrypt.hash(plainPassword, 10);
    const user = await storage.createUser({
      username,
      password: hashed,
      fullName,
      role,
      studentId: studentId || null,
    });

    let emailSent = false;
    const emailEnabled = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "false").toLowerCase() === "true";
    const looksLikeEmail = typeof username === "string" && username.includes("@");
    if (role === "trainer" && emailEnabled && looksLikeEmail) {
      const mailer = getMailer();
      if (mailer) {
        const from = process.env.SMTP_FROM || "no-reply@astba.local";
        const appName = process.env.APP_NAME || "ASTBA";
        try {
          await mailer.sendMail({
            from,
            to: username,
            subject: `${appName} - Vos identifiants formateur`,
            text: `Bonjour ${fullName},\n\nVotre compte formateur a ete cree.\n\nIdentifiant: ${username}\nMot de passe: ${plainPassword}\n\nMerci,\n${appName}`,
          });
          emailSent = true;
        } catch (err) {
          console.error("Failed to send trainer credentials email:", err);
        }
      } else {
        console.warn("SMTP not configured. Trainer email not sent.");
      }
    }

    res.status(201).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
      emailSent,
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

  // Speech (TTS / STT)
  app.post("/api/speech/tts", requireAuth, async (req, res) => {
    const { provider, text, language, voice } = req.body as {
      provider?: "azure" | "google";
      text?: string;
      language?: string;
      voice?: string;
    };

    if (!provider || !text) {
      return res.status(400).json({ message: "provider and text are required" });
    }

    if (provider === "azure") {
      const key = process.env.AZURE_SPEECH_KEY;
      const region = process.env.AZURE_SPEECH_REGION;
      if (!key || !region) {
        return res.status(400).json({ message: "Azure Speech not configured" });
      }

      const lang = language || "fr-FR";
      const voiceName = voice || "fr-FR-DeniseNeural";
      const ssml = `<speak version='1.0' xml:lang='${lang}'><voice xml:lang='${lang}' name='${voiceName}'>${escapeXml(
        text
      )}</voice></speak>`;

      const ttsRes = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
          },
          body: ssml,
        }
      );

      if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        return res.status(500).json({ message: errText || "Azure TTS failed" });
      }

      const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
      return res.json({ audioBase64: audioBuffer.toString("base64"), contentType: "audio/mpeg" });
    }

    if (provider === "google") {
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "Google Speech not configured" });
      }

      const lang = language || "fr-FR";
      const voiceName = voice || "fr-FR-Wavenet-D";
      const ttsRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: lang, name: voiceName },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );

      if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        return res.status(500).json({ message: errText || "Google TTS failed" });
      }

      const payload = await ttsRes.json();
      if (!payload.audioContent) {
        return res.status(500).json({ message: "Google TTS returned no audio" });
      }

      return res.json({ audioBase64: payload.audioContent, contentType: "audio/mpeg" });
    }

    return res.status(400).json({ message: "Unsupported provider" });
  });

  app.post("/api/speech/stt", requireAuth, async (req, res) => {
    const { provider, audioBase64, contentType, language } = req.body as {
      provider?: "azure" | "google";
      audioBase64?: string;
      contentType?: string;
      language?: string;
    };

    if (!provider || !audioBase64 || !contentType) {
      return res.status(400).json({ message: "provider, audioBase64 and contentType are required" });
    }

    if (provider === "azure") {
      const key = process.env.AZURE_SPEECH_KEY;
      const region = process.env.AZURE_SPEECH_REGION;
      if (!key || !region) {
        return res.status(400).json({ message: "Azure Speech not configured" });
      }

      const lang = language || "fr-FR";
      const sttRes = await fetch(
        `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(
          lang
        )}`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": contentType,
          },
          body: Buffer.from(audioBase64, "base64"),
        }
      );

      if (!sttRes.ok) {
        const errText = await sttRes.text();
        return res.status(500).json({ message: errText || "Azure STT failed" });
      }

      const payload = await sttRes.json();
      return res.json({ transcript: payload.DisplayText || "" });
    }

    if (provider === "google") {
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "Google Speech not configured" });
      }

      const lang = language || "fr-FR";
      const encoding = mapGoogleEncoding(contentType || "");
      if (!encoding) {
        return res.status(400).json({ message: "Unsupported audio content type" });
      }

      const sttRes = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              encoding,
              languageCode: lang,
            },
            audio: { content: audioBase64 },
          }),
        }
      );

      if (!sttRes.ok) {
        const errText = await sttRes.text();
        return res.status(500).json({ message: errText || "Google STT failed" });
      }

      const payload = await sttRes.json();
      const transcript = payload.results?.[0]?.alternatives?.[0]?.transcript || "";
      return res.json({ transcript });
    }

    return res.status(400).json({ message: "Unsupported provider" });
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
    const assignment = await storage.createTrainerAssignment({
      userId: asStorageId(userId),
      trainingId: asStorageId(trainingId),
    });
    res.status(201).json(assignment);
  });

  app.delete("/api/trainer-assignments/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteTrainerAssignment(asStorageId(req.params.id));
    res.json({ message: "Assignment removed" });
  });

  // ─── Students ───
  app.get("/api/students", requireRole("admin", "trainer"), async (_req, res) => {
    const allStudents = await storage.getStudents();
    res.json(allStudents);
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    const id = asStorageId(req.params.id);

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

      const progress = await buildTrainingProgress(training.id, id);

      enrichedEnrollments.push({
        enrollment,
        training,
        ...progress,
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
        note: record.note ?? null,
        comment: record.comment ?? null,
      });
    }

    const certificates = await storage.getCertificatesByStudent(id);
    const enrichedCerts = await Promise.all(
      certificates.map(async (c: any) => {
        const t = await storage.getTraining(c.trainingId);
        return { ...c, issuedAt: c.issuedAt || c.issuedDate, trainingName: t?.name || "Unknown" };
      })
    );

    res.json({ student, enrollments: enrichedEnrollments, attendanceHistory, certificates: enrichedCerts });
  });

  app.post("/api/students", requireRole("admin"), async (req, res) => {
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const email = parsed.data.email?.trim();
    if (email) {
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "Un utilisateur avec cet email existe deja" });
      }
    }

    const student = await storage.createStudent(parsed.data);

    let emailSent = false;
    if (email) {
      const plainPassword = generatePassword(8);
      const hashed = await bcrypt.hash(plainPassword, 10);
      await storage.createUser({
        username: email,
        password: hashed,
        fullName: `${student.firstName} ${student.lastName}`,
        role: "student",
        studentId: student.id,
      });

      const mailer = getMailer();
      if (mailer) {
        const from = process.env.SMTP_FROM || "no-reply@astba.local";
        const appName = process.env.APP_NAME || "ASTBA";
        try {
          await mailer.sendMail({
            from,
            to: email,
            subject: `${appName} - Vos identifiants`,
            text: `Bonjour ${student.firstName},\n\nVotre compte ${appName} a ete cree.\nIdentifiant: ${email}\nMot de passe: ${plainPassword}\n\nConnectez-vous et changez votre mot de passe des que possible.`,
          });
          emailSent = true;
          console.log(`Email sent to ${email}`);
        } catch (err) {
          console.error("SMTP send failed:", err);
        }
      } else {
        console.log("SMTP not configured. Email not sent.");
      }
    }

    res.status(201).json({ ...student, emailSent });
  });

  app.delete("/api/students/:id", requireRole("admin"), async (req, res) => {
    const id = asStorageId(req.params.id);
    const student = await storage.getStudent(id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await storage.deleteStudent(id);
    res.json({ message: "Student deleted" });
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
    const id = asStorageId(req.params.id);
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

        const progress = await buildTrainingProgress(training.id, enrollment.studentId);

        return {
          student,
          enrollment,
          ...progress,
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
    const { trainerIds, studentIds, levelsCount, sessionsPerLevel, ...trainingData } = req.body;
    const parsed = insertTrainingSchema.safeParse(trainingData);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const training = await storage.createTraining(parsed.data);

    const levelsTotal = Number.isFinite(Number(levelsCount)) ? Math.max(1, Number(levelsCount)) : 4;
    const sessionsTotal = Number.isFinite(Number(sessionsPerLevel)) ? Math.max(1, Number(sessionsPerLevel)) : 6;

    for (let i = 1; i <= levelsTotal; i++) {
      const level = await storage.createLevel({
        trainingId: training.id,
        levelNumber: i,
        name: `Niveau ${i}`,
      });
      for (let j = 1; j <= sessionsTotal; j++) {
        await storage.createSession({
          levelId: level.id,
          sessionNumber: j,
          title: `Seance ${j}`,
          date: null,
        });
      }
    }

    if (Array.isArray(trainerIds)) {
      for (const userId of trainerIds) {
        await storage.createTrainerAssignment({ userId: asStorageId(userId), trainingId: asStorageId(training.id) });
      }
    }

    if (Array.isArray(studentIds)) {
      for (const studentId of studentIds) {
        await storage.createEnrollment({
          studentId: asStorageId(studentId),
          trainingId: asStorageId(training.id),
          currentLevel: 1,
          enrolled: true,
        });
      }
    }

    res.status(201).json(training);
  });

  // ─── Enrollments ───
  app.post("/api/enrollments", requireRole("admin"), async (req, res) => {
    const { studentId, trainingId } = req.body;
    if (!studentId || !trainingId) {
      return res.status(400).json({ message: "Valid studentId and trainingId are required" });
    }

    const student = await storage.getStudent(asStorageId(studentId));
    if (!student) return res.status(404).json({ message: "Student not found" });

    const training = await storage.getTraining(asStorageId(trainingId));
    if (!training) return res.status(404).json({ message: "Training not found" });

    const existing = await storage.getEnrollment(asStorageId(studentId), asStorageId(trainingId));
    if (existing) {
      return res.status(400).json({ message: "Student is already enrolled in this training" });
    }

    const enrollment = await storage.createEnrollment({
      studentId: asStorageId(studentId),
      trainingId: asStorageId(trainingId),
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
    const sessionId = asStorageId(req.params.sessionId);
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
          note: attendanceRecord?.note ?? null,
          comment: attendanceRecord?.comment ?? null,
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
        const session = await storage.getSession(asStorageId(record.sessionId));
        if (!session) continue;
        const level = flatLevels.find((l) => l.id === session.levelId);
        if (!level || !assignedTrainingIds.has(level.trainingId)) {
          return res.status(403).json({ message: "Not assigned to this training" });
        }
      }
    }

    const now = new Date().toISOString();
    const results = await Promise.all(
      records.map((r: { studentId: any; sessionId: any; present: boolean; note?: number | null; comment?: string | null }) =>
        storage.upsertAttendance({
          studentId: asStorageId(r.studentId),
          sessionId: asStorageId(r.sessionId),
          present: r.present,
          note: r.note ?? null,
          comment: r.comment ?? null,
          markedAt: now,
        })
      )
    );

    const trainings = await storage.getTrainings();
    const allLevels = (await Promise.all(
      trainings.map((t: any) => storage.getLevelsByTraining(t.id))
    )).flat();

    const pairs = new Map<string, { studentId: any; trainingId: any }>();
    for (const record of records) {
      const session = await storage.getSession(asStorageId(record.sessionId));
      if (!session) continue;
      const level = allLevels.find((l: any) => l.id === session.levelId);
      if (!level) continue;
      const key = `${record.studentId}-${level.trainingId}`;
      pairs.set(key, { studentId: asStorageId(record.studentId), trainingId: level.trainingId });
    }

    for (const pair of pairs.values()) {
      const progress = await buildTrainingProgress(pair.trainingId, pair.studentId);
      if (progress.formationStatus === "completed") {
        const existingCert = await storage.getCertificate(pair.studentId, pair.trainingId);
        if (!existingCert) {
          const nowDate = new Date();
          const certificateNumber = `ASTBA-${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}${String(nowDate.getDate()).padStart(2, "0")}-${String(pair.studentId).slice(-3)}${String(pair.trainingId).slice(-3)}`;
          await storage.createCertificate({
            studentId: pair.studentId,
            trainingId: pair.trainingId,
            issuedAt: nowDate.toISOString().split("T")[0],
            certificateNumber,
          });
        }
      }
      const levelUpdate = await computeCurrentLevelStrict(pair.trainingId, pair.studentId);
      await storage.updateEnrollment?.(pair.studentId, pair.trainingId, {
        currentLevel: levelUpdate.nextLevel,
        status: levelUpdate.completed ? "completed" : "active",
      });
    }

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
          issuedAt: cert.issuedAt || cert.issuedDate,
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
      const progress = await buildTrainingProgress(training.id, enrollment.studentId);

      if (progress.formationStatus === "completed") {
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
          completedLevels: progress.levelsCompleted,
          totalLevels: progress.totalLevels,
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

    const progress = await buildTrainingProgress(trainingId, studentId);

    if (progress.formationStatus !== "completed") {
      return res.status(400).json({ message: "Student has not completed all levels" });
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
    const trainingIds = Array.from(new Set(myEnrollments.map((e: any) => e.trainingId)));
    const trainerNameByTrainingId = new Map<any, string>();
    await Promise.all(
      trainingIds.map(async (trainingId: any) => {
        const assignments = await storage.getTrainerAssignmentsByTraining(trainingId);
        if (assignments && assignments.length > 0) {
          const trainer = await storage.getUser(assignments[0].userId);
          trainerNameByTrainingId.set(trainingId, trainer?.fullName || "Encadrant");
        } else {
          trainerNameByTrainingId.set(trainingId, "Encadrant");
        }
      })
    );
    const formations = [];

    for (const enrollment of myEnrollments) {
      const training = await storage.getTraining(enrollment.trainingId);
      if (!training) continue;

      const progress = await buildTrainingProgress(training.id, user.studentId);
      const existingCert = await storage.getCertificate(user.studentId, training.id);

      let status = "In Progress";
      if (existingCert) status = "Certified";
      else if (progress.eligible) status = "Eligible for Certification";

      formations.push({
        training,
        currentLevel: enrollment.currentLevel ?? 1,
        enrollmentStatus: enrollment.status || "active",
        ...progress,
        progress: progress.totalSessions > 0 ? Math.round((progress.attendedSessions / progress.totalSessions) * 100) : 0,
        status,
        certificateNumber: existingCert?.certificateNumber,
        trainerName: trainerNameByTrainingId.get(training.id) || "Encadrant",
      });
    }

    const allAttendance = await storage.getAttendanceByStudent(user.studentId);
    const attendanceBySession = new Map(
      allAttendance.map((a: any) => [a.sessionId, a])
    );
    const attendanceHistory = [];

    for (const enrollment of myEnrollments) {
      const training = await storage.getTraining(enrollment.trainingId);
      if (!training) continue;
      const levels = await storage.getLevelsByTraining(training.id);
      for (const level of levels) {
        const sessions = await storage.getSessionsByLevel(level.id);
        for (const session of sessions) {
          const record = attendanceBySession.get(session.id);
          const status = record ? (record.present ? "present" : "absent") : "not_marked";
          attendanceHistory.push({
            sessionTitle: session.title,
            trainingName: training.name,
            levelName: level.name,
            date: record?.markedAt || session.date || "",
            status,
            note: record?.note ?? null,
            comment: record?.comment ?? null,
          });
        }
      }
    }

    const myCerts = await storage.getCertificatesByStudent(user.studentId);
    const enrichedCerts = await Promise.all(
      myCerts.map(async (c) => {
        const t = await storage.getTraining(c.trainingId);
        return {
          ...c,
          issuedAt: c.issuedAt || c.issuedDate,
          trainingName: t?.name || "Unknown",
          trainerName: trainerNameByTrainingId.get(c.trainingId) || "Encadrant",
        };
      })
    );

    res.json({
      student,
      formations,
      attendanceHistory,
      certificates: enrichedCerts,
    });
  });

  app.get("/api/my/trainings", requireRole("student"), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || !user.studentId) {
      return res.status(400).json({ message: "No student profile linked" });
    }

    const enrollments = await storage.getEnrollmentsByStudent(user.studentId);
    const trainings = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const training = await storage.getTraining(enrollment.trainingId);
        if (!training) return null;
        const progress = await buildTrainingProgress(training.id, user.studentId);
        return {
          training,
          enrollment,
          progress,
        };
      })
    );
    res.json(trainings.filter(Boolean));
  });

  app.get("/api/my/trainings/:id", requireRole("student"), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || !user.studentId) {
      return res.status(400).json({ message: "No student profile linked" });
    }

    const trainingId = asStorageId(req.params.id);
    const enrollment = await storage.getEnrollment(user.studentId, trainingId);
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    const training = await storage.getTraining(trainingId);
    if (!training) return res.status(404).json({ message: "Training not found" });

    const levels = await storage.getLevelsByTraining(trainingId);
    const attendance = await storage.getAttendanceByStudent(user.studentId);
    const attendanceBySession = new Map(
      attendance.map((a: any) => [a.sessionId, a])
    );

    const levelsWithSessions = await Promise.all(
      levels.map(async (level: any) => {
        const sessions = await storage.getSessionsByLevel(level.id);
        const sessionsWithStatus = sessions.map((session: any) => {
          const record = attendanceBySession.get(session.id);
          const status = record ? (record.present ? "present" : "absent") : "not_marked";
          return {
            ...session,
            status,
            note: record?.note ?? null,
            comment: record?.comment ?? null,
          };
        });
        const allPresent = sessionsWithStatus.length > 0 && sessionsWithStatus.every((s: any) => s.status === "present");
        return {
          ...level,
          sessions: sessionsWithStatus,
          validated: allPresent,
        };
      })
    );

    const progress = await buildTrainingProgress(trainingId, user.studentId);

    res.json({
      training,
      enrollment,
      progress,
      levels: levelsWithSessions,
    });
  });

  app.get("/api/my/attendance", requireRole("student"), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || !user.studentId) {
      return res.status(400).json({ message: "No student profile linked" });
    }

    const enrollments = await storage.getEnrollmentsByStudent(user.studentId);
    const trainingIds = enrollments.map((e: any) => e.trainingId);
    const trainings = await Promise.all(trainingIds.map((id: any) => storage.getTraining(id)));
    const trainingMap = new Map(trainingIds.map((id: any, idx: number) => [id, trainings[idx]]));

    const attendance = await storage.getAttendanceByStudent(user.studentId);
    const attendanceBySession = new Map(attendance.map((a: any) => [a.sessionId, a]));

    const allLevels = (await Promise.all(
      trainingIds.map(async (id: any) => {
        const lvls = await storage.getLevelsByTraining(id);
        return lvls.map((l: any) => ({ ...l, trainingId: id }));
      })
    )).flat();

    const allSessions = (await Promise.all(
      allLevels.map(async (lvl: any) => {
        const sessions = await storage.getSessionsByLevel(lvl.id);
        return sessions.map((s: any) => ({ ...s, levelId: lvl.id, trainingId: lvl.trainingId, levelName: lvl.name }));
      })
    )).flat();

    const rows = allSessions.map((session: any) => {
      const record = attendanceBySession.get(session.id);
      const training = trainingMap.get(session.trainingId);
      const status = record ? (record.present ? "present" : "absent") : "not_marked";
      return {
        trainingName: training?.name || "Unknown",
        levelName: session.levelName || "Unknown",
        sessionTitle: session.title,
        date: record?.markedAt || session.date || "",
        status,
        comment: record?.comment ?? null,
      };
    });

    res.json(rows);
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
