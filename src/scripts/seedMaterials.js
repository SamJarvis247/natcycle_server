const mongoose = require("mongoose");
const Material = require("../models/materialModel");
const {
  materialTypeHierarchy,
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
  getLabelForMaterialType, // We'll use this for the 'name' field
} = require("../models/enums/materialTypeHierarchy");
require("dotenv").config();

// Define material properties for each SUBTYPE.
// This list should ideally cover all subtypes defined in materialTypeHierarchy.js
// For missing ones, you might need to add default values or skip them.
const subtypeProperties = {
  // Plastic
  "500ml plastic": { weight: 0.025, cuValue: 0.5, natPoints: 5 },
  "1000ml plastic": { weight: 0.04, cuValue: 0.7, natPoints: 7 },
  "1500ml plastic": { weight: 0.05, cuValue: 0.8, natPoints: 8 },
  "plastic bags": { weight: 0.01, cuValue: 0.4, natPoints: 4 },
  "plastic containers": { weight: 0.1, cuValue: 0.6, natPoints: 6 },
  // Glass
  "glass bottles": { weight: 0.3, cuValue: 0.3, natPoints: 3 },
  "glass jars": { weight: 0.25, cuValue: 0.25, natPoints: 2 },
  // Paper
  cardboard: { weight: 0.05, cuValue: 0.3, natPoints: 3 },
  newspaper: { weight: 0.03, cuValue: 0.2, natPoints: 2 },
  "office paper": { weight: 0.01, cuValue: 0.15, natPoints: 1 },
  // Metal
  "aluminum cans": { weight: 0.015, cuValue: 0.6, natPoints: 6 }, // Also under aluminium primary
  "metal containers": { weight: 0.2, cuValue: 0.5, natPoints: 5 },
  "scrap metal": { weight: 1.0, cuValue: 0.4, natPoints: 4 }, // Weight can vary significantly
  // Organic
  "food waste": { weight: 0.1, cuValue: 0.1, natPoints: 1 }, // Example, can be more granular
  "garden waste": { weight: 0.1, cuValue: 0.1, natPoints: 1 },
  // eWaste
  batteries: { weight: 0.1, cuValue: 0.8, natPoints: 8 },
  "small electronics": { weight: 0.5, cuValue: 1.0, natPoints: 10 },
  "large electronics": { weight: 2.0, cuValue: 1.5, natPoints: 15 },
  // Fabric
  clothing: { weight: 0.2, cuValue: 0.4, natPoints: 4 },
  textiles: { weight: 0.1, cuValue: 0.3, natPoints: 3 },
  // Aluminium (Note: "aluminum cans" is duplicated, ensure consistency or unique handling if primary types differ)
  // "aluminum cans" is already defined under "metal". If it's distinct for "aluminium" primary, define it here.
  // For now, assuming "aluminum cans" under "metal" covers it.
  "aluminum containers": { weight: 0.05, cuValue: 0.55, natPoints: 5 },
};

async function seedMaterials() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding materials.");

    const allDefinedPrimaryTypes = getPrimaryMaterialTypes();
    if (!allDefinedPrimaryTypes || allDefinedPrimaryTypes.length === 0) {
      console.log("No primary material types defined in hierarchy. Exiting.");
      return;
    }

    const existingPrimaryCategoriesInDB = await Material.distinct("category");
    console.log("Existing primary categories in DB:", existingPrimaryCategoriesInDB);

    const missingPrimaryCategories = allDefinedPrimaryTypes.filter(
      (pt) => !existingPrimaryCategoriesInDB.includes(pt)
    );

    if (missingPrimaryCategories.length === 0) {
      console.log("All primary material categories are already represented in the database. No new materials will be seeded.");
      return;
    }

    console.log("Missing primary categories that will be seeded:", missingPrimaryCategories);

    const materialsToCreate = [];

    for (const primaryCategory of missingPrimaryCategories) {
      const subtypes = getSubtypesForPrimaryType(primaryCategory);
      if (!subtypes || subtypes.length === 0) {
        console.warn(`No subtypes found for primary category: ${primaryCategory}. Skipping.`);
        continue;
      }

      console.log(`Preparing to seed subtypes for: ${primaryCategory}`);
      for (const subtypeValue of subtypes) {
        const properties = subtypeProperties[subtypeValue];
        if (!properties) {
          console.warn(`Properties not defined for subtype: ${subtypeValue} (under ${primaryCategory}). Skipping.`);
          continue;
        }

        // Check if this specific category + subCategory combination already exists
        // This is an extra safety, though if primaryCategory is missing, its subtypes should be too.
        const existingMaterial = await Material.findOne({ category: primaryCategory, subCategory: subtypeValue });
        if (existingMaterial) {
          console.log(`Material for ${primaryCategory} - ${subtypeValue} already exists. Skipping.`);
          continue;
        }

        materialsToCreate.push({
          category: primaryCategory,
          subCategory: subtypeValue,
          name: getLabelForMaterialType(subtypeValue) || subtypeValue, // Use label from hierarchy
          weight: properties.weight,
          cuValue: properties.cuValue,
          natPoints: properties.natPoints || Math.round(properties.cuValue * 10), // Default natPoints if not specified
          quantity: 0, // Default quantity
          isActive: true,
          // image: { public_id: null, url: null } // Optional: add default image logic if needed
        });
        console.log(`  - Queued: ${primaryCategory} - ${subtypeValue}`);
      }
    }

    if (materialsToCreate.length > 0) {
      await Material.insertMany(materialsToCreate);
      console.log(`Successfully seeded ${materialsToCreate.length} new material subtypes.`);
    } else {
      console.log("No new material subtypes needed to be seeded in this run (after checking missing categories).");
    }

  } catch (error) {
    console.error("Error seeding materials:", error);
  } finally {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

seedMaterials();
