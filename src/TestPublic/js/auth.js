import { $, $$ } from './utils.js';
import { setAuthToken, apiRequest } from './apiService.js';
import { initializeSocket, disconnectSocket } from './socketService.js';
import { displayNotification } from './ui/notifications.js';
import { loadInitialData } from './app.js'; // Assuming app.js will export this

let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function handleLogin() {
  const tokenInput = $('jwtToken');
  const token = tokenInput.value.trim();

  if (!token) {
    displayNotification('Please enter a JWT token.', 'danger');
    return;
  }

  setAuthToken(token);

  try {
    // Fetch user profile to verify token and get user details
    console.log("🚀 ~ handleLogin ~ token:", token);
    const profileData = await apiRequest('/auth/profile');
    console.log("🚀 ~ handleLogin ~ profileData:", profileData)

    if (!profileData || !profileData.user) {
      throw new Error("User profile data not found in response.");
    }

    currentUser = profileData.user; // This is the ThingsMatchUser object

    // Ensure TMID is set, it's the _id of the ThingsMatchUser
    if (!currentUser._id) {
      throw new Error("TMID (ThingsMatchUser _id) not found in profile.");
    }
    currentUser.TMID = currentUser._id.toString();


    // Display user info
    const userInfoDiv = $('userInfo');
    const userTMIDSpan = $('userTMID');
    const userNameSpan = $('userName');
    const userEmailSpan = $('userEmail');

    userTMIDSpan.textContent = currentUser.TMID;
    // Access populated natcycleId details
    userNameSpan.textContent = `${currentUser.natcycleId?.firstName || 'N/A'} ${currentUser.natcycleId?.lastName || ''}`.trim();
    userEmailSpan.textContent = currentUser.natcycleId?.email || 'N/A';
    userInfoDiv.classList.remove('hidden');

    $('mainAppSection').classList.remove('hidden');
    $('authSection').classList.add('hidden'); // Hide auth section after login

    displayNotification('Logged in successfully!', 'success');
    initializeSocket();
    loadInitialData(); // Fetch initial data for the app sections

  } catch (error) {
    console.error('Login failed:', error);
    setAuthToken(null); // Clear token on failure
    currentUser = null;
    $('userInfo').classList.add('hidden');
    $('mainAppSection').classList.add('hidden');
    $('authSection').classList.remove('hidden'); // Ensure auth section is visible on failure
    // Notification is already displayed by apiRequest or here
    if (!error.message.startsWith('API Error:')) {
      displayNotification(`Login failed: ${error.message}`, 'danger');
    }
    disconnectSocket();
  }
}

export function handleLogout() {
  setAuthToken(null);
  currentUser = null;
  disconnectSocket();

  $('jwtToken').value = '';
  $('userInfo').classList.add('hidden');
  $('mainAppSection').classList.add('hidden');
  $('authSection').classList.remove('hidden');

  // Clear dynamic content areas
  $('swipeItemsContainer').innerHTML = '';
  $('myItemsContainer').innerHTML = '';
  $('myMatchesContainer').innerHTML = '';
  $('chatWindow').innerHTML = '';
  $('chatInterface').classList.add('hidden');
  $('chatSelectionArea').classList.remove('hidden');
  $('notificationsArea').innerHTML = '';


  displayNotification('Logged out.', 'info');
}
