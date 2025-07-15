const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Campaign = require("../models/campaignModel");
const DropOffLocation = require("../models/dropOffLocationModel");
const {
  getPrimaryMaterialTypes,
} = require("../models/enums/materialTypeHierarchy");

require("dotenv").config();

// Happy Food Bakery, Ada George coordinates as reference point
const HAPPY_FOOD_BAKERY = {
  lat: 4.8396,
  lng: 7.0047,
  name: "Happy Food Bakery Area",
  city: "Port Harcourt",
  state: "Rivers State",
  country: "Nigeria"
};

// Configuration for campaign locations
const CAMPAIGNS_CONFIG = {
  // Port Harcourt area (close to Happy Food Bakery)
  PH_HAPPY_FOOD_AREA: {
    lat: HAPPY_FOOD_BAKERY.lat,
    lng: HAPPY_FOOD_BAKERY.lng,
    radius: 0.01, // Very close to Happy Food Bakery (about 1km)
    count: 3,
    namePrefix: "Happy Food Recycling",
    city: "Port Harcourt",
    state: "Rivers State",
    country: "Nigeria"
  },
  // Ada George Road Area
  ADA_GEORGE: {
    lat: 4.8454,
    lng: 7.0012,
    radius: 0.008, // Close to Ada George Road
    count: 3,
    namePrefix: "Ada George Green",
    city: "Port Harcourt",
    state: "Rivers State",
    country: "Nigeria"
  },
  // Other Port Harcourt areas
  PH_GENERAL: {
    lat: 4.8396,
    lng: 7.0047,
    radius: 0.04, // Within Port Harcourt (about 4km)
    count: 5,
    namePrefix: "PH Recycle",
    city: "Port Harcourt",
    state: "Rivers State",
    country: "Nigeria"
  },
  // Lagos
  LAGOS: {
    lat: 6.5244,
    lng: 3.3792,
    radius: 0.03,
    count: 2,
    namePrefix: "Lagos Green",
    city: "Lagos",
    state: "Lagos State",
    country: "Nigeria"
  },
  // Abuja
  ABUJA: {
    lat: 9.0765,
    lng: 7.3986,
    radius: 0.03,
    count: 2,
    namePrefix: "Abuja Clean",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria"
  }
};

// Organization names for campaigns
const ORGANIZATION_NAMES = [
  "EcoNigeria",
  "GreenEarth Initiative",
  "RecycleFirst",
  "EnviroSolutions",
  "NatCycle Community",
  "EarthKeepers",
  "CleanPlanet Nigeria",
  "GreenTomorrow",
  "RecyclePath",
  "EcoFriends",
  "Plastic Free Future",
  "Sustainable Communities"
];

// Campaign themes
const CAMPAIGN_THEMES = [
  "Community Cleanup",
  "Plastic Recycling",
  "School Recycling Challenge",
  "Beach Cleanup",
  "Market Waste Reduction",
  "Office Recycling Program",
  "Neighborhood Green Initiative",
  "River Cleanup Project",
  "Zero Waste Challenge",
  "E-Waste Collection",
  "Glass Recycling Drive",
  "Textile Collection Campaign"
];

// Campaign descriptions
const CAMPAIGN_DESCRIPTIONS = [
  "Help us collect recyclable materials to keep our community clean and green. Join this campaign to earn rewards while contributing to environmental sustainability.",
  "This campaign aims to reduce plastic pollution in our neighborhoods. Bring your plastic waste and earn points while helping protect our environment.",
  "Join our mission to create a cleaner future. Every item you recycle makes a difference in reducing landfill waste and conserving resources.",
  "Participate in our recycling drive to transform waste into valuable resources. Your contributions help create a circular economy and reduce environmental impact.",
  "Be a recycling champion in your community! This campaign encourages proper waste disposal and rewards participants who bring recyclable materials.",
  "Help us achieve our recycling goals while earning rewards. Your participation directly contributes to reducing pollution and conserving natural resources.",
  "This collection initiative focuses on reducing waste sent to landfills. Join us in creating a more sustainable future through recycling and proper waste management.",
  "Together we can make a difference! This campaign targets reducing environmental pollution through proper collection and recycling of waste materials."
];

// Get a random element from an array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Generate a random coordinate within a radius of a point
const getRandomCoordinate = (baseLat, baseLng, radius) => {
  const randomAngle = Math.random() * 2 * Math.PI; // Random angle in radians
  const randomRadius = Math.random() * radius; // Random radius within the max radius

  // Convert to Cartesian coordinates
  const dx = randomRadius * Math.cos(randomAngle);
  const dy = randomRadius * Math.sin(randomAngle);

  // Convert back to latitude and longitude
  // 111,111 meters is approximately 1 degree of latitude
  // Longitude degrees vary based on latitude, approx cos(lat) * 111,111
  const newLat = baseLat + (dy / 111.111);
  const newLng = baseLng + (dx / (111.111 * Math.cos(baseLat * (Math.PI / 180))));

  return [newLng, newLat]; // GeoJSON uses [longitude, latitude] format
};

// Generate campaign data
const generateCampaignData = async (config) => {
  const campaigns = [];
  const materialTypes = getPrimaryMaterialTypes();

  // Find existing drop-off locations to potentially link to campaigns
  const dropOffLocations = await DropOffLocation.find({});

  // Loop through each location configuration
  for (const [key, locationConfig] of Object.entries(CAMPAIGNS_CONFIG)) {
    for (let i = 0; i < locationConfig.count; i++) {
      // Generate coordinates near the location
      const coordinates = getRandomCoordinate(
        locationConfig.lat,
        locationConfig.lng,
        locationConfig.radius
      );

      // Generate random date for startDate (between now and 30 days ago)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));

      // 75% of campaigns have an end date, 25% are ongoing
      let endDate = null;
      if (Math.random() > 0.25) {
        endDate = new Date();
        endDate.setDate(startDate.getDate() + 30 + Math.floor(Math.random() * 60)); // 30-90 days after start date
      }

      // Select a random number of material types (1-3)
      const numMaterialTypes = Math.floor(Math.random() * 3) + 1;
      const selectedMaterialTypes = [];
      const materialTypesCopy = [...materialTypes]; // Make a copy to avoid modifying the original

      for (let j = 0; j < numMaterialTypes; j++) {
        if (materialTypesCopy.length > 0) {
          const randomIndex = Math.floor(Math.random() * materialTypesCopy.length);
          selectedMaterialTypes.push(materialTypesCopy[randomIndex]);
          materialTypesCopy.splice(randomIndex, 1); // Remove the selected type to avoid duplicates
        }
      }

      // Randomly associate with a drop-off location (30% chance)
      let dropOffLocation = null;
      if (Math.random() < 0.3 && dropOffLocations.length > 0) {
        dropOffLocation = dropOffLocations[Math.floor(Math.random() * dropOffLocations.length)]._id;
      }

      // Generate a campaign
      const campaign = {
        name: `${locationConfig.namePrefix} ${getRandomElement(CAMPAIGN_THEMES)}`,
        organizationName: getRandomElement(ORGANIZATION_NAMES),
        description: getRandomElement(CAMPAIGN_DESCRIPTIONS),
        location: {
          type: 'Point',
          coordinates
        },
        address: `${faker.location.streetAddress()}, ${locationConfig.city}, ${locationConfig.state || ''}, ${locationConfig.country}`,
        startDate,
        endDate,
        status: 'active', // All campaigns start active
        materialTypes: selectedMaterialTypes,
        goal: Math.floor(Math.random() * 1000) + 100, // Random goal between 100-1100
        progress: 0, // Start with 0 progress
        contributors: [], // Start with no contributors
        image: {
          public_id: 'campaigns/default',
          url: 'https://res.cloudinary.com/dfvwwccxs/image/upload/v1709162352/campaigns/qnljqbcti5od3s8rehs5.jpg'
        },
        dropOffLocation
      };

      campaigns.push(campaign);
    }
  }

  return campaigns;
};

// Seed the campaigns
const seedCampaigns = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Delete existing campaigns
    await Campaign.deleteMany({});
    console.log("Deleted existing campaigns");

    // Generate and insert campaigns
    const campaigns = await generateCampaignData();
    const result = await Campaign.insertMany(campaigns);

    console.log(`Successfully seeded ${result.length} campaigns`);
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding campaigns:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedCampaigns();
