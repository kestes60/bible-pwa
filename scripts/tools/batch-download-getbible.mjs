#!/usr/bin/env node
/**
 * Batch Download and Convert GetBible Translations
 *
 * Downloads multiple Bible translations from GetBible API and converts
 * them to the PWA JSON format.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Translations to download from GetBible
const TRANSLATIONS = [
  { id: 'arabicsv', outDir: 'ara-svd', name: 'Arabic Smith Van Dyke', direction: 'RTL' },
  { id: 'ls1910', outDir: 'fra-lsg', name: 'French Louis Segond 1910', direction: 'LTR' },
  { id: 'luther1545', outDir: 'deu-lut', name: 'German Luther 1545', direction: 'LTR' },
  { id: 'japkougo', outDir: 'jpn-kougo', name: 'Japanese Kougo-yaku', direction: 'LTR' },
  { id: 'almeida', outDir: 'por-almeida', name: 'Portuguese Almeida', direction: 'LTR' },
  { id: 'synodal', outDir: 'rus-synodal', name: 'Russian Synodal', direction: 'LTR' },
  { id: 'swahili', outDir: 'swa-swahili', name: 'Swahili', direction: 'LTR' },
];

const BASE_URL = 'https://api.getbible.net/v2';
const DATA_DIR = join(process.cwd(), 'data');
const SOURCE_DIR = join(DATA_DIR, 'getbible-source');
const CONVERTER_SCRIPT = join(process.cwd(), 'scripts/tools/convert-getbible-to-json.mjs');

async function downloadTranslation(translation) {
  const url = `${BASE_URL}/${translation.id}.json`;
  const sourcePath = join(SOURCE_DIR, `${translation.id}.json`);

  console.log(`\n📥 Downloading ${translation.name}...`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.text();
    writeFileSync(sourcePath, data);

    const sizeMB = (data.length / 1024 / 1024).toFixed(2);
    console.log(`   ✓ Downloaded ${sizeMB} MB`);

    return sourcePath;
  } catch (error) {
    console.error(`   ✗ Failed: ${error.message}`);
    return null;
  }
}

async function convertTranslation(translation, sourcePath) {
  const outDir = join(DATA_DIR, translation.outDir);

  console.log(`\n🔄 Converting ${translation.name}...`);

  try {
    const cmd = `node "${CONVERTER_SCRIPT}" --source "${sourcePath}" --out-dir "${outDir}" --version-id "${translation.outDir}"`;
    execSync(cmd, { stdio: 'pipe' });

    console.log(`   ✓ Converted to ${outDir}`);
    return true;
  } catch (error) {
    console.error(`   ✗ Conversion failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🌍 Batch GetBible Translation Downloader');
  console.log('=========================================\n');

  // Create source directory
  if (!existsSync(SOURCE_DIR)) {
    mkdirSync(SOURCE_DIR, { recursive: true });
  }

  const results = [];

  for (const translation of TRANSLATIONS) {
    // Download
    const sourcePath = await downloadTranslation(translation);
    if (!sourcePath) {
      results.push({ ...translation, status: 'download_failed' });
      continue;
    }

    // Convert
    const success = await convertTranslation(translation, sourcePath);
    results.push({ ...translation, status: success ? 'success' : 'convert_failed' });
  }

  // Summary
  console.log('\n=========================================');
  console.log('📊 Summary:');
  console.log('=========================================');

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');

  console.log(`\n✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.name} (${r.outDir})`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.name}: ${r.status}`));
  }

  // Output versions.js snippet
  console.log('\n=========================================');
  console.log('📝 Add to versions.js:');
  console.log('=========================================\n');

  successful.forEach(t => {
    const langCode = t.outDir.split('-')[0];
    const langNames = {
      'ara': 'Arabic',
      'fra': 'French',
      'deu': 'German',
      'jpn': 'Japanese',
      'por': 'Portuguese',
      'rus': 'Russian',
      'swa': 'Swahili'
    };

    console.log(`  "${t.outDir}": {
    id: "${t.outDir}",
    name: "${t.name}",
    shortName: "${t.outDir.split('-')[1].toUpperCase().slice(0, 3)}",
    language: "${langCode}",
    languageName: "${langNames[langCode] || langCode}",
    status: "installed",
    storageStrategy: "bundled",
    dataPath: "data/${t.outDir}/",
    booksFile: "books.json",
    estimatedSizeMB: 4,
    sourceUrl: "${BASE_URL}/${t.id}.json",
    sourceFormat: "getbible-json",
    direction: "${t.direction}",
    description: "${t.name} translation"
  },\n`);
  });
}

main().catch(console.error);
