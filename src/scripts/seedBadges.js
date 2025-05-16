const mongoose = require("mongoose");
const Badge = require("../models/badgeModel");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Default badges
const defaultBadges = [
  {
    name: "Recycling Rookie",
    description: "Awarded for completing your first recycling activity",
    image: {
      public_id: "badges/recycling_rookie",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/badges/recycling_rookie.png",
    },
  },
  {
    name: "Plastic Champion",
    description: "Recycled over 10kg of plastic materials",
    image: {
      public_id: "badges/plastic_champion",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/badges/plastic_champion.png",
    },
  },
  {
    name: "Food Waste Warrior",
    description: "Composted over 20kg of food waste",
    image: {
      public_id: "badges/food_waste_warrior",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/badges/food_waste_warrior.png",
    },
  },
  {
    name: "Community Leader",
    description: "Referred 5 friends to join NatCycle",
    image: {
      public_id: "badges/community_leader",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/badges/community_leader.png",
    },
  },
  {
    name: "Carbon Reducer",
    description:
      "Reduced carbon footprint by 100 units through recycling activities",
    image: {
      public_id: "badges/carbon_reducer",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/badges/carbon_reducer.png",
    },
  },
];

async function seedBadges() {
  try {
    // Clear existing badges
    await Badge.deleteMany({});

    // Insert default badges
    await Badge.insertMany(defaultBadges);

    console.log("Default badges seeded successfully");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding badges:", error);
    mongoose.disconnect();
  }
}

seedBadges();
