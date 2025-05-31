import { $, $$ } from '../utils.js';
import { apiRequest } from '../apiService.js';
import { displayNotification } from './notifications.js';
import { showModal, closeModal } from './modals.js';
import { DEFAULT_ITEM_IMAGE } from '../config.js';
import { refreshMyMatches } from './matchesMy.js';
import { escapeHTML } from '../utils.js';

const swipeItemsContainer = $('swipeItemsContainer');
const fetchSwipeItemsButton = $('fetchSwipeItemsButton');
const swipeLongitudeInput = $('swipeLongitude');
const swipeLatitudeInput = $('swipeLatitude');
const swipeMaxDistanceInput = $('swipeMaxDistance');

// Modal elements for default message
const defaultMessageModal = $('defaultMessageModal');
const modalItemIdForMsgInput = $('modalItemIdForMsg');
const modalItemNameForMsgSpan = $('modalItemNameForMsg');
const defaultMessageContentInput = $('defaultMessageContent');
const sendDefaultMessageButton = $('sendDefaultMessageButton');

let currentSwipeItems = [];
let currentSwipeIndex = 0;

function renderSwipeItemCard(item) {
  if (!swipeItemsContainer) return;
  swipeItemsContainer.innerHTML = ''; // Clear previous, show one at a time

  if (!item) {
    swipeItemsContainer.innerHTML = '<p>No more items to swipe in this batch. Fetch new ones!</p>';
    return;
  }

  const card = document.createElement('div');
  card.className = 'item-card swipe-card-active'; // Add a class for potential animation
  card.dataset.itemId = item._id;

  const itemImage = (item.itemImages && item.itemImages.length > 0) ? escapeHTML(item.itemImages[0].url) : DEFAULT_ITEM_IMAGE;
  const ownerName = item.userDetails ? escapeHTML(item.userDetails.name) : 'N/A';

  card.innerHTML = `
        <img src="${itemImage}" alt="${escapeHTML(item.name)}">
        <h4>${escapeHTML(item.name)} (ID: ${escapeHTML(item._id)})</h4>
        <p><strong>Category:</strong> ${escapeHTML(item.category)}</p>
        <p><strong>Description:</strong> ${escapeHTML(item.description)}</p>
        <p><strong>Owner:</strong> ${ownerName}</p>
        <p><strong>Distance:</strong> ${item.distance ? (item.distance / 1000).toFixed(2) + ' km' : 'N/A'}</p>
        <div class="item-card-actions">
            <button class="like-button success" data-item-id="${escapeHTML(item._id)}" data-item-name="${escapeHTML(item.name)}">Like</button>
            <button class="dislike-button danger" data-item-id="${escapeHTML(item._id)}">Dislike</button>
        </div>
    `;
  swipeItemsContainer.appendChild(card);
}

function showNextSwipeItem() {
  currentSwipeIndex++;
  if (currentSwipeIndex < currentSwipeItems.length) {
    renderSwipeItemCard(currentSwipeItems[currentSwipeIndex]);
  } else {
    renderSwipeItemCard(null); // No more items
    displayNotification('Reached end of current swipe batch. Fetch more if needed.', 'info');
  }
}

export async function fetchSwipeItems() {
  if (!swipeItemsContainer) return;
  swipeItemsContainer.innerHTML = '<p>Loading items...</p>';
  currentSwipeItems = [];
  currentSwipeIndex = 0;

  let queryParams = '';
  const lon = swipeLongitudeInput.value.trim();
  const lat = swipeLatitudeInput.value.trim();
  const dist = swipeMaxDistanceInput.value.trim();
  const params = new URLSearchParams();

  if (lon && lat) {
    params.append('longitude', lon);
    params.append('latitude', lat);
  }
  if (dist) {
    params.append('maxDistance', dist);
  }
  if (params.toString()) {
    queryParams = `?${params.toString()}`;
  }

  try {
    const data = await apiRequest(`/items${queryParams}`); // Endpoint is /items for swiping
    if (data && data.items && data.items.length > 0) {
      currentSwipeItems = data.items;
      renderSwipeItemCard(currentSwipeItems[0]);
      displayNotification(`${data.items.length} items fetched for swiping.`, 'success');
    } else {
      swipeItemsContainer.innerHTML = '<p>No items found matching your criteria.</p>';
      displayNotification('No items found to swipe.', 'info');
    }
  } catch (error) {
    swipeItemsContainer.innerHTML = '<p>Error fetching items. Please try again.</p>';
  }
}

async function handleLike(itemId, itemName) {
  modalItemIdForMsgInput.value = itemId;
  modalItemNameForMsgSpan.textContent = escapeHTML(itemName);
  defaultMessageContentInput.value = `Hi! I'm interested in your "${escapeHTML(itemName)}".`;
  showModal('defaultMessageModal');
}

async function handleDislike(itemId) {
  // In a real app, you might record this to avoid showing the item again.
  // For this test client, we just move to the next.
  displayNotification(`Disliked item ${itemId}. (No API call for dislike in this client)`, 'info');
  showNextSwipeItem();
}

async function handleSendDefaultMessage() {
  const itemId = modalItemIdForMsgInput.value;
  const content = defaultMessageContentInput.value.trim();

  if (!content) {
    displayNotification('Default message cannot be empty.', 'danger');
    return;
  }

  try {
    // API endpoint: POST /matches/:itemId/swipe-interest
    const result = await apiRequest(`/matches/${itemId}/swipe-interest`, 'POST', { defaultMessageContent: content });
    displayNotification(`Interest sent for item ${itemId}! Match ID: ${result.match._id}`, 'success');
    closeModal('defaultMessageModal');
    showNextSwipeItem(); // Move to next item after successful like
    refreshMyMatches(); // Refresh matches list as a new pending match might be created
  } catch (error) {
    // Error already displayed by apiRequest
    displayNotification(`Failed to send interest: ${error.message}`, 'danger');
  }
}

export function initializeSwipeItems() {
  if (fetchSwipeItemsButton) {
    fetchSwipeItemsButton.addEventListener('click', fetchSwipeItems);
  }

  if (swipeItemsContainer) {
    swipeItemsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('like-button')) {
        const itemId = e.target.dataset.itemId;
        const itemName = e.target.dataset.itemName;
        handleLike(itemId, itemName);
      } else if (e.target.classList.contains('dislike-button')) {
        const itemId = e.target.dataset.itemId;
        handleDislike(itemId);
      }
    });
  }

  if (sendDefaultMessageButton) {
    sendDefaultMessageButton.addEventListener('click', handleSendDefaultMessage);
  }
}
