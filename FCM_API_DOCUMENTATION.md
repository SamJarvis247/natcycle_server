# FCM Token Management API Documentation

This API provides endpoints for managing Firebase Cloud Messaging (FCM) tokens for push notifications in the NatCycle application.

## Overview

The FCM Token Management API allows users to:

- Register FCM tokens for receiving push notifications
- Remove FCM tokens when no longer needed
- View registered tokens for their account
- Send test notifications to verify setup

## Authentication

All endpoints require authentication. Include the authentication token in the request headers.

## Base URLs

- **Regular Users**: `/api/user/`
- **ThingsMatch Users**: `/api/thingsMatch/users/`

---

## Endpoints

### 1. Register FCM Token

Register a new FCM token or update an existing one for the authenticated user.

**Endpoint**: `POST /fcm-token`

**Request Body**:

```json
{
  "token": "string (required)",
  "deviceId": "string (optional)",
  "platform": "string (optional, enum: ['ios', 'android', 'web'])"
}
```

**Example Request**:

```json
{
  "token": "dPm7lqK9QQGtL8gJ3ZmvY2:APA91bHKjLmnopqrst...",
  "deviceId": "iPhone12_User123",
  "platform": "ios"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "FCM token registered successfully",
  "data": {
    "message": "FCM token registered successfully",
    "tokenCount": 2,
    "registeredAt": "2025-07-07T10:30:00.000Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid token format or missing required fields
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error

---

### 2. Remove FCM Token

Remove a specific FCM token from the user's account.

**Endpoint**: `DELETE /fcm-token`

**Request Body**:

```json
{
  "token": "string (required)"
}
```

**Example Request**:

```json
{
  "token": "dPm7lqK9QQGtL8gJ3ZmvY2:APA91bHKjLmnopqrst..."
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "FCM token removed successfully",
  "data": {
    "message": "FCM token removed successfully",
    "tokenCount": 1
  }
}
```

**Error Responses**:

- `400 Bad Request`: Missing or invalid token
- `401 Unauthorized`: Authentication required
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 3. Get FCM Tokens

Retrieve all FCM tokens registered for the authenticated user.

**Endpoint**: `GET /fcm-tokens`

**Success Response** (200):

```json
{
  "status": "success",
  "message": "FCM tokens retrieved successfully",
  "data": {
    "tokens": [
      {
        "id": "64a1b2c3d4e5f6789abcdef0",
        "deviceId": "iPhone12_User123",
        "platform": "ios",
        "createdAt": "2025-07-07T09:00:00.000Z",
        "lastUsed": "2025-07-07T10:30:00.000Z",
        "tokenPreview": "dPm7lqK9QQGtL8gJ3ZmvY2..."
      },
      {
        "id": "64a1b2c3d4e5f6789abcdef1",
        "deviceId": "AndroidDevice_User123",
        "platform": "android",
        "createdAt": "2025-07-06T15:20:00.000Z",
        "lastUsed": "2025-07-07T08:45:00.000Z",
        "tokenPreview": "fAa5bqX2PPHuN9hK4YnwZ1..."
      }
    ],
    "totalCount": 2
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Authentication required
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 4. Send Test Notification

Send a test notification to all registered devices for the authenticated user.

**Endpoint**: `POST /test-notification`

**Request Body** (Optional):

```json
{
  "title": "string (optional, default: 'Test Notification')",
  "body": "string (optional, default: 'This is a test notification from NatCycle!')"
}
```

**Example Request**:

```json
{
  "title": "Hello from NatCycle! 🌱",
  "body": "Your push notifications are working perfectly!"
}
```

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Test notification sent successfully",
  "data": {
    "message": "Test notification sent successfully",
    "successCount": 2,
    "failureCount": 0
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid notification content or no tokens found
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error

---

## Usage Examples

### Frontend Integration Example (JavaScript)

```javascript
class FCMTokenManager {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  async registerToken(fcmToken, deviceId = null, platform = null) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          token: fcmToken,
          deviceId,
          platform,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        console.log("FCM token registered successfully");
        return data.data;
      } else {
        throw new Error(data.message || "Failed to register FCM token");
      }
    } catch (error) {
      console.error("Error registering FCM token:", error);
      throw error;
    }
  }

  async sendTestNotification(title, body) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/test-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending test notification:", error);
      throw error;
    }
  }
}

// Usage
const fcmManager = new FCMTokenManager(
  "https://api.natcycle.com/api/user",
  "your-auth-token"
);

// Register FCM token
fcmManager.registerToken(
  "dPm7lqK9QQGtL8gJ3ZmvY2:APA91bHKjLmnopqrst...",
  "iPhone12_User123",
  "ios"
);

// Send test notification
fcmManager.sendTestNotification("Hello!", "Testing push notifications");
```

### Mobile Integration Example (React Native)

```javascript
import messaging from "@react-native-firebase/messaging";

// Request permission and get FCM token
const setupNotifications = async () => {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // Get FCM token
      const fcmToken = await messaging().getToken();

      // Register with your API
      await registerFCMToken(fcmToken, getDeviceId(), Platform.OS);

      console.log("FCM token registered:", fcmToken);
    }
  } catch (error) {
    console.error("Failed to setup notifications:", error);
  }
};

const registerFCMToken = async (token, deviceId, platform) => {
  const response = await fetch("https://api.natcycle.com/api/user/fcm-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token,
      deviceId,
      platform,
    }),
  });

  return response.json();
};
```

---

## Rate Limiting

- Token registration: 10 requests per minute per user
- Token removal: 10 requests per minute per user
- Test notifications: 5 requests per minute per user

---

## Notes

1. **Token Limits**: Each user can have a maximum of 5 FCM tokens registered at once. Older tokens are automatically removed when this limit is exceeded.

2. **Automatic Cleanup**: Invalid tokens are automatically removed from the database when push notifications fail due to token expiration or unregistration.

3. **Welcome Notification**: When a new token is registered, a welcome notification is automatically sent to verify the token works.

4. **Security**: Full FCM tokens are never returned in API responses. Only token previews (first 20 characters) are shown.

5. **Platform Detection**: If no platform is specified, the system will attempt to detect it based on the token format.

6. **Cross-Platform**: The same API endpoints work for both regular NatCycle users and ThingsMatch users, with appropriate route prefixes.
