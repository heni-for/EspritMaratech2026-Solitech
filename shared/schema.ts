import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  absenceCount: integer("absence_count").notNull().default(0),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export const trainings = pgTable("trainings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  status: text("status").notNull().default("active"),
});

export const insertTrainingSchema = createInsertSchema(trainings).omit({ id: true });
export type InsertTraining = z.infer<typeof insertTrainingSchema>;
export type Training = typeof trainings.$inferSelect;

export const levels = pgTable("levels", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  trainingId: integer("training_id").notNull(),
  levelNumber: integer("level_number").notNull(),
  name: text("name").notNull(),
});

export const insertLevelSchema = createInsertSchema(levels).omit({ id: true });
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Level = typeof levels.$inferSelect;

export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  levelId: integer("level_id").notNull(),
  sessionNumber: integer("session_number").notNull(),
  title: text("title").notNull(),
  date: text("date"),
  status: text("status").notNull().default("pending"), // 'pending', 'en_cours', 'fini'
});

export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const enrollments = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull(),
  trainingId: integer("training_id").notNull(),
  currentLevel: integer("current_level").notNull().default(1),
  completedSessions: integer("completed_sessions").notNull().default(0),
  enrolled: boolean("enrolled").notNull().default(true),
  trainingStatus: text("training_status").notNull().default("in_progress"), // 'in_progress', 'completed'
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export const attendance = pgTable("attendance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull(),
  sessionId: integer("session_id").notNull(),
  present: boolean("present").notNull().default(false),
  markedAt: text("marked_at"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const complaints = pgTable("complaints", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull(),
  trainerId: varchar("trainer_id").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull(),
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({ id: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;

export const certificates = pgTable("certificates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull(),
  trainingId: integer("training_id").notNull(),
  issuedAt: text("issued_at").notNull(),
  certificateNumber: text("certificate_number").notNull(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true });
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"),
  studentId: integer("student_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  studentId: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const trainerAssignments = pgTable("trainer_assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  trainingId: integer("training_id").notNull(),
});

export const insertTrainerAssignmentSchema = createInsertSchema(trainerAssignments).omit({ id: true });
export type InsertTrainerAssignment = z.infer<typeof insertTrainerAssignmentSchema>;
export type TrainerAssignment = typeof trainerAssignments.$inferSelect;
