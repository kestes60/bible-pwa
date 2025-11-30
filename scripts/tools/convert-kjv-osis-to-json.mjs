#!/usr/bin/env node
/**
 * OSIS to JSON Converter for KJV Bible
 *
 * Converts the OSIS XML format to the JSON schema used by the Bible PWA.
 *
 * OSIS Structure:
 * - Books: <div type="book" osisID="Gen">
 * - Chapters: <chapter sID="Gen.1..." n="1"/> ... <chapter eID="..."/>
 * - Verses: <verse osisID="Gen.1.1" sID="..." n="1"/>text<verse eID="..."/>
 *
 * Output JSON Schema:
 * - Book files: { "1": { "1": "verse text", "2": "verse text", ... }, "2": { ... } }
 * - books.json: { "books": [{ "name", "shortName", "filename", "testament", "order", "chapters" }] }
 *
 * Usage: node convert-kjv-osis-to-json.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROJECT_ROOT = join(__dirname, '..', '..');
const OSIS_FILE = join(PROJECT_ROOT, 'data', 'kjv-source', 'eng-kjv.osis.xml');
const OUTPUT_DIR = join(PROJECT_ROOT, 'data', 'kjv');
const WEB_BOOKS_FILE = join(PROJECT_ROOT, 'data', 'books.json');

// OSIS book ID to WEB filename mapping
// Maps OSIS standard abbreviations to the filenames used in the WEB data
const OSIS_TO_FILENAME = {
  'Gen': 'Genesis.json',
  'Exod': 'Exodus.json',
  'Lev': 'Leviticus.json',
  'Num': 'Numbers.json',
  'Deut': 'Deuteronomy.json',
  'Josh': 'Joshua.json',
  'Judg': 'Judges.json',
  'Ruth': 'Ruth.json',
  '1Sam': '1_Samuel.json',
  '2Sam': '2_Samuel.json',
  '1Kgs': '1_Kings.json',
  '2Kgs': '2_Kings.json',
  '1Chr': '1_Chronicles.json',
  '2Chr': '2_Chronicles.json',
  'Ezra': 'Ezra.json',
  'Neh': 'Nehemiah.json',
  'Esth': 'Esther.json',
  'Job': 'Job.json',
  'Ps': 'Psalms.json',
  'Prov': 'Proverbs.json',
  'Eccl': 'Ecclesiastes.json',
  'Song': 'Song_of_Solomon.json',
  'Isa': 'Isaiah.json',
  'Jer': 'Jeremiah.json',
  'Lam': 'Lamentations.json',
  'Ezek': 'Ezekiel.json',
  'Dan': 'Daniel.json',
  'Hos': 'Hosea.json',
  'Joel': 'Joel.json',
  'Amos': 'Amos.json',
  'Obad': 'Obadiah.json',
  'Jonah': 'Jonah.json',
  'Mic': 'Micah.json',
  'Nah': 'Nahum.json',
  'Hab': 'Habakkuk.json',
  'Zeph': 'Zephaniah.json',
  'Hag': 'Haggai.json',
  'Zech': 'Zechariah.json',
  'Mal': 'Malachi.json',
  'Matt': 'Matthew.json',
  'Mark': 'Mark.json',
  'Luke': 'Luke.json',
  'John': 'John.json',
  'Acts': 'Acts.json',
  'Rom': 'Romans.json',
  '1Cor': '1_Corinthians.json',
  '2Cor': '2_Corinthians.json',
  'Gal': 'Galatians.json',
  'Eph': 'Ephesians.json',
  'Phil': 'Philippians.json',
  'Col': 'Colossians.json',
  '1Thess': '1_Thessalonians.json',
  '2Thess': '2_Thessalonians.json',
  '1Tim': '1_Timothy.json',
  '2Tim': '2_Timothy.json',
  'Titus': 'Titus.json',
  'Phlm': 'Philemon.json',
  'Heb': 'Hebrews.json',
  'Jas': 'James.json',
  '1Pet': '1_Peter.json',
  '2Pet': '2_Peter.json',
  '1John': '1_John.json',
  '2John': '2_John.json',
  '3John': '3_John.json',
  'Jude': 'Jude.json',
  'Rev': 'Revelation.json'
};

// Canonical book IDs (66 Protestant canon books, excludes Apocrypha)
const CANONICAL_BOOKS = new Set(Object.keys(OSIS_TO_FILENAME));

/**
 * Strip XML tags from text, keeping only the text content
 * Handles <transChange>, <q>, <p>, <note>, etc.
 * @param {string} text - Text possibly containing XML tags
 * @returns {string} Plain text
 */
function stripXmlTags(text) {
  // Remove all XML tags but keep their text content
  let result = text
    // Remove self-closing tags entirely (like <verse eID="..."/>)
    .replace(/<[^>]+\/>/g, '')
    // Remove opening and closing tags but keep content
    .replace(/<[^>]+>/g, '')
    // Decode common XML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return result;
}

/**
 * Clean and normalize verse text
 * @param {string} text - Raw verse text
 * @returns {string} Cleaned text
 */
function cleanVerseText(text) {
  let cleaned = stripXmlTags(text);

  // Normalize whitespace: replace multiple spaces/newlines with single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Parse a single book from OSIS XML content
 * @param {string} bookContent - The XML content for a single book
 * @param {string} osisId - The OSIS book ID (e.g., "Gen")
 * @returns {Object} Book data in JSON format { "1": { "1": "verse", ... }, ... }
 */
function parseBook(bookContent, osisId) {
  const bookData = {};

  // Find all verse elements using regex
  // OSIS uses milestoned verses: <verse osisID="Gen.1.1" sID="..." n="1"/>text<verse eID="..."/>
  // We need to extract text between sID marker and eID marker

  // Pattern to match verse start markers and capture verse info
  const verseStartPattern = /<verse\s+osisID="([^"]+)"\s+sID="([^"]+)"\s+n="(\d+)"\s*\/>/g;

  let match;
  const versePositions = [];

  // Find all verse start positions
  while ((match = verseStartPattern.exec(bookContent)) !== null) {
    const [fullMatch, osisID, sID, verseNum] = match;
    const parts = osisID.split('.');
    if (parts.length >= 3) {
      const chapterNum = parts[1];
      versePositions.push({
        osisID,
        sID,
        chapterNum,
        verseNum,
        startPos: match.index + fullMatch.length
      });
    }
  }

  // For each verse, find text until the corresponding eID marker
  for (let i = 0; i < versePositions.length; i++) {
    const verse = versePositions[i];

    // Find the end marker for this verse
    const eIDPattern = new RegExp(`<verse\\s+eID="${verse.sID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*\\/>`, 'g');
    eIDPattern.lastIndex = verse.startPos;
    const endMatch = eIDPattern.exec(bookContent);

    if (endMatch) {
      // Extract text between start and end markers
      const rawText = bookContent.substring(verse.startPos, endMatch.index);
      const cleanedText = cleanVerseText(rawText);

      // Initialize chapter if not exists
      if (!bookData[verse.chapterNum]) {
        bookData[verse.chapterNum] = {};
      }

      // Store verse
      bookData[verse.chapterNum][verse.verseNum] = cleanedText;
    }
  }

  return bookData;
}

/**
 * Extract book content from full OSIS XML
 * @param {string} xml - Full OSIS XML content
 * @returns {Map<string, string>} Map of osisID to book content
 */
function extractBooks(xml) {
  const books = new Map();

  // Pattern to match book divs
  // <div type="book" osisID="Gen" canonical="true">...</div>
  const bookPattern = /<div\s+type="book"\s+osisID="([^"]+)"[^>]*>([\s\S]*?)(?=<div\s+type="book"|<\/div>\s*<\/div>\s*<\/osisText>)/g;

  let match;
  while ((match = bookPattern.exec(xml)) !== null) {
    const osisId = match[1];
    const bookContent = match[2];

    // Only include canonical books (skip Apocrypha)
    if (CANONICAL_BOOKS.has(osisId)) {
      books.set(osisId, bookContent);
    }
  }

  return books;
}

/**
 * Main conversion function
 */
async function convert() {
  console.log('KJV OSIS to JSON Converter');
  console.log('==========================\n');

  // Check input file exists
  if (!existsSync(OSIS_FILE)) {
    console.error(`Error: OSIS file not found at ${OSIS_FILE}`);
    process.exit(1);
  }

  // Load WEB books.json for metadata reference
  let webBooks;
  try {
    webBooks = JSON.parse(readFileSync(WEB_BOOKS_FILE, 'utf8'));
  } catch (e) {
    console.error(`Error loading WEB books.json: ${e.message}`);
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read OSIS XML
  console.log(`Reading OSIS file: ${OSIS_FILE}`);
  const xml = readFileSync(OSIS_FILE, 'utf8');
  console.log(`  File size: ${(xml.length / 1024 / 1024).toFixed(2)} MB\n`);

  // Extract all books
  console.log('Extracting books...');
  const books = extractBooks(xml);
  console.log(`  Found ${books.size} canonical books\n`);

  // Process each book
  const kjvBooks = [];
  let totalVerses = 0;
  let totalChapters = 0;

  console.log('Converting books:');

  for (const [osisId, bookContent] of books) {
    const filename = OSIS_TO_FILENAME[osisId];
    if (!filename) {
      console.warn(`  Warning: Unknown OSIS ID '${osisId}', skipping`);
      continue;
    }

    // Find matching WEB book metadata
    const webBook = webBooks.books.find(b => b.filename === filename);
    if (!webBook) {
      console.warn(`  Warning: No WEB metadata for '${filename}', skipping`);
      continue;
    }

    // Parse book content
    const bookData = parseBook(bookContent, osisId);

    // Count chapters and verses
    const chapterCount = Object.keys(bookData).length;
    const verseCount = Object.values(bookData).reduce((sum, ch) => sum + Object.keys(ch).length, 0);
    totalChapters += chapterCount;
    totalVerses += verseCount;

    // Write book JSON file
    const outputPath = join(OUTPUT_DIR, filename);
    writeFileSync(outputPath, JSON.stringify(bookData, null, 2));

    console.log(`  ✓ ${webBook.name.padEnd(20)} ${chapterCount} chapters, ${verseCount} verses`);

    // Add to books list with WEB metadata
    kjvBooks.push({
      name: webBook.name,
      shortName: webBook.shortName,
      filename: webBook.filename,
      testament: webBook.testament,
      order: webBook.order,
      chapters: chapterCount
    });
  }

  // Sort books by canonical order
  kjvBooks.sort((a, b) => a.order - b.order);

  // Write books.json
  const booksJsonPath = join(OUTPUT_DIR, 'books.json');
  writeFileSync(booksJsonPath, JSON.stringify({ books: kjvBooks }, null, 2));

  console.log('\n==========================');
  console.log(`Total: ${kjvBooks.length} books, ${totalChapters} chapters, ${totalVerses} verses`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Books index: ${booksJsonPath}`);
  console.log('\nConversion complete!');

  // Validation spot checks
  console.log('\n--- Validation Spot Checks ---');

  // Genesis 1:1
  try {
    const genesis = JSON.parse(readFileSync(join(OUTPUT_DIR, 'Genesis.json'), 'utf8'));
    console.log(`\nGenesis 1:1:`);
    console.log(`  "${genesis['1']['1']}"`);
  } catch (e) {
    console.error('  Error reading Genesis:', e.message);
  }

  // Psalm 23:1
  try {
    const psalms = JSON.parse(readFileSync(join(OUTPUT_DIR, 'Psalms.json'), 'utf8'));
    console.log(`\nPsalm 23:1:`);
    console.log(`  "${psalms['23']['1']}"`);
  } catch (e) {
    console.error('  Error reading Psalms:', e.message);
  }

  // John 3:16
  try {
    const john = JSON.parse(readFileSync(join(OUTPUT_DIR, 'John.json'), 'utf8'));
    console.log(`\nJohn 3:16:`);
    console.log(`  "${john['3']['16']}"`);
  } catch (e) {
    console.error('  Error reading John:', e.message);
  }

  // Chapter count validation
  console.log('\n--- Chapter Count Validation ---');
  const webBooksMap = new Map(webBooks.books.map(b => [b.filename, b]));
  let chapterMismatches = 0;

  for (const kjvBook of kjvBooks) {
    const webBook = webBooksMap.get(kjvBook.filename);
    if (webBook && kjvBook.chapters !== webBook.chapters) {
      console.log(`  ⚠ ${kjvBook.name}: KJV has ${kjvBook.chapters} chapters, WEB has ${webBook.chapters}`);
      chapterMismatches++;
    }
  }

  if (chapterMismatches === 0) {
    console.log('  ✓ All chapter counts match WEB metadata');
  }
}

// Run conversion
convert().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
