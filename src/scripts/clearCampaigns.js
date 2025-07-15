const mongoose = require('mongoose');
const Campaign = require('../models/campaignModel');
require('dotenv').config();

async function clearCampaigns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    const result = await Campaign.deleteMany({});
    console.log(`Deleted ${result.deletedCount} campaigns`);

    mongoose.connection.close();
    console.log('MongoDB connection closed');

    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing campaigns:', error);
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  clearCampaigns();
}

module.exports = clearCampaigns;
