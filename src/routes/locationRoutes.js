const express = require('express')
const router = express.Router()
const locationControllers = require('../controllers/locationController')

const {
  addLocation,
  getLocations,
  getLocation,
  updateLocation,
  deleteLocation
} = locationControllers

const { isAuth } = require('../middleware/authMiddleware')

router.post('/', isAuth, addLocation)

router.get('/', isAuth, getLocations)

router.get('/:id', isAuth, getLocation)

router.put('/:id', isAuth, updateLocation)

router.delete('/:id', isAuth, deleteLocation)

module.exports = router
