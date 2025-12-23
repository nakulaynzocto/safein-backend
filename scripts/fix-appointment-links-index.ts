import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.config';

/**
 * Script to fix appointment booking links index issue
 * This script:
 * 1. Drops the old token_1 index if it exists
 * 2. Deletes any documents with null secureToken
 * 3. Creates a new sparse unique index on secureToken
 * 4. Verifies the indexes
 * 
 * This script is idempotent - safe to run multiple times.
 * 
 * Usage: 
 *   npm run fix:appointment-links-index
 *   or
 *   ts-node scripts/fix-appointment-links-index.ts
 * 
 * Environment Variables Required:
 *   - MONGODB_URI: MongoDB connection string
 */

// Constants
const COLLECTION_NAME = 'appointmentbookinglinks';
const OLD_INDEX_NAME = 'token_1';
const NEW_INDEX_NAME = 'secureToken_1';
const NEW_INDEX_FIELD = 'secureToken';

// MongoDB error codes
const INDEX_NOT_FOUND_CODE = 27;
const INDEX_NOT_FOUND_CODE_NAME = 'IndexNotFound';

/**
 * Check if an index exists in the collection
 */
async function indexExists(collection: mongoose.mongo.Collection, indexName: string): Promise<boolean> {
  const indexes = await collection.indexes();
  return indexes.some((idx) => idx.name === indexName);
}

/**
 * Get index information by name
 */
async function getIndexInfo(collection: mongoose.mongo.Collection, indexName: string): Promise<mongoose.mongo.IndexDescriptionInfo | null> {
  const indexes = await collection.indexes();
  return indexes.find((idx) => idx.name === indexName) || null;
}

/**
 * Check if error is an index not found error
 */
function isIndexNotFoundError(error: any): boolean {
  return error?.code === INDEX_NOT_FOUND_CODE || error?.codeName === INDEX_NOT_FOUND_CODE_NAME;
}

/**
 * Safely drop an index, handling not found errors gracefully
 */
async function safeDropIndex(collection: mongoose.mongo.Collection, indexName: string): Promise<boolean> {
  try {
    await collection.dropIndex(indexName);
    return true;
  } catch (error: any) {
    if (isIndexNotFoundError(error)) {
      return false; // Index doesn't exist, which is fine
    }
    throw error; // Re-throw unexpected errors
  }
}

/**
 * Log index information in a readable format
 */
function logIndexes(indexes: mongoose.mongo.IndexDescriptionInfo[]): void {
  console.log('\n📋 Current indexes:');
  indexes.forEach((index) => {
    const info: Record<string, unknown> = {
      name: index.name,
      key: index.key,
    };
    if (index.unique) info.unique = true;
    if (index.sparse) info.sparse = true;
    console.log(`  - ${JSON.stringify(info)}`);
  });
}

async function fixAppointmentLinksIndex(): Promise<void> {
  const startTime = Date.now();
  let db: mongoose.mongo.Db | null = null;

  try {
    console.log('🔧 Starting appointment booking links index fix...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Validate environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    // Connect to database using environment variables
    await connectDatabase();
    console.log('✅ Connected to database');
    
    const connectionDb = mongoose.connection.db;
    if (!connectionDb) {
      throw new Error('Database connection not available');
    }
    db = connectionDb;
    
    const dbName = db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    
    const collection = db.collection(COLLECTION_NAME);
    
    // Check if collection exists
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.log(`⚠️  Collection "${COLLECTION_NAME}" does not exist. Creating it...`);
      // Collection will be created automatically on first insert
    }
    
    // Get current document count
    const totalDocs = await collection.countDocuments();
    const nullTokenDocs = await collection.countDocuments({ [NEW_INDEX_FIELD]: null });
    console.log(`📈 Total documents: ${totalDocs}`);
    console.log(`📈 Documents with null ${NEW_INDEX_FIELD}: ${nullTokenDocs}`);
    
    // Get current indexes (only once for efficiency)
    const existingIndexes = await collection.indexes();
    logIndexes(existingIndexes);
    
    // Step 1: Drop old index if it exists
    const hasOldIndex = await indexExists(collection, OLD_INDEX_NAME);
    if (hasOldIndex) {
      const dropped = await safeDropIndex(collection, OLD_INDEX_NAME);
      if (dropped) {
        console.log(`\n✅ Dropped old ${OLD_INDEX_NAME} index`);
      }
    } else {
      console.log(`\nℹ️  ${OLD_INDEX_NAME} index does not exist - skipping drop`);
    }
    
    // Step 2: Delete any documents with null secureToken
    if (nullTokenDocs > 0) {
      const deleteResult = await collection.deleteMany({ [NEW_INDEX_FIELD]: null });
      console.log(`\n✅ Deleted ${deleteResult.deletedCount} documents with null ${NEW_INDEX_FIELD}`);
    } else {
      console.log(`\nℹ️  No documents with null ${NEW_INDEX_FIELD} found - skipping deletion`);
    }
    
    // Step 3: Check if secureToken_1 index already exists
    const hasNewIndex = await indexExists(collection, NEW_INDEX_NAME);
    if (hasNewIndex) {
      console.log(`\nℹ️  ${NEW_INDEX_NAME} index already exists - verifying...`);
      const indexInfo = await getIndexInfo(collection, NEW_INDEX_NAME);
      if (indexInfo?.unique && indexInfo?.sparse) {
        console.log(`✅ ${NEW_INDEX_NAME} index is already correctly configured (unique, sparse)`);
      } else {
        console.log(`⚠️  ${NEW_INDEX_NAME} index exists but may not be correctly configured`);
        console.log('   Dropping and recreating...');
        await safeDropIndex(collection, NEW_INDEX_NAME);
        await collection.createIndex(
          { [NEW_INDEX_FIELD]: 1 },
          { unique: true, sparse: true, name: NEW_INDEX_NAME }
        );
        console.log(`✅ Recreated ${NEW_INDEX_NAME} index with correct configuration`);
      }
    } else {
      // Create new sparse unique index on secureToken
      await collection.createIndex(
        { [NEW_INDEX_FIELD]: 1 },
        { unique: true, sparse: true, name: NEW_INDEX_NAME }
      );
      console.log(`\n✅ Created new ${NEW_INDEX_NAME} index`);
    }
    
    // Step 4: Verify final indexes
    const finalIndexes = await collection.indexes();
    logIndexes(finalIndexes);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Index fix completed successfully in ${duration}s!`);
    
  } catch (error) {
    console.error('\n❌ Error fixing appointment links index:');
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error('   Unknown error:', error);
    }
    process.exit(1);
  } finally {
    // Close database connection safely
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the fix function
if (require.main === module) {
  fixAppointmentLinksIndex();
}

export { fixAppointmentLinksIndex };
