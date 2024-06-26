const express = require('express')
const router = express.Router()

const pickupControllers = require('../controllers/pickupController')

const { addPickUp, getPickUps, cancelPickUp } = pickupControllers

const { isAuth } = require('../middleware/authMiddleware')

router.post('/', isAuth, addPickUp)

router.get('/', isAuth, getPickUps)

router.delete('/:id', isAuth, cancelPickUp)

module.exports = router
