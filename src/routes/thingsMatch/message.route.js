const { Router } = require("express");
const thingsMatchMessageController = require("../../controllers/thingsMatch/message.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");

const router = Router();

router.use(isThingsMatchUser);

// Send a message in a specific match
router.post("/:matchId/send", thingsMatchMessageController.sendMessage);

// Get all messages for a specific match (with pagination)
router.get("/:matchId", thingsMatchMessageController.getMessagesForMatch);

// Mark messages as read/delivered (optional, if you implement this controller action)
router.patch(
  "/:matchId/messages/status",
  thingsMatchMessageController.updateMessageStatus
);

module.exports = router;
