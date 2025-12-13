#!/usr/bin/env node
/**
 * GetBible JSON to PWA JSON Converter
 *
 * Converts GetBible v2 JSON format to the JSON schema used by the Bible PWA.
 * Supports Hebrew and other RTL languages.
 *
 * GetBible Structure:
 * - books: [{ nr, name, chapters: [{ chapter, verses: [{ verse, text }] }] }]
 *
 * Output JSON Schema:
 * - Book files: { "1": { "1": "verse text", "2": "verse text", ... }, "2": { ... } }
 * - books.json: { "books": [{ "name", "shortName", "filename", "testament", "order", "chapters" }] }
 *
 * Usage:
 *   node convert-getbible-to-json.mjs \
 *     --source path/to/translation.json \
 *     --out-dir data/version/ \
 *     --version-id version
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// GetBible book number to filename mapping (Old Testament only for Hebrew)
const BOOK_NUMBER_TO_FILENAME = {
  1: 'Genesis.json',
  2: 'Exodus.json',
  3: 'Leviticus.json',
  4: 'Numbers.json',
  5: 'Deuteronomy.json',
  6: 'Joshua.json',
  7: 'Judges.json',
  8: 'Ruth.json',
  9: '1_Samuel.json',
  10: '2_Samuel.json',
  11: '1_Kings.json',
  12: '2_Kings.json',
  13: '1_Chronicles.json',
  14: '2_Chronicles.json',
  15: 'Ezra.json',
  16: 'Nehemiah.json',
  17: 'Esther.json',
  18: 'Job.json',
  19: 'Psalms.json',
  20: 'Proverbs.json',
  21: 'Ecclesiastes.json',
  22: 'Song_of_Solomon.json',
  23: 'Isaiah.json',
  24: 'Jeremiah.json',
  25: 'Lamentations.json',
  26: 'Ezekiel.json',
  27: 'Daniel.json',
  28: 'Hosea.json',
  29: 'Joel.json',
  30: 'Amos.json',
  31: 'Obadiah.json',
  32: 'Jonah.json',
  33: 'Micah.json',
  34: 'Nahum.json',
  35: 'Habakkuk.json',
  36: 'Zephaniah.json',
  37: 'Haggai.json',
  38: 'Zechariah.json',
  39: 'Malachi.json',
  // New Testament
  40: 'Matthew.json',
  41: 'Mark.json',
  42: 'Luke.json',
  43: 'John.json',
  44: 'Acts.json',
  45: 'Romans.json',
  46: '1_Corinthians.json',
  47: '2_Corinthians.json',
  48: 'Galatians.json',
  49: 'Ephesians.json',
  50: 'Philippians.json',
  51: 'Colossians.json',
  52: '1_Thessalonians.json',
  53: '2_Thessalonians.json',
  54: '1_Timothy.json',
  55: '2_Timothy.json',
  56: 'Titus.json',
  57: 'Philemon.json',
  58: 'Hebrews.json',
  59: 'James.json',
  60: '1_Peter.json',
  61: '2_Peter.json',
  62: '1_John.json',
  63: '2_John.json',
  64: '3_John.json',
  65: 'Jude.json',
  66: 'Revelation.json'
};

// Book metadata for English names
const BOOK_METADATA = {
  1: { name: 'Genesis', shortName: 'Gen', testament: 'OT' },
  2: { name: 'Exodus', shortName: 'Exod', testament: 'OT' },
  3: { name: 'Leviticus', shortName: 'Lev', testament: 'OT' },
  4: { name: 'Numbers', shortName: 'Num', testament: 'OT' },
  5: { name: 'Deuteronomy', shortName: 'Deut', testament: 'OT' },
  6: { name: 'Joshua', shortName: 'Josh', testament: 'OT' },
  7: { name: 'Judges', shortName: 'Judg', testament: 'OT' },
  8: { name: 'Ruth', shortName: 'Ruth', testament: 'OT' },
  9: { name: '1 Samuel', shortName: '1Sam', testament: 'OT' },
  10: { name: '2 Samuel', shortName: '2Sam', testament: 'OT' },
  11: { name: '1 Kings', shortName: '1Kgs', testament: 'OT' },
  12: { name: '2 Kings', shortName: '2Kgs', testament: 'OT' },
  13: { name: '1 Chronicles', shortName: '1Chr', testament: 'OT' },
  14: { name: '2 Chronicles', shortName: '2Chr', testament: 'OT' },
  15: { name: 'Ezra', shortName: 'Ezra', testament: 'OT' },
  16: { name: 'Nehemiah', shortName: 'Neh', testament: 'OT' },
  17: { name: 'Esther', shortName: 'Esth', testament: 'OT' },
  18: { name: 'Job', shortName: 'Job', testament: 'OT' },
  19: { name: 'Psalms', shortName: 'Ps', testament: 'OT' },
  20: { name: 'Proverbs', shortName: 'Prov', testament: 'OT' },
  21: { name: 'Ecclesiastes', shortName: 'Eccl', testament: 'OT' },
  22: { name: 'Song of Solomon', shortName: 'Song', testament: 'OT' },
  23: { name: 'Isaiah', shortName: 'Isa', testament: 'OT' },
  24: { name: 'Jeremiah', shortName: 'Jer', testament: 'OT' },
  25: { name: 'Lamentations', shortName: 'Lam', testament: 'OT' },
  26: { name: 'Ezekiel', shortName: 'Ezek', testament: 'OT' },
  27: { name: 'Daniel', shortName: 'Dan', testament: 'OT' },
  28: { name: 'Hosea', shortName: 'Hos', testament: 'OT' },
  29: { name: 'Joel', shortName: 'Joel', testament: 'OT' },
  30: { name: 'Amos', shortName: 'Amos', testament: 'OT' },
  31: { name: 'Obadiah', shortName: 'Obad', testament: 'OT' },
  32: { name: 'Jonah', shortName: 'Jonah', testament: 'OT' },
  33: { name: 'Micah', shortName: 'Mic', testament: 'OT' },
  34: { name: 'Nahum', shortName: 'Nah', testament: 'OT' },
  35: { name: 'Habakkuk', shortName: 'Hab', testament: 'OT' },
  36: { name: 'Zephaniah', shortName: 'Zeph', testament: 'OT' },
  37: { name: 'Haggai', shortName: 'Hag', testament: 'OT' },
  38: { name: 'Zechariah', shortName: 'Zech', testament: 'OT' },
  39: { name: 'Malachi', shortName: 'Mal', testament: 'OT' },
  40: { name: 'Matthew', shortName: 'Matt', testament: 'NT' },
  41: { name: 'Mark', shortName: 'Mark', testament: 'NT' },
  42: { name: 'Luke', shortName: 'Luke', testament: 'NT' },
  43: { name: 'John', shortName: 'John', testament: 'NT' },
  44: { name: 'Acts', shortName: 'Acts', testament: 'NT' },
  45: { name: 'Romans', shortName: 'Rom', testament: 'NT' },
  46: { name: '1 Corinthians', shortName: '1Cor', testament: 'NT' },
  47: { name: '2 Corinthians', shortName: '2Cor', testament: 'NT' },
  48: { name: 'Galatians', shortName: 'Gal', testament: 'NT' },
  49: { name: 'Ephesians', shortName: 'Eph', testament: 'NT' },
  50: { name: 'Philippians', shortName: 'Phil', testament: 'NT' },
  51: { name: 'Colossians', shortName: 'Col', testament: 'NT' },
  52: { name: '1 Thessalonians', shortName: '1Thess', testament: 'NT' },
  53: { name: '2 Thessalonians', shortName: '2Thess', testament: 'NT' },
  54: { name: '1 Timothy', shortName: '1Tim', testament: 'NT' },
  55: { name: '2 Timothy', shortName: '2Tim', testament: 'NT' },
  56: { name: 'Titus', shortName: 'Titus', testament: 'NT' },
  57: { name: 'Philemon', shortName: 'Phlm', testament: 'NT' },
  58: { name: 'Hebrews', shortName: 'Heb', testament: 'NT' },
  59: { name: 'James', shortName: 'Jas', testament: 'NT' },
  60: { name: '1 Peter', shortName: '1Pet', testament: 'NT' },
  61: { name: '2 Peter', shortName: '2Pet', testament: 'NT' },
  62: { name: '1 John', shortName: '1John', testament: 'NT' },
  63: { name: '2 John', shortName: '2John', testament: 'NT' },
  64: { name: '3 John', shortName: '3John', testament: 'NT' },
  65: { name: 'Jude', shortName: 'Jude', testament: 'NT' },
  66: { name: 'Revelation', shortName: 'Rev', testament: 'NT' }
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
GetBible JSON to PWA JSON Converter

Usage:
  node convert-getbible-to-json.mjs \\
    --source <path> \\
    --out-dir <path> \\
    --version-id <id>

Required Arguments:
  --source <path>      Path to GetBible JSON file
  --out-dir <path>     Output directory for JSON files
  --version-id <id>    Version identifier (e.g., heb-modern)

Example:
  node convert-getbible-to-json.mjs \\
    --source data/heb-sivan-source/modernhebrew.json \\
    --out-dir data/heb-modern \\
    --version-id heb-modern
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

  console.log('GetBible to PWA JSON Converter');
  console.log('==============================\n');
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

  // Read GetBible JSON
  console.log('Reading GetBible JSON...');
  const rawData = readFileSync(source, 'utf8');
  const getBibleData = JSON.parse(rawData);

  console.log(`  Translation: ${getBibleData.translation}`);
  console.log(`  Language: ${getBibleData.language}`);
  console.log(`  Direction: ${getBibleData.direction || 'LTR'}`);
  console.log(`  Books: ${getBibleData.books.length}\n`);

  // Process each book
  const versionBooks = [];
  let totalVerses = 0;
  let totalChapters = 0;

  console.log('Converting books:');

  for (const book of getBibleData.books) {
    const bookNum = book.nr;
    const filename = BOOK_NUMBER_TO_FILENAME[bookNum];
    const metadata = BOOK_METADATA[bookNum];

    if (!filename || !metadata) {
      console.warn(`  Warning: Unknown book number ${bookNum} (${book.name}), skipping`);
      continue;
    }

    // Build book data in PWA format
    const bookData = {};

    for (const chapter of book.chapters) {
      const chapterNum = String(chapter.chapter);
      bookData[chapterNum] = {};

      for (const verse of chapter.verses) {
        const verseNum = String(verse.verse);
        bookData[chapterNum][verseNum] = cleanVerseText(verse.text);
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
      order: bookNum,
      chapters: chapterCount
    });
  }

  // Sort books by canonical order
  versionBooks.sort((a, b) => a.order - b.order);

  // Write books.json
  const booksJsonPath = join(outDir, 'books.json');
  writeFileSync(booksJsonPath, JSON.stringify({ books: versionBooks }, null, 2));

  console.log('\n==============================');
  console.log(`Total: ${versionBooks.length} books, ${totalChapters} chapters, ${totalVerses} verses`);
  console.log(`Output directory: ${outDir}`);
  console.log(`Books index: ${booksJsonPath}`);
  console.log('\nConversion complete!');

  // Validation spot checks
  console.log('\n--- Validation Spot Checks ---');

  // Genesis 1:1
  try {
    const genesis = JSON.parse(readFileSync(join(outDir, 'Genesis.json'), 'utf8'));
    console.log(`\nGenesis 1:1 (RTL Hebrew):`);
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
