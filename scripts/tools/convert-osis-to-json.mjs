#!/usr/bin/env node
/**
 * Generic OSIS to JSON Converter for Bible Translations
 *
 * Converts OSIS XML format to the JSON schema used by the Bible PWA.
 * Supports any Bible version in OSIS format.
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
 * Usage:
 *   node convert-osis-to-json.mjs \
 *     --source path/to/translation.osis.xml \
 *     --out-dir data/version/ \
 *     --version-id version \
 *     [--reference-books data/books.json]
 *
 * Example:
 *   node convert-osis-to-json.mjs \
 *     --source data/kjv-source/eng-kjv.osis.xml \
 *     --out-dir data/kjv \
 *     --version-id kjv \
 *     --reference-books data/books.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// OSIS book ID to filename mapping
// Maps OSIS standard abbreviations to the filenames used in the Bible PWA
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
 * Parse CLI arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    source: null,
    outDir: null,
    versionId: null,
    referenceBooks: 'data/books.json' // Default value
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--source':
        if (!nextArg || nextArg.startsWith('--')) {
          throw new Error('--source requires a path argument');
        }
        parsed.source = resolve(nextArg);
        i++;
        break;

      case '--out-dir':
        if (!nextArg || nextArg.startsWith('--')) {
          throw new Error('--out-dir requires a path argument');
        }
        parsed.outDir = resolve(nextArg);
        i++;
        break;

      case '--version-id':
        if (!nextArg || nextArg.startsWith('--')) {
          throw new Error('--version-id requires an identifier argument');
        }
        parsed.versionId = nextArg;
        i++;
        break;

      case '--reference-books':
        if (!nextArg || nextArg.startsWith('--')) {
          throw new Error('--reference-books requires a path argument');
        }
        parsed.referenceBooks = resolve(nextArg);
        i++;
        break;

      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;

      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  // Validate required arguments
  const missing = [];
  if (!parsed.source) missing.push('--source');
  if (!parsed.outDir) missing.push('--out-dir');
  if (!parsed.versionId) missing.push('--version-id');

  if (missing.length > 0) {
    throw new Error(`Missing required arguments: ${missing.join(', ')}`);
  }

  return parsed;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Generic OSIS to JSON Converter

Usage:
  node convert-osis-to-json.mjs \\
    --source <path> \\
    --out-dir <path> \\
    --version-id <id> \\
    [--reference-books <path>]

Required Arguments:
  --source <path>           Path to OSIS XML file
  --out-dir <path>          Output directory for JSON files
  --version-id <id>         Version identifier (e.g., kjv, krv, asv)

Optional Arguments:
  --reference-books <path>  Path to books.json for metadata reference
                            (default: data/books.json)
  --help, -h                Show this help message

Example:
  node convert-osis-to-json.mjs \\
    --source data/kjv-source/eng-kjv.osis.xml \\
    --out-dir data/kjv \\
    --version-id kjv \\
    --reference-books data/books.json
`);
}

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
 * Supports both milestoned verses (KJV style) and container verses (Korean style)
 * @param {string} bookContent - The XML content for a single book
 * @param {string} osisId - The OSIS book ID (e.g., "Gen")
 * @returns {Object} Book data in JSON format { "1": { "1": "verse", ... }, ... }
 */
function parseBook(bookContent, osisId) {
  const bookData = {};

  // Try container-style verses first (simpler format used by Korean, etc.)
  // Pattern: <verse osisID='Gen.1.1'>text</verse> or <verse osisID="Gen.1.1">text</verse>
  const containerPattern = /<verse\s+osisID=['"]([^'"]+)['"]>([^<]*(?:<(?!\/verse>)[^<]*)*)<\/verse>/g;

  let match;
  let foundContainerVerses = false;

  while ((match = containerPattern.exec(bookContent)) !== null) {
    foundContainerVerses = true;
    const [fullMatch, osisID, rawText] = match;
    const parts = osisID.split('.');

    if (parts.length >= 3) {
      const chapterNum = parts[1];
      const verseNum = parts[2];
      const cleanedText = cleanVerseText(rawText);

      // Initialize chapter if not exists
      if (!bookData[chapterNum]) {
        bookData[chapterNum] = {};
      }

      // Store verse
      bookData[chapterNum][verseNum] = cleanedText;
    }
  }

  // If container verses found, return
  if (foundContainerVerses) {
    return bookData;
  }

  // Fall back to milestoned verses (KJV style)
  // Pattern: <verse osisID="Gen.1.1" sID="..." n="1"/>text<verse eID="..."/>
  const verseStartPattern = /<verse\s+osisID=["']([^"']+)["']\s+sID=["']([^"']+)["']\s+n=["'](\d+)["']\s*\/>/g;

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

    // Find the end marker for this verse (handles both quote styles)
    const eIDPattern = new RegExp(`<verse\\s+eID=["']${verse.sID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\s*\\/>`, 'g');
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
 * Supports both single and double quotes in attributes
 * @param {string} xml - Full OSIS XML content
 * @returns {Map<string, string>} Map of osisID to book content
 */
function extractBooks(xml) {
  const books = new Map();

  // Pattern to match book divs (handles both single and double quotes)
  // <div type="book" osisID="Gen" ...> or <div type='book' osisID='Gen' ...>
  const bookPattern = /<div\s+type=['"]book['"]\s+osisID=['"]([^'"]+)['"][^>]*>([\s\S]*?)(?=<div\s+type=['"]book['"]|<\/div>\s*<\/div>\s*<\/osisText>|<\/osisText>)/g;

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
 * @param {Object} config - Configuration object
 * @param {string} config.source - Path to OSIS XML file
 * @param {string} config.outDir - Output directory path
 * @param {string} config.versionId - Version identifier
 * @param {string} config.referenceBooks - Path to reference books.json
 */
async function convert(config) {
  const { source, outDir, versionId, referenceBooks } = config;

  console.log('OSIS to JSON Converter');
  console.log('======================\n');
  console.log(`Version: ${versionId.toUpperCase()}`);
  console.log(`Source: ${source}`);
  console.log(`Output: ${outDir}\n`);

  // Check input file exists
  if (!existsSync(source)) {
    throw new Error(`OSIS file not found: ${source}`);
  }

  // Load reference books.json for metadata
  let refBooks;
  try {
    if (existsSync(referenceBooks)) {
      refBooks = JSON.parse(readFileSync(referenceBooks, 'utf8'));
      console.log(`Using reference metadata: ${referenceBooks}\n`);
    } else {
      console.warn(`Warning: Reference books.json not found at ${referenceBooks}`);
      console.warn('Will create books.json with basic metadata only\n');
      refBooks = null;
    }
  } catch (e) {
    console.warn(`Warning: Error loading reference books.json: ${e.message}`);
    console.warn('Will create books.json with basic metadata only\n');
    refBooks = null;
  }

  // Create output directory
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    console.log(`Created output directory: ${outDir}\n`);
  }

  // Read OSIS XML
  console.log('Reading OSIS file...');
  const xml = readFileSync(source, 'utf8');
  console.log(`  File size: ${(xml.length / 1024 / 1024).toFixed(2)} MB\n`);

  // Extract all books
  console.log('Extracting books...');
  const books = extractBooks(xml);
  console.log(`  Found ${books.size} canonical books\n`);

  // Process each book
  const versionBooks = [];
  let totalVerses = 0;
  let totalChapters = 0;

  console.log('Converting books:');

  for (const [osisId, bookContent] of books) {
    const filename = OSIS_TO_FILENAME[osisId];
    if (!filename) {
      console.warn(`  Warning: Unknown OSIS ID '${osisId}', skipping`);
      continue;
    }

    // Find matching reference book metadata (if available)
    let refBook = null;
    if (refBooks) {
      refBook = refBooks.books.find(b => b.filename === filename);
    }

    // Parse book content
    const bookData = parseBook(bookContent, osisId);

    // Count chapters and verses
    const chapterCount = Object.keys(bookData).length;
    const verseCount = Object.values(bookData).reduce((sum, ch) => sum + Object.keys(ch).length, 0);
    totalChapters += chapterCount;
    totalVerses += verseCount;

    // Write book JSON file
    const outputPath = join(outDir, filename);
    writeFileSync(outputPath, JSON.stringify(bookData, null, 2));

    const bookName = refBook ? refBook.name : osisId;
    console.log(`  ✓ ${bookName.padEnd(20)} ${chapterCount} chapters, ${verseCount} verses`);

    // Create book metadata
    const bookMetadata = {
      name: refBook ? refBook.name : osisId,
      shortName: refBook ? refBook.shortName : osisId,
      filename: filename,
      testament: refBook ? refBook.testament : (osisId === 'Matt' || books.size > 39 ? 'NT' : 'OT'),
      order: refBook ? refBook.order : versionBooks.length + 1,
      chapters: chapterCount
    };

    versionBooks.push(bookMetadata);
  }

  // Sort books by canonical order
  versionBooks.sort((a, b) => a.order - b.order);

  // Write books.json
  const booksJsonPath = join(outDir, 'books.json');
  writeFileSync(booksJsonPath, JSON.stringify({ books: versionBooks }, null, 2));

  console.log('\n======================');
  console.log(`Total: ${versionBooks.length} books, ${totalChapters} chapters, ${totalVerses} verses`);
  console.log(`Output directory: ${outDir}`);
  console.log(`Books index: ${booksJsonPath}`);
  console.log('\nConversion complete!');

  // Validation spot checks
  console.log('\n--- Validation Spot Checks ---');

  // Genesis 1:1
  try {
    const genesis = JSON.parse(readFileSync(join(outDir, 'Genesis.json'), 'utf8'));
    console.log(`\nGenesis 1:1:`);
    console.log(`  "${genesis['1']['1']}"`);
  } catch (e) {
    console.error('  Error reading Genesis:', e.message);
  }

  // Psalm 23:1
  try {
    const psalms = JSON.parse(readFileSync(join(outDir, 'Psalms.json'), 'utf8'));
    console.log(`\nPsalm 23:1:`);
    console.log(`  "${psalms['23']['1']}"`);
  } catch (e) {
    console.error('  Error reading Psalms:', e.message);
  }

  // John 3:16
  try {
    const john = JSON.parse(readFileSync(join(outDir, 'John.json'), 'utf8'));
    console.log(`\nJohn 3:16:`);
    console.log(`  "${john['3']['16']}"`);
  } catch (e) {
    console.error('  Error reading John:', e.message);
  }

  // Chapter count validation (if reference books available)
  if (refBooks) {
    console.log('\n--- Chapter Count Validation ---');
    const refBooksMap = new Map(refBooks.books.map(b => [b.filename, b]));
    let chapterMismatches = 0;

    for (const book of versionBooks) {
      const refBook = refBooksMap.get(book.filename);
      if (refBook && book.chapters !== refBook.chapters) {
        console.log(`  ⚠ ${book.name}: ${versionId.toUpperCase()} has ${book.chapters} chapters, reference has ${refBook.chapters}`);
        chapterMismatches++;
      }
    }

    if (chapterMismatches === 0) {
      console.log('  ✓ All chapter counts match reference metadata');
    }
  }
}

// Main execution
try {
  const args = parseArgs();
  await convert(args);
} catch (err) {
  if (err.message.includes('Missing required arguments') || err.message.includes('Unknown argument')) {
    console.error(`Error: ${err.message}\n`);
    printUsage();
    process.exit(1);
  } else {
    console.error('Conversion failed:', err.message);
    process.exit(1);
  }
}
