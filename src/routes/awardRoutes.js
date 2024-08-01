const express = require('express')
const router = express.Router()

const awardController = require('../controllers/awardController')

const {
  addAward, getAwards, updateAward,
  deleteAward,
  userRedeemRewardWithPoints
} = awardController

const { isAuth } = require('../middleware/authMiddleware')

router.post('/', isAuth, addAward)

router.delete('/:id', isAuth, deleteAward)

router.post('/:id/redeem/userId', isAuth, userRedeemRewardWithPoints)

router.get('/', isAuth, getAwards)

router.put('/:id', isAuth, updateAward)

module.exports = router
