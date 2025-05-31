import { $, $$ } from '../utils.js';
import { apiRequest } from '../apiService.js';
import { displayNotification } from './notifications.js';
import { getCurrentUser } from '../auth.js';
import { emitJoinRoom, emitSendMessage, emitTyping, emitStopTyping, emitMessageRead, getSocket } from '../socketService.js';
import { escapeHTML, debounce } from '../utils.js';

const chatSelectionArea = $('chatSelectionArea');
const chatInterface = $('chatInterface');
const chatMatchIdInput = $('chatMatchIdInput');
const joinChatButton = $('joinChatButton');
const currentChatMatchIdSpan = $('currentChatMatchId');
const chatParticipantNameSpan = $('chatParticipantName');
const chatWindow = $('chatWindow');
const chatMessageInput = $('chatMessageInput');
const sendChatMessageButton = $('sendChatMessageButton');
const typingIndicator = $('typingIndicator');

let currentChatContext = {
  matchId: null,
  otherParticipantName: null,
  otherParticipantTMID: null,
  messages: [], // Local cache of messages for the current chat
  isFetchingMessages: false
};

const debouncedEmitStopTyping = debounce(() => {
  if (currentChatContext.matchId && getSocket()?.connected) {
    emitStopTyping(currentChatContext.matchId);
  }
}, 1500); // 1.5 seconds after last keypress

export function getCurrentChatContext() {
  return currentChatContext;
}

export async function openChatForMatch(matchId, otherName, otherTMID) {
  if (!matchId) {
    displayNotification('Match ID is required to open chat.', 'danger');
    return;
  }
  const currentUser = getCurrentUser();
  if (!currentUser) {
    displayNotification('User not logged in.', 'danger');
    return;
  }

  currentChatContext.matchId = matchId;
  currentChatContext.otherParticipantName = otherName || 'Unknown User';
  currentChatContext.otherParticipantTMID = otherTMID || (await fetchOtherParticipantTMID(matchId)); // Fallback if not provided

  chatSelectionArea.classList.add('hidden');
  chatInterface.classList.remove('hidden');
  currentChatMatchIdSpan.textContent = escapeHTML(matchId);
  chatParticipantNameSpan.textContent = escapeHTML(currentChatContext.otherParticipantName);
  chatWindow.innerHTML = ''; // Clear previous messages
  typingIndicator.textContent = '';
  currentChatContext.messages = []; // Reset local message cache

  if (getSocket()?.connected) {
    emitJoinRoom(matchId);
    await fetchAndDisplayChatMessages(matchId);
  } else {
    displayNotification('Socket not connected. Cannot join chat room.', 'danger');
    chatWindow.innerHTML = '<p>Error: Not connected to chat server.</p>';
  }
  chatMessageInput.focus();
}

async function fetchOtherParticipantTMID(matchId) {
  // If otherParticipantTMID wasn't passed (e.g. manual entry), fetch match details
  try {
    const match = await apiRequest(`/matches/${matchId}`);
    const currentUser = getCurrentUser();
    if (match && currentUser) {
      const isOwner = match.itemOwnerDetails?.thingsMatchId === currentUser.TMID;
      const other = isOwner ? match.itemSwiperDetails : match.itemOwnerDetails;
      currentChatContext.otherParticipantName = other?.name || 'Unknown User'; // Update name too
      return other?.thingsMatchId;
    }
  } catch (error) {
    console.error("Could not fetch other participant TMID:", error);
  }
  return 'N/A';
}


async function fetchAndDisplayChatMessages(matchId) {
  if (currentChatContext.isFetchingMessages) return;
  currentChatContext.isFetchingMessages = true;
  chatWindow.innerHTML = '<p>Loading messages...</p>'; // Temp loading state

  try {
    // API: GET /messages/:matchId
    const data = await apiRequest(`/messages/${matchId}`);
    chatWindow.innerHTML = ''; // Clear loading/previous messages
    currentChatContext.messages = data.messages || [];
    currentChatContext.messages.forEach(msg => appendMessageToChat(msg, false)); // false = don't scroll for initial bulk load

    scrollToBottom(chatWindow);
    markVisibleMessagesAsRead(); // Mark initially loaded messages
  } catch (error) {
    chatWindow.innerHTML = '<p>Error fetching messages. Please try again.</p>';
  } finally {
    currentChatContext.isFetchingMessages = false;
  }
}

export function appendMessageToChat(message, doScroll = true) {
  if (!chatWindow || !message || !message.senderId) return; // Basic validation
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const msgDiv = document.createElement('div');
  // Check if senderId is an object (populated) or string
  const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
  const isSentByMe = senderId.toString() === currentUser.TMID;

  msgDiv.className = `message-entry ${isSentByMe ? 'sent' : 'received'}`;
  msgDiv.dataset.messageId = message._id;

  // Determine sender name
  let senderName = 'Unknown';
  if (isSentByMe) {
    senderName = 'You';
  } else if (message.senderDetails && message.senderDetails.name) {
    senderName = message.senderDetails.name;
  } else {
    senderName = currentChatContext.otherParticipantName.split(' ')[0] || 'Them'; // Use context if details missing
  }


  msgDiv.innerHTML = `
        <div class="message-sender">${escapeHTML(senderName)}</div>
        <div class="message-content">${escapeHTML(message.content)}</div>
        <div class="message-timestamp">${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="message-status">Status: ${escapeHTML(message.status)} ${message.isDefaultMsg ? '(Default)' : ''}</div>
    `;
  chatWindow.appendChild(msgDiv);

  if (doScroll) {
    scrollToBottom(chatWindow);
  }

  // Add to local cache if not already there (e.g., for optimistic updates)
  if (!currentChatContext.messages.find(m => m._id === message._id)) {
    currentChatContext.messages.push(message);
  }
}

export function updateMessageStatusInChatUI(updatedMessage) {
  const msgDiv = chatWindow.querySelector(`.message-entry[data-message-id="${updatedMessage._id}"]`);
  if (msgDiv) {
    const statusDiv = msgDiv.querySelector('.message-status');
    if (statusDiv) {
      statusDiv.textContent = `Status: ${escapeHTML(updatedMessage.status)} ${updatedMessage.isDefaultMsg ? '(Default)' : ''}`;
    }
    // Update local cache
    const msgIndex = currentChatContext.messages.findIndex(m => m._id === updatedMessage._id);
    if (msgIndex > -1) {
      currentChatContext.messages[msgIndex].status = updatedMessage.status;
    }
  }
}

async function handleSendMessage() {
  const content = chatMessageInput.value.trim();
  if (!content || !currentChatContext.matchId || !getSocket()?.connected) {
    if (!getSocket()?.connected) displayNotification('Not connected to chat server.', 'danger');
    return;
  }

  // Optimistic UI update (optional, but good for UX)
  // const tempId = `temp_${Date.now()}`;
  // const optimisticMessage = {
  //     _id: tempId,
  //     senderId: getCurrentUser().TMID,
  //     content: content,
  //     createdAt: new Date().toISOString(),
  //     status: 'sending',
  //     isDefaultMsg: false,
  //     matchId: currentChatContext.matchId
  // };
  // appendMessageToChat(optimisticMessage);

  emitSendMessage(currentChatContext.matchId, content);

  chatMessageInput.value = '';
  chatMessageInput.focus();
  clearTypingIndicator(); // Clear own typing indicator
  emitStopTyping(currentChatContext.matchId); // Ensure stop typing is sent
}

function handleTypingInput() {
  if (currentChatContext.matchId && getSocket()?.connected) {
    emitTyping(currentChatContext.matchId);
    debouncedEmitStopTyping();
  }
}

export function setTypingIndicator(isTyping) {
  if (typingIndicator) {
    typingIndicator.textContent = isTyping ? `${escapeHTML(currentChatContext.otherParticipantName.split(' ')[0] || 'Other')} is typing...` : '';
  }
}
export function clearTypingIndicator() {
  if (typingIndicator) typingIndicator.textContent = '';
}


function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

const debouncedMarkRead = debounce(() => {
  if (!getSocket()?.connected || !currentChatContext.matchId || !getCurrentUser()) return;

  const unreadMessages = currentChatContext.messages.filter(msg => {
    const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
    return senderId.toString() !== getCurrentUser().TMID && msg.status !== 'read';
  });

  unreadMessages.forEach(msgToMark => {
    // Check if message element is visible (simple check, can be improved)
    const msgElement = chatWindow.querySelector(`.message-entry[data-message-id="${msgToMark._id}"]`);
    if (msgElement && isElementInViewport(msgElement)) {
      emitMessageRead(msgToMark._id, currentChatContext.matchId);
      // Optimistically update UI, server will confirm via 'messageStatusUpdated'
      // updateMessageStatusInChatUI({ ...msgToMark, status: 'read' });
    }
  });
}, 500); // Debounce to avoid spamming

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}


function markVisibleMessagesAsRead() {
  debouncedMarkRead();
}

export function closeChatInterface() {
  chatInterface.classList.add('hidden');
  chatSelectionArea.classList.remove('hidden');
  currentChatContext.matchId = null;
  currentChatContext.otherParticipantName = null;
  currentChatContext.otherParticipantTMID = null;
  currentChatContext.messages = [];
  chatWindow.innerHTML = '';
  typingIndicator.textContent = '';
  chatMatchIdInput.value = '';
}

export function initializeChat() {
  if (joinChatButton) {
    joinChatButton.addEventListener('click', async () => {
      const matchId = chatMatchIdInput.value.trim();
      if (matchId) {
        // We need other participant's details. Fetch match details to get them.
        try {
          const match = await apiRequest(`/matches/${matchId}`); // GET /matches/:matchId
          const currentUser = getCurrentUser();
          if (match && currentUser) {
            const isOwner = match.itemOwnerDetails?.thingsMatchId === currentUser.TMID;
            const otherParticipant = isOwner ? match.itemSwiperDetails : match.itemOwnerDetails;
            openChatForMatch(matchId, otherParticipant?.name, otherParticipant?.thingsMatchId);
          } else {
            displayNotification('Could not find match details or user not logged in.', 'danger');
          }
        } catch (error) {
          displayNotification(`Error opening chat for match ${matchId}: ${error.message}`, 'danger');
        }
      } else {
        displayNotification('Please enter a Match ID.', 'danger');
      }
    });
  }

  if (sendChatMessageButton) {
    sendChatMessageButton.addEventListener('click', handleSendMessage);
  }
  if (chatMessageInput) {
    chatMessageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
    chatMessageInput.addEventListener('input', handleTypingInput);
  }

  if (chatWindow) {
    // Mark messages as read on scroll (if near bottom) or when new messages arrive and window is focused
    chatWindow.addEventListener('scroll', () => {
      if (chatWindow.scrollHeight - chatWindow.scrollTop <= chatWindow.clientHeight + 100) { // Near bottom
        markVisibleMessagesAsRead();
      }
    });
    // Also consider 'focus' event on window or chat input to trigger read status updates
    window.addEventListener('focus', markVisibleMessagesAsRead);
  }
}
