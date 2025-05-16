const mongoose = require("mongoose");
const Material = require("../models/materialModel");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Default materials with original CU values
const defaultMaterials = [
  // Plastic materials
  {
    category: "plastic",
    name: "Plastic Bottle",
    weight: 0.025, // kg
    cuValue: 0.5, // Original CU value
    isActive: true,
  },
  {
    category: "plastic",
    name: "Plastic Bag",
    weight: 0.01, // kg
    cuValue: 0.4, // Reasonable original-style value
    isActive: true,
  },

  // Glass materials
  {
    category: "glass",
    name: "Glass Bottle",
    weight: 0.3, // kg
    cuValue: 0.3, // Original CU value
    isActive: true,
  },

  // Paper materials
  {
    category: "paper",
    name: "Paper",
    weight: 0.01, // kg
    cuValue: 0.2, // Original CU value
    isActive: true,
  },
  {
    category: "paper",
    name: "Cardboard",
    weight: 0.05, // kg
    cuValue: 0.3, // Reasonable original-style value
    isActive: true,
  },

  // Metal materials
  {
    category: "metal",
    name: "Aluminum Can",
    weight: 0.015, // kg
    cuValue: 0.6, // Original CU value
    isActive: true,
  },

  // Organic materials
  {
    category: "organic",
    name: "Garden Waste",
    weight: 0.1, // kg
    cuValue: 0.1, // Original-style CU value
    isActive: true,
  },

  // Food materials (expanded with original-style CU values)
  {
    category: "food",
    name: "Fruit Scraps",
    weight: 0.05, // kg
    cuValue: 0.2, // Original-style CU value
    isActive: true,
  },
  {
    category: "food",
    name: "Vegetable Peels",
    weight: 0.04, // kg
    cuValue: 0.15, // Original-style CU value
    isActive: true,
  },
  {
    category: "food",
    name: "Coffee Grounds",
    weight: 0.02, // kg
    cuValue: 0.25, // Original-style CU value
    isActive: true,
  },
  {
    category: "food",
    name: "Eggshells",
    weight: 0.01, // kg
    cuValue: 0.1, // Original-style CU value
    isActive: true,
  },
  {
    category: "food",
    name: "Bread",
    weight: 0.03, // kg
    cuValue: 0.2, // Original-style CU value
    isActive: true,
  },
  {
    category: "food",
    name: "Rice/Pasta",
    weight: 0.05, // kg
    cuValue: 0.3, // Original-style CU value
    isActive: true,
  },

  // Fabric materials
  {
    category: "fabric",
    name: "Clothing",
    weight: 0.2, // kg
    cuValue: 0.4, // Original CU value
    isActive: true,
  },
  {
    category: "fabric",
    name: "Textile Scraps",
    weight: 0.05, // kg
    cuValue: 0.3, // Original-style CU value
    isActive: true,
  },

  // E-Waste materials
  {
    category: "eWaste",
    name: "Electronics",
    weight: 0.5, // kg
    cuValue: 1.0, // Original CU value
    isActive: true,
  },
  {
    category: "eWaste",
    name: "Batteries",
    weight: 0.1, // kg
    cuValue: 0.8, // Original-style CU value
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
