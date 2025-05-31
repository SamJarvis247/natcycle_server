import { $ } from './utils.js';
import { handleLogin } from './auth.js';
import { initializeTabs } from './ui/tabs.js';
import { initializeModals } from './ui/modals.js';
import { initializeSwipeItems, fetchSwipeItems } from './ui/itemsSwipe.js';
import { initializeItemCreateForm } from './ui/itemCreate.js';
import { initializeMyItems, refreshMyItems } from './ui/itemsMy.js';
import { initializeMyMatches, refreshMyMatches } from './ui/matchesMy.js';
import { initializeChat } from './ui/chat.js';
import { displayNotification } from './ui/notifications.js';

// This function will be called by auth.js after successful login
export async function loadInitialData() {
  displayNotification('Loading initial user data...', 'info');
  // Fetch data for relevant sections
  // No need to await these if they can load independently and update UI when done
  fetchSwipeItems();
  refreshMyItems();
  refreshMyMatches();
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize core UI components
  initializeTabs();
  initializeModals();

  // Initialize authentication
  const loginButton = $('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
  } else {
    console.error('Login button not found.');
  }

  // Initialize feature modules
  initializeSwipeItems();
  initializeItemCreateForm();
  initializeMyItems();
  initializeMyMatches();
  initializeChat();

  // Check if a token is already in local storage (if you implement persistence)
  // For this example, we require manual token input each time.
  // If you had token persistence:
  // const storedToken = localStorage.getItem('jwtToken');
  // if (storedToken) {
  //     $('jwtToken').value = storedToken;
  //     handleLogin(); // Attempt auto-login
  // }

  displayNotification('Test client initialized. Please enter JWT to login.', 'info');
});
