const express = require('express')
const router = express.Router()

const badgeController = require('../controllers/badgeController')

const { addBadge, getBadges, deleteBadge } = badgeController

const { isAuth, isAdmin } = require('../middleware/authMiddleware')

router.post('/', isAuth, isAdmin, addBadge)

router.get('/', isAuth, isAdmin, getBadges)

router.delete('/:id', isAuth, isAdmin, deleteBadge)

module.exports = router
