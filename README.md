# NatCycle Server 🌱

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-blue.svg)](https://socket.io/)

A comprehensive Node.js server for NatCycle - a sustainability-focused application that manages recycling locations, material tracking, campaigns, and user engagement.

## 🚀 Features

### Core Functionality

- **Drop-off Management**: Regular and simple drop-off locations
- **Material Tracking**: Comprehensive material type management with bulk operations
- **Campaign System**: Environmental campaigns with user participation
- **ThingsMatch**: Community-driven item sharing platform
- **Rewards System**: Gamification with badges and achievements
- **Real-time Communication**: Socket.IO for live updates
- **Geospatial Services**: Location-based features with MongoDB geospatial queries

### API Capabilities

- **Authentication**: JWT-based user authentication with Firebase integration
- **File Upload**: Cloudinary integration for image and video uploads
- **Email Services**: Nodemailer for transactional emails
- **Analytics**: Built-in analytics and reporting
- **Push Notifications**: FCM integration for mobile notifications
- **Database Seeding**: Comprehensive data seeding scripts

### Technical Features

- **Health Monitoring**: Built-in health check endpoints
- **CORS Configuration**: Flexible cross-origin resource sharing
- **Rate Limiting**: API protection and abuse prevention
- **Error Handling**: Centralized error management
- **Logging**: Comprehensive request/response logging
- **Security**: Helmet.js security headers

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT + Firebase Admin SDK
- **File Storage**: Cloudinary
- **Email**: Nodemailer (Gmail SMTP)
- **Security**: Helmet.js, CORS
- **Development**: Nodemon for hot reloading

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB 6.0 or higher
- Cloudinary account
- Firebase project
- Gmail account (for email services)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd natcycle_server
npm install
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env
```

Fill in your environment variables (see Environment Variables section below).

### 3. Database Setup

```bash
# Initialize database with required collections
npm run setup:database

# Seed with sample data (optional)
npm run seed:all
```

### 4. Development

```bash
# Start development server with hot reload
npm run dev

# Or start production server
npm start
```

The server will be available at `http://localhost:5000`

## 🔧 Environment Variables

### Required Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/natcycle

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour Firebase private key here\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-firebase-client-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id

# Cloudinary
CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Client Configuration
CLIENT_URL=http://localhost:3000

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Optional Variables

```env
# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Limits
MAX_FILE_SIZE=5000000
```

## 📚 API Documentation

### Health Check

```
GET /api/health
```

Returns server status and environment information.

### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
```

### Core Resources

```
# Users
GET|POST|PUT|DELETE /api/users/*

# Drop-off Locations
GET|POST|PUT|DELETE /api/dropoff/*

# Simple Drop-offs
GET|POST|PUT|DELETE /api/simple-dropoff/*

# Materials
GET|POST|PUT|DELETE /api/materials/*

# Campaigns
GET|POST|PUT|DELETE /api/campaigns/*

# ThingsMatch
GET|POST|PUT|DELETE /api/thingsmatch/*

# Rewards & Badges
GET|POST|PUT|DELETE /api/rewards/*
GET|POST|PUT|DELETE /api/badges/*
```

## 🗃️ Database Seeding

The application includes comprehensive seeding scripts:

```bash
# Seed individual collections
npm run seed:dropoffs
npm run seed:simple-dropoffs
npm run seed:campaigns
npm run seed:items
npm run seed:materials

# Seed everything at once
npm run seed:all

# Force seed with specified counts
npm run seed:force-dropoffs
npm run seed:force-items

# Clear collections
npm run clear:items
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the Docker image
docker build -t natcycle-server .

# Run the container
docker run -p 5000:5000 --env-file .env natcycle-server
```

### Docker Compose (with MongoDB)

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/natcycle
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## ☁️ Railway Deployment

This server is configured for Railway deployment with the included `railway.toml` file.

### Deploy to Railway

1. **Install Railway CLI:**

   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**

   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add Environment Variables:**
   Set all required environment variables in the Railway dashboard.

4. **Add MongoDB:**
   - Add MongoDB service in Railway
   - Update `MONGO_URI` with Railway's connection string

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Firebase Integration**: Additional authentication layer
- **CORS Protection**: Configurable cross-origin policies
- **Rate Limiting**: Prevents API abuse
- **Helmet.js**: Security headers and protection
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Type and size restrictions

## 📊 Monitoring & Logging

- **Health Checks**: `/api/health` endpoint for monitoring
- **Request Logging**: Morgan middleware for HTTP logging
- **Error Tracking**: Centralized error handling and logging
- **Performance Metrics**: Built-in route timing and monitoring

## 🧪 Testing

```bash
# Run tests (when test suite is added)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
natcycle_server/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── analytics/             # Analytics and reporting
│   ├── config/                # Configuration files
│   │   ├── dbConfig.js
│   │   ├── firebaseConfig.js
│   │   ├── cloudinaryUpload.js
│   │   └── corsConfig.js
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Custom middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── scripts/              # Database seeding scripts
│   ├── service/              # Business logic services
│   ├── socket/               # Socket.IO handlers
│   ├── utility/              # Utility functions
│   └── validation/           # Input validation schemas
├── uploads/                  # Local file uploads (development)
├── server.js                 # Server entry point
├── package.json
├── Dockerfile
├── railway.toml              # Railway deployment config
└── .dockerignore
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Issues:**

- Ensure MongoDB is running
- Check connection string format
- Verify network connectivity

**Authentication Errors:**

- Verify Firebase configuration
- Check JWT secret is set
- Ensure proper token format

**File Upload Issues:**

- Check Cloudinary credentials
- Verify file size limits
- Ensure proper CORS configuration

**Socket.IO Connection Issues:**

- Check CORS configuration
- Verify client/server URL matching
- Check firewall settings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🚀 Roadmap

- [ ] API versioning
- [ ] GraphQL endpoint
- [ ] Microservices architecture
- [ ] Advanced analytics dashboard
- [ ] Mobile app API optimization
- [ ] Blockchain integration for transparency

---

**Made with ❤️ for a sustainable future** 🌍
