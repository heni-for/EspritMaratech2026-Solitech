import { initializeMongoStorage, mongoStorage } from "./mongo-storage";
import { mockStorage } from "./mock-storage";

// Use MongoDB if available, otherwise use mock storage
export let storage: any;
export let storageType: "mongo" | "mock" = "mock";

export async function initializeStorage() {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb')) {
      console.log("Initializing MongoDB storage...");
      await initializeMongoStorage();
      storage = mongoStorage;
      storageType = "mongo";
    } else {
      console.log("Initializing mock storage (no DATABASE_URL set)");
      storage = mockStorage;
      storageType = "mock";
    }
  } catch (error) {
    console.error("Failed to initialize MongoDB storage:", error);
    throw error;
  }
}
