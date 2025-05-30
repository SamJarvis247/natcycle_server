// Add this near the top of your file
const cronScheduler = require("./src/cron");

const app = require("./src/app");
// const RedisService = require('./src/service/redis.service.js')
const mongoose = require("mongoose");

// socket config
const http = require("http");

// import mongodb config
const config = require("./src/config/dbConfig");

//import the geospatial Models
const Item = require("./src/models/thingsMatch/items.model");

// connect to mongoDB
mongoose
  .connect(config.uri, config.options)
  .then(async () => {
    console.log("Connected to MongoDB");
    // Ensure indexes for Item model
    await Item.createIndexes();
    console.log("Item indexes ensured.");

    // try {
    //   await RedisService.connect()
    //   console.log('Connected to Redis')
    // } catch (err) {
    //   console.error('Failed to connect to Redis:', err)
    //   console.log('Server will continue without Redis functionality')
    // }
    console.log("Redis functionality disabled temporarily");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

// start server
const port = process.env.PORT || "5000";

// const server = http.Server(app)

app.listen(port, () => {
  console.log("App running on port 5000...");
});

// This will automatically start the scheduler
