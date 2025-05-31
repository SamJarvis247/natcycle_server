import { $ } from '../utils.js';
import { apiRequest } from '../apiService.js';
import { displayNotification } from './notifications.js';
import { refreshMyItems } from './itemsMy.js'; // To refresh list after creation
import { switchToTab } from './tabs.js';

const createItemForm = $('createItemForm');
const itemNameInput = $('itemName');
const itemDescriptionInput = $('itemDescription');
const itemCategoryInput = $('itemCategory');
const itemAddressInput = $('itemAddress');
const itemImagesInput = $('itemImages');

async function handleCreateItem(event) {
  event.preventDefault();
  if (!createItemForm.checkValidity()) {
    displayNotification('Please fill all required fields correctly.', 'danger');
    createItemForm.reportValidity(); // Show native browser validation messages
    return;
  }

  const formData = new FormData();
  formData.append('name', itemNameInput.value.trim());
  formData.append('description', itemDescriptionInput.value.trim());
  formData.append('category', itemCategoryInput.value);
  formData.append('address', itemAddressInput.value.trim()); // Backend should geocode this

  const files = itemImagesInput.files;
  if (files.length > 5) {
    displayNotification('You can upload a maximum of 5 images.', 'danger');
    return;
  }
  for (let i = 0; i < files.length; i++) {
    formData.append('itemImages', files[i]);
  }

  try {
    const result = await apiRequest('/items', 'POST', formData, true); // true for FormData
    displayNotification(`Item "${result.item.name}" created successfully! ID: ${result.item._id}`, 'success');
    createItemForm.reset();
    itemImagesInput.value = ''; // Clear file input specifically
    refreshMyItems(); // Refresh the "My Listed Items" tab
    switchToTab('myItemsTab'); // Switch to "My Items" tab to see the new item
  } catch (error) {
    // Notification already handled by apiRequest or specific checks
    console.error('Item creation failed:', error);
  }
}

export function initializeItemCreateForm() {
  if (createItemForm) {
    createItemForm.addEventListener('submit', handleCreateItem);
  } else {
    console.warn('Create item form not found.');
  }
}
