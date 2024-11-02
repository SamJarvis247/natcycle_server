const express = require('express')
const router = express.Router()

const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign, getContributors
} = require('../controllers/campaignController')

const { isAuth, isAdmin } = require('../middleware/authMiddleware')

router.get('/', getCampaigns)

router.get('/:id', getCampaign)

router.post('/', isAuth, isAdmin, createCampaign)

router.put('/:id', isAuth, isAdmin, updateCampaign)

router.delete('/:id', isAuth, isAdmin, deleteCampaign)

router.get('/:id/contributors', getContributors)

module.exports = router
