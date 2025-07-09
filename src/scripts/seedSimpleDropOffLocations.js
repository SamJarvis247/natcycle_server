const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const SimpleDropOffLocation = require("../models/simpleDropOffLocationModel");
const {
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
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

// Configuration for location generation
const LOCATIONS_CONFIG = {
  // Port Harcourt area (close to Happy Food Bakery)
  PH_HAPPY_FOOD_AREA: {
    lat: HAPPY_FOOD_BAKERY.lat,
    lng: HAPPY_FOOD_BAKERY.lng,
    radius: 0.01, // Very close to Happy Food Bakery (about 1km)
    count: 4,
    namePrefix: "Happy Food Area",
    city: "Port Harcourt",
    state: "Rivers State",
    country: "Nigeria"
  },
  // Other Port Harcourt areas
  PH_GENERAL: {
    lat: 4.8396,
    lng: 7.0047,
    radius: 0.05, // Within Port Harcourt (about 5km)
    count: 6,
    namePrefix: "PH",
    city: "Port Harcourt",
    state: "Rivers State",
    country: "Nigeria"
  },
  // Lagos
  LAGOS: {
    lat: 6.5244,
    lng: 3.3792,
    radius: 0.03,
    count: 3,
    namePrefix: "Lagos",
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
    namePrefix: "Abuja",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria"
  },
  // International locations
  LONDON: {
    lat: 51.5074,
    lng: -0.1278,
    radius: 0.02,
    count: 2,
    namePrefix: "London",
    city: "London",
    country: "United Kingdom"
  },
  NEW_YORK: {
    lat: 40.7128,
    lng: -74.0060,
    radius: 0.02,
    count: 2,
    namePrefix: "NYC",
    city: "New York",
    state: "New York",
    country: "United States"
  },
  ACCRA: {
    lat: 5.6037,
    lng: -0.1870,
    radius: 0.03,
    count: 1,
    namePrefix: "Accra",
    city: "Accra",
    country: "Ghana"
  }
};

// Organization types for variety
const ORGANIZATION_TYPES = [
  "Environmental Initiative",
  "Community Clean-up",
  "School Green Club",
  "Beach Clean Initiative",
  "University Sustainability",
  "Shopping Mall Recycling",
  "Church Green Ministry",
  "Youth Corps Environmental",
  "Local Government Waste",
  "NGO Recycling Program"
];

// Location types for naming
const LOCATION_TYPES = [
  "Collection Basket",
  "Recycling Point",
  "Drop-off Bin",
  "Green Station",
  "Eco Point",
  "Clean Hub",
  "Waste Collection",
  "Recycle Corner"
];

// Generate random coordinates within radius
const generateRandomCoordinates = (centerLat, centerLng, radius) => {
  const radiusInDegrees = radius;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  return {
    lat: centerLat + x,
    lng: centerLng + y
  };
};

// Get random material type with weights favoring common types
const getRandomMaterialType = () => {
  const materialTypes = getPrimaryMaterialTypes();
  const weights = {
    plastic: 40,
    paper: 20,
    glass: 15,
    metal: 15,
    organic: 5,
    ewaste: 3,
    textile: 2
  };

  const weightedTypes = materialTypes
    .map(type => ({ value: type, weight: weights[type] || 1 }))
    .flatMap(item => Array(item.weight).fill(item.value));

  return faker.helpers.arrayElement(weightedTypes);
};

// Generate accepted subtypes for a material type
const getAcceptedSubtypes = (materialType) => {
  const allSubtypes = getSubtypesForPrimaryType(materialType);
  if (!allSubtypes || allSubtypes.length === 0) return [];

  // Include 50-100% of available subtypes
  const minCount = Math.ceil(allSubtypes.length * 0.5);
  const maxCount = allSubtypes.length;
  const count = faker.number.int({ min: minCount, max: maxCount });

  return faker.helpers.arrayElements(allSubtypes, count);
};

// Generate a simple drop-off location
const generateLocation = (config, index) => {
  const coords = generateRandomCoordinates(config.lat, config.lng, config.radius);
  const materialType = getRandomMaterialType();
  const acceptedSubtypes = getAcceptedSubtypes(materialType);
  const organizationType = faker.helpers.arrayElement(ORGANIZATION_TYPES);
  const locationType = faker.helpers.arrayElement(LOCATION_TYPES);

  // Generate address based on location
  let address = "";
  if (config.country === "Nigeria") {
    address = `${faker.location.streetAddress()}, ${config.city}, ${config.state}, Nigeria`;
  } else if (config.country === "United Kingdom") {
    address = `${faker.location.streetAddress()}, ${config.city}, UK`;
  } else if (config.country === "United States") {
    address = `${faker.location.streetAddress()}, ${config.city}, ${config.state}, USA`;
  } else {
    address = `${faker.location.streetAddress()}, ${config.city}, ${config.country}`;
  }

  // Generate contact number based on country
  let contactNumber = "";
  if (config.country === "Nigeria") {
    contactNumber = `+234${faker.string.numeric(10)}`;
  } else if (config.country === "United Kingdom") {
    contactNumber = `+44${faker.string.numeric(10)}`;
  } else if (config.country === "United States") {
    contactNumber = `+1${faker.string.numeric(10)}`;
  } else {
    contactNumber = `+233${faker.string.numeric(9)}`; // Ghana
  }

  return {
    name: `${config.namePrefix} ${locationType} ${index + 1}`,
    location: {
      type: "Point",
      coordinates: [coords.lng, coords.lat]
    },
    address,
    materialType,
    acceptedSubtypes,
    organizationName: `${config.namePrefix} ${organizationType}`,
    isActive: true,
    verificationRequired: faker.datatype.boolean(0.1), // 30% require verification
    maxItemsPerDropOff: faker.number.int({ min: 5, max: 25 }),
    operatingHours: faker.helpers.arrayElement([
      "24/7",
      "6:00 AM - 10:00 PM",
      "8:00 AM - 6:00 PM",
      "Monday - Friday: 9:00 AM - 5:00 PM",
      "Weekdays: 7:00 AM - 7:00 PM, Weekends: 9:00 AM - 5:00 PM"
    ]),
    contactNumber,
    lastVerified: faker.date.recent({ days: 30 })
  };
};

// Main seeding function
const seedSimpleDropOffLocations = async () => {
  try {
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB for seeding Simple Drop-off Locations.");
    }

    // Check if we already have 20 or more locations
    const existingCount = await SimpleDropOffLocation.countDocuments();
    console.log(`Current Simple Drop-off Locations in database: ${existingCount}`);

    if (existingCount >= 20) {
      console.log("Database already has 20 or more Simple Drop-off Locations. Skipping seeding.");
      return;
    }

    const locationsToCreate = [];

    // Generate locations for each configuration
    for (const [configKey, config] of Object.entries(LOCATIONS_CONFIG)) {
      console.log(`Generating ${config.count} locations for ${configKey}...`);

      for (let i = 0; i < config.count; i++) {
        const location = generateLocation(config, i);
        locationsToCreate.push(location);
      }
    }

    console.log(`Generated ${locationsToCreate.length} simple drop-off locations to seed.`);

    // Validate that we don't create duplicates within 50m (as per business logic)
    const validatedLocations = [];

    for (const newLocation of locationsToCreate) {
      // Check if any existing location is within 50m
      const nearbyExisting = await SimpleDropOffLocation.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: newLocation.location.coordinates
            },
            $maxDistance: 50 // 50 meters
          }
        },
        isActive: true
      });

      if (nearbyExisting.length === 0) {
        // Check against other locations we're about to create
        const tooClose = validatedLocations.some(existingLoc => {
          const distance = calculateDistance(
            newLocation.location.coordinates[1], // lat
            newLocation.location.coordinates[0], // lng  
            existingLoc.location.coordinates[1], // lat
            existingLoc.location.coordinates[0]  // lng
          );
          return distance < 0.05; // 50 meters in km
        });

        if (!tooClose) {
          validatedLocations.push(newLocation);
        } else {
          console.log(`Skipping location too close to another: ${newLocation.name}`);
        }
      } else {
        console.log(`Skipping location near existing: ${newLocation.name}`);
      }
    }

    if (validatedLocations.length > 0) {
      await SimpleDropOffLocation.insertMany(validatedLocations);
      console.log(`Successfully seeded ${validatedLocations.length} Simple Drop-off Locations.`);

      // Log breakdown by area
      const breakdown = {};
      for (const [configKey, config] of Object.entries(LOCATIONS_CONFIG)) {
        const count = validatedLocations.filter(loc =>
          loc.name.startsWith(config.namePrefix)
        ).length;
        breakdown[configKey] = count;
      }

      console.log("Breakdown by area:", breakdown);
    } else {
      console.log("No new Simple Drop-off Locations were created (all too close to existing ones).");
    }

    const finalCount = await SimpleDropOffLocation.countDocuments();
    console.log(`Total Simple Drop-off Locations in database: ${finalCount}`);

  } catch (error) {
    console.error("Error seeding Simple Drop-off Locations:", error);
  } finally {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Run the seeding
seedSimpleDropOffLocations();
