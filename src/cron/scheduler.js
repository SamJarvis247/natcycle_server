const cron = require("node-cron");
const path = require("path");
const logger = require("./utils/logger");
const { handleError } = require("./utils/errorHandler");
const jobs = require("./config/jobs");
const timezones = require("./config/timezones");

class Scheduler {
  constructor() {
    this.tasks = {};
  }

  start() {
    logger.info("Starting cron scheduler...");

    Object.keys(jobs).forEach((jobKey) => {
      const jobConfig = jobs[jobKey];

      if (!jobConfig.enabled) {
        logger.info(`Job ${jobConfig.name} is disabled, skipping`);
        return;
      }

      try {
        // Import the job function
        const jobFunction = require(jobConfig.jobPath);

        // Set timezone option if specified
        const options = {};
        if (jobConfig.timezone && timezones[jobConfig.timezone]) {
          options.timezone = timezones[jobConfig.timezone];
        }

        // Schedule the job
        if (cron.validate(jobConfig.schedule)) {
          this.tasks[jobKey] = cron.schedule(
            jobConfig.schedule,
            async () => {
              try {
                await jobFunction();
              } catch (error) {
                handleError(jobConfig.name, error);
              }
            },
            options
          );

          logger.info(
            `Job ${jobConfig.name} scheduled with cron pattern: ${jobConfig.schedule}`
          );
        } else {
          logger.error(
            `Invalid cron pattern for job ${jobConfig.name}: ${jobConfig.schedule}`
          );
        }
      } catch (error) {
        logger.error(
          `Failed to schedule job ${jobConfig.name}: ${error.message}`
        );
      }
    });

    logger.info("Cron scheduler started successfully");
  }

  stop() {
    logger.info("Stopping cron scheduler...");

    Object.keys(this.tasks).forEach((taskKey) => {
      this.tasks[taskKey].stop();
    });

    logger.info("Cron scheduler stopped");
  }
}

module.exports = new Scheduler();
