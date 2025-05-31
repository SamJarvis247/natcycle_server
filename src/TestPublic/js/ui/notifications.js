import { $ } from '../utils.js';

const notificationsArea = $('notificationsArea');
const NOTIFICATION_TIMEOUT = 7000; // 7 seconds

/**
 * Displays a notification message.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'danger' | 'warning'} [type='info'] - The type of notification.
 */
export function displayNotification(message, type = 'info') {
  if (!notificationsArea) {
    console.warn('Notifications area not found in DOM.');
    alert(`${type.toUpperCase()}: ${message}`); // Fallback to alert
    return;
  }

  const item = document.createElement('div');
  item.className = `notification-item ${type}`;
  item.innerHTML = `<strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}`; // Basic formatting

  notificationsArea.appendChild(item);
  notificationsArea.scrollTop = notificationsArea.scrollHeight; // Scroll to bottom

  // Auto-remove notification after some time
  setTimeout(() => {
    item.style.opacity = '0';
    setTimeout(() => item.remove(), 500); // Allow fade out
  }, NOTIFICATION_TIMEOUT);
}
