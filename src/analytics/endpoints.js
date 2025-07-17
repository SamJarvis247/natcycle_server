const baseUrl = process.env.URL || 'http://localhost:5001';

const endpoints = [
  "getAllUsers",
  "getUserById",
  "getTMUserById"
]

module.exports = endpoints;
