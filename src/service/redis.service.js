const redis = require("redis");

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isProduction = process.env.NODE_ENV === "production";
  }

  // Initialize Redis connection
  async connect() {
    try {
      let redisConfig;

      // Configure based on environment
      if (this.isProduction) {
        console.log("Connecting to production Redis...");

        const redisUrl = process.env.PROD_REDIS_HOST;

        if (!redisUrl) {
          throw new Error(
            "Production Redis URL not configured (PROD_REDIS_HOST)"
          );
        }

        this.client = redis.createClient({
          url: redisUrl,
        });
      } else {
        console.log("Connecting to development Redis...");

        // For local development
        this.client = redis.createClient({
          socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: process.env.REDIS_PORT || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
        });
      }

      // Handle connection errors
      this.client.on("error", (err) => {
        console.log(`Redis Client Error: ${err.message}`);
        this.isConnected = false;
      });

      // Handle successful connection
      this.client.on("connect", () => {
        console.log(
          `Connected to Redis in ${
            this.isProduction ? "production" : "development"
          } mode`
        );
        this.isConnected = true;
      });

      // Handle reconnection
      this.client.on("reconnecting", () => {
        console.log("Reconnecting to Redis...");
      });

      // Handle end of connection
      this.client.on("end", () => {
        console.log("Redis connection closed");
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.log(`Failed to connect to Redis: ${error.message}`);

      // In development, throw error to fail fast
      // In production, log but allow app to continue without Redis
      if (!this.isProduction) {
        throw new Error("Redis connection failed");
      } else {
        console.log("Warning: Continuing without Redis in production");
      }
    }
  }

  // Check if Redis is connected
  isReady() {
    return this.isConnected;
  }

  // Graceful error handling for all Redis operations
  async safeExecute(operation, fallback = null) {
    if (!this.isReady()) {
      console.log("Redis not connected, using fallback");
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      console.log(`Redis operation failed: ${error.message}`);
      return fallback;
    }
  }

  // Set a key-value pair with optional TTL (time-to-live in seconds)
  async set(key, value, ttl = 3600) {
    // Default TTL: 1 hour
    return this.safeExecute(async () => {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      console.log(`Cached key ${key} with TTL ${ttl}`);
      return true;
    }, false);
  }

  // Get a value by key
  async get(key) {
    return this.safeExecute(async () => {
      const value = await this.client.get(key);
      if (value) {
        console.log(`Cache hit for key ${key}`);
        return JSON.parse(value);
      }
      console.log(`Cache miss for key ${key}`);
      return null;
    }, null);
  }

  // Delete a key
  async del(key) {
    return this.safeExecute(async () => {
      const result = await this.client.del(key);
      console.log(`Deleted key ${key} from cache (${result} keys affected)`);
      return result;
    }, 0);
  }

  // Delete keys matching a pattern
  async delByPattern(pattern) {
    return this.safeExecute(async () => {
      // Find all keys matching the pattern
      const keys = await this.client.keys(pattern);

      if (keys && keys.length > 0) {
        // Delete all matching keys
        const result = await this.client.del(keys);
        console.log(`Deleted ${result} keys matching pattern ${pattern}`);
        return result;
      }
      return 0;
    }, 0);
  }

  // Flush all data from Redis
  async flushAll() {
    return this.safeExecute(async () => {
      await this.client.flushAll();
      console.log("Flushed all data from Redis");
      return true;
    }, false);
  }

  // Close Redis connection
  async disconnect() {
    return this.safeExecute(async () => {
      await this.client.quit();
      console.log("Disconnected from Redis");
      this.isConnected = false;
      return true;
    }, true);
  }
}

module.exports = new RedisService();
