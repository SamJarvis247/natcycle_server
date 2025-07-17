const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL_RAW = process.env.URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_URL_RAW}/api`,
});

const token = jwt.sign({ type: 'analytics_service' }, process.env.TOKEN_SECRET, {
  expiresIn: "1h",
});

api.defaults.withCredentials = true;

// add token to request header
api.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["House%Analytics"] = `House ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    return Promise.reject(error);
  }
);

module.exports = api;
