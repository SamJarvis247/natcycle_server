require('dotenv').config();
const mongoose = require("mongoose");
const Item = require("../models/thingsMatch/items.model");

const clearItems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for clearing items...");

    const result = await Item.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} items.`);

  } catch (error) {
    console.error("Error clearing items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

clearItems();
