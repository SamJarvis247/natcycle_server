const axios = require("axios");

// API Configuration
const CONFIG = {
  mapbox: {
    token:
      "pk.eyJ1IjoibWFpbmx5cHJpbmNlIiwiYSI6ImNtOGFybW5mczFrcHgyeHNjMjcwd2RvcjAifQ.JHfSF2uqZjJjaDLaSsLJqA",
    baseUrl: "https://api.mapbox.com/geocoding/v5/mapbox.places",
  },
  openCage: {
    apiKey: "4e2cb3816f604847855b90084772e1a7",
    baseUrl: "https://api.opencagedata.com/geocode/v1/json",
  },
  // Known locations with precise coordinates
  knownLocations: {
    "Nnamdi Azikiwe International Airport": { lng: 7.2626, lat: 9.0065 },
    "Wuse 2": { lng: 7.4797, lat: 9.0817 },
    "Jabi Lake Mall": { lng: 7.4255, lat: 9.0764 },
    "Transcorp Hilton Hotel": { lng: 7.4872, lat: 9.0815 },
    // You can add more known locations here as needed
  },
};

/**
 * Main geocoding function that converts an address to coordinates
 * @param {string} location - The address or location to geocode
 * @returns {Promise<Object>} - Object containing lng, lat and metadata
 * @throws {Error} - If geocoding fails or input is invalid
 */
const getCoordinates = async (location) => {
  // Input validation
  if (!location || typeof location !== "string") {
    console.error("Invalid location provided to geocoder");
    throw new Error("Invalid location provided");
  }

  try {
    // Try primary geocoder (Mapbox)
    return await geocodeWithMapbox(location);
  } catch (error) {
    console.error(`Primary geocoder failed: ${error.message}`);
    try {
      // Fallback to secondary geocoder (OpenCage)
      return await geocodeWithOpenCage(location);
    } catch (backupError) {
      console.error(`Backup geocoder also failed: ${backupError.message}`);
      throw new Error(`Failed to geocode location: ${location}`);
    }
  }
};

/**
 * Primary geocoding service using Mapbox
 * @param {string} location - Location to geocode
 * @returns {Promise<Object>} - Object with coordinates and metadata
 * @throws {Error} - If geocoding fails
 */
async function geocodeWithMapbox(location) {
  console.log(`Geocoding "${location}" with Mapbox`);

  const response = await axios.get(
    `${CONFIG.mapbox.baseUrl}/${encodeURIComponent(location)}.json`,
    {
      params: {
        access_token: CONFIG.mapbox.token,
        limit: 1,
        types: "address,place,poi,locality,neighborhood",
        language: "en",
        autocomplete: false,
        fuzzyMatch: false,
      },
    }
  );

  // Validate response
  if (!response.data.features || response.data.features.length === 0) {
    throw new Error(`No geocoding results found for: ${location}`);
  }

  const feature = response.data.features[0];
  const coordinates = feature.geometry.coordinates;
  const relevanceScore = feature.relevance;
  const mapboxPlaceName = feature.place_name;

  console.log(
    `Geocoded "${location}" to: [${coordinates[0]}, ${coordinates[1]}], ` +
      `Relevance: ${relevanceScore}`
  );

  // If relevance score is poor, try backup service
  if (relevanceScore < 0.8) {
    console.warn(
      `Low relevance (${relevanceScore}) for "${location}", using backup geocoder`
    );
    return await geocodeWithOpenCage(location);
  }

  return {
    lng: coordinates[0],
    lat: coordinates[1],
    placeName: location,
    mapboxName: mapboxPlaceName,
    source: "mapbox",
  };
}

/**
 * Backup geocoding service using OpenCage
 * @param {string} location - Location to geocode
 * @returns {Promise<Object>} - Object with coordinates and metadata
 * @throws {Error} - If geocoding fails
 */
async function geocodeWithOpenCage(location) {
  console.log(`Geocoding "${location}" with OpenCage (backup)`);

  const response = await axios.get(CONFIG.openCage.baseUrl, {
    params: {
      q: location,
      key: CONFIG.openCage.apiKey,
      limit: 1,
      no_annotations: 1,
    },
  });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error("No results from backup geocoder");
  }

  const result = response.data.results[0];
  console.log(
    `Backup geocoder found: ${result.formatted} at [${result.geometry.lng}, ${result.geometry.lat}]`
  );

  return {
    lng: result.geometry.lng,
    lat: result.geometry.lat,
    placeName: location,
    backupName: result.formatted,
    source: "opencage",
  };
}

/**
 * Extract standardized coordinates from various possible formats
 * @param {Object|Array} coords - Coordinates in various possible formats
 * @returns {Object} Standardized { lng, lat } object
 */
function normalizeCoordinates(coords) {
  if (!coords) return null;

  // Handle array format [lng, lat] (GeoJSON)
  if (Array.isArray(coords) && coords.length >= 2) {
    return { lng: coords[0], lat: coords[1] };
  }

  // Handle object with lat/lng properties
  if (coords.lat !== undefined && coords.lng !== undefined) {
    return { lng: coords.lng, lat: coords.lat };
  }

  // Handle object with latitude/longitude properties
  if (coords.latitude !== undefined && coords.longitude !== undefined) {
    return { lng: coords.longitude, lat: coords.latitude };
  }

  // Handle GeoJSON format
  if (
    coords.coordinates &&
    Array.isArray(coords.coordinates) &&
    coords.coordinates.length >= 2
  ) {
    return { lng: coords.coordinates[0], lat: coords.coordinates[1] };
  }

  return null;
}

module.exports = getCoordinates;
module.exports.normalizeCoordinates = normalizeCoordinates;
