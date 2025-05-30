require('dotenv').config();
const mongoose = require("mongoose");
const Item = require("../models/thingsMatch/items.model");
const ThingsMatchUser = require("../models/thingsMatch/user.model"); // Import ThingsMatchUser model
const { faker } = require("@faker-js/faker");

const seedItems = async (count = 20) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");
    console.log("Ensuring indexes for Item model...");
    await Item.createIndexes();
    console.log("Item indexes ensured.");

    // Fetch existing ThingsMatchUser IDs
    const users = await ThingsMatchUser.find().select('_id');
    const userIds = users.map(user => user._id);

    if (userIds.length === 0) {
      console.warn("No ThingsMatchUsers found in the database. Items will be created with new ObjectId for userId.");
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
    const items = Array.from({ length: count }, () => {
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
          { value: "faded_out", weight: 1 },
        ]),
        interestCount: faker.number.int({ min: 0, max: 10 }),
      };
    });

    // Insert items
    if (items.length > 0) {
      await Item.deleteMany({}); // Optional: Clear existing items before seeding new ones
      console.log("Cleared existing items.");
      await Item.insertMany(items);
      console.log(`Successfully seeded ${count} items`);
    } else {
      console.log("No items generated to seed.");
    }

  } catch (error) {
    console.error("Error seeding items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedItems();
