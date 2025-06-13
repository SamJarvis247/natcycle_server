const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const DropOffLocation = require("../models/dropOffLocationModel");
const materialEnum = require("../models/enums/materialType"); // For backward compatibility itemType
const {
  materialTypeHierarchy,
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
  isPrimaryType,
  getPrimaryTypeForSubtype,
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
    weight: 5,
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
    lng: -74.006,
    namePrefix: "NYC",
    country: "USA",
    city: "New York",
    state: "NY",
    weight: 3,
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
    weight: 2,
  },
};

const ESSENTIAL_LOCATIONS = [
  {
    name: "EZ Bottle Redemption Center",
    description:
      "Official recycling center accepting all types of plastic bottles and containers. Environmentally-friendly disposal and redemption services available.",
    address: "392 Boston Post Road, Orange, CT 06477, United States of America",
    location: {
      type: "Point",
      coordinates: [-73.0210324, 41.2606126],
    },
    locationType: "redeem centre",
    primaryMaterialType: "plastic",
    // For EZ Bottle, let's ensure it accepts all its defined plastic subtypes
    acceptedSubtypes: getSubtypesForPrimaryType("plastic"),
    itemType: "plastic", // Backward compatibility
  },
];

const LOCATION_TYPES_ENUM = [
  "redeem centre",
  "collection point",
  "sewage unit",
];

const generateNearbyCoordinates = (baseLat, baseLng, offset = 0.08) => [
  parseFloat((baseLng + (Math.random() - 0.5) * offset * 2).toFixed(6)),
  parseFloat((baseLat + (Math.random() - 0.5) * offset * 2).toFixed(6)),
];

const getWeightedPrimaryMaterialType = () => {
  const primaryTypes = getPrimaryMaterialTypes();
  const primaryTypeWeights = [
    { value: "plastic", weight: 7 },
    { value: "paper", weight: 2 },
    { value: "glass", weight: 2 },
    { value: "metal", weight: 1.5 },
    { value: "organic", weight: 1 },
    { value: "ewaste", weight: 1 }, // Corrected from eWaste to ewaste to match hierarchy
    { value: "fabric", weight: 1 },
    { value: "aluminium", weight: 1.5 }, // Corrected from eWaste to ewaste to match hierarchy
  ];

  const validWeightedTypes = primaryTypeWeights.filter((wt) =>
    primaryTypes.includes(wt.value)
  );

  if (validWeightedTypes.length === 0) {
    return faker.helpers.arrayElement(primaryTypes) || "plastic";
  }
  const selectedValue = faker.helpers.weightedArrayElement(validWeightedTypes);
  return typeof selectedValue === "string" && selectedValue.length > 0
    ? selectedValue
    : "plastic";
};

// Enhanced function to get random subtypes with more control
const getRandomSubtypesForPrimary = (primaryType, minCount = 2) => {
  const allSubtypes = getSubtypesForPrimaryType(primaryType);

  if (!allSubtypes || allSubtypes.length === 0) {
    return [];
  }

  let selectedSubtypes = [];
  const maxPossibleSubtypes = allSubtypes.length;
  minCount = Math.min(minCount, maxPossibleSubtypes); // Ensure minCount is not more than available

  if (primaryType === "plastic") {
    // Ensure "500ml plastic" is likely included for plastic locations
    if (allSubtypes.includes("500ml plastic") && Math.random() < 0.8) {
      // 80% chance
      selectedSubtypes.push("500ml plastic");
    }
    // Add other plastic subtypes to meet at least minCount, with variety
    const remainingPlasticSubtypes = allSubtypes.filter(
      (s) => !selectedSubtypes.includes(s)
    );
    if (remainingPlasticSubtypes.length > 0) {
      const needed = Math.max(0, minCount - selectedSubtypes.length);
      // Add at least 'needed', and potentially more for variety
      const countToPick = faker.number.int({
        min: needed,
        max: Math.max(needed, remainingPlasticSubtypes.length), // Pick up to all remaining
      });
      selectedSubtypes.push(
        ...faker.helpers.arrayElements(remainingPlasticSubtypes, countToPick)
      );
    }
  } else {
    // For non-plastic types, pick a random number of subtypes
    const countToPick = faker.number.int({
      min: minCount,
      max: maxPossibleSubtypes,
    });
    selectedSubtypes = faker.helpers.arrayElements(allSubtypes, countToPick);
  }

  // Ensure uniqueness and at least minCount if possible
  selectedSubtypes = [...new Set(selectedSubtypes)]; // Unique
  while (
    selectedSubtypes.length < minCount &&
    selectedSubtypes.length < maxPossibleSubtypes
  ) {
    const remaining = allSubtypes.filter((s) => !selectedSubtypes.includes(s));
    if (remaining.length === 0) break;
    selectedSubtypes.push(faker.helpers.arrayElement(remaining));
    selectedSubtypes = [...new Set(selectedSubtypes)];
  }

  return selectedSubtypes.slice(
    0,
    faker.number.int({
      min: minCount,
      max: Math.max(minCount, selectedSubtypes.length),
    })
  ); // Final random trim for variety
};

const getWeightedItemType = () => {
  // For backward compatibility itemType
  if (Math.random() < 0.4) {
    return getWeightedPrimaryMaterialType();
  }
  const primaryType = getWeightedPrimaryMaterialType();
  const subtypes = getSubtypesForPrimaryType(primaryType);
  if (!subtypes || subtypes.length === 0) {
    return primaryType;
  }
  return faker.helpers.arrayElement(subtypes);
};

const seedDropOffLocations = async (
  defaultSeedCount = 10,
  forceDelete = false // This parameter is not used currently to prevent accidental deletion
) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding drop-off locations...");

    console.log("Checking/Updating essential locations...");
    let essentialProcessedCount = 0;
    for (const essentialLocationData of ESSENTIAL_LOCATIONS) {
      const existingEssential = await DropOffLocation.findOne({
        name: essentialLocationData.name,
      });

      const dataToUpsert = {
        ...essentialLocationData,
        itemType: essentialLocationData.primaryMaterialType || "plastic", // Ensure backward compatibility
      };

      if (!existingEssential) {
        await DropOffLocation.create(dataToUpsert);
        essentialProcessedCount++;
        console.log(`Added essential location: ${dataToUpsert.name}`);
      } else {
        // Optionally update if structure changed, e.g., ensure acceptedSubtypes are correct
        const updateNeeded =
          !existingEssential.primaryMaterialType ||
          JSON.stringify(existingEssential.acceptedSubtypes.sort()) !==
            JSON.stringify(dataToUpsert.acceptedSubtypes.sort());
        if (updateNeeded) {
          await DropOffLocation.findByIdAndUpdate(
            existingEssential._id,
            dataToUpsert
          );
          console.log(
            `Updated essential location: ${dataToUpsert.name} with new structure/subtypes.`
          );
          essentialProcessedCount++;
        } else {
          console.log(
            `Essential location ${dataToUpsert.name} already exists and is up-to-date.`
          );
        }
      }
    }
    if (essentialProcessedCount > 0) {
      console.log(
        `Processed ${essentialProcessedCount} essential drop-off locations.`
      );
    } else {
      console.log("All essential drop-off locations were already up-to-date.");
    }

    const currentCount = await DropOffLocation.countDocuments();
    let randomLocationsToSeedCount = 0;
    const targetTotalLocations = 20; // Aim for around 25-30 locations in total initially

    if (currentCount < targetTotalLocations) {
      randomLocationsToSeedCount = targetTotalLocations - currentCount;
      console.log(
        `Database has ${currentCount} drop-off locations. Planning to seed ${randomLocationsToSeedCount} new random locations to reach ~${targetTotalLocations}.`
      );
    } else {
      console.log(
        `Database has ${currentCount} drop-off locations (>=${targetTotalLocations}). No new random locations will be seeded.`
      );
    }

    if (randomLocationsToSeedCount > 0) {
      const generatedLocations = [];
      const weightedCityConfigs = [];
      for (const key in LOCATIONS_CONFIG) {
        for (let i = 0; i < LOCATIONS_CONFIG[key].weight; i++) {
          weightedCityConfigs.push(LOCATIONS_CONFIG[key]);
        }
      }

      const existingLocationNames = new Set(
        (await DropOffLocation.find({}, "name")).map((loc) => loc.name)
      );

      for (
        let i = 0;
        generatedLocations.length < randomLocationsToSeedCount;
        i++
      ) {
        if (i > randomLocationsToSeedCount * 3) {
          // Safety break
          console.log(
            `Could only generate ${generatedLocations.length} unique random locations. Stopping.`
          );
          break;
        }

        const cityConfig = faker.helpers.arrayElement(weightedCityConfigs);
        const primaryMaterialTypeForLocation = getWeightedPrimaryMaterialType();
        const acceptedSubtypesForLocation = getRandomSubtypesForPrimary(
          primaryMaterialTypeForLocation
        );

        // For backward compatibility, pick one itemType (can be primary or a subtype)
        const itemTypeForLocation =
          acceptedSubtypesForLocation.length > 0 && Math.random() < 0.7
            ? faker.helpers.arrayElement(acceptedSubtypesForLocation)
            : primaryMaterialTypeForLocation;

        let safeItemTypeName = primaryMaterialTypeForLocation; // Use primary type for naming consistency
        if (
          typeof safeItemTypeName !== "string" ||
          safeItemTypeName.length === 0
        ) {
          safeItemTypeName = "Recycling"; // Fallback
        }

        const locationName = `${cityConfig.namePrefix} ${
          faker.company.name().split(" ")[0]
        } ${
          safeItemTypeName.charAt(0).toUpperCase() + safeItemTypeName.slice(1)
        } Center ${i + 1}`; // Add index for more uniqueness

        if (existingLocationNames.has(locationName)) {
          continue;
        }
        existingLocationNames.add(locationName);

        generatedLocations.push({
          name: locationName,
          locationType: faker.helpers.arrayElement(LOCATION_TYPES_ENUM),
          primaryMaterialType: primaryMaterialTypeForLocation,
          acceptedSubtypes: acceptedSubtypesForLocation,
          itemType: itemTypeForLocation, // Backward compatibility
          description: `Accepts ${primaryMaterialTypeForLocation} including ${
            acceptedSubtypesForLocation.join(", ") || "various subtypes"
          }. Located in ${cityConfig.city}.`,
          address: `${faker.location.streetAddress(false)}, ${
            cityConfig.city
          }, ${cityConfig.state || ""}, ${cityConfig.country}`.replace(
            / ,|, $/g,
            ""
          ),
          location: {
            type: "Point",
            coordinates: generateNearbyCoordinates(
              cityConfig.lat,
              cityConfig.lng
            ),
          },
        });
      }

      if (generatedLocations.length > 0) {
        await DropOffLocation.insertMany(generatedLocations);
        console.log(
          `Successfully seeded ${generatedLocations.length} new random drop-off locations.`
        );
      } else {
        console.log(
          "No new random drop-off locations were generated in this attempt."
        );
      }
    }

    const finalCount = await DropOffLocation.countDocuments();
    console.log(`Total drop-off locations in database: ${finalCount}`);
  } catch (error) {
    console.error("Error seeding drop-off locations:", error);
  } finally {
    if (
      mongoose.connection.readyState === 1 ||
      mongoose.connection.readyState === 2
    ) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
};

seedDropOffLocations();
