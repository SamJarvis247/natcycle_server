import { $, $$ } from '../utils.js';
import { apiRequest } from '../apiService.js';
import { displayNotification } from './notifications.js';
import { showModal, closeModal } from './modals.js';
import { DEFAULT_ITEM_IMAGE } from '../config.js';
import { escapeHTML } from '../utils.js';
import { getCurrentUser } from '../auth.js'; // Needed for context in displaying match details

const myItemsContainer = $('myItemsContainer');
const fetchMyItemsButton = $('fetchMyItemsButton');

// Edit Item Modal elements
const editItemModal = $('editItemModal');
const editItemForm = $('editItemForm');
const editItemIdInput = $('editItemId');
const editItemNameInput = $('editItemName');
const editItemDescriptionInput = $('editItemDescription');
const editItemCategoryInput = $('editItemCategory');
const editItemAddressInput = $('editItemAddress');

// Item Matches Modal elements (for the button that opens a modal)
const itemMatchesModal = $('itemMatchesModal');
const modalItemNameForMatchesViewSpan = $('modalItemNameForMatchesView');
const itemMatchesListContainerDiv = $('itemMatchesListContainer');


async function fetchAndRenderDetailedMatchesForItem(itemId, containerElement) {
  if (!containerElement) return;
  containerElement.innerHTML = '<p><small>Loading interactions...</small></p>';
  const currentUser = getCurrentUser(); // For context if needed

  try {
    // API: GET /matches/:itemId/matches
    // This endpoint should return an array of match objects.
    // If it returns { status: 'success', data: matchesArray }, apiRequest handles it.
    const detailedMatches = await apiRequest(`/matches/${itemId}/matches`);
    containerElement.innerHTML = ''; // Clear loading

    if (detailedMatches && Array.isArray(detailedMatches) && detailedMatches.length > 0) {
      const list = document.createElement('ul');
      list.className = 'detailed-item-matches-list'; // For specific styling

      detailedMatches.forEach(match => {
        const listItem = document.createElement('li');
        const isOwner = currentUser && match.itemOwnerDetails?.thingsMatchId === currentUser.TMID;
        const otherParticipant = isOwner ? match.itemSwiperDetails : match.itemOwnerDetails;
        const otherName = otherParticipant?.name || 'Unknown User';

        listItem.innerHTML = `
                    <small>
                        <strong>vs ${escapeHTML(otherName)}</strong> - Status: ${escapeHTML(match.status)}
                        (ID: ${escapeHTML(match._id)})
                    </small>
                `;
        list.appendChild(listItem);
      });
      containerElement.appendChild(list);
    } else {
      containerElement.innerHTML = '<p><small>No detailed interactions found or unable to load.</small></p>';
    }
  } catch (error) {
    console.error(`Error fetching detailed matches for item ${itemId}:`, error);
    containerElement.innerHTML = '<p><small>Error loading interactions.</small></p>';
  }
}

function renderMyItemCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.itemId = item._id;

  const itemImage = (item.itemImages && item.itemImages.length > 0) ? escapeHTML(item.itemImages[0].url) : DEFAULT_ITEM_IMAGE;

  let matchesInfo = 'No active interactions.';
  let hasActiveMatchesIndicator = '';
  let detailedMatchesContainerHTML = '';

  const hasInteractions = item.hasMatches && item.hasMatches.matchId && Array.isArray(item.hasMatches.matchId) && item.hasMatches.matchId.length > 0;

  if (hasInteractions) {
    matchesInfo = `Has ${item.hasMatches.matchId.length} interaction(s).`;
    // Special UI indication for items with matches
    hasActiveMatchesIndicator = '<span class="has-matches-indicator" title="This item has active interactions!">&#128276;</span>'; // Bell icon or similar
    // Placeholder for detailed matches to be loaded
    detailedMatchesContainerHTML = `<div class="detailed-matches-placeholder" id="details-for-${escapeHTML(item._id)}"></div>`;
  }


  card.innerHTML = `
        <img src="${itemImage}" alt="${escapeHTML(item.name)}">
        <h4>${escapeHTML(item.name)} ${hasActiveMatchesIndicator}(ID: ${escapeHTML(item._id)})</h4>
        <p><strong>Status:</strong> ${escapeHTML(item.status)}</p>
        <p><strong>Discovery:</strong> ${escapeHTML(item.discoveryStatus)}</p>
        <p><strong>Interest Count:</strong> ${item.interestCount || 0}</p>
        <p><em>${matchesInfo}</em></p>
        ${detailedMatchesContainerHTML}
        <div class="item-card-actions">
            <button class="edit-item-button secondary" data-item-id="${escapeHTML(item._id)}">Edit</button>
            <button class="delete-item-button danger" data-item-id="${escapeHTML(item._id)}">Delete</button>
            <button class="view-item-matches-button info" data-item-id="${escapeHTML(item._id)}" data-item-name="${escapeHTML(item.name)}">View All Item's Matches (Modal)</button>
            <div class="form-group" style="margin-top:10px; width:100%;">
                <select class="discovery-status-select" data-item-id="${escapeHTML(item._id)}">
                    <option value="visible" ${item.discoveryStatus === 'visible' ? 'selected' : ''}>Visible</option>
                    <option value="hidden_temporarily" ${item.discoveryStatus === 'hidden_temporarily' ? 'selected' : ''}>Hidden Temporarily</option>
                    <option value="faded" ${item.discoveryStatus === 'faded' ? 'selected' : ''}>Faded</option>
                </select>
                <button class="update-discovery-button" data-item-id="${escapeHTML(item._id)}">Update Discovery</button>
            </div>
        </div>
    `;

  // Attach event listeners to buttons within this card
  card.querySelector('.edit-item-button').addEventListener('click', () => populateAndShowEditModal(item));
  card.querySelector('.delete-item-button').addEventListener('click', () => handleDeleteItem(item._id));
  card.querySelector('.update-discovery-button').addEventListener('click', () => {
    const newStatus = card.querySelector('.discovery-status-select').value;
    handleUpdateDiscoveryStatus(item._id, newStatus);
  });
  card.querySelector('.view-item-matches-button').addEventListener('click', () => {
    // This still uses the existing modal functionality
    handleViewItemMatchesModal(item._id, item.name);
  });

  // If the item has interactions, after the card element is created,
  // find the placeholder and trigger the fetch for detailed matches.
  if (hasInteractions) {
    // We need to ensure this runs after the card is in the DOM or the placeholder is part of `card`
    // Since `card` is returned and then appended, we'll call this from `refreshMyItems`
    // Or, we can find it directly on the `card` element before it's appended.
    const placeholder = card.querySelector(`#details-for-${escapeHTML(item._id)}`);
    if (placeholder) {
      fetchAndRenderDetailedMatchesForItem(item._id, placeholder);
    }
  }

  return card;
}

export async function refreshMyItems() {
  if (!myItemsContainer) {
    console.error('[itemsMy.js] myItemsContainer element NOT FOUND in DOM! Cannot display items.');
    return;
  }
  myItemsContainer.innerHTML = '<p>Loading your items...</p>';
  console.log('[itemsMy.js] refreshMyItems called.');

  try {
    const responseFromApiService = await apiRequest('/items/my-items');

    console.log('[itemsMy.js] Full response from apiRequest("/items/my-items") (this is responseFromApiService):', JSON.stringify(responseFromApiService, null, 2));
    // Based on the log, responseFromApiService is: { "items": { "items": [...] } }

    myItemsContainer.innerHTML = ''; // Clear loading message

    // Drill down to the actual array
    const nestedItemsObject = responseFromApiService ? responseFromApiService.items : null;
    const actualArray = nestedItemsObject ? nestedItemsObject.items : null;

    console.log('[itemsMy.js] Final array extracted for iteration (actualArray):', JSON.stringify(actualArray, null, 2));
    console.log('[itemsMy.js] Type of actualArray:', typeof actualArray);
    if (actualArray) {
      console.log('[itemsMy.js] Is actualArray an array?', Array.isArray(actualArray));
      console.log('[itemsMy.js] Length of actualArray:', actualArray.length);
    }

    // Check and iterate over actualArray
    if (actualArray && Array.isArray(actualArray) && actualArray.length > 0) {
      console.log(`[itemsMy.js] Attempting to render ${actualArray.length} items.`);
      actualArray.forEach((item, index) => {
        console.log(`[itemsMy.js] Rendering item ${index + 1}:`, JSON.stringify(item, null, 2));
        const itemCardElement = renderMyItemCard(item);
        if (itemCardElement) {
          myItemsContainer.appendChild(itemCardElement);
          console.log(`[itemsMy.js] Appended card for item ${item._id}`);
        } else {
          console.error('[itemsMy.js] renderMyItemCard returned null or undefined for item:', item);
        }
      });
      displayNotification(`${actualArray.length} of your items loaded.`, 'info');
    } else {
      console.warn('[itemsMy.js] No items to render. actualArray might be null, not an array, or empty. Check structure of response from apiRequest and the extraction logic.');
      myItemsContainer.innerHTML = '<p>You have not listed any items yet. Create one!</p>';
      displayNotification('No items listed by you.', 'info');
    }
  } catch (error) {
    console.error('[itemsMy.js] CRITICAL ERROR in refreshMyItems:', error);
    myItemsContainer.innerHTML = '<p>Error fetching your items. Please try again.</p>';
    displayNotification(`Error loading your items: ${error.message}`, 'danger');
  }
}

function populateAndShowEditModal(item) {
  editItemIdInput.value = item._id;
  editItemNameInput.value = item.name;
  editItemDescriptionInput.value = item.description;
  editItemCategoryInput.value = item.category;
  editItemAddressInput.value = item.location?.address || '';
  showModal('editItemModal');
}

async function handleSaveItemChanges(event) {
  event.preventDefault();
  const itemId = editItemIdInput.value;
  const updatedData = {
    name: editItemNameInput.value.trim(),
    description: editItemDescriptionInput.value.trim(),
    category: editItemCategoryInput.value,
    address: editItemAddressInput.value.trim(),
  };

  if (!updatedData.name || !updatedData.description || !updatedData.address) {
    displayNotification('Name, description, and address cannot be empty.', 'danger');
    return;
  }

  try {
    await apiRequest(`/items/${itemId}`, 'PUT', updatedData);
    displayNotification(`Item ${itemId} updated successfully.`, 'success');
    closeModal('editItemModal');
    refreshMyItems();
  } catch (error) {
    displayNotification(`Failed to update item: ${error.message}`, 'danger');
  }
}

async function handleDeleteItem(itemId) {
  if (confirm(`Are you sure you want to delete item ${itemId}? This action cannot be undone.`)) {
    try {
      await apiRequest(`/items/${itemId}`, 'DELETE');
      displayNotification(`Item ${itemId} deleted successfully.`, 'success');
      refreshMyItems();
    } catch (error) {
      displayNotification(`Failed to delete item: ${error.message}`, 'danger');
    }
  }
}

async function handleUpdateDiscoveryStatus(itemId, newStatus) {
  try {
    await apiRequest(`/items/${itemId}/status`, 'PATCH', { discoveryStatus: newStatus });
    displayNotification(`Item ${itemId} discovery status updated to ${newStatus}.`, 'success');
    refreshMyItems();
  } catch (error) {
    displayNotification(`Failed to update discovery status: ${error.message}`, 'danger');
  }
}

// Renamed to avoid conflict and clarify it's for the MODAL
async function handleViewItemMatchesModal(itemId, itemName) {
  modalItemNameForMatchesViewSpan.textContent = escapeHTML(itemName);
  itemMatchesListContainerDiv.innerHTML = '<p>Loading matches...</p>';
  showModal('itemMatchesModal');

  try {
    const detailedMatches = await apiRequest(`/matches/${itemId}/matches`); // Expects array
    itemMatchesListContainerDiv.innerHTML = '';

    if (detailedMatches && Array.isArray(detailedMatches) && detailedMatches.length > 0) {
      const list = document.createElement('ul');
      list.className = 'simple-list'; // Existing class for modal list
      detailedMatches.forEach(match => {
        const listItem = document.createElement('li');
        const swiperDetails = match.itemSwiperDetails || { name: 'Unknown Swiper', thingsMatchId: 'N/A' };
        // Using itemOwnerDetails and itemSwiperDetails for names
        const ownerName = match.itemOwnerDetails?.name || 'Owner N/A';
        const swiperName = match.itemSwiperDetails?.name || 'Swiper N/A';

        listItem.innerHTML = `
                    <strong>Match ID:</strong> ${escapeHTML(match._id)} <br>
                    Item Owner: ${escapeHTML(ownerName)} <br>
                    Item Swiper: ${escapeHTML(swiperName)} <br>
                    <strong>Status:</strong> ${escapeHTML(match.status)} <br>
                    <small>Created: ${new Date(match.createdAt).toLocaleString()}</small>
                `;
        list.appendChild(listItem);
      });
      itemMatchesListContainerDiv.appendChild(list);
    } else {
      itemMatchesListContainerDiv.innerHTML = '<p>No matches found for this item.</p>';
    }
  } catch (error) {
    itemMatchesListContainerDiv.innerHTML = '<p>Error fetching matches for this item.</p>';
  }
}


export function initializeMyItems() {
  if (fetchMyItemsButton) {
    fetchMyItemsButton.addEventListener('click', refreshMyItems);
  }
  if (editItemForm) {
    editItemForm.addEventListener('submit', handleSaveItemChanges);
  }
}
