import { API_BASE_URL } from './config.js';
import { displayNotification } from './ui/notifications.js';

let currentToken = null;

export function setAuthToken(token) {
  currentToken = token;
}

export function getAuthToken() {
  return currentToken;
}

/**
 * Makes an API request.
 * @param {string} endpoint - The API endpoint (e.g., '/items').
 * @param {string} [method='GET'] - HTTP method.
 * @param {object|FormData|null} [body=null] - Request body.
 * @param {boolean} [isFormData=false] - True if body is FormData.
 * @returns {Promise<any>} - The response data.
 */
export async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {

  const headers = {};
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  if (!isFormData && body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method: method,
    headers: headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }
  console.log(`API Request: ${method} ${API_BASE_URL}${endpoint}`, body, currentToken, headers['Authorization']);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 204) { // No Content
      return null;
    }

    const responseData = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', responseData);
      const errorMessage = responseData.message || responseData.error || `Request failed with status ${response.status}`;
      displayNotification(`API Error: ${errorMessage}`, 'danger');
      throw new Error(errorMessage);
    }
    return responseData.data || responseData; // Backend structure can vary (e.g. { status: 'success', data: ... } or just data)
  } catch (error) {
    console.error('Fetch API Error:', error);
    // Avoid displaying duplicate notification if already handled by response.ok check
    if (!error.message.startsWith('API Error:')) {
      displayNotification(`Network/Request Error: ${error.message}`, 'danger');
    }
    throw error;
  }
}
