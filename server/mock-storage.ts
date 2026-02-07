import {
  type Student, type InsertStudent,
  type Training, type InsertTraining,
  type Level, type InsertLevel,
  type Session, type InsertSession,
  type Enrollment, type InsertEnrollment,
  type Attendance, type InsertAttendance,
  type Complaint, type InsertComplaint,
  type Certificate, type InsertCertificate,
  type User, type InsertUser,
  type TrainerAssignment, type InsertTrainerAssignment,
} from "@shared/schema";
import bcrypt from "bcrypt";

const toNumberId = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number.parseInt(value, 10);
    return Number.isNaN(num) ? value : num;
  }
  return value;
};

export class MockStorage {
  private students: Map<number, Student> = new Map();
  private trainings: Map<number, Training> = new Map();
  private levels: Map<number, Level> = new Map();
  private sessions: Map<number, Session> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private attendance: Map<number, Attendance> = new Map();
  private complaints: Map<number, Complaint> = new Map();
  private certificates: Map<string, Certificate> = new Map();
  private users: Map<string, User> = new Map();
  private trainerAssignments: Map<number, TrainerAssignment> = new Map();

  private nextStudentId = 1;
  private nextTrainingId = 1;
  private nextLevelId = 1;
  private nextSessionId = 1;
  private nextEnrollmentId = 1;
  private nextAttendanceId = 1;
  private nextComplaintId = 1;
  private nextCertificateId = 1;
  private nextTrainerAssignmentId = 1;
  private initialized = false;

  constructor() {
    this.initDefaultDataSync();
  }

  private initDefaultDataSync() {
    // Pre-hash passwords synchronously using bcrypt sync
    const adminHash = require('bcrypt').hashSync("admin123", 10);
    const trainerHash = require('bcrypt').hashSync("trainer123", 10);
    const studentHash = require('bcrypt').hashSync("student123", 10);

    // Create default admin user
    this.users.set("admin-1", {
      id: "admin-1",
      username: "admin",
      password: adminHash,
      fullName: "Administrator",
      role: "admin",
      studentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create demo students
    const student1: Student = {
      id: 1,
      firstName: "Ahmed",
      lastName: "Ben Ali",
      email: "ahmed.benali@email.com",
      phone: "+216 22 345 678",
      dateOfBirth: "2010-03-15",
      guardianName: "Mohamed Ben Ali",
      guardianPhone: "+216 98 765 432",
      absenceCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.students.set(1, student1);
    this.nextStudentId = 2;

    // Create trainer user for demo
    this.users.set("trainer-1", {
      id: "trainer-1",
      username: "trainer1",
      password: trainerHash,
      fullName: "Trainer One",
      role: "trainer",
      studentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create student user
    this.users.set("student-1", {
      id: "student-1",
      username: "ahmed",
      password: studentHash,
      fullName: "Ahmed Ben Ali",
      role: "student",
      studentId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create demo training
    const training: Training = {
      id: 1,
      name: "Robotics Fundamentals",
      description: "Introduction to robotics, electronics, and programming for beginners",
      startDate: "2025-09-01",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trainings.set(1, training);
    this.nextTrainingId = 2;

    // Create levels for training
    for (let i = 1; i <= 4; i++) {
      const level: Level = {
        id: i,
        trainingId: 1,
        levelNumber: i,
        name: `Level ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.levels.set(i, level);
    }
    this.nextLevelId = 5;

    // Create sessions for each level
    let sessionId = 1;
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 6; j++) {
        const session: Session = {
          id: sessionId,
          levelId: i,
          sessionNumber: j,
          date: null,
          startTime: "09:00",
          endTime: "11:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.sessions.set(sessionId, session);
        sessionId++;
      }
    }
    this.nextSessionId = sessionId;

    // Create enrollment
    const enrollment: Enrollment = {
      id: 1,
      studentId: 1,
      trainingId: 1,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.enrollments.set("1-1", enrollment);
    this.nextEnrollmentId = 2;

    // Create mock certificate
    const certificate: Certificate = {
      id: this.nextCertificateId++,
      studentId: 1,
      trainingId: 1,
      certificateNumber: "ASTBA-2026-0207-001001",
      issuedAt: new Date().toISOString().split("T")[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.certificates.set("1-1", certificate);

    // Assign trainer to training
    const assignment: TrainerAssignment = {
      id: 1,
      userId: "trainer-1",
      trainingId: 1,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trainerAssignments.set(1, assignment);

    this.initialized = true;
  }

  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(toNumberId(id));
  }

  async createStudent(data: InsertStudent): Promise<Student> {
    const id = this.nextStudentId++;
    const student: Student = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.students.set(id, student);
    return student;
  }

  async deleteStudent(id: number): Promise<void> {
    const idNum = toNumberId(id);
    this.students.delete(idNum);
    for (const [key, enrollment] of this.enrollments.entries()) {
      if (enrollment.studentId === idNum) {
        this.enrollments.delete(key);
      }
    }
    for (const [key, record] of this.attendance.entries()) {
      if (record.studentId === idNum) {
        this.attendance.delete(key);
      }
    }
    for (const [key, cert] of this.certificates.entries()) {
      if (cert.studentId === idNum) {
        this.certificates.delete(key);
      }
    }
    for (const [key, user] of this.users.entries()) {
      if (user.studentId === idNum) {
        this.users.delete(key);
      }
    }
  }

  async getTrainings(): Promise<Training[]> {
    return Array.from(this.trainings.values());
  }

  async getTraining(id: number): Promise<Training | undefined> {
    return this.trainings.get(toNumberId(id));
  }

  async createTraining(data: InsertTraining): Promise<Training> {
    const id = this.nextTrainingId++;
    const training: Training = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trainings.set(id, training);
    return training;
  }

  async getLevelsByTraining(trainingId: number): Promise<Level[]> {
    const idNum = toNumberId(trainingId);
    return Array.from(this.levels.values()).filter(l => l.trainingId === idNum);
  }

  async createLevel(data: InsertLevel): Promise<Level> {
    const id = this.nextLevelId++;
    const level: Level = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.levels.set(id, level);
    return level;
  }

  async getSessionsByLevel(levelId: number): Promise<Session[]> {
    const idNum = toNumberId(levelId);
    return Array.from(this.sessions.values()).filter(s => s.levelId === idNum);
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(toNumberId(id));
  }

  async createSession(data: InsertSession): Promise<Session> {
    const id = this.nextSessionId++;
    const session: Session = {
      id,
      levelId: data.levelId,
      sessionNumber: data.sessionNumber,
      title: (data as any).title || `Session ${data.sessionNumber}`,
      date: (data as any).date || null,
      status: (data as any).status || "pending",
      startTime: (data as any).startTime || "09:00",
      endTime: (data as any).endTime || "11:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session | undefined> {
    const idNum = toNumberId(id);
    const session = this.sessions.get(idNum);
    if (!session) return undefined;
    
    const updated: Session = {
      ...session,
      ...data,
      updatedAt: new Date(),
    };
    this.sessions.set(idNum, updated);
    return updated;
  }

  async getEnrollmentsByTraining(trainingId: number): Promise<Enrollment[]> {
    const idNum = toNumberId(trainingId);
    return Array.from(this.enrollments.values()).filter(e => e.trainingId === idNum);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    const idNum = toNumberId(studentId);
    return Array.from(this.enrollments.values()).filter(e => e.studentId === idNum);
  }

  async getEnrollment(studentId: number, trainingId: number): Promise<Enrollment | undefined> {
    const sId = toNumberId(studentId);
    const tId = toNumberId(trainingId);
    return this.enrollments.get(`${sId}-${tId}`);
  }

  async createEnrollment(data: InsertEnrollment): Promise<Enrollment> {
    const id = this.nextEnrollmentId++;
    const studentId = toNumberId((data as any).studentId);
    const trainingId = toNumberId((data as any).trainingId);
    const now = new Date().toISOString();
    const enrollment: Enrollment = {
      id,
      studentId,
      trainingId,
      enrollmentDate: (data as any).enrollmentDate || new Date().toISOString().split('T')[0],
      status: (data as any).status || "active",
      currentLevel: (data as any).currentLevel ?? 1,
      enrolled: (data as any).enrolled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.enrollments.set(`${studentId}-${trainingId}`, enrollment);
    return enrollment;
  }

  async updateEnrollment(studentId: number, trainingId: number, data: Partial<any>): Promise<Enrollment | undefined> {
    const sId = toNumberId(studentId);
    const tId = toNumberId(trainingId);
    const existing = this.enrollments.get(`${sId}-${tId}`);
    if (!existing) return undefined;
    const updated: Enrollment = {
      ...existing,
      ...(data as any),
      updatedAt: new Date(),
    };
    this.enrollments.set(`${sId}-${tId}`, updated);
    return updated;
  }

  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    const idNum = toNumberId(sessionId);
    return Array.from(this.attendance.values()).filter(a => a.sessionId === idNum);
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    const idNum = toNumberId(studentId);
    return Array.from(this.attendance.values()).filter(a => a.studentId === idNum);
  }

  async upsertAttendance(data: InsertAttendance): Promise<Attendance> {
    const studentId = toNumberId((data as any).studentId);
    const sessionId = toNumberId((data as any).sessionId);
    const key = `${studentId}-${sessionId}`;
    let attendance = this.attendance.get(key as any);
    
    const wasPresent = attendance ? attendance.present !== false : true;
    const isNowAbsent = (data as any).present === false;
    
    if (attendance) {
      attendance.present = (data as any).present !== false;
      (attendance as any).note = (data as any).note ?? null;
      (attendance as any).comment = (data as any).comment ?? null;
      attendance.markedAt = (data as any).markedAt || new Date().toISOString();
      attendance.updatedAt = new Date();
    } else {
      const id = this.nextAttendanceId++;
      attendance = {
        id,
        studentId,
        sessionId,
        present: (data as any).present !== false,
        note: (data as any).note ?? null,
        comment: (data as any).comment ?? null,
        markedAt: (data as any).markedAt || new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Attendance;
      this.attendance.set(id, attendance);
    }

    // Update student absence count
    const student = this.students.get(studentId);
    if (student) {
      // Initialize absenceCount if not present
      if ((student as any).absenceCount === undefined) {
        (student as any).absenceCount = 0;
      }
      
      // Increment if now absent (and wasn't before or is new record)
      if (isNowAbsent && wasPresent) {
        (student as any).absenceCount += 1;
      }
      // Decrement if was absent but now present
      else if (!isNowAbsent && !wasPresent && attendance.id !== this.nextAttendanceId - 1) {
        (student as any).absenceCount = Math.max(0, (student as any).absenceCount - 1);
      }
    }

    return attendance;
  }

  async getComplaints(): Promise<Complaint[]> {
    return Array.from(this.complaints.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getComplaintsByStudent(studentId: number): Promise<Complaint[]> {
    const idNum = toNumberId(studentId);
    return Array.from(this.complaints.values())
      .filter((c) => c.studentId === idNum)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  async createComplaint(data: InsertComplaint): Promise<Complaint> {
    const id = this.nextComplaintId++;
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id,
      studentId: toNumberId((data as any).studentId),
      trainerId: (data as any).trainerId,
      message: (data as any).message,
      status: (data as any).status || "open",
      createdAt: now,
    } as Complaint;
    this.complaints.set(id, complaint);
    return complaint;
  }

  async getCertificates(): Promise<Certificate[]> {
    return Array.from(this.certificates.values());
  }

  async getCertificate(studentId: number, trainingId: number): Promise<Certificate | undefined> {
    const sId = toNumberId(studentId);
    const tId = toNumberId(trainingId);
    return this.certificates.get(`${sId}-${tId}`);
  }

  async getCertificatesByStudent(studentId: number): Promise<Certificate[]> {
    const idNum = toNumberId(studentId);
    return Array.from(this.certificates.values()).filter(c => c.studentId === idNum);
  }

  async createCertificate(data: InsertCertificate): Promise<Certificate> {
    const id = this.nextCertificateId++;
    const certificate: Certificate = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const studentId = toNumberId((data as any).studentId);
    const trainingId = toNumberId((data as any).trainingId);
    this.certificates.set(`${studentId}-${trainingId}`, {
      ...certificate,
      studentId,
      trainingId,
    });
    return certificate;
  }

  async getStudentCount(): Promise<number> {
    return this.students.size;
  }

  async getActiveTrainingCount(): Promise<number> {
    return Array.from(this.trainings.values()).filter(t => t.status === "active").length;
  }

  async getCertificateCount(): Promise<number> {
    return this.certificates.size;
  }

  async getTodayAttendanceCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.attendance.values()).filter(a => {
      const session = this.sessions.get(a.sessionId);
      return session?.date === today;
    }).length;
  }

  async getAttendanceByDate(dateStr: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => {
      const session = this.sessions.get(a.sessionId);
      return session?.date === dateStr;
    });
  }

  async getRecentAttendance(limit: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).slice(0, limit);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = `user-${Date.now()}`;
    const user: User = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getAllTrainerAssignments(): Promise<TrainerAssignment[]> {
    return Array.from(this.trainerAssignments.values());
  }

  async getTrainerAssignments(userId: string): Promise<TrainerAssignment[]> {
    return Array.from(this.trainerAssignments.values()).filter(a => a.userId === userId);
  }

  async getTrainerAssignmentsByTraining(trainingId: number): Promise<TrainerAssignment[]> {
    const idNum = toNumberId(trainingId);
    return Array.from(this.trainerAssignments.values()).filter(a => a.trainingId === idNum);
  }

  async createTrainerAssignment(data: InsertTrainerAssignment): Promise<TrainerAssignment> {
    const id = this.nextTrainerAssignmentId++;
    const assignment: TrainerAssignment = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trainerAssignments.set(id, assignment);
    return assignment;
  }

  async deleteTrainerAssignment(id: number): Promise<void> {
    this.trainerAssignments.delete(toNumberId(id));
  }
}

export const mockStorage = new MockStorage();
