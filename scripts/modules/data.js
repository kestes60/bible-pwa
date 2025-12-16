/**
 * Data Module - Bible data loading and caching
 *
 * Handles loading books.json, chapter data, and version switching.
 * Works with the versions.js config file for version metadata.
 *
 * Note: This module expects versions.js to be loaded first (provides
 * getCurrentVersionId, getVersion, getVersionBooksFile, etc.)
 */

// ========================================
// Module State
// ========================================

// Cached data
let booksJsonCache = null;
let bookDataCache = {};  // { [versionId-bookName]: bookData }

// Current state
let currentBook = 'John';
let currentChapter = 1;
let totalChapters = 21;
let currentBookData = null;  // Current book metadata from books.json

// ========================================
// Books Metadata Loading
// ========================================

/**
 * Load books.json for the current version
 * @returns {Promise<Object>} Books metadata object
 */
export async function loadBooksJson() {
  try {
    // Use versions.js helper (expected to be global)
    const booksFilePath = './' + getCurrentBooksFile();
    console.log('[Data] Loading books.json from:', booksFilePath);

    const response = await fetch(booksFilePath);
    if (!response.ok) {
      throw new Error(`Failed to load books data: ${response.status}`);
    }

    booksJsonCache = await response.json();
    return booksJsonCache;
  } catch (error) {
    console.error('[Data] Error loading books.json:', error);
    throw error;
  }
}

/**
 * Load books.json for a specific version
 * @param {string} versionId - Version ID (e.g., 'en-web')
 * @returns {Promise<Object>} Books metadata object
 */
export async function loadBooksJsonForVersion(versionId) {
  try {
    const booksFilePath = './' + getVersionBooksFile(versionId);
    console.log('[Data] Loading books.json for version:', versionId);

    const response = await fetch(booksFilePath);
    if (!response.ok) {
      throw new Error(`Failed to load books data for ${versionId}: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Data] Error loading books.json for version:', versionId, error);
    throw error;
  }
}

/**
 * Get cached books.json data
 * @returns {Object|null} Cached books metadata or null
 */
export function getBooksJson() {
  return booksJsonCache;
}

/**
 * Set books.json cache (for external updates)
 * @param {Object} data - Books metadata
 */
export function setBooksJson(data) {
  booksJsonCache = data;
}

// ========================================
// Book Data Loading
// ========================================

/**
 * Load chapter data for a specific book
 * @param {Object} book - Book metadata object from books.json
 * @param {string} [versionId] - Optional version ID (defaults to current)
 * @returns {Promise<Object>} Book chapter data
 */
export async function loadBookData(book, versionId = null) {
  const version = versionId || getCurrentVersionId();
  const cacheKey = `${version}-${book.name}`;

  // Check cache first
  if (bookDataCache[cacheKey]) {
    console.log('[Data] Using cached book data:', cacheKey);
    return bookDataCache[cacheKey];
  }

  try {
    const dataPath = './' + (versionId ? getVersionDataPath(versionId) : getCurrentDataPath());
    const bookPath = dataPath + book.filename;
    console.log('[Data] Loading book from:', bookPath);

    const response = await fetch(bookPath);

    if (!response.ok) {
      // Enhanced error handling for offline scenarios
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      throw new Error(`Failed to load ${book.name}: ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    bookDataCache[cacheKey] = data;

    return data;
  } catch (error) {
    console.error('[Data] Error loading book:', book.name, error);
    throw error;
  }
}

/**
 * Load chapter data for a book by name
 * @param {string} bookName - Book name (e.g., 'John')
 * @param {string} [versionId] - Optional version ID
 * @returns {Promise<Object>} Book chapter data
 */
export async function loadBookByName(bookName, versionId = null) {
  const books = booksJsonCache;
  if (!books || !books.books) {
    throw new Error('Books metadata not loaded');
  }

  const book = books.books.find(b => b.name === bookName);
  if (!book) {
    throw new Error(`Book not found: ${bookName}`);
  }

  return loadBookData(book, versionId);
}

/**
 * Load verses for a specific chapter
 * @param {string} bookName - Book name
 * @param {number} chapter - Chapter number
 * @param {string} [versionId] - Optional version ID
 * @returns {Promise<Object>} Verses object { verseNum: verseText }
 */
export async function loadChapter(bookName, chapter, versionId = null) {
  const bookData = await loadBookByName(bookName, versionId);

  if (!bookData || !bookData[chapter]) {
    throw new Error(`Chapter ${chapter} not found in ${bookName}`);
  }

  return bookData[chapter];
}

// ========================================
// Cache Management
// ========================================

/**
 * Clear all cached data
 */
export function clearCache() {
  booksJsonCache = null;
  bookDataCache = {};
  console.log('[Data] Cache cleared');
}

/**
 * Clear cache for a specific version
 * @param {string} versionId - Version ID to clear
 */
export function clearVersionCache(versionId) {
  const keysToRemove = Object.keys(bookDataCache).filter(k => k.startsWith(versionId));
  keysToRemove.forEach(k => delete bookDataCache[k]);
  console.log('[Data] Cleared cache for version:', versionId);
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    hasBooksJson: booksJsonCache !== null,
    cachedBooks: Object.keys(bookDataCache).length,
    cachedBookNames: Object.keys(bookDataCache)
  };
}

// ========================================
// Current State Accessors
// ========================================

/**
 * Get current book name
 * @returns {string}
 */
export function getCurrentBook() {
  return currentBook;
}

/**
 * Set current book
 * @param {string} bookName
 */
export function setCurrentBook(bookName) {
  currentBook = bookName;
}

/**
 * Get current chapter number
 * @returns {number}
 */
export function getCurrentChapter() {
  return currentChapter;
}

/**
 * Set current chapter
 * @param {number} chapter
 */
export function setCurrentChapter(chapter) {
  currentChapter = chapter;
}

/**
 * Get total chapters in current book
 * @returns {number}
 */
export function getTotalChapters() {
  return totalChapters;
}

/**
 * Set total chapters
 * @param {number} count
 */
export function setTotalChapters(count) {
  totalChapters = count;
}

/**
 * Get current book metadata
 * @returns {Object|null}
 */
export function getCurrentBookData() {
  return currentBookData;
}

/**
 * Set current book metadata
 * @param {Object} bookData
 */
export function setCurrentBookData(bookData) {
  currentBookData = bookData;
  if (bookData) {
    currentBook = bookData.name;
    totalChapters = bookData.chapters;
  }
}

// ========================================
// Book List Helpers
// ========================================

/**
 * Get books filtered by testament
 * @param {'OT'|'NT'} testament - Testament filter
 * @returns {Array} Filtered book list
 */
export function getBooksByTestament(testament) {
  if (!booksJsonCache || !booksJsonCache.books) return [];
  return booksJsonCache.books.filter(book => book.testament === testament);
}

/**
 * Get Old Testament books
 * @returns {Array}
 */
export function getOTBooks() {
  return getBooksByTestament('OT');
}

/**
 * Get New Testament books
 * @returns {Array}
 */
export function getNTBooks() {
  return getBooksByTestament('NT');
}

/**
 * Find a book by name
 * @param {string} bookName
 * @returns {Object|null}
 */
export function findBook(bookName) {
  if (!booksJsonCache || !booksJsonCache.books) return null;
  return booksJsonCache.books.find(b => b.name === bookName) || null;
}

// ========================================
// Module API (for window attachment)
// ========================================
export const Data = {
  // Loading
  loadBooksJson,
  loadBooksJsonForVersion,
  loadBookData,
  loadBookByName,
  loadChapter,

  // Cache
  getBooksJson,
  setBooksJson,
  clearCache,
  clearVersionCache,
  getCacheStats,

  // State
  getCurrentBook,
  setCurrentBook,
  getCurrentChapter,
  setCurrentChapter,
  getTotalChapters,
  setTotalChapters,
  getCurrentBookData,
  setCurrentBookData,

  // Helpers
  getBooksByTestament,
  getOTBooks,
  getNTBooks,
  findBook
};

// Attach to window for global access (backwards compatibility)
if (typeof window !== 'undefined') {
  window.BibleData = Data;
}
