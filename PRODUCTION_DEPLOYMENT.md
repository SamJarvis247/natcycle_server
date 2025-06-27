# Production Deployment Setup

This document explains how to properly deploy the natcycle server with database setup for production environments like Render.

## 📋 Deployment Steps

### 1. **Environment Variables**

Ensure these environment variables are set in your production environment:

```env
# Database
MONGO_URI=your_production_mongodb_connection_string

# Firebase (Optional - for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id

# Other required environment variables...
```

### 2. **NPM Scripts Added**

The following scripts have been added to `package.json`:

| Script           | Command                  | Description                  |
| ---------------- | ------------------------ | ---------------------------- |
| `setup:database` | `npm run setup:database` | Manual database setup        |
| `prestart`       | Automatic                | Runs before `npm start`      |
| `build`          | `npm run build`          | For build step in deployment |

### 3. **Automatic Setup**

The database setup now runs automatically before the server starts:

```bash
npm start  # This will run setup:database first, then start the server
```

### 4. **Manual Setup** (if needed)

You can also run the database setup manually:

```bash
npm run setup:database
```

## 🔧 What the Setup Script Does

### **Step 1: Data Migration**

- Converts old location format `{ lat: x, lng: y }` to GeoJSON `{ type: "Point", coordinates: [lng, lat] }`
- Handles invalid coordinates by setting them to `[0, 0]`
- Preserves address information during migration

### **Step 2: Index Creation**

- Creates `location_2dsphere` geospatial index for MongoDB
- Enables efficient proximity queries for the leaderboard API
- Creates index in background to avoid blocking

### **Step 3: Data Verification**

- Verifies all location data is in correct GeoJSON format
- Tests geospatial queries to ensure everything works
- Reports any data integrity issues

## 🚀 Render.com Deployment

### **Build Command:**

```bash
npm install && npm run build
```

### **Start Command:**

```bash
npm start
```

### **Environment Variables:**

Set all required environment variables in Render dashboard.

## 🐳 Docker Deployment

If using Docker, add this to your Dockerfile:

```dockerfile
# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Setup database and start
CMD ["npm", "start"]
```

## 🔍 Troubleshooting

### **Database Setup Fails**

- Check `MONGO_URI` environment variable
- Ensure MongoDB is accessible from deployment environment
- Check logs for specific error messages

### **Geospatial Queries Fail**

- Verify the setup script completed successfully
- Check that `location_2dsphere` index exists in MongoDB
- Ensure all location data is in GeoJSON format

### **API Returns Empty Results**

- Check that ThingsMatch users have valid location data
- Verify coordinates are within valid ranges (lng: -180 to 180, lat: -90 to 90)
- Test with larger `maxDistance` parameter

## 📊 Production Monitoring

The setup script provides detailed logging:

```
✅ Connected to MongoDB
📍 Step 1: Migrating location data...
🔍 Step 2: Ensuring geospatial indexes...
✅ Step 3: Verifying data integrity...
🎉 Database setup completed successfully!
```

Any errors will cause the deployment to fail with detailed error messages.

## 🔄 Re-running Setup

The setup script is idempotent - it can be run multiple times safely:

- Migration only affects documents that need it
- Index creation skips if index already exists
- Verification provides current state regardless

This ensures your production database is always properly configured for the leaderboard APIs! 🚀
