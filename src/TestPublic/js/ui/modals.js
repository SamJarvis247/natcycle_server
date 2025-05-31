import { $, $$ } from '../utils.js';

/**
 * Shows a modal by its ID.
 * @param {string} modalId - The ID of the modal to show.
 */
export function showModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    // Focus on the first focusable element in the modal if any
    const firstFocusable = modal.querySelector('input, textarea, select, button');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  } else {
    console.error(`Modal with ID '${modalId}' not found.`);
  }
}

/**
 * Closes a modal by its ID.
 * @param {string} modalId - The ID of the modal to close.
 */
export function closeModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.add('hidden');
  } else {
    console.error(`Modal with ID '${modalId}' not found.`);
  }
}

export function initializeModals() {
  // Close modal buttons
  $$('.close-modal-button').forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close modal on ESC key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      $$('.modal:not(.hidden)').forEach(modal => closeModal(modal.id));
    }
  });

  // Close modal on backdrop click (optional)
  $$('.modal').forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) { // Clicked on the backdrop itself
        closeModal(modal.id);
      }
    });
  });
}
