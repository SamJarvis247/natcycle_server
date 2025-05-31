import { SOCKET_URL } from './config.js';
import { getAuthToken } from './apiService.js';
import { displayNotification } from './ui/notifications.js';
import { getCurrentUser } from './auth.js';
import { appendMessageToChat, updateMessageStatusInChatUI, setTypingIndicator, clearTypingIndicator } from './ui/chat.js';
import { refreshMyMatches } from './ui/matchesMy.js'; // To refresh match list on updates
import { getCurrentChatContext } from './ui/chat.js'; // To check current chat

let socket = null;

export function initializeSocket() {
  if (socket && socket.connected) {
    console.log('Socket already connected.');
    return socket;
  }

  const token = getAuthToken();
  console.log('[SocketService] Token being used for auth:', token);
  if (!token) {
    console.error('Socket initialization failed: No auth token available.');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token: token },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    displayNotification('Socket connected successfully!', 'success');
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    displayNotification(`Socket disconnected: ${reason}`, 'danger');
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    displayNotification(`Socket connection error: ${error.message}`, 'danger');
    console.error('Socket connection error:', error);
  });

  socket.on('chatError', (data) => {
    displayNotification(`Chat Error: ${data.message || 'Unknown chat error'}`, 'danger');
    console.error('Chat Error Event:', data);
  });

  socket.on('roomJoined', (data) => {
    displayNotification(`Joined chat room: ${data.matchId}`, 'info');
    console.log('Room Joined Event:', data);
  });

  socket.on('receiveMessage', (message) => {
    const currentUser = getCurrentUser();
    const currentChatCtx = getCurrentChatContext();
    displayNotification(`New message in match ${message.matchId}`, 'info');
    console.log('Receive Message Event:', message);

    if (currentChatCtx && currentChatCtx.matchId === message.matchId.toString()) {
      appendMessageToChat(message);
      // If user is viewing this chat and the message is not from them, mark as read
      if (currentUser && message.senderId.toString() !== currentUser.TMID) {
        emitMessageRead(message._id, message.matchId);
      }
    } else {
      // Potentially highlight the match in "My Matches" list or show a general unread indicator
      console.log(`Message received for inactive chat room: ${message.matchId}`);
    }
    refreshMyMatches(); // Update last message time in match list
  });

  socket.on('userTyping', ({ userId, matchId }) => {
    const currentUser = getCurrentUser();
    const currentChatCtx = getCurrentChatContext();
    if (currentChatCtx && currentChatCtx.matchId === matchId && currentUser && userId !== currentUser.TMID) {
      setTypingIndicator(true);
    }
  });

  socket.on('userStopTyping', ({ userId, matchId }) => {
    const currentUser = getCurrentUser();
    const currentChatCtx = getCurrentChatContext();
    if (currentChatCtx && currentChatCtx.matchId === matchId && currentUser && userId !== currentUser.TMID) {
      setTypingIndicator(false);
    }
  });

  socket.on('messageStatusUpdated', (updatedMessage) => {
    displayNotification(`Message ${updatedMessage._id} status updated to ${updatedMessage.status}`, 'info');
    console.log('Message Status Updated Event:', updatedMessage);
    updateMessageStatusInChatUI(updatedMessage);
  });

  socket.on('newPendingInterest', ({ match, message }) => {
    const itemNameToDisplay = match.itemDetails?.name || match.itemId?.name || 'your item';
    displayNotification(`New pending interest for ${itemNameToDisplay}! Message: "${message.content}"`, 'success');
    console.log('New Pending Interest Event:', { match, message });
    refreshMyMatches();
  });

  socket.on('matchStatusUpdated', async (updatedMatch) => {
    displayNotification(`Match ${updatedMatch._id} status updated to ${updatedMatch.status}`, 'info');
    console.log('Match Status Updated Event:', updatedMatch);
    refreshMyMatches();
    // If this is the current chat, update UI or close chat if no longer 'matched'
    const currentChatCtx = getCurrentChatContext();
    if (currentChatCtx && currentChatCtx.matchId === updatedMatch._id.toString()) {
      if (updatedMatch.status !== 'active') {
        // Logic to close or disable chat interface for this match
        displayNotification(`Chat for match ${updatedMatch._id} is no longer active (status: ${updatedMatch.status}).`, 'warning');
        // Potentially call a function from chat.js to reset/close the chat UI
        const chatUI = await import('./ui/chat.js');
        chatUI.closeChatInterface();
      }
    }
  });

  socket.on('matchConfirmed', ({ match }) => {
    const itemNameToDisplay = match.itemDetails?.name || match.itemId?.name || 'item';
    displayNotification(`Your match for ${itemNameToDisplay} has been confirmed!`, 'success');
    console.log('Match Confirmed Event:', match);
    refreshMyMatches();
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket explicitly disconnected.');
  }
}

export function getSocket() {
  return socket;
}

// --- Emitters ---
export function emitJoinRoom(matchId) {
  if (socket && socket.connected) {
    console.log(`Emitting joinRoom for matchId: ${matchId}`);
    socket.emit('joinRoom', { matchId });
  } else {
    console.error('Socket not connected. Cannot emit joinRoom.');
  }
}

export function emitSendMessage(matchId, content) {
  if (socket && socket.connected) {
    socket.emit('sendMessage', { matchId, content });
  } else {
    console.error('Socket not connected. Cannot emit sendMessage.');
  }
}

export function emitTyping(matchId) {
  if (socket && socket.connected) {
    socket.emit('typing', { matchId });
  }
}

export function emitStopTyping(matchId) {
  if (socket && socket.connected) {
    socket.emit('stopTyping', { matchId });
  }
}

export function emitMessageRead(messageId, matchId) {
  if (socket && socket.connected) {
    socket.emit('messageRead', { messageId, matchId });
  } else {
    console.error('Socket not connected. Cannot emit messageRead.');
  }
}
