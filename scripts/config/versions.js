/**
 * Bible Version Registry
 *
 * Configuration for available Bible translations.
 * Supports multiple languages with installed (offline) and planned (coming-soon) versions.
 *
 * Each version includes:
 * - status: "installed" (available offline), "coming-soon" (planned), or "remote" (downloadable)
 * - storageStrategy: "bundled" (included in app) or "remote" (user-downloaded)
 * - estimatedSizeMB: Approximate size for UI display
 *
 * Currently installed:
 * - en-web: World English Bible (English)
 * - en-kjv: King James Version (English)
 *
 * Planned translations (coming-soon):
 * - Korean, Spanish, Chinese, Arabic, Hindi, French, Bengali,
 *   Portuguese, Russian, Indonesian, Urdu, German, Japanese
 *
 * NOTE: Bible data is stored in JSON format in /data/ directory.
 * Future versions will be converted from OSIS format using open-bibles tools.
 */

// Current active version (default)
const DEFAULT_VERSION_ID = "en-web";

// localStorage key for persisting version preference
const VERSION_STORAGE_KEY = 'bibleReader.currentVersionId';

// Registry of available Bible versions
const bibleVersions = {
  // ========================================
  // INSTALLED VERSIONS (available offline)
  // ========================================
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
  },

  // ========================================
  // INSTALLED VERSIONS (additional languages)
  // ========================================
  "ko-krv": {
    id: "ko-krv",
    name: "Korean Revised Version",
    shortName: "KRV",
    language: "ko",
    languageName: "Korean",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/krv/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: "https://raw.githubusercontent.com/seven1m/open-bibles/master/kor-korean.osis.xml",
    sourceFormat: "osis",
    description: "Korean translation, public domain"
  },

  // ========================================
  // PLANNED VERSIONS (coming soon)
  // Require USFX converter or source not available
  // ========================================
  "es-rvr": {
    id: "es-rvr",
    name: "Reina Valera 1909",
    shortName: "RVR",
    language: "es",
    languageName: "Spanish",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/rvr/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: "https://raw.githubusercontent.com/seven1m/open-bibles/master/spa-rv1909.usfx.xml",
    sourceFormat: "usfx",
    description: "Classic Spanish translation, public domain (USFX converter needed)"
  },
  "zh-cuv": {
    id: "zh-cuv",
    name: "Chinese Union Version",
    shortName: "CUV",
    language: "zh",
    languageName: "Chinese",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/cuv/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: "https://raw.githubusercontent.com/seven1m/open-bibles/master/chi-cuv.usfx.xml",
    sourceFormat: "usfx",
    description: "Traditional Chinese translation, public domain (USFX converter needed)"
  },
  "ar-svd": {
    id: "ar-svd",
    name: "Smith & Van Dyck Arabic",
    shortName: "SVD",
    language: "ar",
    languageName: "Arabic",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/svd/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: null,
    sourceFormat: null,
    description: "Arabic translation (source not yet available in open-bibles)"
  },
  "hi-irv": {
    id: "hi-irv",
    name: "Indian Revised Version",
    shortName: "IRV",
    language: "hi",
    languageName: "Hindi",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/irv/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: null,
    sourceFormat: null,
    description: "Hindi translation (source not yet available in open-bibles)"
  },
  "fr-lsg": {
    id: "fr-lsg",
    name: "Louis Segond",
    shortName: "LSG",
    language: "fr",
    languageName: "French",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/lsg/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Classic French translation, public domain"
  },
  "bn-bsi": {
    id: "bn-bsi",
    name: "Bengali Common Language",
    shortName: "BCL",
    language: "bn",
    languageName: "Bengali",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/bcl/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Bengali translation, public domain"
  },
  "pt-ara": {
    id: "pt-ara",
    name: "Almeida Revista e Atualizada",
    shortName: "ARA",
    language: "pt",
    languageName: "Portuguese",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/ara/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Portuguese translation, public domain"
  },
  "ru-synod": {
    id: "ru-synod",
    name: "Synodal Translation",
    shortName: "SYNOD",
    language: "ru",
    languageName: "Russian",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/synod/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Russian Synodal translation, public domain"
  },
  "id-tb": {
    id: "id-tb",
    name: "Terjemahan Baru",
    shortName: "TB",
    language: "id",
    languageName: "Indonesian",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/tb/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Indonesian translation, public domain"
  },
  "ur-geo": {
    id: "ur-geo",
    name: "Urdu Geo Version",
    shortName: "UGV",
    language: "ur",
    languageName: "Urdu",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/ugv/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Urdu translation, public domain"
  },
  "de-lut": {
    id: "de-lut",
    name: "Luther Bibel",
    shortName: "LUT",
    language: "de",
    languageName: "German",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/lut/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "German Luther translation, public domain"
  },
  "ja-kougo": {
    id: "ja-kougo",
    name: "Kougo-yaku",
    shortName: "JCB",
    language: "ja",
    languageName: "Japanese",
    status: "coming-soon",
    storageStrategy: "remote",
    dataPath: "data/kougo/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceRepo: null,
    description: "Japanese Colloquial translation, public domain"
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
 * Get all versions that are planned but not yet available
 * @returns {Array} Array of version objects with status === "coming-soon"
 */
function getComingSoonVersions() {
  return Object.values(bibleVersions).filter(v => v.status === "coming-soon");
}

/**
 * Get all versions that are not installed (coming-soon or remote)
 * @returns {Array} Array of version objects with status !== "installed"
 */
function getNonInstalledVersions() {
  return Object.values(bibleVersions).filter(v => v.status !== "installed");
}

/**
 * Get the current version object using getCurrentVersionId()
 * This version reads from localStorage unlike the direct getCurrentVersion()
 * @returns {Object} The current version configuration
 */
function getActiveVersion() {
  return bibleVersions[getCurrentVersionId()];
}

/**
 * Get total size of all installed versions in MB
 * @returns {number} Total estimated size in MB
 */
function getTotalInstalledSizeMB() {
  return getInstalledVersions()
    .reduce((sum, v) => sum + (v.estimatedSizeMB || 0), 0);
}
