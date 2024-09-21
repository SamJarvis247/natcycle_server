const express = require('express')
const router = express.Router()

const awardController = require('../controllers/awardController')

const {
  addAward, getAwards, updateAward,
  deleteAward,
  userRedeemRewardWithPoints, getUserRewards,
  adminUpdateRedeemStatus, adminGetRedeemAwards
} = awardController

const { isAuth } = require('../middleware/authMiddleware')

router.post('/', isAuth, addAward)

router.delete('/:id', isAuth, deleteAward)

router.post('/:id/redeem', isAuth, userRedeemRewardWithPoints)

router.get('/', isAuth, getAwards)

router.put('/:id', isAuth, updateAward)

router.get('/user', isAuth, getUserRewards)

router.put('/admin/:id/update/:status', isAuth, adminUpdateRedeemStatus)

router.get('/admin/redeemed', isAuth, adminGetRedeemAwards)

module.exports = router
