const express = require('express')
const router = express.Router()

const badgeController = require('../controllers/badgeController')

const { addBadge, getBadges, deleteBadge, updateBadge } = badgeController

const { isAuth, isAdmin } = require('../middleware/authMiddleware')

router.post('/', isAuth, isAdmin, addBadge)

router.get('/', isAuth, isAdmin, getBadges)

router.delete('/:id', isAuth, isAdmin, deleteBadge)

router.put('/:id', isAuth, isAdmin, updateBadge)

module.exports = router
