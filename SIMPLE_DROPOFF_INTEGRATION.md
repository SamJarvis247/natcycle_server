# SimpleDropOff System Integration

## Overview

The SimpleDropOff system is designed to cater to smaller recycling locations like collection baskets in schools, beaches, and other micro-locations. Unlike the regular drop-off system which requires users to visit large recycling centers, SimpleDropOff allows users to quickly dispose of individual items at nearby collection points.

## Key Features

### 🎯 **Dual Recycling System**

- **Regular DropOff**: Large recycling centers with machines and receipt scanning
- **SimpleDropOff**: Small collection baskets/points for quick individual item disposal

### 📍 **Location Management**

- Admin-managed simple drop-off locations
- GPS-based location discovery
- Material-type specific locations
- Geospatial proximity search

### 📸 **Proof-Based System**

- Users take photos of their hand holding the item
- Image-based verification process
- Optional admin verification workflow

### ♻️ **Reward System**

- Carbon Units (CU) only - no NatPoints
- 50% of regular drop-off CU rates
- Daily limits per location to prevent abuse

## API Endpoints

### SimpleDropOff Locations

#### Public Endpoints

```
GET /api/simple-dropoff-locations/nearby
GET /api/simple-dropoff-locations/material-types
GET /api/simple-dropoff-locations/:id
```

#### Admin Endpoints

```
POST /api/simple-dropoff-locations
GET /api/simple-dropoff-locations
PUT /api/simple-dropoff-locations/:id
DELETE /api/simple-dropoff-locations/:id
PATCH /api/simple-dropoff-locations/:id/verify
GET /api/simple-dropoff-locations/admin/statistics
```

### SimpleDropOffs

#### User Endpoints

```
POST /api/simple-dropoffs
GET /api/simple-dropoffs/my-dropoffs
GET /api/simple-dropoffs/my-stats
GET /api/simple-dropoffs/:id
```

#### Admin Endpoints

```
GET /api/simple-dropoffs
GET /api/simple-dropoffs/admin/pending
GET /api/simple-dropoffs/admin/stats
PATCH /api/simple-dropoffs/:id/verify
PATCH /api/simple-dropoffs/admin/bulk-verify
DELETE /api/simple-dropoffs/:id
```

## Usage Examples

### 1. Creating a Simple Drop-Off Location (Admin)

```bash
POST /api/simple-dropoff-locations
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Beach Cleanup Basket - Santa Monica",
  "latitude": 34.0194,
  "longitude": -118.4912,
  "address": "Santa Monica Beach, CA",
  "materialType": "plastic",
  "organizationName": "Ocean Cleanup Initiative",
  "verificationRequired": false,
  "maxItemsPerDropOff": 10,
  "operatingHours": "24/7",
  "contactNumber": "+1234567890"
}
```

### 2. Finding Nearby Locations

```bash
GET /api/simple-dropoff-locations/nearby?latitude=34.0194&longitude=-118.4912&radius=2000&materialType=plastic
```

### 3. Creating a Simple Drop-Off (User)

```bash
POST /api/simple-dropoffs
Content-Type: multipart/form-data
Authorization: Bearer <user_token>

{
  "simpleDropOffLocationId": "64a7b8c9d1e2f3456789abc0",
  "materialType": "plastic",
  "quantity": 1,
  "latitude": 34.0194,
  "longitude": -118.4912,
  "proofPicture": <image_file>
}
```

### 4. Getting User's Drop-Off History

```bash
GET /api/simple-dropoffs/my-dropoffs?page=1&limit=10&materialType=plastic&isVerified=true
```

### 5. Admin Verification

```bash
PATCH /api/simple-dropoffs/64a7b8c9d1e2f3456789abc1/verify
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "isApproved": true
}
```

## Data Models

### SimpleDropOffLocation

```javascript
{
  name: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  address: String,
  materialType: String, // enum: primary material types
  acceptedSubtypes: [String],
  organizationName: String,
  isActive: Boolean,
  verificationRequired: Boolean,
  maxItemsPerDropOff: Number,
  operatingHours: String,
  contactNumber: String,
  lastVerified: Date
}
```

### SimpleDropOff

```javascript
{
  user: ObjectId, // ref: User
  simpleDropOffLocation: ObjectId, // ref: SimpleDropOffLocation
  materialType: String,
  quantity: Number,
  proofPicture: {
    public_id: String,
    url: String
  },
  cuEarned: Number,
  rejectionReason: String,
  isVerified: Boolean,
  gpsCordinates: {
    type: "Point",
    coordinates: [longitude, latitude]
  }
}
```

## Business Rules

### Location Validation

- No two locations within 50m radius
- Material type must be supported
- GPS coordinates required

### Drop-Off Validation

- User must be within 100m of location
- Daily limit per user per location (default: 5 items)
- Only accepted material types allowed
- Proof picture required

### CU Calculation

- 50% of regular drop-off rates
- Material-specific CU values
- Auto-credited for non-verification-required locations
- Credited after admin approval for verification-required locations

### Security Features

- Rate limiting (20 drop-offs per hour per user)
- Image file validation
- GPS coordinate validation
- Admin-only sensitive operations

## Error Handling

### Common Error Responses

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message",
      "value": "invalid_value"
    }
  ]
}
```

### Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden (Admin required)
- `404`: Not Found
- `429`: Too Many Requests

## Deployment Considerations

### Required Environment Variables

```
TOKEN_SECRET=<jwt_secret>
CLOUDINARY_CLOUD_NAME=<cloudinary_name>
CLOUDINARY_API_KEY=<cloudinary_key>
CLOUDINARY_API_SECRET=<cloudinary_secret>
```

### Database Indexes

- Geospatial indexes on location coordinates
- User and location compound indexes
- Material type indexes for filtering

### File Storage

- Cloudinary integration for proof pictures
- 10MB file size limit
- Image format validation

## Testing

### User Flow Testing

1. Find nearby locations
2. Create drop-off with photo
3. Verify GPS proximity
4. Check CU calculation
5. Verify admin approval workflow

### Admin Flow Testing

1. Create locations
2. Verify drop-offs
3. View statistics
4. Bulk operations

## Future Enhancements

- AI-based image verification
- Mobile app optimization
- Offline mode capabilities
- Advanced analytics dashboard
- Gamification features
