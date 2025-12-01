#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION_SOURCES = {
  'krv': {
    url: 'https://raw.githubusercontent.com/seven1m/open-bibles/master/kor-korean.osis.xml',
    format: 'osis',
    filename: 'kor-korean.osis.xml'
  },
  'rvr': {
    url: 'https://raw.githubusercontent.com/seven1m/open-bibles/master/spa-rv1909.usfx.xml',
    format: 'usfx',
    filename: 'spa-rv1909.usfx.xml'
  },
  'cuv': {
    url: 'https://raw.githubusercontent.com/seven1m/open-bibles/master/chi-cuv.usfx.xml',
    format: 'usfx',
    filename: 'chi-cuv.usfx.xml'
  },
  'kjv': {
    url: 'https://raw.githubusercontent.com/seven1m/open-bibles/master/eng-kjv.osis.xml',
    format: 'osis',
    filename: 'eng-kjv.osis.xml'
  }
};

/**
 * Downloads a file from a URL to a destination path
 * @param {string} url - Source URL
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from: ${url}`);
    console.log(`Saving to: ${destPath}`);

    const file = fs.createWriteStream(destPath);
    let downloadedBytes = 0;

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        console.log(`Following redirect to: ${response.headers.location}`);
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }

      const totalBytes = parseInt(response.headers['content-length'], 10);
      console.log(`File size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
          const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\nDownload completed successfully!');
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(destPath);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      reject(err);
    });
  });
}

/**
 * Runs the OSIS to JSON converter
 * @param {string} sourcePath - Path to source OSIS file
 * @param {string} outDir - Output directory
 * @param {string} versionId - Version ID
 * @returns {Promise<void>}
 */
function runOsisConverter(sourcePath, outDir, versionId) {
  return new Promise((resolve, reject) => {
    const converterPath = path.join(__dirname, 'convert-osis-to-json.mjs');

    console.log('\n=== Running OSIS to JSON converter ===');
    console.log(`Converter: ${converterPath}`);
    console.log(`Source: ${sourcePath}`);
    console.log(`Output: ${outDir}`);
    console.log(`Version: ${versionId}\n`);

    const converter = spawn('node', [
      converterPath,
      '--source', sourcePath,
      '--out-dir', outDir,
      '--version-id', versionId
    ], {
      stdio: 'inherit'
    });

    converter.on('close', (code) => {
      if (code === 0) {
        console.log('\nConversion completed successfully!');
        resolve();
      } else {
        reject(new Error(`Converter exited with code ${code}`));
      }
    });

    converter.on('error', (err) => {
      reject(new Error(`Failed to run converter: ${err.message}`));
    });
  });
}

/**
 * Main function
 */
async function main() {
  const versionId = process.argv[2];

  // Validate input
  if (!versionId) {
    console.error('Error: Version ID is required');
    console.error('\nUsage: node download-openbible-source.mjs <version-id>');
    console.error('\nAvailable versions:');
    Object.keys(VERSION_SOURCES).forEach(id => {
      const src = VERSION_SOURCES[id];
      console.error(`  ${id.padEnd(6)} - ${src.format.toUpperCase()} format`);
    });
    process.exit(1);
  }

  const source = VERSION_SOURCES[versionId];
  if (!source) {
    console.error(`Error: Unknown version ID '${versionId}'`);
    console.error('\nAvailable versions:');
    Object.keys(VERSION_SOURCES).forEach(id => {
      const src = VERSION_SOURCES[id];
      console.error(`  ${id.padEnd(6)} - ${src.format.toUpperCase()} format`);
    });
    process.exit(1);
  }

  // Setup paths
  const projectRoot = path.join(__dirname, '..', '..');
  const sourceDir = path.join(projectRoot, 'data', `${versionId}-source`);
  const destPath = path.join(sourceDir, source.filename);
  const outputDir = path.join(projectRoot, 'data', versionId);

  try {
    // Create source directory
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
      console.log(`Created directory: ${sourceDir}`);
    }

    // Download file
    console.log(`\n=== Downloading ${versionId.toUpperCase()} (${source.format.toUpperCase()} format) ===\n`);
    await downloadFile(source.url, destPath);

    // Verify file exists and has content
    const stats = fs.statSync(destPath);
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    console.log(`File saved: ${destPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Handle format-specific post-processing
    if (source.format === 'osis') {
      console.log('\n=== OSIS format detected - running converter ===');

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
      }

      // Run converter
      await runOsisConverter(destPath, outputDir, versionId);

      console.log(`\n=== Complete ===`);
      console.log(`Source files: ${sourceDir}`);
      console.log(`JSON output: ${outputDir}`);
    } else if (source.format === 'usfx') {
      console.log(`\n=== USFX format detected ===`);
      console.log(`USFX converter not yet implemented.`);
      console.log(`Files downloaded to: ${sourceDir}`);
    } else {
      console.log(`\n=== Unknown format: ${source.format} ===`);
      console.log(`Files downloaded to: ${sourceDir}`);
    }

  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

main();
