import { $, $$ } from '../utils.js';
import { apiRequest } from '../apiService.js';
import { displayNotification } from './notifications.js';
import { showModal, closeModal } from './modals.js';
import { getCurrentUser } from '../auth.js';
import { openChatForMatch } from './chat.js'; // To open chat from match card
import { switchToTab } from './tabs.js';
import { escapeHTML } from '../utils.js';

const myMatchesContainer = $('myMatchesContainer');
const fetchMyMatchesButton = $('fetchMyMatchesButton');

// Update Match Status Modal elements
const updateMatchStatusModal = $('updateMatchStatusModal');
const updateStatusMatchIdInput = $('updateStatusMatchId');
const newMatchStatusSelect = $('newMatchStatus');
const submitUpdateMatchStatusButton = $('submitUpdateMatchStatusButton');

function renderMyMatchCard(match) {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const card = document.createElement('div');
  card.className = 'match-card';
  card.dataset.matchId = match._id;

  const itemDetails = match.itemDetails || { name: 'N/A (Item Deleted?)', _id: match.itemId };
  const isOwner = match.itemOwnerDetails?.thingsMatchId === currentUser.TMID;
  const otherParticipant = isOwner ? match.itemSwiperDetails : match.itemOwnerDetails;
  const otherParticipantName = otherParticipant?.name || 'Unknown User';
  const otherParticipantTMID = otherParticipant?.thingsMatchId || 'N/A';

  let lastMessageSnippet = '';
  if (match.lastMessage) {
    const sender = match.lastMessage.senderId === currentUser.TMID ? 'You' : (otherParticipantName.split(' ')[0] || 'Them');
    lastMessageSnippet = `<p class="last-message"><em>${sender}: ${escapeHTML(match.lastMessage.content.substring(0, 30))}${match.lastMessage.content.length > 30 ? '...' : ''}</em></p>`;
  }


  card.innerHTML = `
        <h4>Match with ${escapeHTML(otherParticipantName)}</h4>
        <p><strong>Item:</strong> ${escapeHTML(itemDetails.name)} (ID: ${escapeHTML(itemDetails._id)})</p>
        <p><strong>Status:</strong> <strong class="match-status-${match.status.toLowerCase()}">${escapeHTML(match.status)}</strong></p>
        <p><strong>Your Role:</strong> ${isOwner ? 'Item Owner' : 'Item Swiper'}</p>
        ${lastMessageSnippet}
        <div class="match-card-actions">
            ${isOwner && match.status === 'pendingInterest' ? `<button class="confirm-match-button success" data-match-id="${escapeHTML(match._id)}">Confirm Match</button>` : ''}
            ${match.status === 'active' ? `<button class="view-chat-button" data-match-id="${escapeHTML(match._id)}" data-other-name="${escapeHTML(otherParticipantName)}" data-other-tmid="${escapeHTML(otherParticipantTMID)}">View Chat</button>` : ''}
            <button class="update-match-status-button secondary" data-match-id="${escapeHTML(match._id)}">Update Status</button>
            <button class="view-match-details-button info" data-match-id="${escapeHTML(match._id)}">Details</button>
        </div>
    `;

  // Add event listeners
  const confirmBtn = card.querySelector('.confirm-match-button');
  if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirmMatch(match._id));

  const chatBtn = card.querySelector('.view-chat-button');
  if (chatBtn) chatBtn.addEventListener('click', () => {
    openChatForMatch(match._id, otherParticipantName, otherParticipantTMID);
    switchToTab('chatTab');
  });

  card.querySelector('.update-match-status-button').addEventListener('click', () => populateAndShowUpdateStatusModal(match._id, match.status));
  card.querySelector('.view-match-details-button').addEventListener('click', () => handleViewMatchDetails(match._id));

  return card;
}

export async function refreshMyMatches() {
  if (!myMatchesContainer) return;
  myMatchesContainer.innerHTML = '<p>Loading your matches...</p>';
  try {
    // API: GET /matches/my-matches
    const data = await apiRequest('/matches/my-matches');
    myMatchesContainer.innerHTML = ''; // Clear loading

    if (data && data.matches && data.matches.length > 0) {
      data.matches.forEach(match => {
        const card = renderMyMatchCard(match);
        if (card) myMatchesContainer.appendChild(card);
      });
      displayNotification(`${data.matches.length} matches loaded.`, 'info');
    } else {
      myMatchesContainer.innerHTML = '<p>You have no active matches yet.</p>';
      displayNotification('No matches found.', 'info');
    }
  } catch (error) {
    myMatchesContainer.innerHTML = '<p>Error fetching your matches. Please try again.</p>';
  }
}

async function handleConfirmMatch(matchId) {
  try {
    // API: PATCH /matches/:matchId/confirm
    await apiRequest(`/matches/${matchId}/confirm`, 'PATCH');
    displayNotification(`Match ${matchId} confirmed successfully!`, 'success');
    refreshMyMatches(); // Refresh list to show updated status and chat button
  } catch (error) {
    displayNotification(`Failed to confirm match ${matchId}: ${error.message}`, 'danger');
  }
}

function populateAndShowUpdateStatusModal(matchId, currentStatus) {
  updateStatusMatchIdInput.value = matchId;
  // Pre-select current status if it's a valid option, or default
  const existingOption = Array.from(newMatchStatusSelect.options).find(opt => opt.value === currentStatus);
  if (existingOption) {
    newMatchStatusSelect.value = currentStatus;
  } else {
    newMatchStatusSelect.selectedIndex = 0; // Default to first option
  }
  showModal('updateMatchStatusModal');
}

async function handleUpdateMatchStatus() {
  const matchId = updateStatusMatchIdInput.value;
  const newStatus = newMatchStatusSelect.value;

  if (!newStatus) {
    displayNotification('Please select a new status.', 'danger');
    return;
  }

  try {
    // API: PATCH /matches/:matchId/status
    await apiRequest(`/matches/${matchId}/status`, 'PATCH', { status: newStatus });
    displayNotification(`Match ${matchId} status updated to ${newStatus}.`, 'success');
    closeModal('updateMatchStatusModal');
    refreshMyMatches(); // Refresh list
  } catch (error) {
    displayNotification(`Failed to update match status: ${error.message}`, 'danger');
  }
}

async function handleViewMatchDetails(matchId) {
  try {
    // API: GET /matches/:matchId
    const matchDetails = await apiRequest(`/matches/${matchId}`);
    // For simplicity, using alert. A dedicated modal would be better for complex data.
    alert(`Match Details for ${matchId}:\n\n${JSON.stringify(matchDetails, null, 2)}`);
  } catch (error) {
    displayNotification(`Failed to fetch details for match ${matchId}: ${error.message}`, 'danger');
  }
}

export function initializeMyMatches() {
  if (fetchMyMatchesButton) {
    fetchMyMatchesButton.addEventListener('click', refreshMyMatches);
  }
  if (submitUpdateMatchStatusButton) {
    submitUpdateMatchStatusButton.addEventListener('click', handleUpdateMatchStatus);
  }
  // Initial load by app.js
}
