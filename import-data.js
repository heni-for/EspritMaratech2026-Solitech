import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { BSON } from 'bson';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/asset_manager?authSource=admin';
const DATA_DIR = path.join(__dirname, 'asset_manager', 'asset_manager');

async function importData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db('asset_manager');
    
    // Get all .bson files
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.bson'));
    
    for (const file of files) {
      const collectionName = file.replace('.bson', '');
      const filePath = path.join(DATA_DIR, file);
      
      console.log(`Importing ${collectionName}...`);
      
      try {
        // Read BSON file
        const buffer = fs.readFileSync(filePath);
        const documents = [];
        
        // Parse BSON documents
        let offset = 0;
        while (offset < buffer.length) {
          // Read document size (first 4 bytes)
          const size = buffer.readUInt32LE(offset);
          if (size === 0) break;
          
          // Extract document
          const docBuffer = buffer.slice(offset, offset + size);
          const doc = BSON.deserialize(docBuffer);
          documents.push(doc);
          
          offset += size;
        }
        
        if (documents.length > 0) {
          // Drop existing collection
          try {
            await db.collection(collectionName).deleteMany({});
          } catch (e) {
            // Collection might not exist
          }
          
          // Insert documents
          const result = await db.collection(collectionName).insertMany(documents);
          console.log(`  ✓ Imported ${result.insertedIds.length} documents into ${collectionName}`);
        }
      } catch (error) {
        console.error(`  ✗ Error importing ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n✓ Import completed!');
    
    // Calculate and update absence counts for all students
    console.log('\nCalculating absence counts...');
    const students = await db.collection('students').find().toArray();
    
    for (const student of students) {
      const absenceCount = await db.collection('attendance').countDocuments({
        studentId: student._id,
        present: false
      });
      
      await db.collection('students').updateOne(
        { _id: student._id },
        { $set: { absenceCount: absenceCount } }
      );
    }
    
    console.log(`✓ Updated absence counts for ${students.length} students`);

    // Migrate enrollments to add createdAt if missing
    console.log('\nMigrating enrollments to add timestamps...');
    const migrationDate = new Date().toISOString();
    const enrollments = await db.collection('enrollments').find().toArray();
    
    let updatedCount = 0;
    for (const enrollment of enrollments) {
      if (!enrollment.createdAt) {
        await db.collection('enrollments').updateOne(
          { _id: enrollment._id },
          { $set: { createdAt: migrationDate, updatedAt: migrationDate } }
        );
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`✓ Added timestamps to ${updatedCount} enrollments`);
    } else {
      console.log('✓ All enrollments already have timestamps');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

importData().catch(console.error);
