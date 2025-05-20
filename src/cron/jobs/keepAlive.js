const axios = require("axios");
const logger = require("../utils/logger");

const BASE_URL = "https://thingsmatch.onrender.com";
let failureCount = 0;
let isDisabled = false;

async function keepAlive() {
  // If job has been disabled due to too many failures, don't proceed
  if (isDisabled) return;

  try {
    await axios.get(BASE_URL);
    // Reset failure count on success
    failureCount = 0;
  } catch (error) {
    failureCount++;
    logger.error(
      `Failed to ping server (attempt ${failureCount}): ${error.message}`
    );

    // Disable job after 5 consecutive failures
    if (failureCount >= 5) {
      isDisabled = true;
      logger.error("Keep-alive job disabled after 5 consecutive failures");
    }
  }
}

module.exports = keepAlive;
