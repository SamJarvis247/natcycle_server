const mongoose = require("mongoose");
const Award = require("../models/awardModel");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Default awards
const defaultAwards = [
  {
    name: "Eco-Friendly Water Bottle",
    description: "A reusable water bottle made from recycled materials",
    pointsRequired: 500,
    image: {
      public_id: "awards/water_bottle",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/awards/water_bottle.png",
    },
    sponsorName: "GreenLife Products",
    sponsorLink: "https://greenlifeproducts.example.com",
  },
  {
    name: "Organic Cotton Tote Bag",
    description: "A stylish tote bag made from 100% organic cotton",
    pointsRequired: 300,
    image: {
      public_id: "awards/tote_bag",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/awards/tote_bag.png",
    },
    sponsorName: "EcoFashion",
    sponsorLink: "https://ecofashion.example.com",
  },
  {
    name: "Composting Starter Kit",
    description: "Everything you need to start composting at home",
    pointsRequired: 750,
    image: {
      public_id: "awards/composting_kit",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/awards/composting_kit.png",
    },
    sponsorName: "Garden Solutions",
    sponsorLink: "https://gardensolutions.example.com",
  },
  {
    name: "Discount Voucher for Eco Store",
    description:
      "20% off your next purchase at participating eco-friendly stores",
    pointsRequired: 200,
    image: {
      public_id: "awards/discount_voucher",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/awards/discount_voucher.png",
    },
    sponsorName: "Green Retail Alliance",
    sponsorLink: "https://greenretail.example.com",
  },
  {
    name: "Tree Planting Certificate",
    description:
      "We'll plant a tree in your name to help offset carbon emissions",
    pointsRequired: 1000,
    image: {
      public_id: "awards/tree_certificate",
      url: "https://res.cloudinary.com/natcycle/image/upload/v1/awards/tree_certificate.png",
    },
    sponsorName: "Forest Restoration Project",
    sponsorLink: "https://forestrestoration.example.com",
  },
];

async function seedAwards() {
  try {
    // Clear existing awards
    await Award.deleteMany({});

    // Insert default awards
    await Award.insertMany(defaultAwards);

    console.log("Default awards seeded successfully");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding awards:", error);
    mongoose.disconnect();
  }
}

seedAwards();
