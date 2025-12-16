/**
 * Storage Module - Centralized localStorage management
 *
 * Provides type-safe access to all localStorage keys and helper functions.
 * All keys are namespaced under 'bibleReader.' for consistency.
 */

// ========================================
// Storage Keys (single source of truth)
// ========================================
export const STORAGE_KEYS = {
  // Appearance
  THEME: 'bibleReaderTheme',
  FONT_SIZE: 'bibleReader.fontSize',
  LINE_HEIGHT: 'bibleReader.lineHeight',

  // Reading State
  READING_STATE: 'bibleReadingState',
  LAST_BOOK: 'bibleReader.lastBook',
  LAST_CHAPTER: 'bibleReader.lastChapter',
  LAST_VISITED: 'bibleReader.lastVisited',

  // Version & Parallel View
  CURRENT_VERSION: 'bibleReader.currentVersionId',
  PARALLEL_ENABLED: 'bibleReader.parallelEnabled',
  PARALLEL_VERSION: 'bibleReader.parallelVersionId',

  // Bookmarks & Plans
  BOOKMARKS: 'bibleReader.bookmarks',
  READING_PLANS: 'bibleReader.readingState.v1',

  // UI State
  SETTINGS_SECTION: 'bibleReader.settingsExpandedSection',
  WELCOME_SEEN: 'bibleReader.hasSeenWelcome',
  LAST_SEEN_VERSION: 'bibleReader.lastSeenVersion',

  // Premium
  PREMIUM_UNLOCKED: 'bibleReader.isPremiumUnlocked'
};

// ========================================
// Default Values
// ========================================
export const DEFAULTS = {
  THEME: 'theme-dark',
  FONT_SIZE: 'medium',
  LINE_HEIGHT: '1.6',
  PARALLEL_VERSION: 'en-kjv',
  VERSION: 'en-web'
};

// ========================================
// Generic Storage Helpers
// ========================================

/**
 * Safely get a value from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {string|null} The stored value or default
 */
export function getItem(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.warn('[Storage] Error reading:', key, e.message);
    return defaultValue;
  }
}

/**
 * Safely set a value in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {boolean} True if successful
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('[Storage] Error writing:', key, e.message);
    return false;
  }
}

/**
 * Safely remove a value from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if successful
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn('[Storage] Error removing:', key, e.message);
    return false;
  }
}

/**
 * Get a JSON object from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist or parse fails
 * @returns {*} The parsed object or default
 */
export function getJSON(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value);
  } catch (e) {
    console.warn('[Storage] Error parsing JSON:', key, e.message);
    return defaultValue;
  }
}

/**
 * Set a JSON object in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be stringified)
 * @returns {boolean} True if successful
 */
export function setJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[Storage] Error saving JSON:', key, e.message);
    return false;
  }
}

/**
 * Get a boolean value from localStorage
 * @param {string} key - Storage key
 * @param {boolean} defaultValue - Default value
 * @returns {boolean}
 */
export function getBoolean(key, defaultValue = false) {
  const value = getItem(key);
  if (value === null) return defaultValue;
  return value === 'true';
}

/**
 * Set a boolean value in localStorage
 * @param {string} key - Storage key
 * @param {boolean} value - Boolean value
 * @returns {boolean} True if successful
 */
export function setBoolean(key, value) {
  return setItem(key, value ? 'true' : 'false');
}

// ========================================
// Backup & Restore Helpers
// ========================================

/**
 * Export all Bible PWA data from localStorage
 * @returns {Object} All stored data
 */
export function exportAllData() {
  const data = {};
  const prefix = 'bibleReader';

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(prefix) || key === 'bibleReadingState')) {
        data[key] = localStorage.getItem(key);
      }
    }
  } catch (e) {
    console.warn('[Storage] Error exporting data:', e.message);
  }

  return data;
}

/**
 * Import Bible PWA data to localStorage
 * @param {Object} data - Data object with key-value pairs
 * @returns {boolean} True if successful
 */
export function importAllData(data) {
  try {
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('bibleReader') || key === 'bibleReadingState') {
        localStorage.setItem(key, value);
      }
    }
    return true;
  } catch (e) {
    console.warn('[Storage] Error importing data:', e.message);
    return false;
  }
}

/**
 * Clear all Bible PWA data from localStorage
 * @returns {boolean} True if successful
 */
export function clearAllData() {
  const keysToRemove = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('bibleReader') || key === 'bibleReadingState')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (e) {
    console.warn('[Storage] Error clearing data:', e.message);
    return false;
  }
}

// ========================================
// Storage Statistics
// ========================================

/**
 * Get storage usage statistics
 * @returns {Object} Usage info { used, total, percentage }
 */
export function getStorageStats() {
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        totalSize += (key.length + (value ? value.length : 0)) * 2; // UTF-16
      }
    }

    // Typical localStorage limit is 5MB
    const limitBytes = 5 * 1024 * 1024;

    return {
      usedBytes: totalSize,
      usedKB: Math.round(totalSize / 1024),
      limitBytes: limitBytes,
      limitKB: Math.round(limitBytes / 1024),
      percentage: Math.round((totalSize / limitBytes) * 100)
    };
  } catch (e) {
    console.warn('[Storage] Error calculating stats:', e.message);
    return { usedBytes: 0, usedKB: 0, limitBytes: 0, limitKB: 0, percentage: 0 };
  }
}

// ========================================
// Module API (for window attachment)
// ========================================
export const Storage = {
  KEYS: STORAGE_KEYS,
  DEFAULTS,
  getItem,
  setItem,
  removeItem,
  getJSON,
  setJSON,
  getBoolean,
  setBoolean,
  exportAllData,
  importAllData,
  clearAllData,
  getStorageStats
};

// Attach to window for global access (backwards compatibility)
if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
