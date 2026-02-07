// MongoDB initialization script
db = db.getSiblingDB('asset_manager');

// Create indexes (collections will be created by the application)
// Users collection index
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

console.log("MongoDB initialization completed!");
