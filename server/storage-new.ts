import { MongoDBStorage, initializeMongoStorage, mongoStorage } from "./mongo-storage";
import { mockStorage } from "./mock-storage";

// Use MongoDB if available, otherwise use mock storage
export let storage: any;

export async function initializeStorage() {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb')) {
      console.log("Initializing MongoDB storage...");
      await initializeMongoStorage();
      storage = mongoStorage;
    } else {
      console.log("Initializing mock storage (no DATABASE_URL set)");
      storage = mockStorage;
    }
  } catch (error) {
    console.warn("Failed to initialize MongoDB storage, falling back to mock storage:", error);
    storage = mockStorage;
  }
}
