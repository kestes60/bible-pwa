/**
 * Bible Version Registry
 *
 * Configuration for available Bible translations.
 * Currently supports only World English Bible (WEB).
 *
 * Future versions can be added here:
 * - "en-kjv": King James Version
 * - "en-nasb": New American Standard Bible
 * - "es-rvr": Reina Valera (Spanish)
 * etc.
 *
 * NOTE: Bible data is stored in JSON format in /data/ directory.
 * Future AI features may use TOON format for prompts/context,
 * but the PWA will continue to load JSON files in the browser.
 */

// Current active version
const CURRENT_VERSION_ID = "en-web";

// Registry of available Bible versions
const bibleVersions = {
  "en-web": {
    id: "en-web",
    name: "World English Bible",
    shortName: "WEB",
    language: "en",
    languageName: "English",
    dataPath: "data/",
    booksFile: "books.json",
    description: "Modern English translation, public domain"
  }
  // TODO: Add additional versions here
  // "en-kjv": {
  //   id: "en-kjv",
  //   name: "King James Version",
  //   shortName: "KJV",
  //   language: "en",
  //   languageName: "English",
  //   dataPath: "data/kjv/",
  //   booksFile: "books.json",
  //   description: "Classic English translation from 1611"
  // },
  // "es-rvr": {
  //   id: "es-rvr",
  //   name: "Reina Valera Revisada",
  //   shortName: "RVR",
  //   language: "es",
  //   languageName: "Español",
  //   dataPath: "data/rvr/",
  //   booksFile: "books.json",
  //   description: "Spanish translation"
  // }
};

/**
 * Get the currently active Bible version
 * @returns {Object} The current version configuration
 */
function getCurrentVersion() {
  return bibleVersions[CURRENT_VERSION_ID];
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
