/**
 * Simple console-based logger with emoji indicators
 */

const logger = {
  /**
   * Log informational messages
   * @param {string} message - The message to log
   */
  info: (message) => {
    console.log(`ℹ️ INFO: ${message}`);
  },

  /**
   * Log error messages
   * @param {string} message - The error message to log
   */
  error: (message) => {
    console.error(`❌ ERROR: ${message}`);
  },

  /**
   * Log warning messages
   * @param {string} message - The warning message to log
   */
  warn: (message) => {
    console.warn(`⚠️ WARNING: ${message}`);
  },

  /**
   * Log success messages
   * @param {string} message - The success message to log
   */
  success: (message) => {
    console.log(`✅ SUCCESS: ${message}`);
  },

  /**
   * Log debug messages (only in non-production environments)
   * @param {string} message - The debug message to log
   */
  debug: (message) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔍 DEBUG: ${message}`);
    }
  },
};

module.exports = logger;
