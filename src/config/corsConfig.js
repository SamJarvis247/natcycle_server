// cors config file

module.exports = {
  origin: process.env.ORIGIN.split(','),
  optionSuccessStatus: 200,
  credentials: true
};
