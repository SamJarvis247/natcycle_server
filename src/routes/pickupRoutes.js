const express = require('express')
const router = express.Router()

const pickupControllers = require('../controllers/pickUpController')

const {
  addPickUp, getPickUpById, getPickUps, cancelPickUp,
  adminGetPickUps, completePickUp, deletePickUp
} = pickupControllers

const { isAuth, isAdmin } = require('../middleware/authMiddleware')

router.post('/', isAuth, addPickUp)

router.get('/', isAuth, getPickUps)

router.delete('/:id', isAuth, cancelPickUp)

router.get('/admin', isAuth, adminGetPickUps)

router.get('/:id', isAuth, getPickUpById)

router.put('/complete/:id', isAuth, isAdmin, completePickUp)

router.delete('/delete/:id', isAuth, deletePickUp)

module.exports = router
