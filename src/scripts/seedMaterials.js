const mongoose = require("mongoose");
const Material = require("../models/materialModel");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Default materials with CU values
const defaultMaterials = [
  {
    category: "plastic",
    name: "Plastic Bottle",
    weight: 0.025, // kg
    cuValue: 0.5, // Example CU value
    isActive: true,
  },
  {
    category: "glass",
    name: "Glass Bottle",
    weight: 0.3, // kg
    cuValue: 0.3, // Example CU value
    isActive: true,
  },
  {
    category: "paper",
    name: "Paper",
    weight: 0.01, // kg
    cuValue: 0.2, // Example CU value
    isActive: true,
  },
  {
    category: "metal",
    name: "Aluminum Can",
    weight: 0.015, // kg
    cuValue: 0.6, // Example CU value
    isActive: true,
  },
  {
    category: "organic",
    name: "Food Waste",
    weight: 0.1, // kg
    cuValue: 0.1, // Example CU value
    isActive: true,
  },
  {
    category: "fabric",
    name: "Clothing",
    weight: 0.2, // kg
    cuValue: 0.4, // Example CU value
    isActive: true,
  },
  {
    category: "eWaste",
    name: "Electronics",
    weight: 0.5, // kg
    cuValue: 1.0, // Example CU value
    isActive: true,
  },
];

async function seedMaterials() {
  try {
    // Clear existing materials
    await Material.deleteMany({});

    // Insert default materials
    await Material.insertMany(defaultMaterials);

    console.log("Default materials seeded successfully");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding materials:", error);
    mongoose.disconnect();
  }
}

seedMaterials();
