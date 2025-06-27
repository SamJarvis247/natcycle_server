const mongoose = require('mongoose');
const ThingsMatchUser = require('../models/thingsMatch/user.model.js');
require('dotenv').config();

/**
 * Comprehensive database setup script for production deployment
 * This script handles:
 * 1. Data migration from old location format to GeoJSON
 * 2. Ensures geospatial indexes are created
 * 3. Verifies data integrity
 */

const setupDatabase = async () => {
  let connection = null;

  try {
    console.log('🚀 Starting database setup...');

    // Connect to MongoDB
    connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    const collection = mongoose.connection.collection('thingsmatchusers');

    // Step 1: Migrate location data format
    await migrateLocationData(collection);

    // Step 2: Ensure geospatial indexes
    await ensureGeospatialIndexes(collection);

    // Step 3: Verify data integrity
    await verifyDataIntegrity(collection);

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
  }
};

/**
 * Migrate location data from old format to GeoJSON format
 */
const migrateLocationData = async (collection) => {
  console.log('\n📍 Step 1: Migrating location data...');

  try {
    // Find all documents with the old location format
    const documents = await collection.find({
      $or: [
        { 'location.lat': { $exists: true } },
        { 'location.lng': { $exists: true } },
        { 'location.coordinates': { $exists: false } },
        { 'location.type': { $exists: false } },
        { 'location.type': { $ne: 'Point' } }
      ]
    }).toArray();

    console.log(`   Found ${documents.length} documents to migrate`);

    if (documents.length === 0) {
      console.log('   ✅ No documents need migration');
      return;
    }

    let migrated = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        let newLocation;

        if (doc.location && (doc.location.lat !== undefined || doc.location.lng !== undefined)) {
          // Old format: { lat: x, lng: y, address: "..." }
          const lat = parseFloat(doc.location.lat) || 0;
          const lng = parseFloat(doc.location.lng) || 0;
          const address = doc.location.address || "";

          // Validate coordinates
          if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            console.log(`   ⚠️  Invalid coordinates for ${doc._id}, using default [0, 0]`);
            newLocation = {
              type: "Point",
              coordinates: [0, 0],
              address: address
            };
          } else {
            newLocation = {
              type: "Point",
              coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
              address: address
            };
          }
        } else if (!doc.location || !doc.location.type || doc.location.type !== 'Point') {
          // No location or missing/incorrect type
          newLocation = {
            type: "Point",
            coordinates: [0, 0],
            address: ""
          };
        } else {
          // Already in correct format, skip
          continue;
        }

        // Update the document
        await collection.updateOne(
          { _id: doc._id },
          { $set: { location: newLocation } }
        );

        migrated++;
        console.log(`   ✅ Migrated ${doc._id}: [${newLocation.coordinates[0]}, ${newLocation.coordinates[1]}]`);

      } catch (error) {
        errors++;
        console.error(`   ❌ Error migrating ${doc._id}:`, error.message);
      }
    }

    console.log(`   📊 Migration Summary: ${migrated} migrated, ${errors} errors`);

  } catch (error) {
    console.error('   ❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Ensure all required geospatial indexes exist
 */
const ensureGeospatialIndexes = async (collection) => {
  console.log('\n🔍 Step 2: Ensuring geospatial indexes...');

  try {
    // Check existing indexes
    const indexes = await collection.getIndexes();
    const indexNames = Object.keys(indexes);
    console.log(`   Current indexes: ${indexNames.join(', ')}`);

    // Check if geospatial index exists
    const hasGeospatialIndex = indexNames.includes('location_2dsphere');

    if (hasGeospatialIndex) {
      console.log('   ✅ Geospatial index already exists');
    } else {
      console.log('   🔧 Creating geospatial index...');

      // Create the geospatial index
      await collection.createIndex({ location: "2dsphere" }, {
        name: "location_2dsphere",
        background: true
      });

      console.log('   ✅ Geospatial index created successfully');
    }

    // Verify index was created
    const updatedIndexes = await collection.getIndexes();
    const updatedIndexNames = Object.keys(updatedIndexes);
    console.log(`   Final indexes: ${updatedIndexNames.join(', ')}`);

  } catch (error) {
    console.error('   ❌ Index creation failed:', error);
    throw error;
  }
};

/**
 * Verify data integrity after migration and indexing
 */
const verifyDataIntegrity = async (collection) => {
  console.log('\n✅ Step 3: Verifying data integrity...');

  try {
    // Get all documents
    const documents = await collection.find({}).toArray();
    console.log(`   Total ThingsMatch users: ${documents.length}`);

    let correctFormat = 0;
    let incorrectFormat = 0;
    let missingLocation = 0;
    let invalidCoordinates = 0;

    for (const doc of documents) {
      if (!doc.location) {
        missingLocation++;
        console.log(`   ❌ Missing location: ${doc._id}`);
      } else if (doc.location.type === "Point" &&
        Array.isArray(doc.location.coordinates) &&
        doc.location.coordinates.length === 2) {

        const [lng, lat] = doc.location.coordinates;

        // Check if coordinates are valid numbers
        if (typeof lng === 'number' && typeof lat === 'number' &&
          !isNaN(lng) && !isNaN(lat) &&
          lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          correctFormat++;
        } else {
          invalidCoordinates++;
          console.log(`   ⚠️  Invalid coordinates: ${doc._id} - [${lng}, ${lat}]`);
        }
      } else {
        incorrectFormat++;
        console.log(`   ❌ Incorrect format: ${doc._id}`);
      }
    }

    // Verify index exists
    const indexes = await collection.getIndexes();
    const hasGeospatialIndex = Object.keys(indexes).includes('location_2dsphere');

    console.log(`   📊 Data Integrity Summary:`);
    console.log(`      ✅ Correct GeoJSON format: ${correctFormat}`);
    console.log(`      ❌ Incorrect format: ${incorrectFormat}`);
    console.log(`      ❌ Missing location: ${missingLocation}`);
    console.log(`      ⚠️  Invalid coordinates: ${invalidCoordinates}`);
    console.log(`      🔍 Geospatial index exists: ${hasGeospatialIndex ? 'Yes' : 'No'}`);

    // Test a sample geospatial query to ensure everything works
    if (hasGeospatialIndex && correctFormat > 0) {
      console.log(`   🧪 Testing geospatial query...`);

      const testQuery = await collection.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [0, 0] },
            distanceField: "distance",
            maxDistance: 100000000, // Large distance to include all documents
            spherical: true
          }
        },
        { $limit: 1 }
      ]).toArray();

      if (testQuery.length > 0) {
        console.log(`   ✅ Geospatial query test successful`);
      } else {
        console.log(`   ⚠️  Geospatial query returned no results`);
      }
    }

    // Report any issues that need attention
    const totalIssues = incorrectFormat + missingLocation + invalidCoordinates;
    if (totalIssues > 0) {
      console.log(`   ⚠️  Found ${totalIssues} documents with issues that may need manual review`);
    } else {
      console.log(`   🎉 All data is in correct format!`);
    }

  } catch (error) {
    console.error('   ❌ Data verification failed:', error);
    throw error;
  }
};

// Export for use in other scripts
module.exports = {
  setupDatabase,
  migrateLocationData,
  ensureGeospatialIndexes,
  verifyDataIntegrity
};

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}
