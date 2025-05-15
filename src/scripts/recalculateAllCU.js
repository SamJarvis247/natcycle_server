const mongoose = require("mongoose");
const cuCalculationService = require("../service/cuCalculationService");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function recalculateAllCU() {
  try {
    console.log("Starting CU recalculation for all users...");

    const result = await cuCalculationService.recalculateAllUsersCU();

    console.log(
      `Recalculation complete: ${result.usersProcessed} users processed`
    );
    mongoose.disconnect();
  } catch (error) {
    console.error("Error during recalculation:", error);
    mongoose.disconnect();
  }
}

recalculateAllCU();
