// Add this near the top of your file
const cronScheduler = require("./src/cron");
const http = require("http");
const { Server } = require("socket.io");
const corsConfig = require("./src/config/corsConfig");
const initializeSocketIO = require("./src/socket/chatHandler");

const app = require("./src/app");
const mongoose = require("mongoose");

// import mongodb config
const config = require("./src/config/dbConfig");

//import the geospatial Models
const Item = require("./src/models/thingsMatch/items.model");

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: corsConfig,
});

// Pass 'io' instance to the socket handler
initializeSocketIO(io);


app.set('socketio', io);

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

httpServer.listen(port, () => { // Use httpServer to listen
  console.log(`App running on port ${port}...`);
  console.log(`Socket.IO initialized and listening on port ${port}`);
});

// This will automatically start the scheduler
