require("dotenv").config();
const scheduler = require("./scheduler");

// Start the scheduler
scheduler.start();

// Handle graceful shutdown
process.on("SIGTERM", () => {
  scheduler.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  scheduler.stop();
  process.exit(0);
});

module.exports = scheduler;
