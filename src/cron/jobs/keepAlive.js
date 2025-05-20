const axios = require("axios");
const logger = require("../utils/logger");

const BASE_URL = "https://thingsmatch.onrender.com";
let failureCount = 0;
let isDisabled = false;

async function keepAlive() {
  // If job has been disabled due to too many failures, don't proceed
  if (isDisabled) return;

  try {
    const response = await axios.get(BASE_URL);
    // Log success with status code (but only in non-production)
    if (process.env.NODE_ENV !== "production") {
      logger.success(
        `Server ping successful: ${response.status} ${response.statusText}`
      );
    }
    // Reset failure count on any successful response (including 304)
    failureCount = 0;
  } catch (error) {
    // Only count as failure if it's a real error (not 304 or other success codes)
    if (!error.response || error.response.status >= 400) {
      failureCount++;
      logger.error(
        `Failed to ping server (attempt ${failureCount}): ${error.message}`
      );

      // Disable job after 5 consecutive failures
      if (failureCount >= 5) {
        isDisabled = true;
        logger.error("Keep-alive job disabled after 5 consecutive failures");
      }
    } else {
      // This handles cases where axios throws an error but the status is actually successful
      // (like redirects or other non-200 but still successful responses)
      logger.info(`Server responded with status: ${error.response.status}`);
      // Reset failure count as this isn't a real failure
      failureCount = 0;
    }
  }
}

module.exports = keepAlive;
