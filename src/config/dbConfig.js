require("dotenv").config();

module.exports = {
  // The MongoDB connection URI
  uri: process.env.MONGO_URI || process.env.DATABASE_URL,

  // Optional MongoDB options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 100,
  },
};
