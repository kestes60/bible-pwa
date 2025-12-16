/**
 * Reading Module - Reading state and navigation management
 *
 * Handles reading state persistence, bookmarks, parallel view,
 * and reading history. Works with the BibleReading API from reading-plans.js.
 */

import { STORAGE_KEYS, DEFAULTS, getItem, setItem, getJSON, setJSON, getBoolean, setBoolean } from './storage.js';

// ========================================
// Reading State Persistence
// ========================================

const READING_STATE_KEY = 'bibleReadingState';

/**
 * Save the current reading state to localStorage
 * @param {string} book - Book name (e.g., "John")
 * @param {number} chapter - Chapter number
 */
export function saveReadingState(book, chapter) {
  try {
    const state = {
      book: book,
      chapter: chapter,
      timestamp: new Date().toISOString()
    };
    setItem(READING_STATE_KEY, JSON.stringify(state));
    console.log('[Reading] State saved:', state);
  } catch (error) {
    console.warn('[Reading] Failed to save state:', error.message);
  }
}

/**
 * Load the reading state from localStorage
 * @returns {Object|null} The saved state {book, chapter} or null
 */
export function loadReadingState() {
  try {
    const stateJson = getItem(READING_STATE_KEY);
    if (stateJson) {
      return JSON.parse(stateJson);
    }
  } catch (error) {
    console.warn('[Reading] Failed to load state:', error.message);
  }
  return null;
}

/**
 * Clear saved reading state
 */
export function clearReadingState() {
  try {
    localStorage.removeItem(READING_STATE_KEY);
  } catch (e) {
    console.warn('[Reading] Failed to clear state');
  }
}

// ========================================
// Reading Event Logging
// ========================================

/**
 * Log a chapter reading event to BibleReading API
 * @param {string} versionId - Version ID
 * @param {string} bookId - Book name
 * @param {number} chapter - Chapter number
 */
export function logReadingEvent(versionId, bookId, chapter) {
  if (!window.BibleReading || typeof BibleReading.logReadingEvent !== 'function') {
    return;
  }

  try {
    if (!versionId || !bookId || !chapter) return;

    BibleReading.logReadingEvent({
      versionId: versionId,
      bookId: bookId,
      chapter: Number(chapter)
    });
    console.log('[Reading] Event logged:', bookId, chapter);
  } catch (e) {
    console.warn('[Reading] Failed to log event:', e);
  }
}

/**
 * Get recent reading events
 * @param {number} limit - Max events to return
 * @returns {Array}
 */
export function getRecentReadingEvents(limit = 20) {
  if (!window.BibleReading || typeof BibleReading.getRecentReadingEvents !== 'function') {
    return [];
  }
  return BibleReading.getRecentReadingEvents(limit);
}

// ========================================
// Current Book Plan
// ========================================

/**
 * Update the "Current Book" reading plan
 * @param {string} bookId - Book name
 * @param {number} chapter - Current chapter
 * @param {number} totalChapters - Total chapters in book
 */
export function updateCurrentBookPlan(bookId, chapter, totalChapters) {
  if (!window.BibleReading ||
      typeof BibleReading.upsertPlan !== 'function' ||
      typeof BibleReading.setCurrentPlanId !== 'function') {
    return;
  }

  if (!bookId || !chapter) return;

  const nowIso = new Date().toISOString();

  BibleReading.upsertPlan({
    id: 'current-book',
    name: 'Current Book',
    type: 'auto-current-book',
    config: {
      bookId: bookId,
      totalChapters: totalChapters || null
    },
    progress: {
      bookId: bookId,
      lastChapter: chapter,
      lastUpdatedAt: nowIso
    }
  });

  BibleReading.setCurrentPlanId('current-book');
}

/**
 * Get current book plan info
 * @returns {Object|null}
 */
export function getCurrentBookPlan() {
  if (!window.BibleReading || typeof BibleReading.getPlans !== 'function') {
    return null;
  }

  const plans = BibleReading.getPlans();
  return plans ? plans['current-book'] : null;
}

// ========================================
// Bookmark Management
// ========================================

/**
 * Get all bookmarks
 * @returns {Array}
 */
export function getBookmarks() {
  return getJSON(STORAGE_KEYS.BOOKMARKS, []);
}

/**
 * Save bookmarks
 * @param {Array} bookmarks
 */
export function saveBookmarks(bookmarks) {
  setJSON(STORAGE_KEYS.BOOKMARKS, bookmarks);
}

/**
 * Check if a chapter is bookmarked
 * @param {string} versionId
 * @param {string} bookId
 * @param {number} chapter
 * @returns {boolean}
 */
export function isBookmarked(versionId, bookId, chapter) {
  const bookmarks = getBookmarks();
  return bookmarks.some(b =>
    b.versionId === versionId &&
    b.bookId === bookId &&
    b.chapter === chapter
  );
}

/**
 * Add a bookmark
 * @param {string} versionId
 * @param {string} bookId
 * @param {number} chapter
 * @returns {Object} The new bookmark
 */
export function addBookmark(versionId, bookId, chapter) {
  const bookmarks = getBookmarks();

  // Check if already exists
  if (isBookmarked(versionId, bookId, chapter)) {
    console.log('[Reading] Already bookmarked');
    return null;
  }

  const newBookmark = {
    id: Date.now().toString(),
    versionId: versionId,
    bookId: bookId,
    chapter: chapter,
    bookmarkedAt: new Date().toISOString()
  };

  bookmarks.unshift(newBookmark);
  saveBookmarks(bookmarks);

  console.log('[Reading] Bookmark added:', newBookmark);
  return newBookmark;
}

/**
 * Remove a bookmark
 * @param {string} versionId
 * @param {string} bookId
 * @param {number} chapter
 * @returns {boolean} True if removed
 */
export function removeBookmark(versionId, bookId, chapter) {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b =>
    b.versionId === versionId &&
    b.bookId === bookId &&
    b.chapter === chapter
  );

  if (index === -1) return false;

  bookmarks.splice(index, 1);
  saveBookmarks(bookmarks);

  console.log('[Reading] Bookmark removed');
  return true;
}

/**
 * Toggle bookmark for a chapter
 * @param {string} versionId
 * @param {string} bookId
 * @param {number} chapter
 * @returns {boolean} True if now bookmarked, false if removed
 */
export function toggleBookmark(versionId, bookId, chapter) {
  if (isBookmarked(versionId, bookId, chapter)) {
    removeBookmark(versionId, bookId, chapter);
    return false;
  } else {
    addBookmark(versionId, bookId, chapter);
    return true;
  }
}

/**
 * Remove bookmark by ID
 * @param {string} bookmarkId
 * @returns {boolean}
 */
export function removeBookmarkById(bookmarkId) {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.id === bookmarkId);

  if (index === -1) return false;

  bookmarks.splice(index, 1);
  saveBookmarks(bookmarks);
  return true;
}

// ========================================
// Parallel View State
// ========================================

/**
 * Check if parallel view is enabled
 * @returns {boolean}
 */
export function isParallelEnabled() {
  return getBoolean(STORAGE_KEYS.PARALLEL_ENABLED, false);
}

/**
 * Set parallel view enabled state
 * @param {boolean} enabled
 */
export function setParallelEnabled(enabled) {
  setBoolean(STORAGE_KEYS.PARALLEL_ENABLED, enabled);
}

/**
 * Get secondary version ID for parallel view
 * @returns {string}
 */
export function getSecondaryVersionId() {
  return getItem(STORAGE_KEYS.PARALLEL_VERSION, DEFAULTS.PARALLEL_VERSION);
}

/**
 * Set secondary version ID
 * @param {string} versionId
 */
export function setSecondaryVersionId(versionId) {
  setItem(STORAGE_KEYS.PARALLEL_VERSION, versionId);
}

// Sync flag to prevent infinite scroll loops
let isParallelSyncing = false;

/**
 * Get parallel sync state
 * @returns {boolean}
 */
export function isParallelSyncActive() {
  return isParallelSyncing;
}

/**
 * Set parallel sync state
 * @param {boolean} syncing
 */
export function setParallelSyncActive(syncing) {
  isParallelSyncing = syncing;
}

// ========================================
// Navigation Helpers
// ========================================

/**
 * Check if we can go to previous chapter
 * @param {number} currentChapter
 * @returns {boolean}
 */
export function canGoPrevious(currentChapter) {
  return currentChapter > 1;
}

/**
 * Check if we can go to next chapter
 * @param {number} currentChapter
 * @param {number} totalChapters
 * @returns {boolean}
 */
export function canGoNext(currentChapter, totalChapters) {
  return currentChapter < totalChapters;
}

/**
 * Get previous chapter number
 * @param {number} currentChapter
 * @returns {number}
 */
export function getPreviousChapter(currentChapter) {
  return Math.max(1, currentChapter - 1);
}

/**
 * Get next chapter number
 * @param {number} currentChapter
 * @param {number} totalChapters
 * @returns {number}
 */
export function getNextChapter(currentChapter, totalChapters) {
  return Math.min(totalChapters, currentChapter + 1);
}

// ========================================
// Chapter Search State
// ========================================

let searchMatches = [];
let currentMatchIndex = 0;
let lastSearchTerm = '';
let searchActive = false;

/**
 * Get search state
 * @returns {Object}
 */
export function getSearchState() {
  return {
    matches: searchMatches,
    currentIndex: currentMatchIndex,
    term: lastSearchTerm,
    active: searchActive
  };
}

/**
 * Set search matches
 * @param {Array} matches
 */
export function setSearchMatches(matches) {
  searchMatches = matches;
}

/**
 * Set current match index
 * @param {number} index
 */
export function setCurrentMatchIndex(index) {
  currentMatchIndex = index;
}

/**
 * Set last search term
 * @param {string} term
 */
export function setLastSearchTerm(term) {
  lastSearchTerm = term;
}

/**
 * Set search active state
 * @param {boolean} active
 */
export function setSearchActive(active) {
  searchActive = active;
}

/**
 * Clear search state
 */
export function clearSearchState() {
  searchMatches = [];
  currentMatchIndex = 0;
  lastSearchTerm = '';
  searchActive = false;
}

// ========================================
// Module API (for window attachment)
// ========================================
export const Reading = {
  // Reading State
  saveReadingState,
  loadReadingState,
  clearReadingState,

  // Reading Events
  logReadingEvent,
  getRecentReadingEvents,

  // Current Book Plan
  updateCurrentBookPlan,
  getCurrentBookPlan,

  // Bookmarks
  getBookmarks,
  saveBookmarks,
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  removeBookmarkById,

  // Parallel View
  isParallelEnabled,
  setParallelEnabled,
  getSecondaryVersionId,
  setSecondaryVersionId,
  isParallelSyncActive,
  setParallelSyncActive,

  // Navigation
  canGoPrevious,
  canGoNext,
  getPreviousChapter,
  getNextChapter,

  // Search
  getSearchState,
  setSearchMatches,
  setCurrentMatchIndex,
  setLastSearchTerm,
  setSearchActive,
  clearSearchState
};

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.Reading = Reading;

  // Expose commonly used functions directly
  window.saveReadingState = saveReadingState;
  window.loadReadingState = loadReadingState;
  window.toggleBookmark = toggleBookmark;
  window.isParallelEnabled = isParallelEnabled;
}
