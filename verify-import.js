import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/asset_manager?authSource=admin';

async function verifyImport() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('asset_manager');
    const collections = ['users', 'students', 'trainings', 'sessions', 'enrollments', 'certificates', 'levels', 'trainerAssignments'];
    
    console.log('\n📊 Import Verification:\n');
    for (const colName of collections) {
      const count = await db.collection(colName).countDocuments();
      console.log(`  ${colName}: ${count} documents`);
    }
    console.log('\n✓ Import successful!\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

verifyImport().catch(console.error);
