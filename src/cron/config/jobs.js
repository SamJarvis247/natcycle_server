module.exports = {
  keepAlive: {
    name: "Keep Server Alive",
    schedule: "*/14 * * * *", // Every 14 minutes
    timezone: "UTC",
    enabled: true,
    jobPath: "./jobs/keepAlive",
  },
};
