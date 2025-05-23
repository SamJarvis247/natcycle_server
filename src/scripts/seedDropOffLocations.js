const mongoose = require("mongoose");
const DropOffLocation = require("../models/dropOffLocationModel");
const getCoordinates = require("../utility/geocode");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Base coordinates for Rumueme, Port Harcourt (RX7J+6GQ)
// Approximate coordinates for this plus code
const BASE_COORDINATES = {
  lat: 4.8396,
  lng: 7.0047,
};

// Drop-off locations to seed
const dropOffLocations = [
  // Original locations
  {
    name: "Rumueme Recycling Center",
    itemType: "plastic",
    description: "Main recycling center for plastic items in Rumueme",
    address: "10 Rumueme Road, Port Harcourt, Rivers State",
    // Slightly offset from base coordinates
    coordinates: [BASE_COORDINATES.lng + 0.002, BASE_COORDINATES.lat + 0.001],
  },
  {
    name: "GreenEarth Collection Point",
    itemType: "food",
    description: "Food waste collection point for composting",
    address: "15 Stadium Road, Rumueme, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.003, BASE_COORDINATES.lat + 0.002],
  },
  {
    name: "Fabric Recycling Hub",
    itemType: "fabric",
    description: "Collection center for old clothes and fabric",
    address: "5 Ikwerre Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.005, BASE_COORDINATES.lat - 0.001],
  },
  {
    name: "Port Harcourt Eco Center",
    itemType: "plastic",
    description: "Eco-friendly drop-off point for plastic recycling",
    address: "22 Aba Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.004, BASE_COORDINATES.lat - 0.003],
  },
  {
    name: "Rivers State Recycling Initiative",
    itemType: "food",
    description: "Government-sponsored food waste collection center",
    address: "Government House Area, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.007, BASE_COORDINATES.lat + 0.004],
  },
  {
    name: "Textile Reclaim Center",
    itemType: "fabric",
    description: "Specialized in fabric and textile recycling",
    address: "8 Old GRA, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.006, BASE_COORDINATES.lat + 0.005],
  },
  {
    name: "PH Green Initiative",
    itemType: "plastic",
    description: "Community-led plastic recycling center",
    address: "12 Trans Amadi, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.009, BASE_COORDINATES.lat - 0.002],
  },
  {
    name: "Organic Waste Solutions",
    itemType: "food",
    description: "Organic waste processing center",
    address: "3 Elekahia Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.008, BASE_COORDINATES.lat - 0.004],
  },
  {
    name: "Fabric Upcycling Workshop",
    itemType: "fabric",
    description: "Drop-off point with upcycling workshops",
    address: "18 Woji Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.011, BASE_COORDINATES.lat + 0.006],
  },
  {
    name: "EcoHub Port Harcourt",
    itemType: "plastic",
    description: "Multi-material recycling center with focus on plastics",
    address: "25 Rumuola Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.005, BASE_COORDINATES.lat + 0.007],
  },

  // New locations with different material types
  {
    name: "Glass Recycling Center",
    itemType: "glass",
    description: "Specialized center for glass bottle and container recycling",
    address: "7 Olu Obasanjo Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.004, BASE_COORDINATES.lat + 0.008],
  },
  {
    name: "Metal Scrap Collection",
    itemType: "metal",
    description: "Collection point for metal scraps and recyclables",
    address: "14 Diobu Area, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.007, BASE_COORDINATES.lat - 0.006],
  },
  {
    name: "E-Waste Drop-Off",
    itemType: "e-waste",
    description: "Safe disposal and recycling of electronic waste",
    address: "9 Garrison Junction, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.006, BASE_COORDINATES.lat - 0.005],
  },
  {
    name: "Paper Recycling Hub",
    itemType: "paper",
    description: "Collection center for paper, cardboard, and books",
    address: "20 Mile 4, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.009, BASE_COORDINATES.lat + 0.003],
  },
  {
    name: "Battery Collection Point",
    itemType: "batteries",
    description: "Safe disposal of used batteries of all types",
    address: "11 Rumuokoro, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng + 0.008, BASE_COORDINATES.lat - 0.007],
  },
  {
    name: "Hazardous Waste Facility",
    itemType: "hazardous",
    description: "Proper disposal of household hazardous waste",
    address: "30 Choba Road, Port Harcourt",
    coordinates: [BASE_COORDINATES.lng - 0.01, BASE_COORDINATES.lat + 0.009],
  },
];

async function seedDropOffLocations() {
  try {
    // Clear existing drop-off locations
    await DropOffLocation.deleteMany({});
    console.log("Cleared existing drop-off locations");

    // Create new drop-off locations
    const createdLocations = [];

    for (const location of dropOffLocations) {
      const newLocation = new DropOffLocation({
        name: location.name,
        itemType: location.itemType,
        description: location.description,
        address: location.address,
        location: {
          type: "Point",
          coordinates: location.coordinates,
        },
      });

      await newLocation.save();
      createdLocations.push(newLocation);
    }

    console.log(
      `Successfully seeded ${createdLocations.length} drop-off locations`
    );
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding drop-off locations:", error);
    mongoose.disconnect();
  }
}

seedDropOffLocations();
