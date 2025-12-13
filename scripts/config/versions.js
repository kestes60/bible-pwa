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
 * - direction: "RTL" for Arabic/Hebrew, "LTR" for others (default)
 *
 * Currently installed (16 versions):
 * - en-web: World English Bible (English)
 * - en-kjv: King James Version (English)
 * - ko-krv: Korean Revised Version
 * - he-modern: Hebrew Modern (RTL)
 * - es-rvr: Reina Valera 1909 (Spanish)
 * - zh-cuv: Chinese Union Version
 * - ara-svd: Arabic Smith Van Dyke (RTL)
 * - fra-lsg: Louis Segond 1910 (French)
 * - deu-lut: Luther Bibel 1545 (German)
 * - jpn-kougo: Kougo-yaku (Japanese)
 * - por-almeida: Almeida (Portuguese)
 * - rus-synodal: Synodal (Russian)
 * - swa-sbe: Swahili Bible Edition (African)
 * - hi-irv: Hindi Indian Revised Version
 * - bn-irv: Bengali Indian Revised Version
 * - id-tb: Indonesian Terjemahan Baru
 *
 * Note: Urdu translation not yet available in public domain sources
 *
 * NOTE: Bible data is stored in JSON format in /data/ directory.
 * Versions are converted from GetBible API or OSIS/USFX formats.
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
  // INSTALLED VERSIONS (Hebrew)
  // ========================================
  "he-modern": {
    id: "he-modern",
    name: "Hebrew Modern",
    shortName: "HEB",
    language: "he",
    languageName: "Hebrew",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/heb-modern/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://api.getbible.net/v2/modernhebrew.json",
    sourceFormat: "getbible-json",
    direction: "RTL",
    description: "Modern Hebrew Bible translation"
  },

  // ========================================
  // INSTALLED VERSIONS (Spanish and Chinese)
  // ========================================
  "es-rvr": {
    id: "es-rvr",
    name: "Reina Valera 1909",
    shortName: "RVR",
    language: "es",
    languageName: "Spanish",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/rvr/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://raw.githubusercontent.com/seven1m/open-bibles/master/spa-rv1909.usfx.xml",
    sourceFormat: "usfx",
    description: "Classic Spanish translation from 1909, public domain"
  },
  "zh-cuv": {
    id: "zh-cuv",
    name: "Chinese Union Version",
    shortName: "CUV",
    language: "zh",
    languageName: "Chinese",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/cuv/",
    booksFile: "books.json",
    estimatedSizeMB: 2,
    sourceUrl: "https://raw.githubusercontent.com/seven1m/open-bibles/master/chi-cuv.usfx.xml",
    sourceFormat: "usfx",
    description: "Traditional Chinese translation, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (Arabic)
  // ========================================
  "ara-svd": {
    id: "ara-svd",
    name: "Arabic Smith Van Dyke",
    shortName: "SVD",
    language: "ar",
    languageName: "Arabic",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/ara-svd/",
    booksFile: "books.json",
    estimatedSizeMB: 6,
    sourceUrl: "https://api.getbible.net/v2/arabicsv.json",
    sourceFormat: "getbible-json",
    direction: "RTL",
    description: "Arabic Smith Van Dyke translation, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (French)
  // ========================================
  "fra-lsg": {
    id: "fra-lsg",
    name: "Louis Segond 1910",
    shortName: "LSG",
    language: "fr",
    languageName: "French",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/fra-lsg/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://api.getbible.net/v2/ls1910.json",
    sourceFormat: "getbible-json",
    description: "Classic French translation from 1910, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (German)
  // ========================================
  "deu-lut": {
    id: "deu-lut",
    name: "Luther Bibel 1545",
    shortName: "LUT",
    language: "de",
    languageName: "German",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/deu-lut/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://api.getbible.net/v2/luther1545.json",
    sourceFormat: "getbible-json",
    description: "German Luther translation from 1545, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (Japanese)
  // ========================================
  "jpn-kougo": {
    id: "jpn-kougo",
    name: "Japanese Kougo-yaku",
    shortName: "JKG",
    language: "ja",
    languageName: "Japanese",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/jpn-kougo/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://api.getbible.net/v2/japkougo.json",
    sourceFormat: "getbible-json",
    description: "Japanese Colloquial translation, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (Portuguese)
  // ========================================
  "por-almeida": {
    id: "por-almeida",
    name: "Portuguese Almeida",
    shortName: "ALM",
    language: "pt",
    languageName: "Portuguese",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/por-almeida/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://api.getbible.net/v2/almeida.json",
    sourceFormat: "getbible-json",
    description: "Portuguese Almeida translation, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (Russian)
  // ========================================
  "rus-synodal": {
    id: "rus-synodal",
    name: "Russian Synodal",
    shortName: "SYN",
    language: "ru",
    languageName: "Russian",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/rus-synodal/",
    booksFile: "books.json",
    estimatedSizeMB: 6,
    sourceUrl: "https://api.getbible.net/v2/synodal.json",
    sourceFormat: "getbible-json",
    description: "Russian Synodal translation, public domain"
  },

  // ========================================
  // INSTALLED VERSIONS (Swahili - African)
  // ========================================
  "swa-sbe": {
    id: "swa-sbe",
    name: "Swahili Bible Edition",
    shortName: "SWA",
    language: "sw",
    languageName: "Swahili",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/swa-sbe/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: "https://github.com/shemmjunior/swahili-bible-edition",
    sourceFormat: "swahili-bible-edition-json",
    description: "Swahili Bible Edition (full OT/NT), MIT license"
  },

  // ========================================
  // INSTALLED VERSIONS (South/Southeast Asian)
  // ========================================
  "hi-irv": {
    id: "hi-irv",
    name: "Hindi Indian Revised Version",
    shortName: "IRV",
    language: "hi",
    languageName: "Hindi",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/hi-irv/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "https://github.com/godlytalias/Bible-Database",
    sourceFormat: "godlytalias-json",
    description: "Hindi Indian Revised Version, public domain"
  },
  "bn-irv": {
    id: "bn-irv",
    name: "Bengali Indian Revised Version",
    shortName: "BIR",
    language: "bn",
    languageName: "Bengali",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/bn-irv/",
    booksFile: "books.json",
    estimatedSizeMB: 5,
    sourceUrl: "https://github.com/godlytalias/Bible-Database",
    sourceFormat: "godlytalias-json",
    description: "Bengali Indian Revised Version, public domain"
  },
  "id-tb": {
    id: "id-tb",
    name: "Alkitab Terjemahan Baru",
    shortName: "TB",
    language: "id",
    languageName: "Indonesian",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/id-tb/",
    booksFile: "books.json",
    estimatedSizeMB: 3,
    sourceUrl: "https://github.com/godlytalias/Bible-Database",
    sourceFormat: "godlytalias-json",
    description: "Indonesian Terjemahan Baru (New Translation), public domain"
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
