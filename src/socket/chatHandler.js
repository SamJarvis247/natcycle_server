const socketAuthMiddleware = require('../middleware/socketAuth');
const Match = require('../models/thingsMatch/match.model');
const messageService = require('../service/thingsMatch/message.service');

function initializeSocketIO(io) {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User TMID: ${socket.TMID}`);

    socket.on('joinRoom', async ({ matchId }) => {
      try {
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit('chatError', { message: 'Match not found.' });
        }

        const userTMID = socket.TMID;
        if (match.itemOwnerId.toString() !== userTMID && match.itemSwiperId.toString() !== userTMID) {
          return socket.emit('chatError', { message: 'You are not authorized to join this chat.' });
        }

        // Allow joining for 'active' or 'pendingInterest' (to receive the default message if owner is online)
        if (match.status !== 'active' && match.status !== 'pendingInterest') {
          return socket.emit('chatError', { message: `Chat not available for this match (status: ${match.status}).` });
        }

        socket.join(matchId);
        socket.currentRoom = matchId;
        console.log(`User ${userTMID} (${socket.id}) joined room: ${matchId}`);
        socket.emit('roomJoined', { matchId, message: `Successfully joined room ${matchId}` });

      } catch (error) {
        console.error(`Error joining room ${matchId} for user ${socket.TMID}:`, error);
        socket.emit('chatError', { message: 'Failed to join room.', details: error.message });
      }
    });

    socket.on('sendMessage', async ({ matchId, content }) => {
      console.log(`User ${socket.TMID} sending message in room ${matchId}: ${content}`);
      if (!content || String(content).trim() === "") {
        return socket.emit('chatError', { message: 'Message content cannot be empty.' });
      }
      if (socket.currentRoom !== matchId) {
        return socket.emit('chatError', { message: 'You are not in this room or trying to send to a different room.' });
      }

      try {
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit('chatError', { message: 'Match not found.' });
        }
        if (match.status !== 'active') {
          return socket.emit('chatError', { message: `Cannot send message. Match status is: ${match.status}.` });
        }

        const senderId = socket.TMID;
        const receiverId = match.itemOwnerId.toString() === senderId
          ? match.itemSwiperId.toString()
          : match.itemOwnerId.toString();

        console.log(`Sender ID: ${senderId}, Receiver ID: ${receiverId}, Match ID: ${matchId}, Content: ${content}`);

        const savedMessage = await messageService.sendMessage(matchId, senderId, receiverId, content, "custom");

        io.to(matchId).emit('receiveMessage', savedMessage);
        console.log(`Message sent in room ${matchId} by ${senderId}: ${content}`);

      } catch (error) {
        console.error(`Error sending message in room ${matchId} by user ${socket.TMID}:`, error);
        socket.emit('chatError', { message: 'Failed to send message.', details: error.message });
      }
    });

    socket.on('typing', ({ matchId }) => {
      if (socket.currentRoom === matchId) {
        socket.to(matchId).emit('userTyping', { userId: socket.TMID, matchId });
      }
    });

    socket.on('stopTyping', ({ matchId }) => {
      if (socket.currentRoom === matchId) {
        socket.to(matchId).emit('userStopTyping', { userId: socket.TMID, matchId });
      }
    });

    socket.on('messageRead', async ({ messageId, matchId }) => { // Added matchId for room broadcast
      try {
        if (!messageId || !matchId) {
          return socket.emit('chatError', { message: 'Message ID and Match ID are required for read status.' });
        }
        const updatedMessage = await messageService.updateMessageStatus(messageId, socket.TMID, 'read');
        if (updatedMessage) {
          io.to(matchId).emit('messageStatusUpdated', updatedMessage); // Broadcast to room
        }
      } catch (error) {
        console.error(`Error marking message ${messageId} as read by ${socket.TMID}:`, error);
        socket.emit('chatError', { message: 'Failed to update message status.', details: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}, User TMID: ${socket.TMID}`);
      // Clean up, e.g., notify room if user left
      // if (socket.currentRoom) {
      //   socket.to(socket.currentRoom).emit('userLeft', { userId: socket.TMID, matchId: socket.currentRoom });
      // }
    });
  });
}

module.exports = initializeSocketIO;
