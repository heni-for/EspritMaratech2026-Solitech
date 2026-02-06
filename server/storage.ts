import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  students, trainings, levels, sessions, enrollments, attendance, certificates, users, trainerAssignments,
  type Student, type InsertStudent,
  type Training, type InsertTraining,
  type Level, type InsertLevel,
  type Session, type InsertSession,
  type Enrollment, type InsertEnrollment,
  type Attendance, type InsertAttendance,
  type Certificate, type InsertCertificate,
  type User, type InsertUser,
  type TrainerAssignment, type InsertTrainerAssignment,
} from "@shared/schema";

export interface IStorage {
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(data: InsertStudent): Promise<Student>;

  getTrainings(): Promise<Training[]>;
  getTraining(id: number): Promise<Training | undefined>;
  createTraining(data: InsertTraining): Promise<Training>;

  getLevelsByTraining(trainingId: number): Promise<Level[]>;
  createLevel(data: InsertLevel): Promise<Level>;

  getSessionsByLevel(levelId: number): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(data: InsertSession): Promise<Session>;

  getEnrollmentsByTraining(trainingId: number): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollment(studentId: number, trainingId: number): Promise<Enrollment | undefined>;
  createEnrollment(data: InsertEnrollment): Promise<Enrollment>;

  getAttendanceBySession(sessionId: number): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  upsertAttendance(data: InsertAttendance): Promise<Attendance>;

  getCertificates(): Promise<Certificate[]>;
  getCertificate(studentId: number, trainingId: number): Promise<Certificate | undefined>;
  getCertificatesByStudent(studentId: number): Promise<Certificate[]>;
  createCertificate(data: InsertCertificate): Promise<Certificate>;

  getStudentCount(): Promise<number>;
  getActiveTrainingCount(): Promise<number>;
  getCertificateCount(): Promise<number>;
  getTodayAttendanceCount(): Promise<number>;

  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getTrainerAssignments(userId: string): Promise<TrainerAssignment[]>;
  getTrainerAssignmentsByTraining(trainingId: number): Promise<TrainerAssignment[]>;
  createTrainerAssignment(data: InsertTrainerAssignment): Promise<TrainerAssignment>;
  deleteTrainerAssignment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(data: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(data).returning();
    return student;
  }

  async getTrainings(): Promise<Training[]> {
    return db.select().from(trainings);
  }

  async getTraining(id: number): Promise<Training | undefined> {
    const [training] = await db.select().from(trainings).where(eq(trainings.id, id));
    return training;
  }

  async createTraining(data: InsertTraining): Promise<Training> {
    const [training] = await db.insert(trainings).values(data).returning();
    return training;
  }

  async getLevelsByTraining(trainingId: number): Promise<Level[]> {
    return db.select().from(levels).where(eq(levels.trainingId, trainingId));
  }

  async createLevel(data: InsertLevel): Promise<Level> {
    const [level] = await db.insert(levels).values(data).returning();
    return level;
  }

  async getSessionsByLevel(levelId: number): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.levelId, levelId));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(data: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(data).returning();
    return session;
  }

  async getEnrollmentsByTraining(trainingId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.trainingId, trainingId));
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollment(studentId: number, trainingId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.trainingId, trainingId)));
    return enrollment;
  }

  async createEnrollment(data: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(data).returning();
    return enrollment;
  }

  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.sessionId, sessionId));
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async upsertAttendance(data: InsertAttendance): Promise<Attendance> {
    const existing = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.studentId, data.studentId), eq(attendance.sessionId, data.sessionId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(attendance)
        .set({ present: data.present, markedAt: data.markedAt })
        .where(eq(attendance.id, existing[0].id))
        .returning();
      return updated;
    }

    const [record] = await db.insert(attendance).values(data).returning();
    return record;
  }

  async getCertificates(): Promise<Certificate[]> {
    return db.select().from(certificates);
  }

  async getCertificate(studentId: number, trainingId: number): Promise<Certificate | undefined> {
    const [cert] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.studentId, studentId), eq(certificates.trainingId, trainingId)));
    return cert;
  }

  async getCertificatesByStudent(studentId: number): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.studentId, studentId));
  }

  async createCertificate(data: InsertCertificate): Promise<Certificate> {
    const [cert] = await db.insert(certificates).values(data).returning();
    return cert;
  }

  async getStudentCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(students);
    return result[0]?.count ?? 0;
  }

  async getActiveTrainingCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trainings)
      .where(eq(trainings.status, "active"));
    return result[0]?.count ?? 0;
  }

  async getCertificateCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(certificates);
    return result[0]?.count ?? 0;
  }

  async getTodayAttendanceCount(): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(and(eq(attendance.present, true), sql`${attendance.markedAt} LIKE ${today + '%'}`));
    return result[0]?.count ?? 0;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getTrainerAssignments(userId: string): Promise<TrainerAssignment[]> {
    return db.select().from(trainerAssignments).where(eq(trainerAssignments.userId, userId));
  }

  async getTrainerAssignmentsByTraining(trainingId: number): Promise<TrainerAssignment[]> {
    return db.select().from(trainerAssignments).where(eq(trainerAssignments.trainingId, trainingId));
  }

  async createTrainerAssignment(data: InsertTrainerAssignment): Promise<TrainerAssignment> {
    const [assignment] = await db.insert(trainerAssignments).values(data).returning();
    return assignment;
  }

  async deleteTrainerAssignment(id: number): Promise<void> {
    await db.delete(trainerAssignments).where(eq(trainerAssignments.id, id));
  }
}

export const storage = new DatabaseStorage();
