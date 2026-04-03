function injectUI() {
  // Only inject once
  if (document.getElementById('ai-profiler-root')) return;

  const root = document.createElement('div');
  root.id = 'ai-profiler-root';

  const btn = document.createElement('button');
  btn.className = 'ai-profiler-btn';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
      <path d="M12 12 2.1 12"></path>
      <path d="m12 12 7.1-7.1"></path>
    </svg>
    AI Profile Review
  `;
  
  const panel = document.createElement('div');
  panel.className = 'ai-profiler-panel';
  panel.innerHTML = `
    <div class="ai-profiler-header">
      <h2>AI Profiler Insights</h2>
      <button class="ai-profiler-close">&times;</button>
    </div>
    <div class="ai-profiler-content" id="ai-profiler-content">
      <p>Click "AI Profile Review" to get started.</p>
    </div>
  `;

  root.appendChild(btn);
  root.appendChild(panel);
  document.body.appendChild(root);

  let isOpen = false;

  btn.addEventListener('click', () => {
    isOpen = true;
    panel.classList.add('open');
    startAnalysis();
  });

  const closeBtn = panel.querySelector('.ai-profiler-close');
  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('open');
  });
}

function extractProfileData() {
  // Extract heading text
  const headlineEl = document.querySelector('h1.text-heading-xlarge');
  const headlineTxt = headlineEl ? headlineEl.innerText : '';
  
  const taglineEl = document.querySelector('.text-body-medium');
  const taglineTxt = taglineEl ? taglineEl.innerText : '';

  // Extract text from sections to find About and Experience
  const sections = Array.from(document.querySelectorAll('section'));
  
  let aboutTxt = '';
  const aboutSection = sections.find(s => {
    const title = s.querySelector('h2');
    return title && title.innerText.match(/About|Обо мне/i);
  });
  if (aboutSection) aboutTxt = aboutSection.innerText;
  
  let expTxt = '';
  const expSection = sections.find(s => {
    const title = s.querySelector('h2');
    return title && title.innerText.match(/Experience|Опыт работы/i);
  });
  if (expSection) expTxt = expSection.innerText;

  return {
    headline: `${headlineTxt} - ${taglineTxt}`,
    about: aboutTxt,
    experience: expTxt
  };
}

function startAnalysis() {
  const contentDiv = document.getElementById('ai-profiler-content');
  contentDiv.innerHTML = `
    <div class="ai-profiler-loading">
      <div class="ai-spinner"></div>
      <p>Analyzing profile and matching career paths...</p>
    </div>
  `;

  const profileData = extractProfileData();

  chrome.runtime.sendMessage({ action: 'analyzeProfile', profileData }, (response) => {
    if (chrome.runtime.lastError) {
      contentDiv.innerHTML = `<p style="color: red;">Extension Error: ${chrome.runtime.lastError.message}. Make sure to reload the extension.</p>`;
      return;
    }

    if (response && response.success) {
      contentDiv.innerHTML = response.data;
    } else {
      contentDiv.innerHTML = `<p style="color: red;">Error: ${response ? response.error : 'Unknown error'}</p>`;
    }
  });
}

// Initial injection
setTimeout(injectUI, 1000);

// Periodically check because LinkedIn is an SPA and might blow away our UI
// or we might navigate between /in/ and feed.
setInterval(() => {
  if (window.location.href.includes('/in/')) {
    injectUI();
  } else {
    // Remove if we navigate away from a profile
    const root = document.getElementById('ai-profiler-root');
    if (root) root.remove();
  }
}, 2000);
