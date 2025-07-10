# Frontend Guide: Creating Drop-offs

This guide explains how to properly send requests from the frontend to create both regular DropOffs and SimpleDropOffs.

## Regular DropOff Requests

### Endpoint

```
POST /api/drop-offs
```

### Authentication

- Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

### Content Type

Use `multipart/form-data` to support file uploads.

### Form Fields

| Field Name      | Type         | Required | Description                                      |
| --------------- | ------------ | -------- | ------------------------------------------------ |
| location        | String       | Yes      | ID of the DropOffLocation                        |
| itemType        | String       | Yes      | Primary material type (e.g., 'plastic', 'paper') |
| dropOffQuantity | Array/String | Yes      | JSON array or stringified JSON array of items    |
| description     | String       | No       | Additional notes about the drop-off              |
| campaignId      | String       | No       | ID of an associated campaign                     |
| file            | File         | No       | Image of the receipt/proof                       |

### Example dropOffQuantity Format

```json
[
  {
    "materialType": "pet_bottles",
    "units": 5
  },
  {
    "materialType": "hdpe_containers",
    "units": 3
  }
]
```

### JavaScript Example (using Axios)

```javascript
import axios from "axios";

const createDropOff = async (dropOffData, image) => {
  const formData = new FormData();

  // Add basic fields
  formData.append("location", dropOffData.locationId);
  formData.append("itemType", dropOffData.itemType); // e.g., 'plastic'

  // Add dropOffQuantity as stringified JSON
  const quantityData = [
    { materialType: "pet_bottles", units: 5 },
    { materialType: "hdpe_containers", units: 3 },
  ];
  formData.append("dropOffQuantity", JSON.stringify(quantityData));

  // Add optional fields
  if (dropOffData.description) {
    formData.append("description", dropOffData.description);
  }

  if (dropOffData.campaignId) {
    formData.append("campaignId", dropOffData.campaignId);
  }

  // Add image file if available
  if (image) {
    formData.append("file", image);
  }

  // Send the request
  const response = await axios.post(
    "http://your-api-url/api/drop-offs",
    formData,
    {
      headers: {
        Authorization: `Bearer ${yourAuthToken}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
```

## SimpleDropOff Requests

### Endpoint

```
POST /api/simple-drop-offs
```

### Authentication

- Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

### Content Type

Use `multipart/form-data` to support file uploads.

### Form Fields

| Field Name              | Type   | Required | Description                                      |
| ----------------------- | ------ | -------- | ------------------------------------------------ |
| simpleDropOffLocationId | String | Yes      | ID of the SimpleDropOffLocation                  |
| materialType            | String | Yes      | Primary material type (e.g., 'plastic', 'paper') |
| quantity                | Number | No       | Amount of items (defaults to 1)                  |
| latitude                | Number | Yes      | Current GPS latitude                             |
| longitude               | Number | Yes      | Current GPS longitude                            |
| file                    | File   | Yes      | Image proof of drop-off                          |

### JavaScript Example (using Axios)

```javascript
import axios from "axios";

const createSimpleDropOff = async (dropOffData, image) => {
  const formData = new FormData();

  // Add required fields
  formData.append("simpleDropOffLocationId", dropOffData.locationId);
  formData.append("materialType", dropOffData.materialType);
  formData.append("latitude", dropOffData.latitude);
  formData.append("longitude", dropOffData.longitude);

  // Add quantity if provided
  if (dropOffData.quantity) {
    formData.append("quantity", dropOffData.quantity);
  }

  // Add image file (required for SimpleDropOff)
  formData.append("file", image);

  // Send the request
  const response = await axios.post(
    "http://your-api-url/api/simple-drop-offs",
    formData,
    {
      headers: {
        Authorization: `Bearer ${yourAuthToken}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
```

## Important Notes

1. **Image Upload**:

   - Always use `file` as the field name for image uploads in both endpoints
   - Images are uploaded to Cloudinary automatically
   - Maximum file size is 5MB
   - Supported formats: JPEG, PNG, GIF

2. **GPS Coordinates**:

   - For SimpleDropOff, GPS coordinates must be valid (latitude: -90 to 90, longitude: -180 to 180)
   - GPS coordinates help verify the user is near the drop-off location

3. **Material Types**:

   - Primary material types include: plastic, paper, metal, glass, electronics, textile, organic
   - Subtypes are more specific categories under each primary type
   - SimpleDropOff locations can only accept their specified material type

4. **Error Handling**:

   - Check for 400-level responses which contain error messages
   - Common errors include invalid location IDs, material types, or missing required fields

5. **Response Format**:
   - Successful responses include the created drop-off object with all fields
   - For regular DropOffs, image URL is available in `receipt.url`
   - For SimpleDropOffs, image URL is available in `proofPicture.url`

## Testing Your Implementation

You can test your implementation using Insomnia or Postman with the multipart form data format. Make sure to include a valid authentication token and all required fields before sending the request.
