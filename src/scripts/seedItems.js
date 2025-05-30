require('dotenv').config();
const mongoose = require("mongoose");
const Item = require("../models/thingsMatch/items.model");
const ThingsMatchUser = require("../models/thingsMatch/user.model");
const { faker } = require("@faker-js/faker");

const seedItems = async (defaultSeedCount = 10) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Ensure indexes are created using the current connection
    console.log("Ensuring indexes for Item model...");
    await Item.createIndexes();
    console.log("Item indexes ensured.");

    // Check existing item count
    const currentItemCount = await Item.countDocuments();
    let itemsToSeedCount = 0;

    if (currentItemCount >= 10) {
      itemsToSeedCount = 0;
      console.log(`Database already has ${currentItemCount} items (>=10). No new items will be seeded.`);
    } else if (currentItemCount >= 2) { // 2 to 9 items exist
      itemsToSeedCount = 8;
      console.log(`Database has ${currentItemCount} items. Seeding 8 new items.`);
    } else if (currentItemCount === 1) { // 1 item exists
      itemsToSeedCount = 9;
      console.log(`Database has 1 item. Seeding 9 new items.`);
    } else { // 0 items exist
      itemsToSeedCount = defaultSeedCount; // Use the function's default/parameter
      console.log(`Database is empty. Seeding ${itemsToSeedCount} new items.`);
    }

    if (itemsToSeedCount === 0) {
      console.log("No items need to be seeded.");
    } else {
      // Fetch existing ThingsMatchUser IDs
      const users = await ThingsMatchUser.find().select('_id');
      const userIds = users.map(user => user._id);

      if (userIds.length === 0) {
        console.warn("No ThingsMatchUsers found in the database. Items will be created with new ObjectId for userId if seeding proceeds.");
      } else {
        console.log(`Found ${userIds.length} ThingsMatchUsers to assign items to.`);
      }

      // Define enum values from the model
      const categories = [
        "Shoes",
        "Electronics",
        "Books",
        "Furniture",
        "Food",
        "Flowers",
        "Other",
      ];
      const statuses = ["available", "matched", "given_away"];

      // Generate random items
      const items = Array.from({ length: itemsToSeedCount }, () => {
        let assignedUserId;
        if (userIds.length > 0) {
          assignedUserId = faker.helpers.arrayElement(userIds);
        } else {
          assignedUserId = mongoose.Types.ObjectId();
        }

        return {
          userId: assignedUserId,
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          category: faker.helpers.arrayElement(categories),
          location: {
            type: "Point",
            coordinates: [
              parseFloat(faker.location.longitude()),
              parseFloat(faker.location.latitude()),
            ],
            address: faker.location.streetAddress(),
          },
          itemImages: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
            public_id: faker.string.uuid(),
            url: faker.image.url(),
          })),
          status: faker.helpers.arrayElement(statuses),
          discoveryStatus: faker.helpers.weightedArrayElement([
            { value: "visible", weight: 7 },
            { value: "hidden_temporarily", weight: 2 },
            { value: "faded", weight: 1 },
          ]),
          interestCount: faker.number.int({ min: 0, max: 10 }),
        };
      });

      // Insert items
      if (items.length > 0) {
        await Item.deleteMany({}); // Clear existing items before seeding new ones
        console.log("Cleared existing items.");
        await Item.insertMany(items);
        console.log(`Successfully seeded ${items.length} items`);
      } else {
        // This case should ideally not be reached if itemsToSeedCount > 0
        console.log("No items were generated to seed, though seeding was intended.");
      }
    }

  } catch (error) {
    console.error("Error seeding items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedItems();
