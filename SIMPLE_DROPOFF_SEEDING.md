# SimpleDropOffLocation Seeding Guide

## Overview

This seed script creates 20 SimpleDropOffLocation entries across Nigeria and international locations, with special focus on Port Harcourt area near Happy Food Bakery, Ada George.

## Location Distribution

### Port Harcourt Area (10 locations)

- **4 locations**: Very close to Happy Food Bakery, Ada George (within 1km)
- **6 locations**: General Port Harcourt area (within 5km)
- All use realistic Nigerian addresses and phone numbers (+234)

### Other Nigerian Cities (5 locations)

- **Lagos**: 3 locations around Lagos mainland
- **Abuja**: 2 locations in FCT area

### International (5 locations)

- **London, UK**: 2 locations
- **New York, USA**: 2 locations
- **Accra, Ghana**: 1 location

## Reference Coordinates

- **Happy Food Bakery, Ada George**: 4.8396°N, 7.0047°E
- Close locations within 0.01° radius (~1km)
- PH general locations within 0.05° radius (~5km)

## Features

- **Smart Duplicate Prevention**: No locations within 50m of each other
- **Material Type Distribution**: Weighted towards common types (plastic 40%, paper 20%, etc.)
- **Realistic Data**:
  - Country-specific phone numbers
  - Proper addresses
  - Operating hours variety
  - Organization names
- **Verification Mix**: 30% require admin verification

## Usage

### Run Simple Seeding

```bash
npm run seed:simple-dropoffs
```

### Test with Verbose Output

```bash
npm run seed:simple-dropoffs-test
```

### Run All Seeds (including simple dropoffs)

```bash
npm run seed:all
```

## Safety Features

- **Check Existing**: Won't create if 20+ locations already exist
- **Distance Validation**: Prevents locations too close together
- **Database Indexes**: Auto-creates geospatial indexes

## Sample Generated Data

```json
{
  "name": "Happy Food Area Collection Basket 1",
  "location": {
    "type": "Point",
    "coordinates": [7.0055, 4.8402]
  },
  "address": "123 Ada George Road, Port Harcourt, Rivers State, Nigeria",
  "materialType": "plastic",
  "acceptedSubtypes": ["500ml plastic", "plastic bags", "plastic containers"],
  "organizationName": "Happy Food Area Environmental Initiative",
  "isActive": true,
  "verificationRequired": false,
  "maxItemsPerDropOff": 15,
  "operatingHours": "24/7",
  "contactNumber": "+2348012345678"
}
```

## Verification

After seeding, verify with:

1. Check database count: Should have exactly 20 locations
2. Check PH locations: Should have 10 with 4 very close to Happy Food Bakery
3. Check geospatial queries work for nearby location search
4. Verify no locations are within 50m of each other
