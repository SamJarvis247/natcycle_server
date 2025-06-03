const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const DropOffLocation = require("../models/dropOffLocationModel");
// Assuming materialEnum.js exports an array directly or an object with a 'default' key that is an array

let materialEnum = require("../models/enums/materialType");
if (materialEnum.default) {
  materialEnum = materialEnum.default;
}
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
  // Add more UK/USA cities if desired with lower weights
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

const LOCATION_TYPES_ENUM = ["redeem centre", "collection point", "sewage unit"];

// Helper to generate random coordinates around a base
const generateNearbyCoordinates = (baseLat, baseLng, offset = 0.08) => [
  parseFloat((baseLng + (Math.random() - 0.5) * offset * 2).toFixed(6)),
  parseFloat((baseLat + (Math.random() - 0.5) * offset * 2).toFixed(6)),
];

// Helper to get a weighted random item type
const getWeightedItemType = () => {
  const localWeightedTypes = [
    { value: "500ml plastic", weight: 7 },
    { value: "1000ml plastic", weight: 1 },
    { value: "1500ml plastic", weight: 1 },
    { value: "paper", weight: 2 },
    { value: "glass", weight: 2 },
    { value: "metal", weight: 1.5 },
    { value: "organic", weight: 1 },
    { value: "eWaste", weight: 1 },
    { value: "fabric", weight: 1 },
    { value: "food", weight: 1 },
  ];

  if (!materialEnum || !Array.isArray(materialEnum)) {
    console.warn(
      "materialEnum is not a valid array. Falling back to a default item type ('general')."
    );
    return "general";
  }

  const validWeightedTypes = localWeightedTypes.filter(
    (wt) => materialEnum.includes(wt.value)
  );

  if (validWeightedTypes.length === 0) {
    console.warn(
      "No valid weighted types after filtering against materialEnum. Falling back to random selection from materialEnum (if available) or default."
    );
    if (materialEnum.length > 0) {
      const randomType = faker.helpers.arrayElement(materialEnum);
      if (typeof randomType === 'string' && randomType.length > 0) {
        return randomType;
      } else {
        console.warn("Randomly selected type from materialEnum is invalid. Falling back to default ('general').");
        return "general";
      }
    } else {
      console.warn(
        "materialEnum is empty. Cannot pick random element. Falling back to default ('general')."
      );
      return "general";
    }
  }

  // `faker.helpers.weightedArrayElement` returns the VALUE directly
  const selectedValue = faker.helpers.weightedArrayElement(validWeightedTypes);

  // Check if the returned selectedValue is a valid string
  if (typeof selectedValue === 'string' && selectedValue.length > 0) {
    return selectedValue;
  } else {
    console.warn("Weighted element selection resulted in an invalid type or empty string. Falling back to default ('general').");
    return "general";
  }
};

const seedDropOffLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding drop-off locations...");

    const currentCount = await DropOffLocation.countDocuments();
    let locationsToSeedCount = 0;

    if (currentCount >= 30) {
      locationsToSeedCount = 15;
      console.log(`Database has ${currentCount} drop-off locations (>=30). Planning to seed 15 new locations.`);
    } else {
      locationsToSeedCount = 20;
      console.log(`Database has ${currentCount} drop-off locations (<30). Planning to seed 20 new locations.`);
    }

    if (locationsToSeedCount === 0) {
      console.log(
        "No new drop-off locations need to be seeded based on the calculated count."
      );
    } else {
      await DropOffLocation.deleteMany({});
      console.log(
        "Cleared existing drop-off locations as new ones will be seeded."
      );

      const generatedLocations = [];
      let phPlasticCount = 0;
      const requiredPhPlasticLocations = 3;

      const weightedCityConfigs = [];
      for (const key in LOCATIONS_CONFIG) {
        for (let i = 0; i < LOCATIONS_CONFIG[key].weight; i++) {
          weightedCityConfigs.push(LOCATIONS_CONFIG[key]);
        }
      }

      for (let i = 0; i < locationsToSeedCount; i++) {
        let cityConfig;
        let itemTypeToUse; // Renamed to avoid confusion with loop variable
        let isPhPlasticSpecial = false;

        if (phPlasticCount < requiredPhPlasticLocations) {
          cityConfig = LOCATIONS_CONFIG.NIGERIA_PH;
          itemTypeToUse = "plastic"; // Directly assign for special PH locations
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
          console.warn(`Invalid itemType ('${safeItemTypeName}') determined for naming. Defaulting to 'General'.`);
          safeItemTypeName = 'General';
        }

        const locationName = isPhPlasticSpecial
          ? `${cityConfig.namePrefix} Prime Plastic Drop-off ${phPlasticCount}`
          : `${cityConfig.namePrefix} ${faker.company.name().split(" ")[0]} ${safeItemTypeName.charAt(0).toUpperCase() + safeItemTypeName.slice(1)} Hub`;

        generatedLocations.push({
          name: locationName,
          itemType: itemTypeToUse, // Store the actual itemType determined
          description: `Accepts ${itemTypeToUse}. Located in ${cityConfig.city}. ${faker.lorem.sentence(5)}`,
          address: `${faker.location.streetAddress(false)}, ${cityConfig.city}, ${cityConfig.state || ''}, ${cityConfig.country}`.replace(/ ,|, $/g, ''),
          location: { type: "Point", coordinates: coords },
          locationType: faker.helpers.arrayElement(["redeem centre", "collection point", "sewage unit"]),
        });
      }

      if (generatedLocations.length > 0) {
        await DropOffLocation.insertMany(generatedLocations);
        console.log(`Successfully seeded ${generatedLocations.length} new drop-off locations.`);
      } else {
        console.log("No drop-off locations were generated in this run (this should not happen if locationsToSeedCount > 0).");
      }
    }
  } catch (error) {
    console.error("Error seeding drop-off locations:", error);
  } finally {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
};

seedDropOffLocations();
