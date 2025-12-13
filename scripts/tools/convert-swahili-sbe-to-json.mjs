#!/usr/bin/env node
/**
 * Swahili Bible Edition to PWA JSON Converter
 *
 * Converts shemmjunior/swahili-bible-edition JSON format to PWA JSON schema.
 *
 * Source Structure:
 * - BIBLEBOOK: [{ book_number, book_name, CHAPTER: [{ chapter_number, VERSES: [{ verse_number, verse_text }] }] }]
 *
 * Output JSON Schema:
 * - Book files: { "1": { "1": "verse text", "2": "verse text", ... }, "2": { ... } }
 * - books.json: { "books": [{ "name", "shortName", "filename", "testament", "order", "chapters" }] }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Book number to filename and metadata mapping
const BOOK_CONFIG = {
  1: { filename: 'Genesis.json', name: 'Genesis', shortName: 'Gen', testament: 'OT' },
  2: { filename: 'Exodus.json', name: 'Exodus', shortName: 'Exod', testament: 'OT' },
  3: { filename: 'Leviticus.json', name: 'Leviticus', shortName: 'Lev', testament: 'OT' },
  4: { filename: 'Numbers.json', name: 'Numbers', shortName: 'Num', testament: 'OT' },
  5: { filename: 'Deuteronomy.json', name: 'Deuteronomy', shortName: 'Deut', testament: 'OT' },
  6: { filename: 'Joshua.json', name: 'Joshua', shortName: 'Josh', testament: 'OT' },
  7: { filename: 'Judges.json', name: 'Judges', shortName: 'Judg', testament: 'OT' },
  8: { filename: 'Ruth.json', name: 'Ruth', shortName: 'Ruth', testament: 'OT' },
  9: { filename: '1_Samuel.json', name: '1 Samuel', shortName: '1Sam', testament: 'OT' },
  10: { filename: '2_Samuel.json', name: '2 Samuel', shortName: '2Sam', testament: 'OT' },
  11: { filename: '1_Kings.json', name: '1 Kings', shortName: '1Kgs', testament: 'OT' },
  12: { filename: '2_Kings.json', name: '2 Kings', shortName: '2Kgs', testament: 'OT' },
  13: { filename: '1_Chronicles.json', name: '1 Chronicles', shortName: '1Chr', testament: 'OT' },
  14: { filename: '2_Chronicles.json', name: '2 Chronicles', shortName: '2Chr', testament: 'OT' },
  15: { filename: 'Ezra.json', name: 'Ezra', shortName: 'Ezra', testament: 'OT' },
  16: { filename: 'Nehemiah.json', name: 'Nehemiah', shortName: 'Neh', testament: 'OT' },
  17: { filename: 'Esther.json', name: 'Esther', shortName: 'Esth', testament: 'OT' },
  18: { filename: 'Job.json', name: 'Job', shortName: 'Job', testament: 'OT' },
  19: { filename: 'Psalms.json', name: 'Psalms', shortName: 'Ps', testament: 'OT' },
  20: { filename: 'Proverbs.json', name: 'Proverbs', shortName: 'Prov', testament: 'OT' },
  21: { filename: 'Ecclesiastes.json', name: 'Ecclesiastes', shortName: 'Eccl', testament: 'OT' },
  22: { filename: 'Song_of_Solomon.json', name: 'Song of Solomon', shortName: 'Song', testament: 'OT' },
  23: { filename: 'Isaiah.json', name: 'Isaiah', shortName: 'Isa', testament: 'OT' },
  24: { filename: 'Jeremiah.json', name: 'Jeremiah', shortName: 'Jer', testament: 'OT' },
  25: { filename: 'Lamentations.json', name: 'Lamentations', shortName: 'Lam', testament: 'OT' },
  26: { filename: 'Ezekiel.json', name: 'Ezekiel', shortName: 'Ezek', testament: 'OT' },
  27: { filename: 'Daniel.json', name: 'Daniel', shortName: 'Dan', testament: 'OT' },
  28: { filename: 'Hosea.json', name: 'Hosea', shortName: 'Hos', testament: 'OT' },
  29: { filename: 'Joel.json', name: 'Joel', shortName: 'Joel', testament: 'OT' },
  30: { filename: 'Amos.json', name: 'Amos', shortName: 'Amos', testament: 'OT' },
  31: { filename: 'Obadiah.json', name: 'Obadiah', shortName: 'Obad', testament: 'OT' },
  32: { filename: 'Jonah.json', name: 'Jonah', shortName: 'Jonah', testament: 'OT' },
  33: { filename: 'Micah.json', name: 'Micah', shortName: 'Mic', testament: 'OT' },
  34: { filename: 'Nahum.json', name: 'Nahum', shortName: 'Nah', testament: 'OT' },
  35: { filename: 'Habakkuk.json', name: 'Habakkuk', shortName: 'Hab', testament: 'OT' },
  36: { filename: 'Zephaniah.json', name: 'Zephaniah', shortName: 'Zeph', testament: 'OT' },
  37: { filename: 'Haggai.json', name: 'Haggai', shortName: 'Hag', testament: 'OT' },
  38: { filename: 'Zechariah.json', name: 'Zechariah', shortName: 'Zech', testament: 'OT' },
  39: { filename: 'Malachi.json', name: 'Malachi', shortName: 'Mal', testament: 'OT' },
  40: { filename: 'Matthew.json', name: 'Matthew', shortName: 'Matt', testament: 'NT' },
  41: { filename: 'Mark.json', name: 'Mark', shortName: 'Mark', testament: 'NT' },
  42: { filename: 'Luke.json', name: 'Luke', shortName: 'Luke', testament: 'NT' },
  43: { filename: 'John.json', name: 'John', shortName: 'John', testament: 'NT' },
  44: { filename: 'Acts.json', name: 'Acts', shortName: 'Acts', testament: 'NT' },
  45: { filename: 'Romans.json', name: 'Romans', shortName: 'Rom', testament: 'NT' },
  46: { filename: '1_Corinthians.json', name: '1 Corinthians', shortName: '1Cor', testament: 'NT' },
  47: { filename: '2_Corinthians.json', name: '2 Corinthians', shortName: '2Cor', testament: 'NT' },
  48: { filename: 'Galatians.json', name: 'Galatians', shortName: 'Gal', testament: 'NT' },
  49: { filename: 'Ephesians.json', name: 'Ephesians', shortName: 'Eph', testament: 'NT' },
  50: { filename: 'Philippians.json', name: 'Philippians', shortName: 'Phil', testament: 'NT' },
  51: { filename: 'Colossians.json', name: 'Colossians', shortName: 'Col', testament: 'NT' },
  52: { filename: '1_Thessalonians.json', name: '1 Thessalonians', shortName: '1Thess', testament: 'NT' },
  53: { filename: '2_Thessalonians.json', name: '2 Thessalonians', shortName: '2Thess', testament: 'NT' },
  54: { filename: '1_Timothy.json', name: '1 Timothy', shortName: '1Tim', testament: 'NT' },
  55: { filename: '2_Timothy.json', name: '2 Timothy', shortName: '2Tim', testament: 'NT' },
  56: { filename: 'Titus.json', name: 'Titus', shortName: 'Titus', testament: 'NT' },
  57: { filename: 'Philemon.json', name: 'Philemon', shortName: 'Phlm', testament: 'NT' },
  58: { filename: 'Hebrews.json', name: 'Hebrews', shortName: 'Heb', testament: 'NT' },
  59: { filename: 'James.json', name: 'James', shortName: 'Jas', testament: 'NT' },
  60: { filename: '1_Peter.json', name: '1 Peter', shortName: '1Pet', testament: 'NT' },
  61: { filename: '2_Peter.json', name: '2 Peter', shortName: '2Pet', testament: 'NT' },
  62: { filename: '1_John.json', name: '1 John', shortName: '1John', testament: 'NT' },
  63: { filename: '2_John.json', name: '2 John', shortName: '2John', testament: 'NT' },
  64: { filename: '3_John.json', name: '3 John', shortName: '3John', testament: 'NT' },
  65: { filename: 'Jude.json', name: 'Jude', shortName: 'Jude', testament: 'NT' },
  66: { filename: 'Revelation.json', name: 'Revelation', shortName: 'Rev', testament: 'NT' }
};

function cleanVerseText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

async function convert(sourcePath, outDir) {
  console.log('Swahili Bible Edition to PWA JSON Converter');
  console.log('============================================\n');
  console.log(`Source: ${sourcePath}`);
  console.log(`Output: ${outDir}\n`);

  if (!existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    console.log(`Created output directory: ${outDir}\n`);
  }

  console.log('Reading Swahili Bible Edition JSON...');
  const rawData = readFileSync(sourcePath, 'utf8');
  const bibleData = JSON.parse(rawData);

  const books = bibleData.BIBLEBOOK;
  console.log(`  Books found: ${books.length}\n`);

  const versionBooks = [];
  let totalVerses = 0;
  let totalChapters = 0;

  console.log('Converting books:');

  for (const book of books) {
    const bookNum = parseInt(book.book_number, 10);
    const config = BOOK_CONFIG[bookNum];

    if (!config) {
      console.warn(`  Warning: Unknown book number ${bookNum} (${book.book_name}), skipping`);
      continue;
    }

    const bookData = {};

    // Handle both array and object (single-chapter books like Obadiah)
    const chapters = Array.isArray(book.CHAPTER) ? book.CHAPTER : [book.CHAPTER];

    for (const chapter of chapters) {
      const chapterNum = chapter.chapter_number;
      bookData[chapterNum] = {};

      // Handle both array and object (single-verse chapters)
      const verses = Array.isArray(chapter.VERSES) ? chapter.VERSES : [chapter.VERSES];

      for (const verse of verses) {
        const verseNum = verse.verse_number;
        bookData[chapterNum][verseNum] = cleanVerseText(verse.verse_text);
      }
    }

    const chapterCount = Object.keys(bookData).length;
    const verseCount = Object.values(bookData).reduce((sum, ch) => sum + Object.keys(ch).length, 0);
    totalChapters += chapterCount;
    totalVerses += verseCount;

    const outputPath = join(outDir, config.filename);
    writeFileSync(outputPath, JSON.stringify(bookData, null, 2));

    console.log(`  ✓ ${config.name.padEnd(20)} ${chapterCount} chapters, ${verseCount} verses`);

    versionBooks.push({
      name: config.name,
      shortName: config.shortName,
      filename: config.filename,
      testament: config.testament,
      order: bookNum,
      chapters: chapterCount
    });
  }

  versionBooks.sort((a, b) => a.order - b.order);

  const booksJsonPath = join(outDir, 'books.json');
  writeFileSync(booksJsonPath, JSON.stringify({ books: versionBooks }, null, 2));

  console.log('\n============================================');
  console.log(`Total: ${versionBooks.length} books, ${totalChapters} chapters, ${totalVerses} verses`);
  console.log(`Output directory: ${outDir}`);
  console.log('\nConversion complete!');

  // Validation spot checks
  console.log('\n--- Validation Spot Checks ---');

  try {
    const genesis = JSON.parse(readFileSync(join(outDir, 'Genesis.json'), 'utf8'));
    console.log(`\nGenesis 1:1 (Swahili):`);
    console.log(`  "${genesis['1']['1']}"`);
  } catch (e) {
    console.error('  Error reading Genesis:', e.message);
  }

  try {
    const john = JSON.parse(readFileSync(join(outDir, 'John.json'), 'utf8'));
    console.log(`\nJohn 3:16 (Swahili):`);
    console.log(`  "${john['3']['16']}"`);
  } catch (e) {
    console.error('  Error reading John:', e.message);
  }
}

// Main execution
const sourcePath = process.argv[2] || '/tmp/swahili-sbe.json';
const outDir = process.argv[3] || 'data/swa-sbe';

convert(resolve(sourcePath), resolve(outDir)).catch(err => {
  console.error('Conversion failed:', err.message);
  process.exit(1);
});
