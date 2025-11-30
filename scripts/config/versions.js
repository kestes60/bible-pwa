/**
 * Bible Version Registry
 *
 * Configuration for available Bible translations.
 * Currently supports World English Bible (WEB) and upcoming King James Version (KJV).
 *
 * Each version includes:
 * - status: "installed" (available offline), "coming-soon" (planned), or "remote" (future)
 * - storageStrategy: "bundled" (included in app) or "remote" (downloaded)
 * - estimatedSizeMB: Approximate size for UI display
 *
 * Future versions can be added here:
 * - "en-nasb": New American Standard Bible
 * - "es-rvr": Reina Valera (Spanish)
 * etc.
 *
 * NOTE: Bible data is stored in JSON format in /data/ directory.
 * Future AI features may use TOON format for prompts/context,
 * but the PWA will continue to load JSON files in the browser.
 */

// Current active version (default)
const DEFAULT_VERSION_ID = "en-web";

// localStorage key for persisting version preference
const VERSION_STORAGE_KEY = 'bibleReader.currentVersionId';

// Registry of available Bible versions
const bibleVersions = {
  "en-web": {
    id: "en-web",
    name: "World English Bible",
    shortName: "WEB",
    language: "en",
    languageName: "English",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Modern English translation, public domain"
  },
  "en-kjv": {
    id: "en-kjv",
    name: "King James Version",
    shortName: "KJV",
    language: "en",
    languageName: "English",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/kjv/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Classic English translation from 1611"
  }
};

/**
 * Get the currently active Bible version
 * Respects the user's saved version preference from localStorage
 * @returns {Object} The current version configuration
 */
function getCurrentVersion() {
  return bibleVersions[getCurrentVersionId()];
}

/**
 * Get a specific Bible version by ID
 * @param {string} versionId - The version identifier (e.g., "en-web")
 * @returns {Object|null} The version configuration or null if not found
 */
function getVersion(versionId) {
  return bibleVersions[versionId] || null;
}

/**
 * Get list of all available versions
 * @returns {Array} Array of version objects
 */
function getAllVersions() {
  return Object.values(bibleVersions);
}

/**
 * Get the data path for the current version
 * @returns {string} Path to the Bible data directory
 */
function getCurrentDataPath() {
  return getCurrentVersion().dataPath;
}

/**
 * Get the books.json file path for the current version
 * @returns {string} Path to the books metadata file
 */
function getCurrentBooksFile() {
  const version = getCurrentVersion();
  return version.dataPath + version.booksFile;
}

/**
 * Get the internal ID for the currently active version
 * Reads from localStorage, falls back to DEFAULT_VERSION_ID
 * @returns {string} The current version ID (e.g., "en-web")
 */
function getCurrentVersionId() {
  try {
    const savedVersionId = localStorage.getItem(VERSION_STORAGE_KEY);
    // Validate saved version exists in registry
    if (savedVersionId && bibleVersions[savedVersionId]) {
      return savedVersionId;
    }
  } catch (e) {
    console.warn('Error reading version from localStorage:', e);
  }
  return DEFAULT_VERSION_ID;
}

/**
 * Set the current version ID and persist to localStorage
 * @param {string} versionId - The version ID to set (e.g., "en-web", "en-kjv")
 * @returns {boolean} True if set successfully, false if version not found
 */
function setCurrentVersionId(versionId) {
  if (!bibleVersions[versionId]) {
    console.error('Version not found:', versionId);
    return false;
  }
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, versionId);
    return true;
  } catch (e) {
    console.error('Error saving version to localStorage:', e);
    return false;
  }
}

/**
 * Get the data path for a specific version
 * @param {string} versionId - The version ID
 * @returns {string|null} Path to the Bible data directory or null if not found
 */
function getVersionDataPath(versionId) {
  const version = getVersion(versionId);
  return version ? version.dataPath : null;
}

/**
 * Get the books.json file path for a specific version
 * @param {string} versionId - The version ID
 * @returns {string|null} Path to the books metadata file or null if not found
 */
function getVersionBooksFile(versionId) {
  const version = getVersion(versionId);
  return version ? version.dataPath + version.booksFile : null;
}

/**
 * Check if a version is installed (available offline)
 * @param {string} versionId - The version ID to check
 * @returns {boolean} True if version is installed
 */
function isVersionInstalled(versionId) {
  const version = getVersion(versionId);
  return version && version.status === "installed";
}

/**
 * Get all versions that are installed/available offline
 * @returns {Array} Array of version objects with status === "installed"
 */
function getInstalledVersions() {
  return Object.values(bibleVersions).filter(v => v.status === "installed");
}

/**
 * Get the current version object using getCurrentVersionId()
 * This version reads from localStorage unlike the direct getCurrentVersion()
 * @returns {Object} The current version configuration
 */
function getActiveVersion() {
  return bibleVersions[getCurrentVersionId()];
}
