import { $, $$ } from '../utils.js';

export function initializeTabs() {
  const tabButtons = $$('.tab-button');
  const tabContents = $$('.tab-content');

  if (!tabButtons.length || !tabContents.length) {
    console.warn('Tab buttons or contents not found.');
    return;
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all buttons and hide all content
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.add('hidden'));

      // Activate clicked button and show corresponding content
      button.classList.add('active');
      const tabId = button.dataset.tab;
      const activeTabContent = $(tabId);
      if (activeTabContent) {
        activeTabContent.classList.remove('hidden');
      } else {
        console.error(`Tab content with ID '${tabId}' not found.`);
      }
    });
  });
}

export function switchToTab(tabId) {
  const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (tabButton) {
    tabButton.click();
  } else {
    console.error(`Tab button for tab ID '${tabId}' not found.`);
  }
}
