// cors config file

module.exports = {
  origin: [
    "https://www.natcycle.app",
    "http://localhost:5173",
    "http://localhost:5001",
    "http://localhost:5500",
    "https://nat-cycle.vercel.app",
    "https://natcycle.netlify.app",
  ],
  optionSuccessStatus: 200,
  credentials: true,
};
