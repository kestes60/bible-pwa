#!/usr/bin/env node
/**
 * USFX to JSON Converter for Bible Translations
 *
 * Converts USFX XML format to the JSON schema used by the Bible PWA.
 * Supports any Bible version in USFX format (e.g., RVR, CUV from open-bibles).
 *
 * USFX Structure:
 * - Books: <book id="GEN">...</book>
 * - Chapters: <c id="1" /> (self-closing milestone)
 * - Verses: <v id="1" />text<ve /> (start marker, content, end marker)
 * - Words: <w s="H7225">word text</w> (with Strong's numbers - we keep text only)
 * - Added text: <add>translator additions</add>
 * - Other tags: <p>, <h>, <toc>, <id>, etc. (ignored or stripped)
 *
 * Output JSON Schema:
 * - Book files: { "1": { "1": "verse text", "2": "verse text", ... }, "2": { ... } }
 * - books.json: { "books": [{ "name", "shortName", "filename", "testament", "order", "chapters" }] }
 *
 * Usage:
 *   node convert-usfx-to-json.mjs \
 *     --source path/to/translation.usfx.xml \
 *     --out-dir data/version/ \
 *     --version-id version \
 *     [--reference-books data/books.json]
 *
 * Example:
 *   node convert-usfx-to-json.mjs \
 *     --source data/rvr-source/spa-rv1909.usfx.xml \
 *     --out-dir data/rvr \
 *     --version-id rvr \
 *     --reference-books data/books.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// USFX book ID to filename mapping
// Maps USFX 3-letter codes to the filenames used in the Bible PWA
const USFX_TO_FILENAME = {
  'GEN': 'Genesis.json',
  'EXO': 'Exodus.json',
  'LEV': 'Leviticus.json',
  'NUM': 'Numbers.json',
  'DEU': 'Deuteronomy.json',
  'JOS': 'Joshua.json',
  'JDG': 'Judges.json',
  'RUT': 'Ruth.json',
  '1SA': '1_Samuel.json',
  '2SA': '2_Samuel.json',
  '1KI': '1_Kings.json',
  '2KI': '2_Kings.json',
  '1CH': '1_Chronicles.json',
  '2CH': '2_Chronicles.json',
  'EZR': 'Ezra.json',
  'NEH': 'Nehemiah.json',
  'EST': 'Esther.json',
  'JOB': 'Job.json',
  'PSA': 'Psalms.json',
  'PRO': 'Proverbs.json',
  'ECC': 'Ecclesiastes.json',
  'SNG': 'Song_of_Solomon.json',
  'ISA': 'Isaiah.json',
  'JER': 'Jeremiah.json',
  'LAM': 'Lamentations.json',
  'EZK': 'Ezekiel.json',
  'DAN': 'Daniel.json',
  'HOS': 'Hosea.json',
  'JOL': 'Joel.json',
  'AMO': 'Amos.json',
  'OBA': 'Obadiah.json',
  'JON': 'Jonah.json',
  'MIC': 'Micah.json',
  'NAM': 'Nahum.json',
  'HAB': 'Habakkuk.json',
  'ZEP': 'Zephaniah.json',
  'HAG': 'Haggai.json',
  'ZEC': 'Zechariah.json',
  'MAL': 'Malachi.json',
  'MAT': 'Matthew.json',
  'MRK': 'Mark.json',
  'LUK': 'Luke.json',
  'JHN': 'John.json',
  'ACT': 'Acts.json',
  'ROM': 'Romans.json',
  '1CO': '1_Corinthians.json',
  '2CO': '2_Corinthians.json',
  'GAL': 'Galatians.json',
  'EPH': 'Ephesians.json',
  'PHP': 'Philippians.json',
  'COL': 'Colossians.json',
  '1TH': '1_Thessalonians.json',
  '2TH': '2_Thessalonians.json',
  '1TI': '1_Timothy.json',
  '2TI': '2_Timothy.json',
  'TIT': 'Titus.json',
  'PHM': 'Philemon.json',
  'HEB': 'Hebrews.json',
  'JAS': 'James.json',
  '1PE': '1_Peter.json',
  '2PE': '2_Peter.json',
  '1JN': '1_John.json',
  '2JN': '2_John.json',
  '3JN': '3_John.json',
  'JUD': 'Jude.json',
  'REV': 'Revelation.json'
};

// Canonical book IDs (66 Protestant canon books, excludes Apocrypha)
const CANONICAL_BOOKS = new Set(Object.keys(USFX_TO_FILENAME));

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
USFX to JSON Converter

Usage:
  node convert-usfx-to-json.mjs \\
    --source <path> \\
    --out-dir <path> \\
    --version-id <id> \\
    [--reference-books <path>]

Required Arguments:
  --source <path>           Path to USFX XML file
  --out-dir <path>          Output directory for JSON files
  --version-id <id>         Version identifier (e.g., rvr, cuv)

Optional Arguments:
  --reference-books <path>  Path to books.json for metadata reference
                            (default: data/books.json)
  --help, -h                Show this help message

Example:
  node convert-usfx-to-json.mjs \\
    --source data/rvr-source/spa-rv1909.usfx.xml \\
    --out-dir data/rvr \\
    --version-id rvr \\
    --reference-books data/books.json
`);
}

/**
 * Strip XML tags from text, keeping only the text content
 * Handles <w>, <add>, <q>, <p>, <note>, etc.
 * @param {string} text - Text possibly containing XML tags
 * @returns {string} Plain text
 */
function stripXmlTags(text) {
  let result = text
    // Remove self-closing tags entirely (like <ve/>, <c id="..."/>)
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
 * Parse a single book from USFX XML content
 * USFX uses milestone markers: <c id="N"/> for chapters, <v id="N"/>...<ve/> for verses
 * @param {string} bookContent - The XML content for a single book
 * @param {string} bookId - The USFX book ID (e.g., "GEN")
 * @returns {Object} Book data in JSON format { "1": { "1": "verse", ... }, ... }
 */
function parseBook(bookContent, bookId) {
  const bookData = {};
  let currentChapter = null;

  // USFX parsing strategy:
  // 1. Split content by chapter markers <c id="N"/>
  // 2. Within each chapter, find verses between <v id="N"/> and <ve/>

  // Find all chapter markers and their positions
  const chapterPattern = /<c\s+id=["'](\d+)["']\s*\/>/g;
  const chapters = [];
  let match;

  while ((match = chapterPattern.exec(bookContent)) !== null) {
    chapters.push({
      num: match[1],
      startPos: match.index + match[0].length
    });
  }

  // Process each chapter
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextChapter = chapters[i + 1];

    // Extract chapter content (from this chapter marker to next, or end of book)
    const endPos = nextChapter ? nextChapter.startPos - nextChapter.num.length - 15 : bookContent.length;
    const chapterContent = bookContent.substring(chapter.startPos, endPos);

    // Initialize chapter in bookData
    bookData[chapter.num] = {};

    // Find all verses in this chapter
    // Pattern: <v id="N"/>...content...<ve/>
    // Note: Some USFX files may have <v id="N" /> with space before />
    const versePattern = /<v\s+id=["'](\d+)["']\s*\/>/g;
    const verses = [];

    while ((match = versePattern.exec(chapterContent)) !== null) {
      verses.push({
        num: match[1],
        startPos: match.index + match[0].length
      });
    }

    // Extract verse content
    for (let j = 0; j < verses.length; j++) {
      const verse = verses[j];

      // Find the verse end marker <ve/> or <ve />
      // Start searching from verse start position
      const searchFrom = verse.startPos;
      const vePattern = /<ve\s*\/>/;
      const veMatch = vePattern.exec(chapterContent.substring(searchFrom));

      let verseContent;
      if (veMatch) {
        verseContent = chapterContent.substring(searchFrom, searchFrom + veMatch.index);
      } else {
        // No <ve/> found - use content until next verse or end of chapter
        const nextVerse = verses[j + 1];
        if (nextVerse) {
          // Find the start of next <v> tag
          const nextVMatch = /<v\s+id=["']\d+["']\s*\/>/.exec(chapterContent.substring(searchFrom));
          if (nextVMatch) {
            verseContent = chapterContent.substring(searchFrom, searchFrom + nextVMatch.index);
          } else {
            verseContent = chapterContent.substring(searchFrom);
          }
        } else {
          verseContent = chapterContent.substring(searchFrom);
        }
      }

      // Clean the verse text
      const cleanedText = cleanVerseText(verseContent);

      if (cleanedText) {
        bookData[chapter.num][verse.num] = cleanedText;
      }
    }
  }

  return bookData;
}

/**
 * Extract book content from full USFX XML
 * @param {string} xml - Full USFX XML content
 * @returns {Map<string, string>} Map of bookId to book content
 */
function extractBooks(xml) {
  const books = new Map();

  // Pattern to match book elements: <book id="GEN">...</book>
  // Using non-greedy match to get content between opening and closing tags
  const bookPattern = /<book\s+id=["']([A-Z0-9]+)["'][^>]*>([\s\S]*?)<\/book>/g;

  let match;
  while ((match = bookPattern.exec(xml)) !== null) {
    const bookId = match[1].toUpperCase();
    const bookContent = match[2];

    // Only include canonical books (skip Apocrypha)
    if (CANONICAL_BOOKS.has(bookId)) {
      books.set(bookId, bookContent);
    }
  }

  return books;
}

/**
 * Main conversion function
 * @param {Object} config - Configuration object
 * @param {string} config.source - Path to USFX XML file
 * @param {string} config.outDir - Output directory path
 * @param {string} config.versionId - Version identifier
 * @param {string} config.referenceBooks - Path to reference books.json
 */
async function convert(config) {
  const { source, outDir, versionId, referenceBooks } = config;

  console.log('USFX to JSON Converter');
  console.log('======================\n');
  console.log(`Version: ${versionId.toUpperCase()}`);
  console.log(`Source: ${source}`);
  console.log(`Output: ${outDir}\n`);

  // Check input file exists
  if (!existsSync(source)) {
    throw new Error(`USFX file not found: ${source}`);
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

  // Read USFX XML
  console.log('Reading USFX file...');
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

  for (const [bookId, bookContent] of books) {
    const filename = USFX_TO_FILENAME[bookId];
    if (!filename) {
      console.warn(`  Warning: Unknown USFX ID '${bookId}', skipping`);
      continue;
    }

    // Find matching reference book metadata (if available)
    let refBook = null;
    if (refBooks) {
      refBook = refBooks.books.find(b => b.filename === filename);
    }

    // Parse book content
    const bookData = parseBook(bookContent, bookId);

    // Count chapters and verses
    const chapterCount = Object.keys(bookData).length;
    const verseCount = Object.values(bookData).reduce((sum, ch) => sum + Object.keys(ch).length, 0);
    totalChapters += chapterCount;
    totalVerses += verseCount;

    // Write book JSON file
    const outputPath = join(outDir, filename);
    writeFileSync(outputPath, JSON.stringify(bookData, null, 2));

    const bookName = refBook ? refBook.name : bookId;
    console.log(`  ✓ ${bookName.padEnd(20)} ${chapterCount} chapters, ${verseCount} verses`);

    // Create book metadata
    const bookMetadata = {
      name: refBook ? refBook.name : bookId,
      shortName: refBook ? refBook.shortName : bookId,
      filename: filename,
      testament: refBook ? refBook.testament : (bookId === 'MAT' || books.size > 39 ? 'NT' : 'OT'),
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
