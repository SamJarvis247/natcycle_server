const express = require('express')
const router = express.Router()

const {
  addDropOffLocation,
  adminGetDropOffLocations,
  getDropOffLocations, deleteDropOffLocation, getDropOffLocationById,
  getNearestDropOffLocations, updateDropOffLocation
} = require('../controllers/dropOffLocationController')

router.post('/', addDropOffLocation)

router.get('/', getDropOffLocations)

router.get("/all", adminGetDropOffLocations)

router.get('/:id', getDropOffLocationById)

router.get('/nearest/location', getNearestDropOffLocations)

router.put('/:id', updateDropOffLocation)

router.delete('/:id', deleteDropOffLocation)

module.exports = router
