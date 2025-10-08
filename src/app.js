require('dotenv').config()

const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const { errorHandler } = require('./middleware/errorHandler')
const logRoute = require('./middleware/logRoute')

// import cors config
const corsConfig = require('./config/corsConfig')

// Initialize Firebase Admin SDK
const { initializeFirebase } = require('./config/firebaseConfig')
initializeFirebase()

// middleware
app.use(cookieParser())
app.use(helmet())
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.send("Welcome to NatCycle API You don't have access 😛")
})

// Health check endpoint for Railway - works before DB connection
app.get('/api/health', (req, res) => {
  try {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }

    res.status(200).json(healthData)
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// logger to see what routes are being hit
const myLogger = function (req, res, next) {
  console.log('route ' + req.method, req.url)
  // format time
  console.log('time', new Date().toLocaleTimeString())
  next()
}
app.use(logRoute)
app.use(myLogger)

app.use(express.json({ limit: 5000000 }))
app.use(express.urlencoded({ limit: 5000000, extended: false }))
app.use(express.json())

app.set('trust proxy', 1)

app.use(cors(corsConfig))

// link to static files
app.use('/uploads', express.static('uploads'))

// all routes
const routes = require('./routes/index')
app.use('/api', routes)
require('./analytics/main')

// export app
module.exports = app

app.use(errorHandler)
