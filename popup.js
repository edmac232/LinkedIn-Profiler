document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Load existing key
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      chrome.storage.local.set({ geminiApiKey: key }, () => {
        statusEl.textContent = 'API Key saved successfully!';
        statusEl.style.color = '#057642'; // LinkedIn green
        setTimeout(() => { statusEl.textContent = ''; }, 3000);
      });
    } else {
      statusEl.textContent = 'Please enter a valid key.';
      statusEl.style.color = '#cc1016'; // LinkedIn error red
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  });
});
