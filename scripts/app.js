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

  // Update toggle button text and aria-label
  const toggleBtn = document.getElementById('themeToggle');
  if (theme === THEME_DARK) {
    toggleBtn.textContent = '☀ Light';
    toggleBtn.setAttribute('aria-label', 'Switch to light theme');
  } else {
    toggleBtn.textContent = '🌙 Dark';
    toggleBtn.setAttribute('aria-label', 'Switch to dark theme');
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
// Font Size Management
// ========================================
const FONT_SIZE_STORAGE_KEY = 'bibleReader.fontSize';
const FONT_SIZE_SMALL = 'small';
const FONT_SIZE_MEDIUM = 'medium';
const FONT_SIZE_LARGE = 'large';

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
  }
}

/**
 * Render bookmarks list in modal
 */
function renderBookmarksList() {
  const bookmarks = loadBookmarks();
  const container = document.getElementById('bookmarksContainer');

  if (bookmarks.length === 0) {
    container.innerHTML = '<p class="no-bookmarks">No bookmarks yet. Tap the star icon to bookmark a chapter.</p>';
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
  const modal = document.getElementById('historyModalOverlay');
  const list = document.getElementById('readingHistoryList');
  list.innerHTML = '';

  // Check if BibleReading API is available
  if (!window.BibleReading || typeof BibleReading.getRecentReadingEvents !== 'function') {
    list.innerHTML = '<p class="empty-history">Reading history not available.</p>';
    modal.classList.add('active');
    return;
  }

  const events = BibleReading.getRecentReadingEvents(20);

  if (!events.length) {
    list.innerHTML = '<p class="empty-history">No recent reading activity yet.</p>';
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
 * Update the "Last read" hint in the header.
 * Desktop: shows text "Last: John 8"
 * Mobile: updates tooltip and aria-label on the history button
 */
function updateLastReadHint() {
  if (!window.BibleReading) return;

  const events = BibleReading.getRecentReadingEvents(1);
  const hintEl = document.getElementById('lastReadHint');
  const historyBtn = document.querySelector('.history-header-btn');

  if (!events.length) {
    // No history yet
    if (hintEl) hintEl.textContent = '';
    if (historyBtn) {
      historyBtn.title = 'Recent reading history';
      historyBtn.setAttribute('aria-label', 'Open reading history');
    }
    return;
  }

  const ev = events[0];
  const label = ev.bookId + ' ' + ev.chapter;

  // Desktop text
  if (hintEl) {
    hintEl.textContent = 'Last: ' + label;
  }

  // Mobile tooltip + accessibility
  if (historyBtn) {
    historyBtn.title = 'Recent reading (Last: ' + label + ')';
    historyBtn.setAttribute('aria-label', 'Recent reading (Last: ' + label + ')');
  }
}

// Initialize theme immediately
initTheme();
// Initialize font size immediately
initFontSize();
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
 */
function updateCurrentPlanStatusUI() {
  const el = document.getElementById('currentPlanStatus');
  if (!el) return;

  // If BibleReading API not available, hide the element
  if (!window.BibleReading) {
    el.textContent = '';
    return;
  }

  const currentPlanId =
    typeof BibleReading.getCurrentPlanId === 'function'
      ? BibleReading.getCurrentPlanId()
      : null;

  if (currentPlanId !== 'current-book') {
    el.textContent = '';
    return;
  }

  let plan;
  try {
    const state = BibleReading.loadReadingState();
    plan = state && state.plans ? state.plans['current-book'] : null;
  } catch (e) {
    console.warn('[BibleReading] Unable to load reading plan state:', e);
    el.textContent = '';
    return;
  }

  if (!plan || !plan.progress || !plan.config) {
    el.textContent = '';
    return;
  }

  const bookId = plan.config.bookId || plan.progress.bookId;
  const chapterNum = plan.progress.lastChapter;
  const chaptersTotal = plan.config.totalChapters;

  if (!bookId || !chapterNum) {
    el.textContent = '';
    return;
  }

  // Build label with or without totalChapters
  if (chaptersTotal && Number(chaptersTotal) > 0) {
    el.textContent = 'Reading plan: ' + bookId + ' ' + chapterNum + ' of ' + chaptersTotal;
  } else {
    el.textContent = 'Reading plan: ' + bookId + ' ' + chapterNum;
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

    window.scrollTo(0, 0);

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
  currentChapter = chapterNum;

  // Update UI
  updateChapterIndicator();
  updateNavigationButtons();
  displayChapter(currentChapter);

  // Close modal
  closeChapterSelector();

  // Auto-scroll to reading area with smooth behavior
  scrollToReadingTop();

  // Save the reading state
  saveReadingState(currentBook, currentChapter);

  // Update bookmark button
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
  window.scrollTo(0, 0);

  // Save the reading state after displaying
  saveReadingState(currentBook, currentChapter);

  // Log reading event for history tracking
  logCurrentChapterReading();

  // Update the simple "Current Book" reading plan and its UI
  updateCurrentBookPlan();
  updateCurrentPlanStatusUI();

  // Update "Last read" hint in header
  updateLastReadHint();
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

// Navigation functions
/**
 * Scroll smoothly to the top of the reading area after chapter change
 * Ensures the chapter indicator and verses container are visible
 */
function scrollToReadingTop() {
  const chapterIndicator = document.getElementById('chapterIndicator');
  if (chapterIndicator) {
    // Scroll to the chapter indicator (sits between header and sticky nav)
    chapterIndicator.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // Fallback to top of page if indicator not found
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function previousChapter() {
  if (currentChapter > 1) {
    displayChapter(currentChapter - 1);
    scrollToReadingTop();
  }
}

function nextChapter() {
  if (currentChapter < totalChapters) {
    displayChapter(currentChapter + 1);
    scrollToReadingTop();
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
    const searchInput = document.getElementById('chapterSearchInput');

    if (versionManager && versionManager.classList.contains('active')) {
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

// ========================================
// Chapter Search Functionality
// ========================================

let searchMatches = [];
let currentMatchIndex = 0;
let lastSearchTerm = '';
let searchActive = false;

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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
// Service Worker Registration
// ========================================

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.error('SW registration failed', err));
}
