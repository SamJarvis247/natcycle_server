const express = require('express')
const router = express.Router()

const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign
} = require('../controllers/campaignController')

const { isAuth, isAdmin } = require('../middleware/authMiddleware')

router.get('/', getCampaigns)

router.get('/:id', getCampaign)

router.post('/', isAuth, isAdmin, createCampaign)

router.put('/:id', isAuth, isAdmin, updateCampaign)

router.delete('/:id', isAuth, isAdmin, deleteCampaign)

module.exports = router
