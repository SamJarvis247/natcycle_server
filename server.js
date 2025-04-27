const app = require('./src/app')
const RedisService = require('./src/service/redis.service.js')
const mongoose = require('mongoose')

// socket config
const http = require('http')

// import mongodb config
const config = require('./src/config/dbConfig')

// connect to mongoDB
mongoose
  .connect(config.uri, config.options)
  .then(async () => {
    console.log('Connected to MongoDB')
    try {
      await RedisService.connect()
      console.log('Connected to Redis')
    } catch (err) {
      console.error('Failed to connect to Redis:', err)
      console.log('Server will continue without Redis functionality')
    }
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err)
  })

// start server
const port = process.env.PORT || '5000'

// const server = http.Server(app)

app.listen(port, () => {
  console.log('App running on port 5000...')
})
