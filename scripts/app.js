/**
 * Bible PWA - Main Application Script
 *
 * Core functionality for the Bible Progressive Web App including:
 * - Theme management (dark/light mode)
 * - Reading state persistence
 * - Book and chapter navigation
 * - Bookmark system
 * - Full-text search within chapters
 * - Service Worker registration
 */

// ========================================
// Theme Management
// ========================================
const THEME_STORAGE_KEY = 'bibleReaderTheme';
const THEME_DARK = 'theme-dark';
const THEME_LIGHT = 'theme-light';

/**
 * Get saved theme from localStorage
 * @returns {string} Theme name or null if not saved
 */
function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY);
}

/**
 * Save theme preference to localStorage
 * @param {string} theme - Theme name to save
 */
function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Apply theme to the document
 * @param {string} theme - Theme name (theme-dark or theme-light)
 */
function applyTheme(theme) {
  // Remove both theme classes first
  document.body.classList.remove(THEME_DARK, THEME_LIGHT);
  // Add the selected theme
  document.body.classList.add(theme);

  // Update header toggle button text and aria-label
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    if (theme === THEME_DARK) {
      toggleBtn.textContent = '☀ Light';
      toggleBtn.setAttribute('aria-label', 'Switch to light theme');
    } else {
      toggleBtn.textContent = '🌙 Dark';
      toggleBtn.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  // Update settings modal theme button if it exists
  const settingsBtn = document.getElementById('settingsThemeToggle');
  if (settingsBtn) {
    const icon = settingsBtn.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === THEME_DARK ? '🌙' : '☀️';
    }
  }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.body.classList.contains(THEME_LIGHT) ? THEME_LIGHT : THEME_DARK;
  const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  applyTheme(newTheme);
  saveTheme(newTheme);
}

/**
 * Initialize theme on page load
 */
function initTheme() {
  const savedTheme = getSavedTheme();
  const theme = savedTheme || THEME_DARK; // Default to dark theme
  applyTheme(theme);
}

// ========================================
// Splash Screen Management
// ========================================

/**
 * Hide the splash screen with fade-out animation
 */
function hideSplash() {
  const splashScreen = document.getElementById('splashScreen');
  const splashVideo = document.getElementById('splashVideo');

  if (!splashScreen) return;

  // Add hidden class to trigger CSS fade-out
  splashScreen.classList.add('hidden');

  // Remove from DOM after animation completes
  setTimeout(() => {
    if (splashVideo) {
      splashVideo.pause();
      splashVideo.src = ''; // Release video resource
    }
    splashScreen.remove();
  }, 1000);
}

/**
 * Initialize splash screen - hides after 8s AND DOM ready
 */
function initSplash() {
  const splashScreen = document.getElementById('splashScreen');

  if (!splashScreen) return;

  let domReady = false;
  let timeElapsed = false;

  function checkHideSplash() {
    if (domReady && timeElapsed) {
      hideSplash();
    }
  }

  // Wait 8 seconds for verse read time
  setTimeout(() => {
    timeElapsed = true;
    checkHideSplash();
  }, 8000);

  // Track DOM ready state
  if (document.readyState === 'complete') {
    domReady = true;
    checkHideSplash();
  } else {
    window.addEventListener('load', () => {
      domReady = true;
      checkHideSplash();
    });
  }
}

// Initialize splash screen immediately
initSplash();

// ========================================
// Font Size Management
// ========================================
const FONT_SIZE_STORAGE_KEY = 'bibleReader.fontSize';
const FONT_SIZE_SMALL = 'small';
const FONT_SIZE_MEDIUM = 'medium';
const FONT_SIZE_LARGE = 'large';

// ========================================
// App Version & Feature Keys (must be at top for init order)
// ========================================
const APP_VERSION = '0.9.0-dev5';
const WELCOME_SEEN_KEY = 'bibleReader.hasSeenWelcome';
const LAST_SEEN_VERSION_KEY = 'bibleReader.lastSeenVersion';
const LINE_HEIGHT_KEY = 'bibleReader.lineHeight';
const LINE_HEIGHT_DEFAULT = '1.6';

// Parallel View Keys
const PARALLEL_ENABLED_KEY = 'bibleReader.parallelEnabled';
const PARALLEL_VERSION_KEY = 'bibleReader.parallelVersionId';
const PARALLEL_DEFAULT_VERSION = 'en-kjv';

// ========================================
// Search State (must be at top for init order)
// ========================================
let searchMatches = [];
let currentMatchIndex = 0;
let lastSearchTerm = '';
let searchActive = false;

/**
 * Get saved font size from localStorage
 * @returns {string} Font size or FONT_SIZE_MEDIUM if not saved
 */
function getSavedFontSize() {
  return localStorage.getItem(FONT_SIZE_STORAGE_KEY) || FONT_SIZE_MEDIUM;
}

/**
 * Save font size preference to localStorage
 * @param {string} size - Font size to save (small, medium, or large)
 */
function saveFontSize(size) {
  localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
}

/**
 * Apply font size to the document
 * @param {string} size - Font size to apply
 */
function applyFontSize(size) {
  document.body.setAttribute('data-font-size', size);

  // Update dropdown display "A" to match chosen size
  const display = document.getElementById('fontSizeDisplay');
  if (display) {
    display.className = 'font-size-display font-size-display-' + size;
  }

  // Update active state and aria-selected on menu options
  const menu = document.getElementById('fontSizeMenu');
  if (menu) {
    const options = menu.querySelectorAll('li[role="option"]');
    options.forEach(opt => {
      if (opt.getAttribute('data-size') === size) {
        opt.classList.add('active');
        opt.setAttribute('aria-selected', 'true');
      } else {
        opt.classList.remove('active');
        opt.setAttribute('aria-selected', 'false');
      }
    });
  }
}

/**
 * Change font size and persist preference
 * @param {string} size - Font size to apply
 */
function changeFontSize(size) {
  applyFontSize(size);
  saveFontSize(size);
}

// ========================================
// Line Height Preference
// ========================================

// Debounce timer for line height slider (mobile touch fires many events)
let lineHeightDebounceTimer = null;

/**
 * Get saved line height from localStorage
 * @returns {string} Line height value or default
 */
function getSavedLineHeight() {
  return localStorage.getItem(LINE_HEIGHT_KEY) || LINE_HEIGHT_DEFAULT;
}

/**
 * Save line height preference to localStorage
 * @param {string} value - Line height value to save
 */
function saveLineHeight(value) {
  localStorage.setItem(LINE_HEIGHT_KEY, value);
}

/**
 * Apply line height to the document via CSS custom property
 * Forces repaint on mobile by toggling a class
 * @param {string} value - Line height value to apply
 */
function applyLineHeight(value) {
  console.log('[LineHeight] applyLineHeight called with:', value);
  document.documentElement.style.setProperty('--line-height', value);

  // Force repaint on mobile by toggling reflow-trigger class
  const preview = document.getElementById('lineHeightPreview');
  if (preview) {
    preview.classList.add('reflow-trigger');
    // Force synchronous reflow
    void preview.offsetHeight;
    preview.classList.remove('reflow-trigger');
  }

  // Also force reflow on verses container if visible
  const versesContainer = document.getElementById('versesContainer');
  if (versesContainer) {
    versesContainer.classList.add('reflow-trigger');
    void versesContainer.offsetHeight;
    versesContainer.classList.remove('reflow-trigger');
  }
}

/**
 * Update the preview pane to show current line height
 * @param {string} value - Line height value to display
 */
function updateLineHeightPreview(value) {
  const preview = document.getElementById('lineHeightPreview');
  if (preview) {
    preview.style.lineHeight = value;
    console.log('[LineHeight] Preview updated to:', value);
  }
}

/**
 * Initialize line height slider in Settings modal
 * Called when Settings modal opens
 */
function initLineHeightSlider() {
  const slider = document.getElementById('lineHeightSlider');
  const valueSpan = document.getElementById('lineHeightValue');
  if (!slider || !valueSpan) {
    console.log('[LineHeight] Slider or value span not found');
    return;
  }

  const currentValue = getSavedLineHeight();
  console.log('[LineHeight] Initializing slider with value:', currentValue);

  slider.value = currentValue;
  valueSpan.textContent = currentValue;

  // Update preview pane with current value
  updateLineHeightPreview(currentValue);

  // Remove old listeners (prevents duplicates on re-open)
  slider.removeEventListener('input', handleLineHeightInput);
  slider.removeEventListener('change', handleLineHeightChange);
  slider.removeEventListener('touchmove', handleLineHeightTouch);

  // Add both input and change listeners (mobile needs both)
  slider.addEventListener('input', handleLineHeightInput);
  slider.addEventListener('change', handleLineHeightChange);
  // Extra touchmove listener for stubborn mobile browsers
  slider.addEventListener('touchmove', handleLineHeightTouch, { passive: true });

  console.log('[LineHeight] Slider initialized with listeners');
}

/**
 * Handle line height slider input (fires during drag)
 * Updates display immediately, debounces save
 * @param {Event} e - Input event
 */
function handleLineHeightInput(e) {
  const value = e.target.value;
  console.log('[LineHeight] input event, value:', value);

  // Update display immediately
  const valueSpan = document.getElementById('lineHeightValue');
  if (valueSpan) valueSpan.textContent = value;

  // Update preview immediately
  updateLineHeightPreview(value);

  // Debounce the CSS property update and save
  clearTimeout(lineHeightDebounceTimer);
  lineHeightDebounceTimer = setTimeout(() => {
    applyLineHeight(value);
    saveLineHeight(value);
  }, 50);
}

/**
 * Handle line height slider change (fires on release)
 * Ensures final value is applied and saved
 * @param {Event} e - Change event
 */
function handleLineHeightChange(e) {
  const value = e.target.value;
  console.log('[LineHeight] change event, value:', value);

  // Clear any pending debounce
  clearTimeout(lineHeightDebounceTimer);

  // Update display
  const valueSpan = document.getElementById('lineHeightValue');
  if (valueSpan) valueSpan.textContent = value;

  // Apply and save immediately on release
  updateLineHeightPreview(value);
  applyLineHeight(value);
  saveLineHeight(value);
}

/**
 * Handle touchmove on slider for stubborn mobile browsers
 * @param {TouchEvent} e - Touch event
 */
function handleLineHeightTouch(e) {
  const slider = e.target;
  if (!slider || slider.id !== 'lineHeightSlider') return;

  const value = slider.value;
  console.log('[LineHeight] touchmove, value:', value);

  const valueSpan = document.getElementById('lineHeightValue');
  if (valueSpan) valueSpan.textContent = value;
  updateLineHeightPreview(value);
}

// ========================================
// Parallel View
// ========================================

// Sync flag to prevent infinite scroll loops
let isParallelSyncing = false;

/**
 * Check if parallel view is enabled
 * @returns {boolean}
 */
function isParallelEnabled() {
  return localStorage.getItem(PARALLEL_ENABLED_KEY) === 'true';
}

/**
 * Get saved secondary version ID
 * @returns {string}
 */
function getSecondaryVersionId() {
  return localStorage.getItem(PARALLEL_VERSION_KEY) || PARALLEL_DEFAULT_VERSION;
}

/**
 * Save parallel enabled state
 * @param {boolean} enabled
 */
function setParallelEnabled(enabled) {
  localStorage.setItem(PARALLEL_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Save secondary version ID
 * @param {string} versionId
 */
function setSecondaryVersionId(versionId) {
  localStorage.setItem(PARALLEL_VERSION_KEY, versionId);
}

/**
 * Get version display name from versions config
 * @param {string} versionId
 * @returns {string}
 */
function getVersionDisplayName(versionId) {
  if (typeof BIBLE_VERSIONS !== 'undefined' && BIBLE_VERSIONS[versionId]) {
    return BIBLE_VERSIONS[versionId].name || versionId.toUpperCase();
  }
  return versionId.toUpperCase();
}

/**
 * Initialize parallel view state on page load
 */
function initParallelView() {
  const toggle = document.getElementById('parallelToggle');
  const picker = document.getElementById('parallelVersionPicker');
  const secondaryNameSpan = document.getElementById('currentSecondaryName');

  if (!toggle) return;

  const enabled = isParallelEnabled();
  const secondaryId = getSecondaryVersionId();

  toggle.checked = enabled;

  if (picker) {
    picker.style.display = enabled ? 'block' : 'none';
  }

  if (secondaryNameSpan) {
    secondaryNameSpan.textContent = getVersionDisplayName(secondaryId);
  }

  // Remove old listener to prevent duplicates, then add new one
  toggle.removeEventListener('change', handleParallelToggleEvent);
  toggle.addEventListener('change', handleParallelToggleEvent);

  // Apply parallel view state
  if (enabled) {
    showParallelView();
  } else {
    hideParallelView();
  }
}

/**
 * Event handler for parallel toggle change
 * @param {Event} e - Change event
 */
function handleParallelToggleEvent(e) {
  const enabled = e.target.checked;
  console.log('[Parallel] Toggle changed:', enabled);
  handleParallelToggle(enabled);
}

/**
 * Handle parallel toggle change
 * @param {boolean} enabled
 */
function handleParallelToggle(enabled) {
  console.log('[Parallel] Toggle:', enabled);
  setParallelEnabled(enabled);

  const picker = document.getElementById('parallelVersionPicker');
  if (picker) {
    picker.style.display = enabled ? 'block' : 'none';
  }

  if (enabled) {
    showParallelView();
    // Reload current chapter in parallel mode
    displayChapter(currentChapter);
  } else {
    hideParallelView();
    // Reload current chapter in single mode
    displayChapter(currentChapter);
  }

  showToast(enabled ? 'Parallel view enabled' : 'Parallel view disabled');
}

/**
 * Show parallel view container, hide single view
 */
function showParallelView() {
  const singleView = document.getElementById('versesContainer');
  const parallelView = document.getElementById('parallelContainer');

  if (singleView) singleView.style.display = 'none';
  if (parallelView) parallelView.style.display = 'flex';

  // Update headers
  updateParallelHeaders();

  // Initialize scroll sync
  initParallelScrollSync();

  // Initialize back-to-top button for parallel view
  initParallelBackToTop();
}

/**
 * Hide parallel view container, show single view
 */
function hideParallelView() {
  const singleView = document.getElementById('versesContainer');
  const parallelView = document.getElementById('parallelContainer');

  if (singleView) singleView.style.display = 'block';
  if (parallelView) parallelView.style.display = 'none';

  // Hide back-to-top button for parallel view
  hideParallelBackToTop();
}

/**
 * Update parallel view headers with version names
 */
function updateParallelHeaders() {
  const primaryName = document.getElementById('primaryVersionName');
  const secondaryName = document.getElementById('secondaryVersionName');

  const primaryId = getCurrentVersionId();
  const secondaryId = getSecondaryVersionId();

  if (primaryName) {
    primaryName.textContent = getVersionDisplayName(primaryId);
  }
  if (secondaryName) {
    secondaryName.textContent = getVersionDisplayName(secondaryId);
  }
}

/**
 * Initialize bidirectional scroll sync between panes
 */
function initParallelScrollSync() {
  const leftPane = document.querySelector('.parallel-pane.left-pane');
  const rightPane = document.querySelector('.parallel-pane.right-pane');

  if (!leftPane || !rightPane) return;

  // Remove existing listeners to prevent duplicates
  leftPane.removeEventListener('scroll', handleLeftPaneScroll);
  rightPane.removeEventListener('scroll', handleRightPaneScroll);

  // Add scroll listeners
  leftPane.addEventListener('scroll', handleLeftPaneScroll, { passive: true });
  rightPane.addEventListener('scroll', handleRightPaneScroll, { passive: true });
}

/**
 * Handle left pane scroll - sync to right
 */
function handleLeftPaneScroll() {
  if (isParallelSyncing) return;
  isParallelSyncing = true;

  const leftPane = document.querySelector('.parallel-pane.left-pane');
  const rightPane = document.querySelector('.parallel-pane.right-pane');

  if (leftPane && rightPane) {
    const scrollRatio = leftPane.scrollTop / (leftPane.scrollHeight - leftPane.clientHeight);
    rightPane.scrollTop = scrollRatio * (rightPane.scrollHeight - rightPane.clientHeight);
  }

  requestAnimationFrame(() => { isParallelSyncing = false; });
}

/**
 * Handle right pane scroll - sync to left
 */
function handleRightPaneScroll() {
  if (isParallelSyncing) return;
  isParallelSyncing = true;

  const leftPane = document.querySelector('.parallel-pane.left-pane');
  const rightPane = document.querySelector('.parallel-pane.right-pane');

  if (leftPane && rightPane) {
    const scrollRatio = rightPane.scrollTop / (rightPane.scrollHeight - rightPane.clientHeight);
    leftPane.scrollTop = scrollRatio * (leftPane.scrollHeight - leftPane.clientHeight);
  }

  requestAnimationFrame(() => { isParallelSyncing = false; });
}

/**
 * Load verses into a specific container (for parallel view)
 * @param {string} bookName - Book name (e.g., 'John', 'Genesis')
 * @param {number} chapter - Chapter number
 * @param {string} versionId - Version ID (e.g., 'en-web', 'en-kjv')
 * @param {HTMLElement} container - Target container element
 */
async function loadVersesToContainer(bookName, chapter, versionId, container) {
  if (!container) {
    console.error('[Parallel] Container not found');
    return;
  }

  container.innerHTML = '<div class="loading">Loading...</div>';
  console.log('[Parallel] Loading:', bookName, chapter, versionId);

  try {
    // Get version config using the helper function from versions.js
    const versionConfig = getVersion(versionId);
    if (!versionConfig) {
      console.error('[Parallel] Version not found:', versionId);
      container.innerHTML = '<div class="error">Version not found</div>';
      return;
    }

    // Check if version is installed
    if (!isVersionInstalled(versionId)) {
      container.innerHTML = '<div class="error">Version not installed</div>';
      showToast('Secondary version not installed—check Manage Versions');
      return;
    }

    // Build the data path
    const dataPath = versionConfig.dataPath || `data/`;
    const bookPath = `${dataPath}${bookName}.json`;
    console.log('[Parallel] Fetching:', bookPath);

    const response = await fetch(bookPath);

    if (!response.ok) {
      console.error('[Parallel] Fetch failed:', response.status);
      container.innerHTML = '<div class="error">Chapter not available in this version</div>';
      return;
    }

    const bookData = await response.json();
    const chapterData = bookData[chapter]; // Data structure: bookData[chapterNum][verseNum]

    if (!chapterData) {
      container.innerHTML = '<div class="error">Chapter not found</div>';
      return;
    }

    // Render verses - data structure is { "1": "verse text", "2": "verse text", ... }
    container.innerHTML = '';

    // Set RTL direction for Hebrew and Arabic versions
    if (versionConfig.direction === 'RTL') {
      container.setAttribute('dir', 'rtl');
      container.style.textAlign = 'right';
    } else {
      container.setAttribute('dir', 'ltr');
      container.style.textAlign = 'left';
    }

    const verseNums = Object.keys(chapterData).sort((a, b) => parseInt(a) - parseInt(b));

    for (const verseNum of verseNums) {
      const verseText = chapterData[verseNum];
      const verseDiv = document.createElement('div');
      verseDiv.className = `verse v${verseNum}`;

      const verseNumSpan = document.createElement('span');
      verseNumSpan.className = 'verse-num';
      verseNumSpan.textContent = verseNum;

      verseDiv.appendChild(verseNumSpan);
      verseDiv.appendChild(document.createTextNode(' ' + verseText));
      container.appendChild(verseDiv);
    }

    if (verseNums.length === 0) {
      container.innerHTML = '<p class="error">No verses found.</p>';
    }

    console.log('[Parallel] Loaded', verseNums.length, 'verses for', versionId);

  } catch (error) {
    console.error('[Parallel] Error loading verses:', error);
    container.innerHTML = '<div class="error">Failed to load chapter</div>';
  }
}

/**
 * Open parallel version picker modal
 */
function openParallelVersionModal() {
  const overlay = document.getElementById('parallelVersionModalOverlay');
  if (overlay) {
    overlay.classList.add('open');
    lockBodyScroll();
    renderParallelVersionList();
  }
}

/**
 * Close parallel version picker modal
 * @param {Event} event
 */
function closeParallelVersionModal(event) {
  if (event && event.target !== event.currentTarget) return;

  const overlay = document.getElementById('parallelVersionModalOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    unlockBodyScroll();
  }
}

/**
 * Render list of available versions in picker modal
 */
function renderParallelVersionList() {
  const list = document.getElementById('parallelVersionList');
  if (!list || typeof BIBLE_VERSIONS === 'undefined') return;

  const currentSecondary = getSecondaryVersionId();
  const currentPrimary = getCurrentVersionId();

  list.innerHTML = '';

  // Get installed versions (exclude current primary)
  Object.entries(BIBLE_VERSIONS).forEach(([versionId, config]) => {
    if (versionId === currentPrimary) return; // Skip primary version

    const li = document.createElement('li');
    li.className = versionId === currentSecondary ? 'selected' : '';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', versionId === currentSecondary);

    li.innerHTML = `
      <span class="version-name">${config.name || versionId.toUpperCase()}</span>
      <span class="version-lang">${config.language || 'Unknown'}</span>
    `;

    li.onclick = () => selectSecondaryVersion(versionId);
    list.appendChild(li);
  });
}

/**
 * Select a secondary version from the picker
 * @param {string} versionId
 */
function selectSecondaryVersion(versionId) {
  console.log('[Parallel] Selected secondary version:', versionId);

  setSecondaryVersionId(versionId);

  // Update UI
  const secondaryNameSpan = document.getElementById('currentSecondaryName');
  if (secondaryNameSpan) {
    secondaryNameSpan.textContent = getVersionDisplayName(versionId);
  }

  // Close modal
  closeParallelVersionModal();

  // Reload chapter if parallel is enabled
  if (isParallelEnabled()) {
    updateParallelHeaders();
    displayChapter(currentChapter);
  }

  showToast(`Secondary: ${getVersionDisplayName(versionId)}`);
}

/**
 * Toggle font size dropdown open/close
 */
function toggleFontSizeDropdown() {
  const dropdown = document.querySelector('.font-size-dropdown');
  const toggle = document.getElementById('fontSizeToggle');
  if (!dropdown || !toggle) return;

  const isOpen = dropdown.classList.contains('open');
  if (isOpen) {
    closeFontSizeDropdown();
  } else {
    dropdown.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    // Focus the currently active option
    const activeOption = document.querySelector('#fontSizeMenu li.active');
    if (activeOption) {
      activeOption.focus();
    }
  }
}

/**
 * Close font size dropdown
 */
function closeFontSizeDropdown() {
  const dropdown = document.querySelector('.font-size-dropdown');
  const toggle = document.getElementById('fontSizeToggle');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Initialize font size on page load
 */
function initFontSize() {
  const savedSize = getSavedFontSize();
  applyFontSize(savedSize);

  const toggle = document.getElementById('fontSizeToggle');
  const menu = document.getElementById('fontSizeMenu');
  const dropdown = document.querySelector('.font-size-dropdown');

  if (!toggle || !menu || !dropdown) return;

  // Toggle button click
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFontSizeDropdown();
  });

  // Toggle button keyboard (Enter/Space handled by button default)
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!dropdown.classList.contains('open')) {
        toggleFontSizeDropdown();
      }
    }
  });

  // Option click handlers
  const options = menu.querySelectorAll('li[role="option"]');
  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const size = opt.getAttribute('data-size');
      if (size) {
        changeFontSize(size);
        closeFontSizeDropdown();
        toggle.focus();
      }
    });
  });

  // Keyboard navigation in menu
  menu.addEventListener('keydown', (e) => {
    const currentFocus = document.activeElement;
    const optionsList = Array.from(options);
    const currentIndex = optionsList.indexOf(currentFocus);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < optionsList.length - 1) {
          optionsList[currentIndex + 1].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          optionsList[currentIndex - 1].focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentFocus && currentFocus.hasAttribute('data-size')) {
          const size = currentFocus.getAttribute('data-size');
          changeFontSize(size);
          closeFontSizeDropdown();
          toggle.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeFontSizeDropdown();
        toggle.focus();
        break;
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      closeFontSizeDropdown();
    }
  });
}

// ========================================
// Bookmark Management
// ========================================
const BOOKMARKS_STORAGE_KEY = 'bibleReader.bookmarks';

/**
 * Load bookmarks from localStorage
 * @returns {Array} Array of bookmark objects
 */
function loadBookmarks() {
  try {
    const bookmarksJson = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (bookmarksJson) {
      return JSON.parse(bookmarksJson);
    }
  } catch (e) {
    console.error('Error loading bookmarks:', e);
  }
  return [];
}

/**
 * Save bookmarks to localStorage
 * @param {Array} bookmarks - Array of bookmark objects to save
 */
function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Error saving bookmarks:', e);
  }
}

/**
 * Check if current chapter is bookmarked
 * @returns {boolean} True if current chapter has a bookmark
 */
function isCurrentChapterBookmarked() {
  const bookmarks = loadBookmarks();
  return bookmarks.some(b => b.bookId === currentBook && b.chapter === currentChapter);
}

/**
 * Get bookmark ID for current chapter
 * @returns {string|null} Bookmark ID or null if not found
 */
function getCurrentBookmarkId() {
  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find(b => b.bookId === currentBook && b.chapter === currentChapter);
  return bookmark ? bookmark.id : null;
}

/**
 * Add bookmark for current chapter
 */
function addBookmark() {
  const bookmarks = loadBookmarks();
  const id = `${currentBook}-${currentChapter}-${Date.now()}`;
  const newBookmark = {
    id,
    bookId: currentBook,
    bookName: currentBook,
    chapter: currentChapter,
    createdAt: new Date().toISOString()
  };
  bookmarks.unshift(newBookmark); // Add to beginning (most recent first)
  saveBookmarks(bookmarks);
  updateBookmarkButton();
}

/**
 * Remove bookmark by ID
 * @param {string} id - The bookmark ID to remove
 */
function removeBookmark(id) {
  let bookmarks = loadBookmarks();
  bookmarks = bookmarks.filter(b => b.id !== id);
  saveBookmarks(bookmarks);
  updateBookmarkButton();
}

/**
 * Toggle bookmark for current chapter
 */
function toggleBookmark() {
  if (isCurrentChapterBookmarked()) {
    const id = getCurrentBookmarkId();
    if (id) removeBookmark(id);
  } else {
    addBookmark();
  }
}

/**
 * Update bookmark button icon based on current chapter
 */
function updateBookmarkButton() {
  const icon = document.getElementById('bookmarkIcon');
  if (icon) {
    icon.textContent = isCurrentChapterBookmarked() ? '★' : '☆';
  }
}

/**
 * Open bookmarks modal
 */
function openBookmarksModal() {
  lockBodyScroll();
  renderBookmarksList();
  document.getElementById('bookmarksModalOverlay').classList.add('active');
  setTimeout(() => {
    const firstBookmark = document.querySelector('.bookmark-link');
    if (firstBookmark) firstBookmark.focus();
  }, 0);
}

/**
 * Close bookmarks modal
 * @param {Event} event - Optional event object from click handler
 */
function closeBookmarksModal(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById('bookmarksModalOverlay').classList.remove('active');
    unlockBodyScroll();
  }
}

/**
 * Render bookmarks list in modal
 */
function renderBookmarksList() {
  const bookmarks = loadBookmarks();
  const container = document.getElementById('bookmarksContainer');

  if (bookmarks.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<p class="empty-title">You haven\'t saved any bookmarks yet.</p>' +
        '<p class="empty-hint">Tap ★ while reading to save a favorite chapter.</p>' +
      '</div>';
    return;
  }

  let html = '';
  bookmarks.forEach(bookmark => {
    html += `
      <div class="bookmark-item">
        <button class="bookmark-link" onclick="navigateToBookmark('${bookmark.id}')" aria-label="Go to ${bookmark.bookName} chapter ${bookmark.chapter}">
          <span class="bookmark-text">${bookmark.bookName} ${bookmark.chapter}</span>
        </button>
        <button class="bookmark-delete" onclick="removeBookmark('${bookmark.id}'); event.stopPropagation();" aria-label="Remove bookmark for ${bookmark.bookName} chapter ${bookmark.chapter}" title="Remove bookmark">×</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Navigate to a bookmarked chapter
 * @param {string} bookmarkId - The ID of the bookmark to navigate to
 */
async function navigateToBookmark(bookmarkId) {
  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);

  if (!bookmark) return;

  // Close bookmarks modal
  closeBookmarksModal();

  // Load the book if different from current
  if (bookmark.bookId !== currentBook) {
    try {
      const bookInfo = booksJson.books.find(b => b.name === bookmark.bookId);
      if (bookInfo) {
        await selectBook(bookInfo);
      }
    } catch (e) {
      console.error('Error loading bookmarked book:', e);
      return;
    }
  }

  // Navigate to the chapter
  selectChapter(bookmark.chapter);
}

// ========================================
// Reading History Modal
// ========================================

/**
 * Format a relative time string (e.g., "5m ago", "2h ago", "3d ago")
 * @param {Date} date - The date to format
 * @returns {string} Relative time string
 */
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return days + 'd';
  if (hours > 0) return hours + 'h';
  if (minutes > 0) return minutes + 'm';
  return seconds + 's';
}

/**
 * Open the reading history modal and populate with recent events
 */
function openReadingHistory() {
  lockBodyScroll();
  var modal = document.getElementById('historyModalOverlay');
  var list = document.getElementById('readingHistoryList');
  list.innerHTML = '';

  // Update the subtitle with fresh data
  updateHistoryModalSubtitle();

  // Check if BibleReading API is available
  if (!window.BibleReading || typeof BibleReading.getRecentReadingEvents !== 'function') {
    list.innerHTML =
      '<div class="empty-state">' +
        '<p class="empty-title">Reading history not available.</p>' +
        '<p class="empty-hint">The reading history feature could not be loaded.</p>' +
      '</div>';
    modal.classList.add('active');
    return;
  }

  var events = BibleReading.getRecentReadingEvents(20);

  if (!events.length) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<p class="empty-title">No recent reading yet.</p>' +
        '<p class="empty-hint">Start reading any chapter, and it will appear here automatically.</p>' +
      '</div>';
  } else {
    events.forEach(ev => {
      const div = document.createElement('div');
      div.className = 'history-item';

      const timeAgo = timeSince(new Date(ev.completedAt));

      // Create clickable link to navigate to the chapter
      const link = document.createElement('button');
      link.className = 'history-link';
      link.setAttribute('aria-label', 'Go to ' + ev.bookId + ' chapter ' + ev.chapter);

      const textSpan = document.createElement('span');
      textSpan.className = 'history-text';
      textSpan.textContent = ev.bookId + ' ' + ev.chapter;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = timeAgo + ' ago';

      link.appendChild(textSpan);
      link.appendChild(timeSpan);

      // Add click handler to navigate
      link.addEventListener('click', function() {
        navigateToHistoryItem(ev.bookId, ev.chapter);
      });

      div.appendChild(link);
      list.appendChild(div);
    });
  }

  modal.classList.add('active');

  // Focus first item for keyboard navigation
  setTimeout(function() {
    const firstLink = list.querySelector('.history-link');
    if (firstLink) firstLink.focus();
  }, 0);
}

/**
 * Close the reading history modal
 * @param {Event} event - Optional event object from click handler
 */
function closeReadingHistory(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById('historyModalOverlay').classList.remove('active');
    unlockBodyScroll();
  }
}

/**
 * Navigate to a chapter from reading history
 * @param {string} bookId - The book name
 * @param {number} chapter - The chapter number
 */
async function navigateToHistoryItem(bookId, chapter) {
  closeReadingHistory();

  // Load the book if different from current
  if (bookId !== currentBook) {
    try {
      const bookInfo = booksJson.books.find(function(b) {
        return b.name === bookId;
      });
      if (bookInfo) {
        await selectBook(bookInfo);
      }
    } catch (e) {
      console.error('Error loading book from history:', e);
      return;
    }
  }

  // Navigate to the chapter
  selectChapter(chapter);
}

/**
 * Update the history modal subtitle with the most recent reading.
 * Shows "Last: John 8 (3m ago)" or "No recent reading yet." if empty.
 */
function updateHistoryModalSubtitle() {
  var subtitleEl = document.getElementById('historyModalSubtitle');
  if (!subtitleEl) return;

  if (!window.BibleReading || typeof BibleReading.getRecentReadingEvents !== 'function') {
    subtitleEl.textContent = 'No recent reading yet.';
    return;
  }

  var events = BibleReading.getRecentReadingEvents(1);

  if (!events.length) {
    subtitleEl.textContent = 'No recent reading yet.';
  } else {
    var ev = events[0];
    var label = ev.bookId + ' ' + ev.chapter;
    var timeAgo = timeSince(new Date(ev.completedAt));
    subtitleEl.textContent = 'Last: ' + label + ' (' + timeAgo + ' ago)';
  }
}

/**
 * Update the "Last read" hint in the header.
 * Desktop: shows text "Last: John 8"
 * Mobile: updates tooltip and aria-label on the history button
 * Also updates the history modal subtitle.
 */
function updateLastReadHint() {
  if (!window.BibleReading) return;

  var events = BibleReading.getRecentReadingEvents(1);
  var hintEl = document.getElementById('lastReadHint');
  var historyBtn = document.querySelector('.history-header-btn');

  if (!events.length) {
    // No history yet
    if (hintEl) hintEl.textContent = '';
    if (historyBtn) {
      historyBtn.title = 'Recent reading history';
      historyBtn.setAttribute('aria-label', 'Open reading history');
    }
  } else {
    var ev = events[0];
    var label = ev.bookId + ' ' + ev.chapter;

    // Desktop text (short label)
    if (hintEl) {
      hintEl.textContent = 'Last: ' + label;
    }

    // Mobile tooltip + accessibility
    if (historyBtn) {
      historyBtn.title = 'Recent reading (Last: ' + label + ')';
      historyBtn.setAttribute('aria-label', 'Recent reading (Last: ' + label + ')');
    }
  }

  // Also update the history modal subtitle
  updateHistoryModalSubtitle();
}

// Initialize theme immediately
initTheme();
// Initialize font size immediately
initFontSize();
// Initialize line height immediately
applyLineHeight(getSavedLineHeight());
// Initialize version indicator and version manager
initVersionIndicator();
initVersionManager();

// ========================================
// Version Indicator
// ========================================

/**
 * Initialize the version indicator chip in the header
 * Uses getCurrentVersion() from versions.js to display the current Bible version
 */
function initVersionIndicator() {
  const versionChip = document.getElementById('versionChip');
  if (versionChip && typeof getCurrentVersion === 'function') {
    const version = getCurrentVersion();
    if (version && version.shortName) {
      versionChip.textContent = version.shortName;
      versionChip.title = version.name || 'Current Bible version';
    }
  }
}

/**
 * Update the version indicator chip (hook for future multi-version support)
 * Call this when switching versions to update the UI
 * @param {string} versionId - The version identifier (e.g., "en-web")
 */
function updateVersionIndicator(versionId) {
  const versionChip = document.getElementById('versionChip');
  if (versionChip && typeof getVersion === 'function') {
    const version = getVersion(versionId);
    if (version && version.shortName) {
      versionChip.textContent = version.shortName;
      versionChip.title = version.name || 'Current Bible version';
    }
  }
}

// ========================================
// Version Manager
// ========================================

/**
 * Initialize the version manager modal
 * Populates the installed versions list and "Other versions" section
 * Uses getInstalledVersions() and getAllVersions() from versions.js
 *
 * TODO: When full multi-version support is added:
 * - Each installed version item should include a "Remove" button for non-active versions
 * - "Coming soon" versions should have a "Download" button when available
 * - The active version should be determined by user preference stored in localStorage
 */
function initVersionManager() {
  const listContainer = document.getElementById('installedVersionsList');
  if (!listContainer) return;

  const contentContainer = listContainer.parentElement;
  if (!contentContainer) return;

  const currentVersionId = getCurrentVersionId();
  const installedVersions = getInstalledVersions();

  // Clear the installed versions list
  listContainer.innerHTML = '';

  // Populate installed versions
  installedVersions.forEach((version) => {
    const isActive = version.id === currentVersionId;

    const versionItem = document.createElement('div');
    versionItem.className = 'version-item' + (isActive ? '' : ' version-item-clickable');
    versionItem.setAttribute('role', 'button');
    versionItem.setAttribute('tabindex', '0');
    versionItem.setAttribute('aria-label', isActive
      ? `${version.shortName} - ${version.name} (currently active)`
      : `Switch to ${version.shortName} - ${version.name}`);

    // Click handler to switch version (only if not active)
    if (!isActive) {
      versionItem.addEventListener('click', () => {
        switchVersion(version.id);
      });
      versionItem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          switchVersion(version.id);
        }
      });
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'version-item-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'version-item-name';
    nameDiv.textContent = `${version.shortName} – ${version.name}`;

    const langDiv = document.createElement('div');
    langDiv.className = 'version-item-language';
    langDiv.textContent = `Language: ${version.languageName}`;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(langDiv);

    // Add size info
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'version-size-text';
    sizeDiv.textContent = `~${version.estimatedSizeMB || 0} MB offline`;
    infoDiv.appendChild(sizeDiv);

    const badge = document.createElement('span');
    badge.className = 'version-badge' + (isActive ? ' version-badge-active' : '');
    badge.textContent = isActive ? 'Active' : 'Installed';

    versionItem.appendChild(infoDiv);
    versionItem.appendChild(badge);

    listContainer.appendChild(versionItem);
  });

  // Add total installed size summary
  const totalSizeDiv = document.createElement('div');
  totalSizeDiv.className = 'version-total-size';
  totalSizeDiv.textContent = `Total installed offline: ${getTotalInstalledSizeMB()} MB`;
  listContainer.appendChild(totalSizeDiv);

  // Add "Other versions" section if there are non-installed versions
  const allVersions = getAllVersions();
  const otherVersions = allVersions.filter((v) => v.status !== 'installed');

  // Remove any existing "Other versions" section (in case of re-init)
  const existingOtherSection = contentContainer.querySelector('.other-versions-section');
  if (existingOtherSection) {
    existingOtherSection.remove();
  }

  if (otherVersions.length > 0) {
    // Create wrapper for the entire section
    const otherSection = document.createElement('div');
    otherSection.className = 'other-versions-section';

    // Create section title
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'version-manager-section-title';
    sectionTitle.textContent = 'Other languages (coming soon)';
    otherSection.appendChild(sectionTitle);

    // Create hint text
    const otherHint = document.createElement('p');
    otherHint.className = 'version-manager-hint';
    otherHint.textContent = 'These translations are planned for a future update. Download support is not available yet.';
    otherSection.appendChild(otherHint);

    // Create list wrapper
    const otherListWrapper = document.createElement('div');
    otherListWrapper.className = 'other-versions-list';

    // Populate other versions
    otherVersions.forEach((version) => {
      const versionItem = document.createElement('div');
      versionItem.className = 'version-item version-item-disabled';
      versionItem.setAttribute('role', 'button');
      versionItem.setAttribute('tabindex', '0');
      versionItem.setAttribute('aria-label', `${version.shortName} - ${version.name} (coming soon)`);

      // Click handler shows toast for coming-soon versions
      const handleComingSoonClick = () => {
        showToast('This translation will be available in a future update.');
      };
      versionItem.addEventListener('click', handleComingSoonClick);
      versionItem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleComingSoonClick();
        }
      });

      const infoDiv = document.createElement('div');
      infoDiv.className = 'version-item-info';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'version-item-name';
      nameDiv.textContent = `${version.shortName} – ${version.name}`;

      const langDiv = document.createElement('div');
      langDiv.className = 'version-item-language';
      langDiv.textContent = `Language: ${version.languageName}`;

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(langDiv);

      // Add size info (without "offline" since not installed)
      const sizeDiv = document.createElement('div');
      sizeDiv.className = 'version-size-text';
      sizeDiv.textContent = `~${version.estimatedSizeMB || 0} MB`;
      infoDiv.appendChild(sizeDiv);

      const badge = document.createElement('span');
      badge.className = 'version-badge version-badge-secondary';
      badge.textContent = version.status === 'coming-soon' ? 'Coming soon' : 'Download';

      versionItem.appendChild(infoDiv);
      versionItem.appendChild(badge);

      otherListWrapper.appendChild(versionItem);
    });

    otherSection.appendChild(otherListWrapper);

    // Insert before the footer
    const footer = contentContainer.querySelector('.version-manager-footer');
    if (footer) {
      contentContainer.insertBefore(otherSection, footer);
    } else {
      contentContainer.appendChild(otherSection);
    }
  }

  // Set up version chip click handler
  const versionChip = document.getElementById('versionChip');
  if (versionChip) {
    // Handle Enter/Space key for accessibility (since it has role="button")
    versionChip.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openVersionManager();
      }
    });
  }
}

/**
 * Open the version manager modal
 */
function openVersionManager() {
  lockBodyScroll();
  const overlay = document.getElementById('versionManagerOverlay');
  if (overlay) {
    overlay.classList.add('active');
    // Focus the close button for keyboard navigation
    setTimeout(() => {
      const closeBtn = overlay.querySelector('.version-manager-close');
      if (closeBtn) closeBtn.focus();
    }, 0);
  }
}

/**
 * Close the version manager modal
 * @param {Event} event - Optional event object from click handler
 */
function closeVersionManager(event) {
  // Only close if clicking overlay background or explicitly called
  if (!event || event.target === event.currentTarget) {
    const overlay = document.getElementById('versionManagerOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      unlockBodyScroll();
      // Return focus to version chip
      const versionChip = document.getElementById('versionChip');
      if (versionChip) versionChip.focus();
    }
  }
}

// ========================================
// Toast Notification System
// ========================================

/**
 * Show a non-blocking toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in ms (default: 3000)
 */
function showToast(message, duration = 3000) {
  // Remove any existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  // Add to DOM
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300); // Wait for fade out animation
  }, duration);
}

// ========================================
// Version Switching
// ========================================

/**
 * Switch to a different Bible version
 * @param {string} versionId - The version ID to switch to (e.g., "en-web", "en-kjv")
 * @returns {Promise<boolean>} True if switch was successful
 */
async function switchVersion(versionId) {
  // Validate version exists
  const version = getVersion(versionId);
  if (!version) {
    showToast('Version not found.');
    return false;
  }

  // Check if already on this version
  if (versionId === getCurrentVersionId()) {
    closeVersionManager();
    return true;
  }

  // Check if version is installed
  if (!isVersionInstalled(versionId)) {
    showToast('This version is not installed yet.');
    return false;
  }

  try {
    // Save new version preference
    if (!setCurrentVersionId(versionId)) {
      showToast('Failed to save version preference.');
      return false;
    }

    // Update version indicator chip
    updateVersionIndicator(versionId);

    // Clear any active search
    clearChapterSearch();

    // Reload books.json for the new version
    const booksFilePath = './' + getVersionBooksFile(versionId);
    const response = await fetch(booksFilePath);
    console.log('Loading books.json from:', new URL(booksFilePath, window.location.href).href);

    if (!response.ok) {
      throw new Error('Failed to load books data for ' + version.shortName);
    }

    booksJson = await response.json();

    // Rebuild book selector modal
    populateBookLists();

    // Reset to Genesis 1 (or first available book)
    const firstBook = booksJson.books[0];
    if (firstBook) {
      currentBook = firstBook.name;
      currentBookData = firstBook;
      totalChapters = firstBook.chapters;
      currentChapter = 1;

      // Load the first book's data
      const dataPath = './' + version.dataPath;
      const bookPath = dataPath + firstBook.filename;
      const bookResponse = await fetch(bookPath);

      if (!bookResponse.ok) {
        throw new Error('Failed to load ' + firstBook.name);
      }

      bookData = await bookResponse.json();

      // Display chapter
      displayChapter(currentChapter);

      // Update navigation
      updateChapterIndicator();
      updateNavigationButtons();

      // Save new reading state
      saveReadingState(currentBook, currentChapter);

      // Update bookmark button for new context
      updateBookmarkButton();
    }

    // Re-initialize the version manager to reflect the change
    initVersionManager();

    // Close version manager
    closeVersionManager();

    // Show success toast
    showToast('Switched to ' + version.shortName);

    return true;
  } catch (error) {
    console.error('Error switching version:', error);
    showToast('Error loading ' + version.shortName + '. Please try again.');

    // Revert to previous version in localStorage if needed
    // (The version files may not be available)
    return false;
  }
}

// ========================================
// Reading State Persistence
// ========================================

// localStorage key for reading state
const READING_STATE_KEY = 'bibleReadingState';

// Bible reader state
let bookData = null;
let currentChapter = 1;
let totalChapters = 21; // John has 21 chapters (will be updated per book)
let currentBook = 'John'; // Track current book
let booksJson = null; // Cache books data
let currentBookData = null; // Store current book info for chapter selector

/**
 * Save the current reading state to localStorage
 * @param {string} book - The book name (e.g., "John")
 * @param {number} chapter - The chapter number
 */
function saveReadingState(book, chapter) {
  try {
    if (typeof localStorage !== 'undefined') {
      const state = {
        book: book || currentBook,
        chapter: chapter || currentChapter,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(READING_STATE_KEY, JSON.stringify(state));
      console.log('Reading state saved:', state);
    }
  } catch (error) {
    // Silently fail if localStorage is unavailable (private browsing, quota exceeded, etc.)
    console.warn('localStorage not available:', error.message);
  }
}

/**
 * Load the reading state from localStorage
 * @returns {Object|null} The saved state {book, chapter} or null if not found
 */
function loadReadingState() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stateJson = localStorage.getItem(READING_STATE_KEY);
      if (stateJson) {
        const state = JSON.parse(stateJson);
        console.log('Reading state loaded:', state);
        return state;
      }
    }
  } catch (error) {
    // Handle corrupted localStorage data or parsing errors
    console.warn('Failed to load reading state:', error.message);
    try {
      // Clear corrupted data
      localStorage.removeItem(READING_STATE_KEY);
    } catch (e) {
      // Ignore errors when trying to clear
    }
  }
  return null;
}

/**
 * Log the current chapter as a reading event (simple v1)
 * Uses window.BibleReading.logReadingEvent if available.
 * Called after a chapter is successfully displayed.
 */
function logCurrentChapterReading() {
  if (!window.BibleReading || typeof BibleReading.logReadingEvent !== 'function') {
    return;
  }

  try {
    const versionId = typeof getCurrentVersionId === 'function' ? getCurrentVersionId() : null;

    // Use the book name as identifier (matches how bookmarks and reading state work)
    // Prefer currentBookData.name if available for consistency
    const bookId =
      (currentBookData && currentBookData.name) ||
      currentBook ||
      null;

    const chapterNum = Number(currentChapter);

    if (!versionId || !bookId || !chapterNum) {
      return;
    }

    BibleReading.logReadingEvent({
      versionId: versionId,
      bookId: bookId,
      chapter: chapterNum
      // completedAt will default to now inside the storage module
    });
  } catch (e) {
    console.warn('[BibleReading] Failed to log reading event:', e);
  }
}

/**
 * Update the simple "Current Book" reading plan in BibleReading storage.
 * Called whenever a chapter is displayed.
 */
function updateCurrentBookPlan() {
  if (
    !window.BibleReading ||
    typeof BibleReading.upsertPlan !== 'function' ||
    typeof BibleReading.setCurrentPlanId !== 'function'
  ) {
    return;
  }

  const bookId =
    (currentBookData && currentBookData.name) ||
    currentBook ||
    null;

  const chapterNum = Number(currentChapter || 0);

  if (!bookId || !chapterNum) {
    return;
  }

  // Use the global totalChapters or currentBookData.chapters
  const chaptersCount =
    (currentBookData && currentBookData.chapters) ||
    totalChapters ||
    0;

  const nowIso = new Date().toISOString();

  BibleReading.upsertPlan({
    id: 'current-book',
    name: 'Current Book',
    type: 'auto-current-book',
    config: {
      bookId: bookId,
      totalChapters: chaptersCount || null
    },
    progress: {
      bookId: bookId,
      lastChapter: chapterNum,
      lastUpdatedAt: nowIso
    }
  });

  BibleReading.setCurrentPlanId('current-book');
}

/**
 * Update the UI line under the chapter title with the current plan status.
 * Example: "Reading plan: Genesis 7 of 50"
 * Shows empty-state message when no plan progress exists.
 */
function updateCurrentPlanStatusUI() {
  const el = document.getElementById('currentPlanStatus');
  if (!el) return;

  // Helper to show empty-state placeholder
  function showEmptyState() {
    el.textContent = 'Reading plan: No plan yet — start reading to begin tracking.';
    el.style.color = '';  // Use default muted color from CSS
  }

  // If BibleReading API not available, show empty state
  if (!window.BibleReading) {
    showEmptyState();
    return;
  }

  const currentPlanId =
    typeof BibleReading.getCurrentPlanId === 'function'
      ? BibleReading.getCurrentPlanId()
      : null;

  // If no current-book plan is active, show empty state
  if (currentPlanId !== 'current-book') {
    showEmptyState();
    return;
  }

  let plan;
  try {
    const state = BibleReading.loadReadingState();
    plan = state && state.plans ? state.plans['current-book'] : null;
  } catch (e) {
    console.warn('[BibleReading] Unable to load reading plan state:', e);
    showEmptyState();
    return;
  }

  // If no plan or no progress recorded yet, show empty state
  if (!plan || !plan.progress || !plan.config) {
    showEmptyState();
    return;
  }

  const bookId = plan.config.bookId || plan.progress.bookId;
  const chapterNum = plan.progress.lastChapter;
  const chaptersTotal = plan.config.totalChapters;

  // If no actual progress data, show empty state
  if (!bookId || !chapterNum) {
    showEmptyState();
    return;
  }

  // Build label with or without totalChapters
  if (chaptersTotal && Number(chaptersTotal) > 0) {
    el.textContent = 'Reading plan: ' + bookId + ' ' + chapterNum + ' of ' + chaptersTotal;
  } else {
    el.textContent = 'Reading plan: ' + bookId + ' ' + chapterNum;
  }
}

/**
 * Update the "Continue reading" button UI based on current-book plan state.
 * Shows/hides button and updates label based on progress.
 */
function updateCurrentPlanActionUI() {
  var container = document.getElementById('currentPlanActions');
  var btn = document.getElementById('continuePlanBtn');
  if (!container || !btn) return;

  // Hide if BibleReading API unavailable
  if (!window.BibleReading || typeof BibleReading.getPlans !== 'function') {
    container.style.display = 'none';
    return;
  }

  // Get current-book plan
  var plans = BibleReading.getPlans();
  var plan = plans ? plans['current-book'] : null;

  // Hide if no plan or no config
  if (!plan || !plan.config || !plan.config.bookId) {
    container.style.display = 'none';
    return;
  }

  var planBookId = plan.config.bookId;
  var planTotal = plan.config.totalChapters || 0;
  var lastChapter = (plan.progress && plan.progress.lastChapter) || 0;

  // Use currentBookData.name for display (matches UI)
  var displayName = (currentBookData && currentBookData.name) || planBookId;

  // Determine next chapter
  var nextChapter;
  var buttonLabel;

  if (lastChapter >= planTotal && planTotal > 0) {
    // Completed book - offer to re-read
    nextChapter = 1;
    buttonLabel = 'Re-read ' + displayName;
  } else if (lastChapter > 0) {
    // Has progress - continue
    nextChapter = Math.min(lastChapter + 1, planTotal || lastChapter + 1);
    buttonLabel = 'Continue in ' + displayName;
  } else {
    // No progress yet - start
    nextChapter = 1;
    buttonLabel = 'Start reading ' + displayName;
  }

  // Store next chapter on button for click handler
  btn.dataset.bookId = planBookId;
  btn.dataset.nextChapter = nextChapter;
  btn.textContent = buttonLabel;
  container.style.display = '';
}

/**
 * Navigate to the next chapter in the current-book plan.
 * Called when user clicks the "Continue reading" button.
 */
function continueCurrentBookPlan() {
  var btn = document.getElementById('continuePlanBtn');
  if (!btn) return;

  var targetBookId = btn.dataset.bookId;
  var targetChapter = parseInt(btn.dataset.nextChapter, 10);

  if (!targetBookId || isNaN(targetChapter)) return;

  // If already on the correct book, just select the chapter
  if (currentBook === targetBookId) {
    selectChapter(targetChapter);
    return;
  }

  // Otherwise, need to load the book first, then select chapter
  if (!booksJson || !booksJson.books) return;

  var bookInfo = booksJson.books.find(function(b) {
    return b.name === targetBookId;
  });

  if (bookInfo) {
    selectBook(bookInfo).then(function() {
      selectChapter(targetChapter);
    }).catch(function(e) {
      console.error('Error loading book for continue:', e);
    });
  }
}

// ========================================
// Offline Detection & Management
// ========================================

function updateOfflineIndicator() {
  const indicator = document.getElementById('offlineIndicator');
  if (!navigator.onLine) {
    indicator.classList.add('active');
    indicator.classList.remove('hidden');
  } else {
    indicator.classList.remove('active');
    indicator.classList.add('hidden');
    // Remove hidden class after animation completes
    setTimeout(() => {
      indicator.classList.remove('hidden');
    }, 300);
  }
}

// Listen for online/offline events
window.addEventListener('online', () => {
  updateOfflineIndicator();
  console.log('Connection restored');
});

window.addEventListener('offline', () => {
  updateOfflineIndicator();
  console.log('Connection lost');
});

// Check initial connection status on page load
window.addEventListener('load', () => {
  updateOfflineIndicator();
});

// ========================================
// Book & Chapter Navigation
// ========================================

// Load books list from books.json
async function loadBooksJson() {
  try {
    const booksFilePath = './' + getCurrentBooksFile();
    const response = await fetch(booksFilePath);
    console.log('Loading books.json from:', new URL(booksFilePath, window.location.href).href);
    if (!response.ok) throw new Error('Failed to load books data');
    booksJson = await response.json();
    populateBookLists();
  } catch (error) {
    console.error('Error loading books data:', error);
  }
}

// Populate the OT and NT book lists in the modal
function populateBookLists() {
  if (!booksJson) return;

  const otBooks = booksJson.books.filter(book => book.testament === 'OT');
  const ntBooks = booksJson.books.filter(book => book.testament === 'NT');

  const otContainer = document.getElementById('otBooks');
  const ntContainer = document.getElementById('ntBooks');

  otContainer.innerHTML = '';
  ntContainer.innerHTML = '';

  otBooks.forEach(book => {
    const button = document.createElement('button');
    button.className = 'book-button';
    button.textContent = book.name;
    button.onclick = () => selectBook(book);
    otContainer.appendChild(button);
  });

  ntBooks.forEach(book => {
    const button = document.createElement('button');
    button.className = 'book-button';
    button.textContent = book.name;
    button.onclick = () => selectBook(book);
    ntContainer.appendChild(button);
  });
}

// Open the book selector modal
function openBookSelector() {
  lockBodyScroll();
  document.getElementById('bookModalOverlay').classList.add('active');
  // Focus first book button for keyboard navigation
  setTimeout(() => {
    const firstButton = document.querySelector('.book-button');
    if (firstButton) firstButton.focus();
  }, 0);
}

// Close the book selector modal
function closeBookSelector(event) {
  // If event exists and target is not the overlay, don't close
  if (event && event.target.id !== 'bookModalOverlay') {
    return;
  }
  document.getElementById('bookModalOverlay').classList.remove('active');
  unlockBodyScroll();
  // Return focus to menu button
  document.querySelector('.menu-button').focus();
}

// Switch between OT and NT tabs
function switchTestament(testament) {
  const otGrid = document.getElementById('otBooksGrid');
  const ntGrid = document.getElementById('ntBooksGrid');
  const tabs = document.querySelectorAll('.testament-tab');

  tabs.forEach(tab => {
    tab.classList.remove('active');
    tab.setAttribute('aria-selected', 'false');
    if (tab.getAttribute('data-testament') === testament) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }
  });

  if (testament === 'OT') {
    otGrid.classList.remove('hidden');
    ntGrid.classList.add('hidden');
  } else {
    otGrid.classList.add('hidden');
    ntGrid.classList.remove('hidden');
  }
}

// Handle book selection
async function selectBook(book) {
  try {
    // Update current book
    currentBook = book.name;
    currentBookData = book;
    totalChapters = book.chapters;

    // Load the book data
    const dataPath = './' + getCurrentDataPath();
    const bookPath = dataPath + book.filename;
    const response = await fetch(bookPath);
    console.log('Loading book from:', new URL(bookPath, window.location.href).href);
    if (!response.ok) {
      // Enhanced error handling for offline scenarios
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      throw new Error(`Failed to load ${book.name}`);
    }
    bookData = await response.json();

    // Close book selector and open chapter selector
    closeBookSelector();
    openChapterSelector();

    // Scroll to top so chapter selector modal is visible
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });

    // Save the reading state when switching to a new book (will save final chapter when selected)
    saveReadingState(currentBook, 1);
  } catch (error) {
    console.error('Error loading book:', error);

    // Provide context-aware error messages using safe DOM methods
    const errorDiv = document.createElement('div');
    errorDiv.className = 'offline-error';

    const titleStrong = document.createElement('strong');
    const titleText = document.createTextNode(error.message === 'offline' || !navigator.onLine ? '⚠️ Offline Mode' : '⚠️ Error Loading Book');
    titleStrong.appendChild(titleText);
    errorDiv.appendChild(titleStrong);

    const lineBreak = document.createElement('br');
    errorDiv.appendChild(lineBreak);

    let messagePart1 = '';
    let messagePart2 = '';
    if (error.message === 'offline' || !navigator.onLine) {
      messagePart1 = `"${book.name}" is not available offline. `;
      messagePart2 = `Please connect to the internet to load this book.`;
    } else {
      messagePart1 = `Could not load "${book.name}". `;
      messagePart2 = `Please check your connection and try again.`;
    }

    const messageText = document.createTextNode(messagePart1 + messagePart2);
    errorDiv.appendChild(messageText);

    const container = document.getElementById('versesContainer');
    container.innerHTML = '';
    container.appendChild(errorDiv);
  }
}

// Open the chapter selector modal
function openChapterSelector() {
  if (!currentBookData) return;

  lockBodyScroll();

  // Update modal title
  document.getElementById('chapterModalTitle').textContent = currentBook;

  // Populate chapters
  populateChapters(currentBookData.chapters);

  // Show the modal
  document.getElementById('chapterModalOverlay').classList.add('active');
  // Focus first chapter button for keyboard navigation
  setTimeout(() => {
    const firstChapter = document.querySelector('.chapter-button');
    if (firstChapter) firstChapter.focus();
  }, 0);
}

// Close the chapter selector modal
function closeChapterSelector(event) {
  // If event exists and target is not the overlay, don't close
  if (event && event.target.id !== 'chapterModalOverlay') {
    return;
  }
  document.getElementById('chapterModalOverlay').classList.remove('active');
  unlockBodyScroll();
  // Return focus to main content area
  document.getElementById('versesContainer').focus();
}

// Populate chapter buttons
function populateChapters(chapterCount) {
  const container = document.getElementById('chaptersContainer');
  container.innerHTML = '';

  for (let i = 1; i <= chapterCount; i++) {
    const button = document.createElement('button');
    button.className = 'chapter-button';
    button.textContent = i;
    button.onclick = () => selectChapter(i);
    container.appendChild(button);
  }
}

// Handle chapter selection
function selectChapter(chapterNum) {
  // displayChapter handles: updating UI, scrolling, saving state, logging history
  displayChapter(chapterNum);

  // Close modal after display
  closeChapterSelector();

  // Update bookmark button (not handled by displayChapter)
  updateBookmarkButton();
}

// Load the Bible data
async function loadBibleData() {
  try {
    const dataPath = './' + getCurrentDataPath();
    const johnPath = dataPath + 'John.json';
    const response = await fetch(johnPath);
    console.log('Loading John.json from:', new URL(johnPath, window.location.href).href);
    if (!response.ok) throw new Error('Failed to load Bible data');
    bookData = await response.json();
    displayChapter(currentChapter);
  } catch (error) {
    console.error('Error loading Bible data:', error);
    document.getElementById('versesContainer').innerHTML =
      '<div class="error">Error loading Bible data. Please refresh the page.</div>';
  }
}

// Display verses for the current chapter
function displayChapter(chapterNum) {
  if (!bookData || !bookData[chapterNum]) {
    console.error('Chapter not found:', chapterNum);
    return;
  }

  // Clear any active search when navigating to a new chapter
  clearChapterSearch();

  currentChapter = chapterNum;
  const verses = bookData[chapterNum];
  const container = document.getElementById('versesContainer');

  // Clear previous content
  container.innerHTML = '';

  // Set RTL direction for Hebrew and Arabic versions
  const currentVersion = typeof getVersion === 'function' ? getVersion(getCurrentVersionId()) : null;
  if (currentVersion && currentVersion.direction === 'RTL') {
    container.setAttribute('dir', 'rtl');
    container.style.textAlign = 'right';
  } else {
    container.setAttribute('dir', 'ltr');
    container.style.textAlign = 'left';
  }

  // Create header div safely
  const headerDiv = document.createElement('div');
  headerDiv.style.marginBottom = '1.5rem';
  headerDiv.style.fontWeight = '600';
  headerDiv.style.fontSize = '1.3rem';
  headerDiv.style.color = '#667eea';
  headerDiv.textContent = `${currentBook} ${chapterNum}`;
  container.appendChild(headerDiv);

  // Render all verses in the chapter
  for (const verseNum in verses) {
    const verseText = verses[verseNum];
    const verseDiv = document.createElement('div');
    verseDiv.className = 'verse';

    const verseNumberSpan = document.createElement('span');
    verseNumberSpan.className = 'verse-number';
    verseNumberSpan.textContent = verseNum;

    const verseTextSpan = document.createElement('span');
    verseTextSpan.className = 'verse-text';
    verseTextSpan.textContent = verseText;

    verseDiv.appendChild(verseNumberSpan);
    verseDiv.appendChild(verseTextSpan);
    container.appendChild(verseDiv);
  }

  // Always update chapter indicator to reflect current state
  updateChapterIndicator();
  updateNavigationButtons();

  // Trigger fade-in animation, then scroll to top
  runChapterFadeIn();
  scrollToReadingTop();

  // Save the reading state after displaying
  saveReadingState(currentBook, currentChapter);

  // Log reading event for history tracking
  logCurrentChapterReading();

  // Update the simple "Current Book" reading plan and its UI
  updateCurrentBookPlan();
  updateCurrentPlanStatusUI();
  updateCurrentPlanActionUI();

  // Update "Last read" hint in header
  updateLastReadHint();

  // Handle parallel view loading
  if (isParallelEnabled()) {
    loadParallelChapter(currentBook, chapterNum);
  }
}

/**
 * Load chapter content into parallel view panes
 * @param {string} bookName - Book name (e.g., 'John')
 * @param {number} chapter - Chapter number
 */
async function loadParallelChapter(bookName, chapter) {
  const primaryContainer = document.getElementById('primaryVersesContainer');
  const secondaryContainer = document.getElementById('secondaryVersesContainer');

  if (!primaryContainer || !secondaryContainer) {
    console.error('[Parallel] Pane containers not found');
    return;
  }

  const primaryVersionId = getCurrentVersionId();
  const secondaryVersionId = getSecondaryVersionId();

  console.log('[Parallel] Loading chapter:', bookName, chapter);
  console.log('[Parallel] Primary:', primaryVersionId, 'Secondary:', secondaryVersionId);

  // Update headers with version names
  updateParallelHeaders();

  // Load both versions in parallel
  await Promise.all([
    loadVersesToContainer(bookName, chapter, primaryVersionId, primaryContainer),
    loadVersesToContainer(bookName, chapter, secondaryVersionId, secondaryContainer)
  ]);

  // Re-initialize scroll sync after content loads
  initParallelScrollSync();
  console.log('[Parallel] Chapter loaded, scroll sync initialized');
}

// Update the chapter indicator text
function updateChapterIndicator(book = null) {
  const bookName = book ? book.name : currentBook;
  const chapters = book ? book.chapters : totalChapters;
  document.getElementById('chapterIndicator').textContent = `${bookName} ${currentChapter} of ${chapters}`;
}

// Update navigation button states
function updateNavigationButtons() {
  const chapters = Object.keys(bookData || {}).length || totalChapters;
  document.getElementById('prevBtn').disabled = currentChapter === 1;
  document.getElementById('nextBtn').disabled = currentChapter === chapters;
}

// ========================================
// Body Scroll Lock (for modals)
// ========================================

let savedScrollY = 0;

/**
 * Lock body scroll when a modal opens.
 * Saves current scroll position and applies body.modal-open class.
 * Idempotent: safe to call multiple times (for modal-to-modal transitions).
 */
function lockBodyScroll() {
  // Already locked? Don't overwrite saved position
  if (document.body.classList.contains('modal-open')) return;
  savedScrollY = window.scrollY;
  document.body.classList.add('modal-open');
  document.body.style.top = `-${savedScrollY}px`;
}

/**
 * Unlock body scroll when a modal closes.
 * Removes body.modal-open class and restores scroll position.
 */
function unlockBodyScroll() {
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}

// Navigation functions

/**
 * Trigger a subtle fade-in animation on the chapter content container.
 * Respects prefers-reduced-motion: skips animation if user prefers reduced motion.
 * Called from displayChapter() after DOM is updated.
 */
function runChapterFadeIn() {
  // Skip if user prefers reduced motion (CSS also handles this, but avoid class toggling)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const container = document.getElementById('versesContainer');
  if (!container) {
    return;
  }

  // Remove class to reset animation state
  container.classList.remove('chapter-fade-in');

  // Force reflow to restart animation
  void container.offsetWidth;

  // Add class to trigger animation
  container.classList.add('chapter-fade-in');
}

/**
 * Scroll to the top of the reading area after chapter change.
 * Respects prefers-reduced-motion: uses instant jump if user prefers reduced motion,
 * otherwise uses smooth scrolling.
 */
function scrollToReadingTop() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = prefersReducedMotion ? 'instant' : 'smooth';

  const chapterIndicator = document.getElementById('chapterIndicator');
  if (chapterIndicator) {
    // Scroll to the chapter indicator (sits between header and sticky nav)
    chapterIndicator.scrollIntoView({ behavior: behavior, block: 'start' });
  } else {
    // Fallback to top of page if indicator not found
    window.scrollTo({ top: 0, behavior: behavior });
  }
}

function previousChapter() {
  if (currentChapter > 1) {
    displayChapter(currentChapter - 1);
  }
}

function nextChapter() {
  if (currentChapter < totalChapters) {
    displayChapter(currentChapter + 1);
  }
}

/**
 * Restore reading state on app initialization
 * - Attempts to load saved book and chapter
 * - Validates that book exists in booksJson before loading
 * - Falls back to John 1 if validation fails
 */
async function restoreReadingState() {
  const savedState = loadReadingState();

  if (savedState && savedState.book && savedState.chapter) {
    // Wait for booksJson to be loaded
    if (!booksJson) {
      // booksJson not ready yet, retry after a short delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Validate that the book exists in our books list
    const bookExists = booksJson && booksJson.books.some(b => b.name === savedState.book);

    if (bookExists) {
      // Find the book object and load it
      const bookObj = booksJson.books.find(b => b.name === savedState.book);
      try {
        // Update current state
        currentBook = bookObj.name;
        currentBookData = bookObj;
        totalChapters = bookObj.chapters;

        // Validate chapter number is within range
        if (savedState.chapter >= 1 && savedState.chapter <= bookObj.chapters) {
          currentChapter = savedState.chapter;
        } else {
          currentChapter = 1;
        }

        // Load the book data
        const dataPath = './' + getCurrentDataPath();
        const bookPath = dataPath + bookObj.filename;
        const response = await fetch(bookPath);
        console.log('Restoring book from:', new URL(bookPath, window.location.href).href);
        if (!response.ok) {
          throw new Error('Failed to load book');
        }
        bookData = await response.json();

        // Display the saved chapter
        displayChapter(currentChapter);
        console.log(`Restored: ${currentBook} ${currentChapter}`);
      } catch (error) {
        console.warn('Failed to restore reading state, using default:', error);
        // Fall back to loading John 1
        loadBibleData();
      }
    } else {
      console.warn('Saved book not found in books list, using default');
      // Fall back to loading John 1
      loadBibleData();
    }
  } else {
    // No saved state, load default (John 1)
    loadBibleData();
  }
}

// Keyboard event handling for accessibility
document.addEventListener('keydown', function(event) {
  // ESC key closes modals or clears search
  if (event.key === 'Escape') {
    const bookModal = document.getElementById('bookModalOverlay');
    const chapterModal = document.getElementById('chapterModalOverlay');
    const bookmarksModal = document.getElementById('bookmarksModalOverlay');
    const historyModal = document.getElementById('historyModalOverlay');
    const versionManager = document.getElementById('versionManagerOverlay');
    const settingsModal = document.getElementById('settingsModalOverlay');
    const whatsNewModal = document.getElementById('whatsNewOverlay');
    const parallelVersionModal = document.getElementById('parallelVersionModalOverlay');
    const searchInput = document.getElementById('chapterSearchInput');

    if (parallelVersionModal && parallelVersionModal.classList.contains('open')) {
      closeParallelVersionModal();
      event.preventDefault();
    } else if (whatsNewModal && whatsNewModal.classList.contains('active')) {
      closeWhatsNewModal();
      event.preventDefault();
    } else if (settingsModal && settingsModal.classList.contains('active')) {
      closeSettingsModal();
      event.preventDefault();
    } else if (versionManager && versionManager.classList.contains('active')) {
      closeVersionManager();
      event.preventDefault();
    } else if (historyModal && historyModal.classList.contains('active')) {
      closeReadingHistory();
      event.preventDefault();
    } else if (bookModal.classList.contains('active')) {
      closeBookSelector();
      event.preventDefault();
    } else if (chapterModal.classList.contains('active')) {
      closeChapterSelector();
      event.preventDefault();
    } else if (bookmarksModal.classList.contains('active')) {
      closeBookmarksModal();
      event.preventDefault();
    } else if (searchInput.value.trim()) {
      // If search has content, clear it
      clearChapterSearch();
      event.preventDefault();
    }
  }
});

// Initialize the app
loadBooksJson();
// Restore reading state instead of always loading John 1
restoreReadingState();
// Initialize "Last read" hint from stored history
updateLastReadHint();
// Initialize welcome banner for first-time users
initWelcomeBanner();
// Initialize parallel view state (show/hide containers based on saved preference)
if (isParallelEnabled()) {
  showParallelView();
}
// Show What's New modal if version changed
if (shouldShowWhatsNew()) {
  openWhatsNewModal();
}

// ========================================
// Chapter Search Functionality
// ========================================

/**
 * Helper function to escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for regex
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Perform search within the current chapter
 * Finds ALL matches across ALL verses and stores them with their location
 */
function performChapterSearch() {
  const searchInput = document.getElementById('chapterSearchInput');
  const searchTerm = searchInput.value.trim();

  // Clear previous results
  clearSearchHighlights();
  searchMatches = [];
  currentMatchIndex = 0;

  if (!searchTerm) {
    document.getElementById('searchResults').textContent = '';
    document.getElementById('searchNavigation').style.display = 'none';
    document.getElementById('searchBtn').style.display = 'inline-flex';
    document.getElementById('clearSearchBtn').style.display = 'none';
    return;
  }

  // Hide search button, show clear button
  document.getElementById('searchBtn').style.display = 'none';
  document.getElementById('clearSearchBtn').style.display = 'inline-flex';

  // Build regex for case-insensitive matching
  const regex = new RegExp(escapeRegex(searchTerm), 'gi');

  // Search through ALL verse-text elements
  const container = document.getElementById('versesContainer');
  const verses = container.querySelectorAll('.verse-text');

  verses.forEach((verseElement) => {
    const text = verseElement.textContent;
    let match;

    // Reset regex.lastIndex for global flag to work correctly in loop
    regex.lastIndex = 0;

    // Find ALL matches within this verse text
    while ((match = regex.exec(text)) !== null) {
      searchMatches.push({
        element: verseElement,
        verseText: text,
        matchText: match[0],
        startIndex: match.index,
        length: match[0].length
      });
    }
  });

  // Update UI based on results
  if (searchMatches.length === 0) {
    document.getElementById('searchResults').textContent = `No matches found for "${searchTerm}"`;
    document.getElementById('searchNavigation').style.display = 'none';
  } else {
    // Highlight first match and navigate to it
    highlightMatch(0);
    updateSearchResultsDisplay(searchTerm);
    document.getElementById('searchNavigation').style.display = 'flex';
  }
}

/**
 * Highlight a specific match by index
 * Updates the .verse-text HTML with all matches, marking only the current one with .search-highlight-current
 * @param {number} index - The match index to highlight
 */
function highlightMatch(index) {
  if (index < 0 || index >= searchMatches.length) return;

  currentMatchIndex = index;
  const currentMatch = searchMatches[index];

  // Get the search term to rebuild the verse with highlights
  const searchTerm = document.getElementById('chapterSearchInput').value.trim();
  const regex = new RegExp(escapeRegex(searchTerm), 'gi');

  // Process each unique verse element that has matches
  const processedElements = new Set();

  searchMatches.forEach((match, matchIndex) => {
    if (!processedElements.has(match.element)) {
      processedElements.add(match.element);

      const verseText = match.verseText;
      let html = '';
      let lastIndex = 0;

      // Split text by all matches and build HTML
      let regexMatch;
      regex.lastIndex = 0;
      const parts = [];

      while ((regexMatch = regex.exec(verseText)) !== null) {
        // Add text before this match
        if (regexMatch.index > lastIndex) {
          parts.push({
            type: 'text',
            content: verseText.substring(lastIndex, regexMatch.index)
          });
        }

        // Check if this is the current match being highlighted
        const isCurrentMatch = match.element === currentMatch.element &&
          regexMatch.index === currentMatch.startIndex;

        parts.push({
          type: 'match',
          content: regexMatch[0],
          isCurrent: isCurrentMatch
        });

        lastIndex = regexMatch.index + regexMatch[0].length;
      }

      // Add remaining text
      if (lastIndex < verseText.length) {
        parts.push({
          type: 'text',
          content: verseText.substring(lastIndex)
        });
      }

      // Build HTML from parts
      match.element.innerHTML = '';
      parts.forEach(part => {
        if (part.type === 'text') {
          match.element.appendChild(document.createTextNode(part.content));
        } else {
          const span = document.createElement('span');
          span.className = part.isCurrent ? 'search-highlight-current' : 'search-highlight';
          span.textContent = part.content;
          match.element.appendChild(span);
        }
      });
    }
  });

  // Scroll the current match into view
  const currentMatchSpan = currentMatch.element.querySelector('.search-highlight-current');
  if (currentMatchSpan) {
    currentMatchSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    currentMatch.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Update navigation display
  document.getElementById('matchPosition').textContent = `${index + 1} of ${searchMatches.length}`;

  // Update navigation button states
  document.getElementById('prevMatchBtn').disabled = index === 0;
  document.getElementById('nextMatchBtn').disabled = index === searchMatches.length - 1;
}

/**
 * Go to previous search match with wraparound
 */
function goToPreviousMatch() {
  if (searchMatches.length === 0) return;

  let newIndex = currentMatchIndex - 1;
  // Wrap around to end if at beginning
  if (newIndex < 0) {
    newIndex = searchMatches.length - 1;
  }

  highlightMatch(newIndex);
}

/**
 * Go to next search match with wraparound
 */
function goToNextMatch() {
  if (searchMatches.length === 0) return;

  let newIndex = currentMatchIndex + 1;
  // Wrap around to beginning if at end
  if (newIndex >= searchMatches.length) {
    newIndex = 0;
  }

  highlightMatch(newIndex);
}

/**
 * Clear all search highlights and reset search state
 */
function clearChapterSearch() {
  clearSearchHighlights();
  document.getElementById('chapterSearchInput').value = '';
  document.getElementById('searchResults').textContent = '';
  document.getElementById('searchNavigation').style.display = 'none';
  document.getElementById('searchBtn').style.display = 'inline-flex';
  document.getElementById('clearSearchBtn').style.display = 'none';
  searchMatches = [];
  currentMatchIndex = 0;
  lastSearchTerm = '';
  searchActive = false;
}

/**
 * Remove all search highlights from verse text
 * Replaces .search-highlight and .search-highlight-current spans with plain text nodes
 */
function clearSearchHighlights() {
  const highlights = document.querySelectorAll('.search-highlight, .search-highlight-current');
  highlights.forEach(highlight => {
    const text = highlight.textContent;
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(text), highlight);
      // Merge adjacent text nodes to restore original structure
      parent.normalize();
    }
  });
}

/**
 * Update search results display with match count
 * @param {string} searchTerm - The search term
 */
function updateSearchResultsDisplay(searchTerm) {
  const resultText = searchMatches.length === 1
    ? `1 match found for "${searchTerm}"`
    : `${searchMatches.length} matches found for "${searchTerm}"`;
  document.getElementById('searchResults').textContent = resultText;
}

// Set up Enter key handler for search input with smart navigation
const searchInput = document.getElementById('chapterSearchInput');
if (searchInput) {
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      const searchTerm = searchInput.value.trim();

      if (!searchTerm) {
        return; // Do nothing if empty
      }

      // Check if this is a new search or continuation
      const isNewSearch = searchTerm !== lastSearchTerm || !searchActive;

      if (isNewSearch) {
        // Perform new search
        performChapterSearch();
        lastSearchTerm = searchTerm;
        searchActive = searchMatches.length > 0;
      } else {
        // Navigate existing matches
        if (event.shiftKey) {
          goToPreviousMatch();
        } else {
          goToNextMatch();
        }
      }
    }
  });
}

// ========================================
// Back to Top Button Functionality
// ========================================

/**
 * Scroll to the top of the page (for back-to-top button).
 * Respects prefers-reduced-motion.
 */
function scrollToTop() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
}

// Show/hide back-to-top button based on scroll position
window.addEventListener('scroll', () => {
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    if (window.scrollY > 400) {
      backToTopBtn.style.display = 'inline-flex';
    } else {
      backToTopBtn.style.display = 'none';
    }
  }
});

// ========================================
// Parallel View Back-to-Top
// ========================================

/**
 * Scroll both parallel panes to top.
 * Respects prefers-reduced-motion.
 */
function scrollParallelPanesToTop() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const leftPane = document.querySelector('.parallel-pane.left-pane');
  const rightPane = document.querySelector('.parallel-pane.right-pane');

  if (leftPane) {
    leftPane.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  }
  if (rightPane) {
    rightPane.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  }
}

/**
 * Initialize scroll listeners for parallel panes to show/hide back-to-top button.
 * Called when parallel view is enabled.
 */
function initParallelBackToTop() {
  const leftPane = document.querySelector('.parallel-pane.left-pane');
  const rightPane = document.querySelector('.parallel-pane.right-pane');
  const backToTopBtn = document.getElementById('parallelBackToTopBtn');

  if (!leftPane || !rightPane || !backToTopBtn) return;

  const updateButtonVisibility = () => {
    // Show if either pane is scrolled down more than 200px
    const shouldShow = leftPane.scrollTop > 200 || rightPane.scrollTop > 200;
    backToTopBtn.style.display = shouldShow ? 'flex' : 'none';
  };

  // Add scroll listeners to both panes
  leftPane.addEventListener('scroll', updateButtonVisibility);
  rightPane.addEventListener('scroll', updateButtonVisibility);

  // Initial check
  updateButtonVisibility();
}

/**
 * Hide parallel back-to-top button (called when parallel view is disabled).
 */
function hideParallelBackToTop() {
  const backToTopBtn = document.getElementById('parallelBackToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.style.display = 'none';
  }
}

// ========================================
// Settings Modal & Backup/Restore
// ========================================

/**
 * Render the reading plans list in the Settings modal.
 * Shows plan cards with active badge and progress info.
 */
function renderReadingPlansList() {
  const container = document.getElementById('readingPlansList');
  if (!container) {
    return;
  }

  // Clear previous content
  container.innerHTML = '';

  // Check if BibleReading API is available
  if (!window.BibleReading || typeof BibleReading.getPlans !== 'function') {
    const errorP = document.createElement('p');
    errorP.className = 'reading-plans-empty';
    errorP.textContent = 'Reading plans are not available right now.';
    container.appendChild(errorP);
    return;
  }

  const allPlans = BibleReading.getPlans();
  const currentPlanId = BibleReading.getCurrentPlanId();
  const plansArray = Object.values(allPlans);

  // Empty state (shouldn't happen now that we have builtins)
  if (plansArray.length === 0) {
    const emptyP = document.createElement('p');
    emptyP.className = 'reading-plans-empty';
    emptyP.textContent = "No reading plans yet. Start reading a book and we'll track your progress automatically.";
    container.appendChild(emptyP);
    return;
  }

  // Explicit sort for cross-device consistency:
  // 1. Active plan first (if exists)
  // 2. Remaining plans alphabetically by name
  const activePlan = currentPlanId ? allPlans[currentPlanId] : null;
  const otherPlans = plansArray
    .filter(p => p.id !== currentPlanId)
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
  const sortedPlans = activePlan ? [activePlan, ...otherPlans] : otherPlans;

  // Render each plan as a card (in sorted order)
  sortedPlans.forEach(plan => {
    const planId = plan.id;
    const isActive = planId === currentPlanId;

    const card = document.createElement('div');
    card.className = 'reading-plan-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', (plan.name || planId) + (isActive ? ' (Active)' : ''));

    // Header row with title and optional Active badge
    const header = document.createElement('div');
    header.className = 'reading-plan-header';

    const title = document.createElement('span');
    title.className = 'reading-plan-title';
    title.textContent = plan.name || planId;
    header.appendChild(title);

    if (isActive) {
      const badge = document.createElement('span');
      badge.className = 'reading-plan-badge-active';
      badge.textContent = 'Active';
      header.appendChild(badge);
    }

    card.appendChild(header);

    // Meta line with progress info or description
    const meta = document.createElement('p');
    meta.className = 'reading-plan-meta';

    if (planId === 'current-book' && plan.config && plan.progress) {
      // Special handling for current-book plan
      const bookId = plan.config.bookId;
      const totalChapters = plan.config.totalChapters;
      const lastChapter = plan.progress.lastChapter;

      if (bookId && totalChapters && lastChapter) {
        meta.textContent = `Book: ${bookId} • Last: ${lastChapter} / ${totalChapters}`;
      } else if (bookId) {
        meta.textContent = `Book: ${bookId}`;
      } else {
        meta.textContent = 'Tracks your current book automatically.';
      }
    } else if (plan.meta) {
      // Built-in plans with meta string
      meta.textContent = plan.meta;
    } else if (plan.description) {
      // Fallback to description (truncate if long)
      const desc = plan.description;
      meta.textContent = desc.length > 60 ? desc.substring(0, 57) + '...' : desc;
    } else {
      meta.textContent = 'Custom reading plan.';
    }

    card.appendChild(meta);

    // Click handler - switch to this plan
    const handlePlanClick = () => {
      const currentId = BibleReading.getCurrentPlanId();

      // Already on this plan? No-op with friendly message
      if (planId === currentId) {
        showToast('Already on this plan—keep reading!');
        return;
      }

      // Switch to the new plan
      BibleReading.setCurrentPlanId(planId);

      // Reset progress: For v1, clear all events when switching to a builtin plan
      // (current-book keeps events since it tracks whatever you're reading)
      if (plan.isBuiltin && planId !== 'current-book') {
        BibleReading.clearReadingEvents();
        showToast(`Switched to ${plan.name}! Journey reset—start fresh.`);
      } else {
        showToast(`Switched to ${plan.name}!`);
      }

      // Re-render to update the Active badge
      renderReadingPlansList();
    };

    card.addEventListener('click', handlePlanClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePlanClick();
      }
    });

    container.appendChild(card);
  });
}

// ========================================
// Settings Accordion State (Single-Open Mode)
// ========================================
const SETTINGS_EXPANDED_KEY = 'bibleReader.settingsExpanded';
const SETTINGS_DEFAULT_SECTION = 'reading-prefs';

// Track currently active section (module-level for access across functions)
let _currentActiveSection = null;

// Valid section IDs for validation
const VALID_SECTION_IDS = ['reading-prefs', 'reading-plans', 'backup-restore', 'manage-versions', 'appearance'];

/**
 * Get persisted active accordion section
 * Handles migration from old array format to new string format.
 * @returns {string|null} Active section ID or null
 */
function getActiveSection() {
  const stored = localStorage.getItem(SETTINGS_EXPANDED_KEY);
  if (!stored) return null;

  // Handle legacy array format: '["reading-prefs"]' or '["reading-prefs","backup-restore"]'
  if (stored.startsWith('[')) {
    try {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr) && arr.length > 0 && VALID_SECTION_IDS.includes(arr[0])) {
        // Migrate to new format
        const firstSection = arr[0];
        localStorage.setItem(SETTINGS_EXPANDED_KEY, firstSection);
        return firstSection;
      }
    } catch {
      // Invalid JSON, clear it
      localStorage.removeItem(SETTINGS_EXPANDED_KEY);
      return null;
    }
  }

  // Validate stored value is a known section ID
  if (VALID_SECTION_IDS.includes(stored)) {
    return stored;
  }

  // Invalid value, clear and return null
  localStorage.removeItem(SETTINGS_EXPANDED_KEY);
  return null;
}

/**
 * Save active accordion section to localStorage
 * @param {string|null} sectionId - Section ID or null to clear
 */
function saveActiveSection(sectionId) {
  if (sectionId) {
    localStorage.setItem(SETTINGS_EXPANDED_KEY, sectionId);
  } else {
    localStorage.removeItem(SETTINGS_EXPANDED_KEY);
  }
}

/**
 * Collapse a specific accordion section
 * @param {string} targetId - Section ID to collapse
 */
function collapseSection(targetId) {
  // Validate targetId before using in selector
  if (!targetId || !VALID_SECTION_IDS.includes(targetId)) {
    console.warn('[Accordion] Invalid targetId for collapse:', targetId);
    return;
  }
  const header = document.querySelector(`[data-target="${targetId}"]`);
  const content = document.getElementById(targetId);
  if (header && content) {
    header.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Expand a specific accordion section
 * @param {string} targetId - Section ID to expand
 * @param {boolean} scroll - Whether to scroll to header
 */
function expandSection(targetId, scroll = true) {
  // Validate targetId before using in selector
  if (!targetId || !VALID_SECTION_IDS.includes(targetId)) {
    console.warn('[Accordion] Invalid targetId for expand:', targetId);
    return;
  }
  const header = document.querySelector(`[data-target="${targetId}"]`);
  const content = document.getElementById(targetId);
  if (header && content) {
    header.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-expanded', 'true');
    if (scroll) {
      setTimeout(() => {
        header.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }
}

/**
 * Toggle accordion section (single-open mode)
 * Clicking a new section closes any open one first.
 * Clicking the active section collapses it (all closed).
 * @param {string} targetId - Section ID to toggle
 */
function toggleAccordionSection(targetId) {
  // Validate targetId
  if (!targetId || !VALID_SECTION_IDS.includes(targetId)) {
    console.warn('[Accordion] Invalid targetId for toggle:', targetId);
    return;
  }

  if (targetId === _currentActiveSection) {
    // Toggle off: collapse active section
    collapseSection(targetId);
    _currentActiveSection = null;
    saveActiveSection(null);
  } else {
    // Close current if any, then open new
    if (_currentActiveSection) {
      collapseSection(_currentActiveSection);
    }
    expandSection(targetId);
    _currentActiveSection = targetId;
    saveActiveSection(targetId);
  }
}

/**
 * Initialize accordion behavior for settings modal (single-open mode)
 * Only one section can be expanded at a time.
 */
function initSettingsAccordion() {
  const headers = document.querySelectorAll('.accordion-header');

  // Get persisted or default section
  const savedSection = getActiveSection();
  const initialSection = savedSection || SETTINGS_DEFAULT_SECTION;

  // Reset all sections to collapsed first
  headers.forEach(header => {
    const targetId = header.dataset.target;
    const content = document.getElementById(targetId);
    if (!content) return;

    header.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-expanded', 'false');

    // Remove existing listeners (prevent duplicates on re-open)
    header.removeEventListener('click', header._accordionClickHandler);
    header.removeEventListener('keydown', header._accordionKeyHandler);

    // Add click handler
    header._accordionClickHandler = () => toggleAccordionSection(targetId);
    header.addEventListener('click', header._accordionClickHandler);

    // Keyboard accessibility
    header.setAttribute('tabindex', '0');
    header._accordionKeyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordionSection(targetId);
      }
    };
    header.addEventListener('keydown', header._accordionKeyHandler);
  });

  // Expand initial section (without scroll on first load)
  _currentActiveSection = null; // Reset tracking

  // Validate initialSection before using in selector
  const validInitial = initialSection && VALID_SECTION_IDS.includes(initialSection) ? initialSection : SETTINGS_DEFAULT_SECTION;

  if (validInitial) {
    const initialHeader = document.querySelector(`[data-target="${validInitial}"]`);
    if (initialHeader) {
      expandSection(validInitial, false);
      _currentActiveSection = validInitial;
    } else if (headers.length > 0) {
      // Fallback to first section if saved one doesn't exist
      const firstId = headers[0].dataset.target;
      if (firstId && VALID_SECTION_IDS.includes(firstId)) {
        expandSection(firstId, false);
        _currentActiveSection = firstId;
      }
    }
  }

  // ToC navigation (single-open mode)
  const tocLinks = document.querySelectorAll('.settings-toc .toc-link');
  tocLinks.forEach(link => {
    link.removeEventListener('click', link._tocClickHandler);
    link._tocClickHandler = (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);

      // Validate targetId before using in selector
      if (!targetId || !VALID_SECTION_IDS.includes(targetId)) {
        console.warn('[Accordion] Invalid ToC targetId:', targetId);
        return;
      }

      const header = document.querySelector(`[data-target="${targetId}"]`);
      if (header) {
        // If not already active, switch to it
        if (_currentActiveSection !== targetId) {
          toggleAccordionSection(targetId);
        }
        // Scroll to header
        setTimeout(() => {
          header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    };
    link.addEventListener('click', link._tocClickHandler);
  });
}

/**
 * Update theme toggle button in Settings to reflect current theme
 */
function updateSettingsThemeButton() {
  const btn = document.getElementById('settingsThemeToggle');
  if (!btn) return;

  const isDark = document.body.classList.contains(THEME_DARK);
  const icon = btn.querySelector('.theme-icon');
  if (icon) {
    icon.textContent = isDark ? '🌙' : '☀️';
  }
}

/**
 * Open the settings modal
 */
function openSettingsModal() {
  lockBodyScroll();
  // Render reading plans list fresh each time
  renderReadingPlansList();
  // Initialize line height slider with current value
  initLineHeightSlider();
  // Initialize parallel view toggle state
  initParallelView();
  // Initialize accordion behavior
  initSettingsAccordion();
  // Update theme button state
  updateSettingsThemeButton();

  document.getElementById('settingsModalOverlay').classList.add('active');
  // Focus the first accordion header for keyboard navigation
  setTimeout(() => {
    const firstHeader = document.querySelector('.accordion-header');
    if (firstHeader) firstHeader.focus();
  }, 0);
}

/**
 * Close the settings modal
 * @param {Event} event - Optional event object from click handler
 */
function closeSettingsModal(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById('settingsModalOverlay').classList.remove('active');
    unlockBodyScroll();
    // Return focus to settings button
    const settingsBtn = document.querySelector('.settings-header-btn');
    if (settingsBtn) settingsBtn.focus();
  }
}

/**
 * Open the hidden file input to select a backup file
 */
function openBackupFilePicker() {
  const fileInput = document.getElementById('backupFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Handle file selection for backup restore
 * @param {Event} event - The file input change event
 */
function handleBackupFileSelected(event) {
  const fileInput = event.target;
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const content = e.target.result;
      const backup = JSON.parse(content);

      // Validate the backup structure
      if (!backup || typeof backup !== 'object') {
        alert('This file does not look like a valid Bible Reader backup.');
        return;
      }

      // Check appId
      if (backup.appId !== 'yahtsar-bible-reader') {
        alert('This file does not look like a valid Bible Reader backup.');
        return;
      }

      // Check schemaVersion is a number
      if (typeof backup.schemaVersion !== 'number') {
        alert('This file does not look like a valid Bible Reader backup.');
        return;
      }

      // Check data is an object
      if (!backup.data || typeof backup.data !== 'object') {
        alert('This file does not look like a valid Bible Reader backup.');
        return;
      }

      // Ask for confirmation
      const ok = window.confirm(
        'Restoring a backup will overwrite your current Bible Reader data (reading progress, history, preferences) on this device. Continue?'
      );

      if (!ok) {
        return;
      }

      // Clear existing localStorage keys that start with "bibleReader."
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bibleReader.')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Write all keys from backup.data into localStorage
      for (const key in backup.data) {
        if (Object.prototype.hasOwnProperty.call(backup.data, key)) {
          localStorage.setItem(key, backup.data[key]);
        }
      }

      // Show success message and reload
      alert('Backup restored successfully. The app will now reload.');
      window.location.reload();

    } catch (err) {
      console.error('Error parsing backup file:', err);
      alert('This file does not look like a valid Bible Reader backup.');
    }
  };

  reader.onerror = function() {
    console.error('Error reading backup file');
    alert('Sorry, something went wrong while reading the backup file.');
  };

  reader.readAsText(file);

  // Clear the file input value so the same file can be re-selected later
  fileInput.value = '';
}

/**
 * Export all Bible Reader data as a JSON backup file
 */
function exportBibleBackup() {
  try {
    const backup = {
      appId: 'yahtsar-bible-reader',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {}
    };

    // Collect all localStorage keys that start with "bibleReader."
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bibleReader.')) {
        backup.data[key] = localStorage.getItem(key);
      }
    }

    // Check if there's any data to export
    if (Object.keys(backup.data).length === 0) {
      alert('No Bible Reader data found to export. You can still save this file as a starting point.');
    }

    // Create the JSON blob
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = 'bible-reader-backup-' + timestamp + '.json';

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Error creating backup:', err);
    alert('Sorry, something went wrong while creating the backup.');
  }
}

// ========================================
// Welcome Banner (First-time users)
// ========================================

/**
 * Check if the welcome banner should be shown
 * @returns {boolean} True if banner should be shown
 */
function shouldShowWelcomeBanner() {
  try {
    const value = localStorage.getItem(WELCOME_SEEN_KEY);
    return value !== 'true';
  } catch (e) {
    // If localStorage is blocked, just show it once per session
    console.warn('[WelcomeBanner] localStorage unavailable, showing banner without persistence.', e);
    return true;
  }
}

/**
 * Initialize the welcome banner - show if user hasn't seen it before
 */
function initWelcomeBanner() {
  const banner = document.getElementById('welcomeBanner');
  if (!banner) return;

  if (shouldShowWelcomeBanner()) {
    banner.classList.add('active');
  } else {
    banner.classList.remove('active');
  }
}

/**
 * Dismiss the welcome banner and persist the dismissal
 */
function dismissWelcomeBanner() {
  const banner = document.getElementById('welcomeBanner');
  if (banner) {
    banner.classList.remove('active');
  }
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, 'true');
  } catch (e) {
    console.warn('[WelcomeBanner] Failed to persist welcome state:', e);
  }
}

// Make dismissWelcomeBanner available globally for onclick handlers
window.dismissWelcomeBanner = dismissWelcomeBanner;

// ========================================
// What's New Modal (Version change notifications)
// ========================================

/**
 * Get the last version the user has seen
 * @returns {string|null} Last seen version or null
 */
function getLastSeenVersion() {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch (e) {
    console.warn('[WhatsNew] Unable to read last seen version:', e);
    return null;
  }
}

/**
 * Store the last seen version
 * @param {string} version - Version to store
 */
function setLastSeenVersion(version) {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch (e) {
    console.warn('[WhatsNew] Unable to store last seen version:', e);
  }
}

/**
 * Check if we should show the What's New modal
 * @returns {boolean} True if version has changed
 */
function shouldShowWhatsNew() {
  const last = getLastSeenVersion();
  return last !== APP_VERSION;
}

/**
 * Open the What's New modal
 */
function openWhatsNewModal() {
  lockBodyScroll();
  const overlay = document.getElementById('whatsNewOverlay');
  if (!overlay) return;
  overlay.classList.add('active');

  // Focus first focusable button for accessibility
  setTimeout(function() {
    const btn = overlay.querySelector('.whats-new-primary, .whats-new-close');
    if (btn) btn.focus();
  }, 0);
}

/**
 * Close the What's New modal and mark version as seen
 */
function closeWhatsNewModal() {
  const overlay = document.getElementById('whatsNewOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  unlockBodyScroll();
  setLastSeenVersion(APP_VERSION);
}

/**
 * Open What's New modal from Settings modal (closes Settings first)
 * Ensures only one modal is visible at a time
 */
function openWhatsNewFromSettings() {
  // Close Settings modal first
  document.getElementById('settingsModalOverlay').classList.remove('active');
  // Then open What's New
  openWhatsNewModal();
}

// Expose open/close on window for onclick handlers
window.openWhatsNewModal = openWhatsNewModal;
window.closeWhatsNewModal = closeWhatsNewModal;
window.openWhatsNewFromSettings = openWhatsNewFromSettings;

// ========================================
// Modal Overscroll Prevention
// ========================================

/**
 * Initialize overscroll prevention for all modal content areas.
 * Prevents scroll momentum from bleeding through to body when
 * user flings past top/bottom of modal content.
 */
function initModalOverscrollPrevention() {
  // All modal overlays in the app
  const modalSelectors = [
    '#bookModalOverlay',
    '#chapterModalOverlay',
    '#bookmarksModalOverlay',
    '#historyModalOverlay',
    '#versionManagerOverlay',
    '#settingsModalOverlay',
    '#whatsNewOverlay',
    '#parallelVersionModalOverlay'
  ];

  // Content selectors within modals (the scrollable areas)
  const contentSelectors = [
    '.book-modal',
    '.chapter-modal',
    '.bookmarks-modal',
    '.history-modal',
    '.version-manager-modal',
    '.settings-modal',
    '.whats-new-modal',
    '.parallel-version-modal'
  ];

  // Apply to all modal content areas
  contentSelectors.forEach(selector => {
    const content = document.querySelector(selector);
    if (content) {
      setupOverscrollPrevention(content);
    }
  });

  // Also apply to modal bodies (scrollable inner areas)
  const scrollableAreas = document.querySelectorAll(
    '.settings-modal-body, .whats-new-content, .version-manager-content, ' +
    '.bookmarks-list, .history-list, .parallel-version-modal-body'
  );
  scrollableAreas.forEach(area => {
    setupOverscrollPrevention(area);
  });

  console.log('[Overscroll] Modal prevention initialized');
}

/**
 * Setup overscroll prevention for a single scrollable element.
 * Only prevents scroll events at boundaries (edge flings) - allows
 * normal scrolling inside the element.
 * @param {HTMLElement} element - The scrollable element
 */
function setupOverscrollPrevention(element) {
  if (!element || element.dataset.overscrollPrevented) return;

  let startY = 0;

  element.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    // Only apply edge prevention if content is scrollable
    const isScrollable = element.scrollHeight > element.clientHeight + 1;
    if (!isScrollable) return; // Let touch events flow naturally

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    // Check if at scroll boundaries
    const isAtTop = element.scrollTop <= 0;
    const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;

    // Trying to scroll up when at top, or down when at bottom
    const scrollingUp = deltaY > 0;
    const scrollingDown = deltaY < 0;

    // Only prevent at the actual boundary edge flings
    if ((isAtTop && scrollingUp) || (isAtBottom && scrollingDown)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false });

  // Wheel events: Only prevent at boundaries when content IS scrollable
  element.addEventListener('wheel', (e) => {
    // Only apply edge prevention if content is scrollable
    const isScrollable = element.scrollHeight > element.clientHeight + 1;
    if (!isScrollable) return; // Let wheel events flow naturally

    const isAtTop = element.scrollTop <= 0;
    const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;

    const scrollingUp = e.deltaY < 0;
    const scrollingDown = e.deltaY > 0;

    // Only prevent at the actual boundary edge flings
    if ((isAtTop && scrollingUp) || (isAtBottom && scrollingDown)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false });

  element.dataset.overscrollPrevented = 'true';
}

/**
 * Initialize overscroll prevention for parallel view panes.
 * Prevents scroll from bleeding to body when at pane boundaries.
 */
function initParallelPaneOverscrollPrevention() {
  const leftPane = document.querySelector('.parallel-pane.left-pane');
  const rightPane = document.querySelector('.parallel-pane.right-pane');

  if (leftPane) setupOverscrollPrevention(leftPane);
  if (rightPane) setupOverscrollPrevention(rightPane);

  console.log('[Overscroll] Parallel pane prevention initialized');
}

// Initialize overscroll prevention when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initModalOverscrollPrevention();
  initParallelPaneOverscrollPrevention();
});

// Also run immediately in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
  initModalOverscrollPrevention();
  initParallelPaneOverscrollPrevention();
}

// ========================================
// Service Worker Registration
// ========================================

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.error('SW registration failed', err));
}
