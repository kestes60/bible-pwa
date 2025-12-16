/**
 * Modules Index - Central entry point for all Bible PWA modules
 *
 * This file imports all modules and attaches them to the window object
 * for backwards compatibility with existing code.
 *
 * Usage in app.js:
 *   import './modules/index.js';
 *
 * After import, the following are available on window:
 *   - window.Storage
 *   - window.BibleData
 *   - window.UI
 *   - window.Reading
 */

// Import all modules (they self-attach to window)
import { Storage } from './storage.js';
import { Data } from './data.js';
import { UI } from './ui.js';
import { Reading } from './reading.js';

// Re-export for ES module usage
export { Storage, Data, UI, Reading };

// Also export individual items for destructured imports
export * from './storage.js';
export * from './data.js';
export * from './ui.js';
export * from './reading.js';

// Log initialization
console.log('[Modules] All modules loaded:', {
  Storage: !!window.Storage,
  BibleData: !!window.BibleData,
  UI: !!window.UI,
  Reading: !!window.Reading
});
