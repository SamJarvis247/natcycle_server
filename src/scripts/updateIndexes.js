const mongoose = require('mongoose');
const Campaign = require('../models/campaignModel');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/natcycle');
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Update indexes
async function updateIndexes() {
  try {
    console.log('🔄 Updating campaign indexes...');

    // Drop old indexes that might conflict
    try {
      await Campaign.collection.dropIndex('location_2dsphere');
      console.log('✅ Dropped old location_2dsphere index');
    } catch (error) {
      console.log('ℹ️  Old location index not found (this is fine)');
    }

    // Ensure new indexes are created
    await Campaign.collection.createIndex({ 'locations.customLocation': '2dsphere' });
    console.log('✅ Created locations.customLocation 2dsphere index');

    await Campaign.collection.createIndex({ status: 1 });
    console.log('✅ Created status index');

    await Campaign.collection.createIndex({ endDate: 1 });
    console.log('✅ Created endDate index');

    await Campaign.collection.createIndex({ createdAt: -1 });
    console.log('✅ Created createdAt index');

    console.log('🎉 All indexes updated successfully!');

    // List all indexes for verification
    const indexes = await Campaign.collection.listIndexes().toArray();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error updating indexes:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectToDatabase();
    await updateIndexes();
    console.log('\n✨ Index update completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();
