const express = require('express')
const router = express.Router()

const pickupControllers = require('../controllers/pickUpController')

const {
  addPickUp, getPickUps, cancelPickUp,
  adminGetPickUps, completePickUp, deletePickUp
} = pickupControllers

const { isAuth } = require('../middleware/authMiddleware')

router.post('/', isAuth, addPickUp)

router.get('/', isAuth, getPickUps)

router.delete('/:id', isAuth, cancelPickUp)

router.get('/admin', isAuth, adminGetPickUps)

router.put('/complete/:id', isAuth, completePickUp)

router.delete('/delete/:id', isAuth, deletePickUp)

module.exports = router
