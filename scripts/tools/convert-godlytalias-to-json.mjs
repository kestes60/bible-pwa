#!/usr/bin/env node
/**
 * godlytalias Bible Database to PWA JSON Converter
 *
 * Converts godlytalias/Bible-Database JSON format to the JSON schema used by the Bible PWA.
 *
 * godlytalias Structure:
 * - Book: [ { Chapter: [ { Verse: [ { Verseid, Verse } ] } ] } ]
 * - Verseid format: BBCCCVVV (book 2 digits, chapter 3 digits, verse 3 digits, 0-indexed)
 *
 * Output JSON Schema:
 * - Book files: { "1": { "1": "verse text", "2": "verse text", ... }, "2": { ... } }
 * - books.json: { "books": [{ "name", "shortName", "filename", "testament", "order", "chapters" }] }
 *
 * Usage:
 *   node convert-godlytalias-to-json.mjs \
 *     --source path/to/bible.json \
 *     --out-dir data/version/ \
 *     --version-id version
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Book number (0-indexed from source) to filename mapping
const BOOK_NUMBER_TO_FILENAME = {
  0: 'Genesis.json',
  1: 'Exodus.json',
  2: 'Leviticus.json',
  3: 'Numbers.json',
  4: 'Deuteronomy.json',
  5: 'Joshua.json',
  6: 'Judges.json',
  7: 'Ruth.json',
  8: '1_Samuel.json',
  9: '2_Samuel.json',
  10: '1_Kings.json',
  11: '2_Kings.json',
  12: '1_Chronicles.json',
  13: '2_Chronicles.json',
  14: 'Ezra.json',
  15: 'Nehemiah.json',
  16: 'Esther.json',
  17: 'Job.json',
  18: 'Psalms.json',
  19: 'Proverbs.json',
  20: 'Ecclesiastes.json',
  21: 'Song_of_Solomon.json',
  22: 'Isaiah.json',
  23: 'Jeremiah.json',
  24: 'Lamentations.json',
  25: 'Ezekiel.json',
  26: 'Daniel.json',
  27: 'Hosea.json',
  28: 'Joel.json',
  29: 'Amos.json',
  30: 'Obadiah.json',
  31: 'Jonah.json',
  32: 'Micah.json',
  33: 'Nahum.json',
  34: 'Habakkuk.json',
  35: 'Zephaniah.json',
  36: 'Haggai.json',
  37: 'Zechariah.json',
  38: 'Malachi.json',
  // New Testament
  39: 'Matthew.json',
  40: 'Mark.json',
  41: 'Luke.json',
  42: 'John.json',
  43: 'Acts.json',
  44: 'Romans.json',
  45: '1_Corinthians.json',
  46: '2_Corinthians.json',
  47: 'Galatians.json',
  48: 'Ephesians.json',
  49: 'Philippians.json',
  50: 'Colossians.json',
  51: '1_Thessalonians.json',
  52: '2_Thessalonians.json',
  53: '1_Timothy.json',
  54: '2_Timothy.json',
  55: 'Titus.json',
  56: 'Philemon.json',
  57: 'Hebrews.json',
  58: 'James.json',
  59: '1_Peter.json',
  60: '2_Peter.json',
  61: '1_John.json',
  62: '2_John.json',
  63: '3_John.json',
  64: 'Jude.json',
  65: 'Revelation.json'
};

// Book metadata for English names
const BOOK_METADATA = {
  0: { name: 'Genesis', shortName: 'Gen', testament: 'OT' },
  1: { name: 'Exodus', shortName: 'Exod', testament: 'OT' },
  2: { name: 'Leviticus', shortName: 'Lev', testament: 'OT' },
  3: { name: 'Numbers', shortName: 'Num', testament: 'OT' },
  4: { name: 'Deuteronomy', shortName: 'Deut', testament: 'OT' },
  5: { name: 'Joshua', shortName: 'Josh', testament: 'OT' },
  6: { name: 'Judges', shortName: 'Judg', testament: 'OT' },
  7: { name: 'Ruth', shortName: 'Ruth', testament: 'OT' },
  8: { name: '1 Samuel', shortName: '1Sam', testament: 'OT' },
  9: { name: '2 Samuel', shortName: '2Sam', testament: 'OT' },
  10: { name: '1 Kings', shortName: '1Kgs', testament: 'OT' },
  11: { name: '2 Kings', shortName: '2Kgs', testament: 'OT' },
  12: { name: '1 Chronicles', shortName: '1Chr', testament: 'OT' },
  13: { name: '2 Chronicles', shortName: '2Chr', testament: 'OT' },
  14: { name: 'Ezra', shortName: 'Ezra', testament: 'OT' },
  15: { name: 'Nehemiah', shortName: 'Neh', testament: 'OT' },
  16: { name: 'Esther', shortName: 'Esth', testament: 'OT' },
  17: { name: 'Job', shortName: 'Job', testament: 'OT' },
  18: { name: 'Psalms', shortName: 'Ps', testament: 'OT' },
  19: { name: 'Proverbs', shortName: 'Prov', testament: 'OT' },
  20: { name: 'Ecclesiastes', shortName: 'Eccl', testament: 'OT' },
  21: { name: 'Song of Solomon', shortName: 'Song', testament: 'OT' },
  22: { name: 'Isaiah', shortName: 'Isa', testament: 'OT' },
  23: { name: 'Jeremiah', shortName: 'Jer', testament: 'OT' },
  24: { name: 'Lamentations', shortName: 'Lam', testament: 'OT' },
  25: { name: 'Ezekiel', shortName: 'Ezek', testament: 'OT' },
  26: { name: 'Daniel', shortName: 'Dan', testament: 'OT' },
  27: { name: 'Hosea', shortName: 'Hos', testament: 'OT' },
  28: { name: 'Joel', shortName: 'Joel', testament: 'OT' },
  29: { name: 'Amos', shortName: 'Amos', testament: 'OT' },
  30: { name: 'Obadiah', shortName: 'Obad', testament: 'OT' },
  31: { name: 'Jonah', shortName: 'Jonah', testament: 'OT' },
  32: { name: 'Micah', shortName: 'Mic', testament: 'OT' },
  33: { name: 'Nahum', shortName: 'Nah', testament: 'OT' },
  34: { name: 'Habakkuk', shortName: 'Hab', testament: 'OT' },
  35: { name: 'Zephaniah', shortName: 'Zeph', testament: 'OT' },
  36: { name: 'Haggai', shortName: 'Hag', testament: 'OT' },
  37: { name: 'Zechariah', shortName: 'Zech', testament: 'OT' },
  38: { name: 'Malachi', shortName: 'Mal', testament: 'OT' },
  39: { name: 'Matthew', shortName: 'Matt', testament: 'NT' },
  40: { name: 'Mark', shortName: 'Mark', testament: 'NT' },
  41: { name: 'Luke', shortName: 'Luke', testament: 'NT' },
  42: { name: 'John', shortName: 'John', testament: 'NT' },
  43: { name: 'Acts', shortName: 'Acts', testament: 'NT' },
  44: { name: 'Romans', shortName: 'Rom', testament: 'NT' },
  45: { name: '1 Corinthians', shortName: '1Cor', testament: 'NT' },
  46: { name: '2 Corinthians', shortName: '2Cor', testament: 'NT' },
  47: { name: 'Galatians', shortName: 'Gal', testament: 'NT' },
  48: { name: 'Ephesians', shortName: 'Eph', testament: 'NT' },
  49: { name: 'Philippians', shortName: 'Phil', testament: 'NT' },
  50: { name: 'Colossians', shortName: 'Col', testament: 'NT' },
  51: { name: '1 Thessalonians', shortName: '1Thess', testament: 'NT' },
  52: { name: '2 Thessalonians', shortName: '2Thess', testament: 'NT' },
  53: { name: '1 Timothy', shortName: '1Tim', testament: 'NT' },
  54: { name: '2 Timothy', shortName: '2Tim', testament: 'NT' },
  55: { name: 'Titus', shortName: 'Titus', testament: 'NT' },
  56: { name: 'Philemon', shortName: 'Phlm', testament: 'NT' },
  57: { name: 'Hebrews', shortName: 'Heb', testament: 'NT' },
  58: { name: 'James', shortName: 'Jas', testament: 'NT' },
  59: { name: '1 Peter', shortName: '1Pet', testament: 'NT' },
  60: { name: '2 Peter', shortName: '2Pet', testament: 'NT' },
  61: { name: '1 John', shortName: '1John', testament: 'NT' },
  62: { name: '2 John', shortName: '2John', testament: 'NT' },
  63: { name: '3 John', shortName: '3John', testament: 'NT' },
  64: { name: 'Jude', shortName: 'Jude', testament: 'NT' },
  65: { name: 'Revelation', shortName: 'Rev', testament: 'NT' }
};

/**
 * Parse CLI arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    source: null,
    outDir: null,
    versionId: null
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

      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;

      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

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
godlytalias Bible Database to PWA JSON Converter

Usage:
  node convert-godlytalias-to-json.mjs \\
    --source <path> \\
    --out-dir <path> \\
    --version-id <id>

Required Arguments:
  --source <path>      Path to godlytalias bible.json file
  --out-dir <path>     Output directory for JSON files
  --version-id <id>    Version identifier (e.g., hi-irv)

Example:
  node convert-godlytalias-to-json.mjs \\
    --source data/source/hindi/bible.json \\
    --out-dir data/hi-irv \\
    --version-id hi-irv
`);
}

/**
 * Clean verse text (trim whitespace, normalize)
 */
function cleanVerseText(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main conversion function
 */
async function convert(config) {
  const { source, outDir, versionId } = config;

  console.log('godlytalias to PWA JSON Converter');
  console.log('==================================\n');
  console.log(`Version: ${versionId.toUpperCase()}`);
  console.log(`Source: ${source}`);
  console.log(`Output: ${outDir}\n`);

  // Check input file exists
  if (!existsSync(source)) {
    throw new Error(`Source file not found: ${source}`);
  }

  // Create output directory
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    console.log(`Created output directory: ${outDir}\n`);
  }

  // Read godlytalias JSON
  console.log('Reading godlytalias JSON...');
  const rawData = readFileSync(source, 'utf8');
  const bibleData = JSON.parse(rawData);

  const books = bibleData.Book;
  console.log(`  Books found: ${books.length}\n`);

  // Process each book
  const versionBooks = [];
  let totalVerses = 0;
  let totalChapters = 0;

  console.log('Converting books:');

  for (let bookIndex = 0; bookIndex < books.length; bookIndex++) {
    const book = books[bookIndex];
    const filename = BOOK_NUMBER_TO_FILENAME[bookIndex];
    const metadata = BOOK_METADATA[bookIndex];

    if (!filename || !metadata) {
      console.warn(`  Warning: Unknown book index ${bookIndex}, skipping`);
      continue;
    }

    // Build book data in PWA format
    const bookData = {};

    for (let chapterIndex = 0; chapterIndex < book.Chapter.length; chapterIndex++) {
      const chapter = book.Chapter[chapterIndex];
      const chapterNum = String(chapterIndex + 1); // 1-indexed for output
      bookData[chapterNum] = {};

      for (let verseIndex = 0; verseIndex < chapter.Verse.length; verseIndex++) {
        const verse = chapter.Verse[verseIndex];
        const verseNum = String(verseIndex + 1); // 1-indexed for output
        bookData[chapterNum][verseNum] = cleanVerseText(verse.Verse);
      }
    }

    // Count chapters and verses
    const chapterCount = Object.keys(bookData).length;
    const verseCount = Object.values(bookData).reduce((sum, ch) => sum + Object.keys(ch).length, 0);
    totalChapters += chapterCount;
    totalVerses += verseCount;

    // Write book JSON file
    const outputPath = join(outDir, filename);
    writeFileSync(outputPath, JSON.stringify(bookData, null, 2));

    console.log(`  ✓ ${metadata.name.padEnd(20)} ${chapterCount} chapters, ${verseCount} verses`);

    // Create book metadata for books.json
    versionBooks.push({
      name: metadata.name,
      shortName: metadata.shortName,
      filename: filename,
      testament: metadata.testament,
      order: bookIndex + 1,
      chapters: chapterCount
    });
  }

  // Sort books by canonical order
  versionBooks.sort((a, b) => a.order - b.order);

  // Write books.json
  const booksJsonPath = join(outDir, 'books.json');
  writeFileSync(booksJsonPath, JSON.stringify({ books: versionBooks }, null, 2));

  console.log('\n==================================');
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

  // John 1:1
  try {
    const john = JSON.parse(readFileSync(join(outDir, 'John.json'), 'utf8'));
    console.log(`\nJohn 1:1:`);
    console.log(`  "${john['1']['1']}"`);
  } catch (e) {
    console.error('  Error reading John:', e.message);
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
