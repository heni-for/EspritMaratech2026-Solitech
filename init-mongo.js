// MongoDB initialization script
db = db.getSiblingDB('asset_manager');

// Create indexes (collections will be created by the application)
// Users collection index
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

// Complaints collection indexes
db.complaints.createIndex({ studentId: 1, createdAt: -1 });
db.complaints.createIndex({ trainerId: 1, createdAt: -1 });

// Add absenceCount field to all existing students if not present
db.students.updateMany(
  { absenceCount: { $exists: false } },
  { $set: { absenceCount: 0 } }
);

console.log("MongoDB initialization completed!");
