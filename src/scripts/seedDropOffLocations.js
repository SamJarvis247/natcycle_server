const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const DropOffLocation = require("../models/dropOffLocationModel");
const materialEnum = require("../models/enums/materialType");
const {
  materialTypeHierarchy,
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
  isPrimaryType,
  getPrimaryTypeForSubtype
} = require("../models/enums/materialTypeHierarchy");

require("dotenv").config();

// --- Configuration for Location Generation ---
const LOCATIONS_CONFIG = {
  NIGERIA_PH: {
    lat: 4.8396,
    lng: 7.0047,
    namePrefix: "PH",
    country: "Nigeria",
    city: "Port Harcourt",
    state: "Rivers State",
    weight: 5, // Higher weight for more PH locations
  },
  NIGERIA_LAGOS: {
    lat: 6.5244,
    lng: 3.3792,
    namePrefix: "Lagos",
    country: "Nigeria",
    city: "Lagos",
    state: "Lagos State",
    weight: 3,
  },
  NIGERIA_ABUJA: {
    lat: 9.0765,
    lng: 7.3986,
    namePrefix: "Abuja",
    country: "Nigeria",
    city: "Abuja",
    state: "FCT",
    weight: 2,
  },
  UK_LONDON: {
    lat: 51.5074,
    lng: 0.1278,
    namePrefix: "London",
    country: "United Kingdom",
    city: "London",
    weight: 2,
  },
  USA_NEW_YORK: {
    lat: 40.7128,
    lng: -74.0060,
    namePrefix: "NYC",
    country: "USA",
    city: "New York",
    state: "NY",
    weight: 2,
  },
  UK_MANCHESTER: {
    lat: 53.4808,
    lng: -2.2426,
    namePrefix: "Manchester",
    country: "United Kingdom",
    city: "Manchester",
    weight: 1,
  },
  USA_LOS_ANGELES: {
    lat: 34.0522,
    lng: -118.2437,
    namePrefix: "LA",
    country: "USA",
    city: "Los Angeles",
    state: "CA",
    weight: 1,
  },
};

// Pre-defined essential locations that should always be available
const ESSENTIAL_LOCATIONS = [
  {
    name: "EZ Bottle Redemption Center",
    description: "Official recycling center accepting all types of plastic bottles and containers. Environmentally-friendly disposal and redemption services available.",
    address: "392 Boston Post Road, Orange, CT 06477, United States of America",
    location: {
      type: "Point",
      coordinates: [-73.0210324, 41.2606126] // [longitude, latitude]
    },
    locationType: "redeem centre",
    primaryMaterialType: "plastic", // Primary material type
    acceptedSubtypes: ["500ml plastic", "1000ml plastic", "1500ml plastic"], // Specific subtypes accepted
    itemType: "plastic" // For backward compatibility
  },
  // Add more essential locations here if needed
];

const LOCATION_TYPES_ENUM = ["redeem centre", "collection point", "sewage unit"];

// Helper to generate random coordinates around a base
const generateNearbyCoordinates = (baseLat, baseLng, offset = 0.08) => [
  parseFloat((baseLng + (Math.random() - 0.5) * offset * 2).toFixed(6)),
  parseFloat((baseLat + (Math.random() - 0.5) * offset * 2).toFixed(6)),
];

// Helper to get a weighted random item type
// Get a weighted primary material type
const getWeightedPrimaryMaterialType = () => {
  const primaryTypes = getPrimaryMaterialTypes();

  // Define weights for primary material types
  const primaryTypeWeights = [
    { value: "plastic", weight: 7 },  // Emphasize plastic
    { value: "paper", weight: 2 },
    { value: "glass", weight: 2 },
    { value: "metal", weight: 1.5 },
    { value: "organic", weight: 1 },
    { value: "eWaste", weight: 1 },
    { value: "fabric", weight: 1 }
  ];

  // Filter to valid primary types that exist in our system
  const validWeightedTypes = primaryTypeWeights.filter(
    (wt) => primaryTypes.includes(wt.value)
  );

  if (validWeightedTypes.length === 0) {
    // If none of our weighted options are valid, pick a random primary type
    return faker.helpers.arrayElement(primaryTypes) || "plastic";
  }

  // Return a weighted primary type
  const selectedValue = faker.helpers.weightedArrayElement(validWeightedTypes);
  return typeof selectedValue === 'string' && selectedValue.length > 0
    ? selectedValue
    : "plastic";
};

// Get random subtypes for a given primary type
const getRandomSubtypesForPrimary = (primaryType, maxCount = 3) => {
  const allSubtypes = getSubtypesForPrimaryType(primaryType);

  if (!allSubtypes || allSubtypes.length === 0) {
    return [];
  }

  // Randomly decide if we want to accept all subtypes or just some
  const acceptAll = Math.random() < 0.3; // 30% chance to accept all subtypes

  if (acceptAll) {
    return allSubtypes;
  }

  // Otherwise, pick a random number of subtypes
  const count = Math.min(
    faker.number.int({ min: 1, max: maxCount }),
    allSubtypes.length
  );

  // Shuffle and take the first 'count' items
  return faker.helpers.shuffle(allSubtypes).slice(0, count);
};

// For backward compatibility: Get a weighted item type (could be primary or subtype)
const getWeightedItemType = () => {
  // Primary types get higher weight
  if (Math.random() < 0.4) { // 40% chance to return a primary type
    return getWeightedPrimaryMaterialType();
  }

  // For the rest, we'll pick a random subtype from a random primary
  const primaryType = getWeightedPrimaryMaterialType();
  const subtypes = getSubtypesForPrimaryType(primaryType);

  // If no subtypes, return the primary
  if (!subtypes || subtypes.length === 0) {
    return primaryType;
  }

  // Pick a random subtype
  return faker.helpers.arrayElement(subtypes);
};

const seedDropOffLocations = async (defaultSeedCount = 20, forceDelete = false) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding drop-off locations...");    // First, ensure essential locations exist
    console.log("Checking essential locations...");
    let essentialAdded = 0;

    for (const essentialLocation of ESSENTIAL_LOCATIONS) {
      // Check if this essential location already exists
      const existingEssential = await DropOffLocation.findOne({
        name: essentialLocation.name
      });

      if (!existingEssential) {
        // Create the essential location with primary type and accepted subtypes
        const locationData = { ...essentialLocation };

        // For backward compatibility, ensure itemType is set if not already
        if (!locationData.itemType) {
          locationData.itemType = locationData.primaryMaterialType || "plastic";
        }

        // Create the location with proper hierarchy structure
        await DropOffLocation.create(locationData);
        essentialAdded++;
        console.log(`Added essential location: ${locationData.name}`);
      } else {
        // Update the existing location to use the new structure if needed
        if (!existingEssential.primaryMaterialType) {
          const primaryType = isPrimaryType(existingEssential.itemType)
            ? existingEssential.itemType
            : getPrimaryTypeForSubtype(existingEssential.itemType) || "plastic";

          await DropOffLocation.findByIdAndUpdate(existingEssential._id, {
            primaryMaterialType: primaryType,
            // Only set accepted subtypes if it's a subtype
            ...(isPrimaryType(existingEssential.itemType) ? {} : {
              acceptedSubtypes: [existingEssential.itemType]
            })
          });
          console.log(`Updated essential location ${essentialLocation.name} with primary/subtype structure.`);
          essentialAdded++;
        } else {
          console.log(`Essential location ${essentialLocation.name} already exists with proper structure, skipping.`);
        }
      }
    }

    if (essentialAdded > 0) {
      console.log(`Added ${essentialAdded} essential drop-off locations.`);
    } else {
      console.log("All essential drop-off locations already exist.");
    }

    // Now check if we should add random locations
    const currentCount = await DropOffLocation.countDocuments();
    let locationsToSeedCount = 0;

    if (currentCount >= 30) {
      locationsToSeedCount = 15;
      console.log(`Database has ${currentCount} drop-off locations (>=30). Planning to seed 15 more random locations.`);
    } else {
      locationsToSeedCount = 20;
      console.log(`Database has ${currentCount} drop-off locations (<30). Planning to seed 20 more random locations.`);
    }

    if (locationsToSeedCount === 0) {
      console.log("No additional random drop-off locations needed.");
    } else {
      // Unlike before, we DON'T delete existing locations!
      // We just add more unique ones

      const generatedLocations = [];
      let phPlasticCount = 0;
      const requiredPhPlasticLocations = 3;

      const weightedCityConfigs = [];
      for (const key in LOCATIONS_CONFIG) {
        for (let i = 0; i < LOCATIONS_CONFIG[key].weight; i++) {
          weightedCityConfigs.push(LOCATIONS_CONFIG[key]);
        }
      }

      // Keep track of created location names to avoid duplicates
      const createdNames = new Set((await DropOffLocation.find({}, 'name')).map(loc => loc.name));

      for (let i = 0, created = 0; created < locationsToSeedCount; i++) {
        // Prevent infinite loops if we can't create enough unique locations
        if (i > locationsToSeedCount * 3) {
          console.log(`Could only create ${created} new locations after ${i} attempts. Stopping.`);
          break;
        }

        let cityConfig;
        let itemTypeToUse;
        let isPhPlasticSpecial = false;

        if (phPlasticCount < requiredPhPlasticLocations) {
          cityConfig = LOCATIONS_CONFIG.NIGERIA_PH;
          itemTypeToUse = "500ml plastic"; // Using more specific plastic type
          phPlasticCount++;
          isPhPlasticSpecial = true;
        } else {
          cityConfig = faker.helpers.arrayElement(weightedCityConfigs);
          itemTypeToUse = getWeightedItemType();
        }

        const coords = generateNearbyCoordinates(cityConfig.lat, cityConfig.lng);

        // Ensure itemTypeToUse is a string before using string methods for naming
        let safeItemTypeName = itemTypeToUse;
        if (typeof safeItemTypeName !== 'string' || safeItemTypeName.length === 0) {
          safeItemTypeName = '500ml plastic';
        }

        const locationName = isPhPlasticSpecial
          ? `${cityConfig.namePrefix} Prime Plastic Drop-off ${phPlasticCount}`
          : `${cityConfig.namePrefix} ${faker.company.name().split(" ")[0]} ${safeItemTypeName.charAt(0).toUpperCase() + safeItemTypeName.slice(1)} Hub`;

        // Skip if this name already exists
        if (createdNames.has(locationName)) {
          continue;
        }

        createdNames.add(locationName);
        created++;

        generatedLocations.push({
          name: locationName,
          itemType: itemTypeToUse,
          description: `Accepts ${itemTypeToUse}. Located in ${cityConfig.city}. ${faker.lorem.sentence(5)}`,
          address: `${faker.location.streetAddress(false)}, ${cityConfig.city}, ${cityConfig.state || ''}, ${cityConfig.country}`.replace(/ ,|, $/g, ''),
          location: { type: "Point", coordinates: coords },
          locationType: faker.helpers.arrayElement(LOCATION_TYPES_ENUM),
        });
      }

      if (generatedLocations.length > 0) {
        await DropOffLocation.insertMany(generatedLocations);
        console.log(`Successfully seeded ${generatedLocations.length} additional drop-off locations.`);
      } else {
        console.log("No additional drop-off locations were generated.");
      }
    }

    const finalCount = await DropOffLocation.countDocuments();
    console.log(`Total drop-off locations in database: ${finalCount}`);

  } catch (error) {
    console.error("Error seeding drop-off locations:", error);
  } finally {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
};

// Support command line arguments for seed count
const seedCount = process.argv[2] ? parseInt(process.argv[2]) : 20;
const forceDeleteArg = process.argv[3] === 'force';
seedDropOffLocations(seedCount, forceDeleteArg);
