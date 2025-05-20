const logger = require("./logger");

function handleError(jobName, error) {
  logger.error(`Error in job ${jobName}: ${error.message}`);
  logger.error(error.stack);
}

module.exports = { handleError };
