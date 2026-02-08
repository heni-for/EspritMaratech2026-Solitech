import { MongoClient, Db, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

let client: MongoClient;
let db: Db;

function normalizeDoc<T extends Record<string, any>>(doc: T | null | undefined): T | null | undefined {
  if (!doc) return doc;
  const out: any = { ...doc };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  for (const [key, value] of Object.entries(out)) {
    if (value instanceof ObjectId) {
      out[key] = value.toString();
    }
  }
  return out;
}

function normalizeDocs<T extends Record<string, any>>(docs: T[]): T[] {
  return docs.map((doc) => normalizeDoc(doc) as T);
}

export interface IStorageMongo {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getUsers(): Promise<any[]>;
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(data: any): Promise<any>;
  updateUser(id: string, data: Partial<any>): Promise<any | undefined>;
  deleteUser(id: string): Promise<void>;
  
  getStudents(): Promise<any[]>;
  getStudent(id: string): Promise<any | undefined>;
  createStudent(data: any): Promise<any>;
  deleteStudent(id: string): Promise<void>;
  
  getTrainings(): Promise<any[]>;
  getTraining(id: string): Promise<any | undefined>;
  createTraining(data: any): Promise<any>;
  
  getLevelsByTraining(trainingId: string): Promise<any[]>;
  createLevel(data: any): Promise<any>;
  
  getSessionsByLevel(levelId: string): Promise<any[]>;
  getSession(id: string): Promise<any | undefined>;
  createSession(data: any): Promise<any>;
  
  getEnrollmentsByTraining(trainingId: string): Promise<any[]>;
  getEnrollmentsByStudent(studentId: string): Promise<any[]>;
  getEnrollment(studentId: string, trainingId: string): Promise<any | undefined>;
  createEnrollment(data: any): Promise<any>;
  
  getAttendanceBySession(sessionId: string): Promise<any[]>;
  getAttendanceByStudent(studentId: string): Promise<any[]>;
  getAttendance(): Promise<any[]>;
  upsertAttendance(data: any): Promise<any>;
  
  getCertificates(): Promise<any[]>;
  getCertificate(studentId: string, trainingId: string): Promise<any | undefined>;
  getCertificatesByStudent(studentId: string): Promise<any[]>;
  createCertificate(data: any): Promise<any>;
  
  getStudentCount(): Promise<number>;
  getActiveTrainingCount(): Promise<number>;
  getCertificateCount(): Promise<number>;
  getTodayAttendanceCount(): Promise<number>;
  getAttendanceByDate(dateStr: string): Promise<any[]>;
  getRecentAttendance(limit: number): Promise<any[]>;
  
  getAllTrainerAssignments(): Promise<any[]>;
  getTrainerAssignments(userId: string): Promise<any[]>;
  getTrainerAssignmentsByTraining(trainingId: string): Promise<any[]>;
  createTrainerAssignment(data: any): Promise<any>;
  deleteTrainerAssignment(id: string): Promise<void>;
}

export class MongoDBStorage implements IStorageMongo {
  async connect(): Promise<void> {
    const mongoUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/asset_manager";
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db();
    console.log("Connected to MongoDB");
  }

  async disconnect(): Promise<void> {
    if (client) {
      await client.close();
    }
  }

  // User operations
  async getUsers(): Promise<any[]> {
    const users = await db.collection("users").find().toArray();
    return normalizeDocs(users);
  }

  async getUser(id: string): Promise<any | undefined> {
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    return normalizeDoc(user);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    const user = await db.collection("users").findOne({ username });
    return normalizeDoc(user);
  }

  async createUser(data: any): Promise<any> {
    const result = await db.collection("users").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  async updateUser(id: string, data: Partial<any>): Promise<any | undefined> {
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return normalizeDoc(result.value);
  }

  async deleteUser(id: string): Promise<void> {
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
  }

  // Student operations
  async getStudents(): Promise<any[]> {
    const students = await db.collection("students").find().toArray();
    return normalizeDocs(students);
  }

  async getStudent(id: string): Promise<any | undefined> {
    const student = await db.collection("students").findOne({ _id: new ObjectId(id) });
    return normalizeDoc(student);
  }

  async createStudent(data: any): Promise<any> {
    const result = await db.collection("students").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  async deleteStudent(id: string): Promise<void> {
    const studentId = new ObjectId(id);
    await db.collection("students").deleteOne({ _id: studentId });
    await db.collection("enrollments").deleteMany({ studentId });
    await db.collection("attendance").deleteMany({ studentId });
    await db.collection("certificates").deleteMany({ studentId });
    await db.collection("users").deleteMany({
      $or: [{ studentId }, { studentId: id }],
    });
  }

  // Training operations
  async getTrainings(): Promise<any[]> {
    const trainings = await db.collection("trainings").find().toArray();
    return normalizeDocs(trainings);
  }

  async getTraining(id: string): Promise<any | undefined> {
    const training = await db.collection("trainings").findOne({ _id: new ObjectId(id) });
    return normalizeDoc(training);
  }

  async createTraining(data: any): Promise<any> {
    const result = await db.collection("trainings").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  // Level operations
  async getLevelsByTraining(trainingId: string): Promise<any[]> {
    const levels = await db.collection("levels").find({ trainingId: new ObjectId(trainingId) }).toArray();
    return normalizeDocs(levels);
  }

  async createLevel(data: any): Promise<any> {
    const result = await db.collection("levels").insertOne({
      trainingId: new ObjectId(data.trainingId),
      levelNumber: data.levelNumber,
      name: data.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  // Session operations
  async getSessionsByLevel(levelId: string): Promise<any[]> {
    const sessions = await db.collection("sessions").find({ levelId: new ObjectId(levelId) }).toArray();
    return normalizeDocs(sessions);
  }

  async getSession(id: string): Promise<any | undefined> {
    const session = await db.collection("sessions").findOne({ _id: new ObjectId(id) });
    return normalizeDoc(session);
  }

  async createSession(data: any): Promise<any> {
    const result = await db.collection("sessions").insertOne({
      levelId: new ObjectId(data.levelId),
      sessionNumber: data.sessionNumber,
      date: data.date || null,
      startTime: data.startTime || "09:00",
      endTime: data.endTime || "11:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  // Enrollment operations
  async getEnrollmentsByTraining(trainingId: string): Promise<any[]> {
    const enrollments = await db.collection("enrollments").find({ trainingId: new ObjectId(trainingId) }).toArray();
    return normalizeDocs(enrollments);
  }

  async getEnrollmentsByStudent(studentId: string): Promise<any[]> {
    const enrollments = await db.collection("enrollments").find({ studentId: new ObjectId(studentId) }).toArray();
    return normalizeDocs(enrollments);
  }

  async getEnrollment(studentId: string, trainingId: string): Promise<any | undefined> {
    const enrollment = await db.collection("enrollments").findOne({
      studentId: new ObjectId(studentId),
      trainingId: new ObjectId(trainingId),
    });
    return normalizeDoc(enrollment);
  }

  async createEnrollment(data: any): Promise<any> {
    const result = await db.collection("enrollments").insertOne({
      studentId: new ObjectId(data.studentId),
      trainingId: new ObjectId(data.trainingId),
      enrollmentDate: data.enrollmentDate || new Date().toISOString().split('T')[0],
      status: data.status || "active",
      currentLevel: data.currentLevel ?? 1,
      enrolled: data.enrolled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  // Attendance operations
  async getAttendanceBySession(sessionId: string): Promise<any[]> {
    const attendance = await db.collection("attendance").find({ sessionId: new ObjectId(sessionId) }).toArray();
    return normalizeDocs(attendance);
  }

  async getAttendanceByStudent(studentId: string): Promise<any[]> {
    const attendance = await db.collection("attendance").find({ studentId: new ObjectId(studentId) }).toArray();
    return normalizeDocs(attendance);
  }

  async getAttendance(): Promise<any[]> {
    const attendance = await db.collection("attendance").find().toArray();
    return normalizeDocs(attendance);
  }

  async upsertAttendance(data: any): Promise<any> {
    const result = await db.collection("attendance").updateOne(
      {
        studentId: new ObjectId(data.studentId),
        sessionId: new ObjectId(data.sessionId),
      },
      {
        $set: {
          studentId: new ObjectId(data.studentId),
          sessionId: new ObjectId(data.sessionId),
          present: data.present !== false,
          note: data.note ?? null,
          comment: data.comment ?? null,
          markedAt: data.markedAt || new Date().toISOString(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    return result;
  }

  // Certificate operations
  async getCertificates(): Promise<any[]> {
    const certs = await db.collection("certificates").find().toArray();
    return normalizeDocs(certs);
  }

  async getCertificate(studentId: string, trainingId: string): Promise<any | undefined> {
    const cert = await db.collection("certificates").findOne({
      studentId: new ObjectId(studentId),
      trainingId: new ObjectId(trainingId),
    });
    return normalizeDoc(cert);
  }

  async getCertificatesByStudent(studentId: string): Promise<any[]> {
    const certs = await db.collection("certificates").find({ studentId: new ObjectId(studentId) }).toArray();
    return normalizeDocs(certs);
  }

  async createCertificate(data: any): Promise<any> {
    const result = await db.collection("certificates").insertOne({
      studentId: new ObjectId(data.studentId),
      trainingId: new ObjectId(data.trainingId),
      issuedAt: data.issuedAt || new Date().toISOString().split("T")[0],
      certificateNumber: data.certificateNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  // Aggregate operations
  async getStudentCount(): Promise<number> {
    return db.collection("students").countDocuments();
  }

  async getActiveTrainingCount(): Promise<number> {
    return db.collection("trainings").countDocuments({ status: "active" });
  }

  async getCertificateCount(): Promise<number> {
    return db.collection("certificates").countDocuments();
  }

  async getTodayAttendanceCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return db.collection("attendance").countDocuments({
      present: true,
      markedAt: { $regex: `^${today}` },
    });
  }

  async getAttendanceByDate(dateStr: string): Promise<any[]> {
    const attendance = await db.collection("attendance").find({
      markedAt: { $regex: `^${dateStr}` },
    }).toArray();
    return normalizeDocs(attendance);
  }

  async getRecentAttendance(limit: number): Promise<any[]> {
    const attendance = await db.collection("attendance")
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return normalizeDocs(attendance);
  }

  // Trainer assignment operations
  async getAllTrainerAssignments(): Promise<any[]> {
    const assignments = await db.collection("trainerAssignments").find().toArray();
    return normalizeDocs(assignments);
  }

  async getTrainerAssignments(userId: string): Promise<any[]> {
    const assignments = await db.collection("trainerAssignments").find({ userId: new ObjectId(userId) }).toArray();
    return normalizeDocs(assignments);
  }

  async getTrainerAssignmentsByTraining(trainingId: string): Promise<any[]> {
    const assignments = await db.collection("trainerAssignments").find({ trainingId: new ObjectId(trainingId) }).toArray();
    return normalizeDocs(assignments);
  }

  async createTrainerAssignment(data: any): Promise<any> {
    const result = await db.collection("trainerAssignments").insertOne({
      userId: new ObjectId(data.userId),
      trainingId: new ObjectId(data.trainingId),
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return normalizeDoc({ _id: result.insertedId, ...data });
  }

  async deleteTrainerAssignment(id: string): Promise<void> {
    await db.collection("trainerAssignments").deleteOne({ _id: new ObjectId(id) });
  }
}

export let mongoStorage: MongoDBStorage | null = null;

export async function initializeMongoStorage(): Promise<void> {
  mongoStorage = new MongoDBStorage();
  await mongoStorage.connect();
}
