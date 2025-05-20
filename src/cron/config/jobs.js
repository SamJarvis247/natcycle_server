module.exports = {
  keepAlive: {
    name: "Keep Server Alive",
    schedule: "*/1 * * * *", // Every 1 minute
    timezone: "UTC",
    enabled: true,
    jobPath: "../jobs/keepAlive",
  },
  // Add more jobs here as needed
};
