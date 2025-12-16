/**
 * UI Module - User interface management
 *
 * Handles theme, fonts, line height, toasts, scroll lock, and modals.
 * Provides a clean API for UI state management.
 */

import { STORAGE_KEYS, DEFAULTS, getItem, setItem, getBoolean, setBoolean } from './storage.js';

// ========================================
// Theme Management
// ========================================

const THEME_DARK = 'theme-dark';
const THEME_LIGHT = 'theme-light';

/**
 * Get saved theme from localStorage
 * @returns {string} Theme name
 */
export function getSavedTheme() {
  return getItem(STORAGE_KEYS.THEME, DEFAULTS.THEME);
}

/**
 * Save theme preference
 * @param {string} theme - Theme name
 */
export function saveTheme(theme) {
  setItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Apply theme to the document
 * @param {string} theme - Theme name (theme-dark or theme-light)
 */
export function applyTheme(theme) {
  document.body.classList.remove(THEME_DARK, THEME_LIGHT);
  document.body.classList.add(theme);

  // Update header toggle button
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    if (theme === THEME_DARK) {
      toggleBtn.textContent = '☀ Light';
      toggleBtn.setAttribute('aria-label', 'Switch to light theme');
    } else {
      toggleBtn.textContent = '🌙 Dark';
      toggleBtn.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  // Update settings modal theme button
  const settingsBtn = document.getElementById('settingsThemeToggle');
  if (settingsBtn) {
    const icon = settingsBtn.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === THEME_DARK ? '🌙' : '☀️';
    }
  }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
  const currentTheme = document.body.classList.contains(THEME_LIGHT) ? THEME_LIGHT : THEME_DARK;
  const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  applyTheme(newTheme);
  saveTheme(newTheme);
}

/**
 * Initialize theme on page load
 */
export function initTheme() {
  const theme = getSavedTheme();
  applyTheme(theme);
}

/**
 * Check if dark theme is active
 * @returns {boolean}
 */
export function isDarkTheme() {
  return document.body.classList.contains(THEME_DARK);
}

// ========================================
// Font Size Management
// ========================================

const FONT_SIZES = ['small', 'medium', 'large'];

/**
 * Get saved font size
 * @returns {string}
 */
export function getSavedFontSize() {
  return getItem(STORAGE_KEYS.FONT_SIZE, DEFAULTS.FONT_SIZE);
}

/**
 * Save font size preference
 * @param {string} size
 */
export function saveFontSize(size) {
  setItem(STORAGE_KEYS.FONT_SIZE, size);
}

/**
 * Apply font size to the document
 * @param {string} size - Font size to apply (small, medium, large)
 */
export function applyFontSize(size) {
  document.body.setAttribute('data-font-size', size);

  // Update dropdown display
  const display = document.getElementById('fontSizeDisplay');
  if (display) {
    display.className = 'font-size-display font-size-display-' + size;
  }

  // Update menu options
  const menu = document.getElementById('fontSizeMenu');
  if (menu) {
    const options = menu.querySelectorAll('li[role="option"]');
    options.forEach(opt => {
      const isActive = opt.getAttribute('data-size') === size;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
}

/**
 * Change font size and persist preference
 * @param {string} size
 */
export function changeFontSize(size) {
  if (!FONT_SIZES.includes(size)) {
    console.warn('[UI] Invalid font size:', size);
    return;
  }
  applyFontSize(size);
  saveFontSize(size);
}

/**
 * Initialize font size on page load
 */
export function initFontSize() {
  const size = getSavedFontSize();
  applyFontSize(size);
}

// ========================================
// Line Height Management
// ========================================

let lineHeightDebounceTimer = null;

/**
 * Get saved line height
 * @returns {string}
 */
export function getSavedLineHeight() {
  return getItem(STORAGE_KEYS.LINE_HEIGHT, DEFAULTS.LINE_HEIGHT);
}

/**
 * Save line height preference
 * @param {string} value
 */
export function saveLineHeight(value) {
  setItem(STORAGE_KEYS.LINE_HEIGHT, value);
}

/**
 * Apply line height via CSS custom property
 * @param {string} value
 */
export function applyLineHeight(value) {
  document.documentElement.style.setProperty('--line-height', value);

  // Force repaint on mobile
  const containers = ['lineHeightPreview', 'versesContainer'];
  containers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('reflow-trigger');
      void el.offsetHeight;
      el.classList.remove('reflow-trigger');
    }
  });
}

/**
 * Update the line height preview pane
 * @param {string} value
 */
export function updateLineHeightPreview(value) {
  const preview = document.getElementById('lineHeightPreview');
  if (preview) {
    preview.style.lineHeight = value;
  }
}

/**
 * Handle line height slider input (during drag)
 * @param {Event} e
 */
export function handleLineHeightInput(e) {
  const value = e.target.value;

  const valueSpan = document.getElementById('lineHeightValue');
  if (valueSpan) valueSpan.textContent = value;

  updateLineHeightPreview(value);

  // Debounce CSS update and save
  clearTimeout(lineHeightDebounceTimer);
  lineHeightDebounceTimer = setTimeout(() => {
    applyLineHeight(value);
    saveLineHeight(value);
  }, 50);
}

/**
 * Handle line height slider change (on release)
 * @param {Event} e
 */
export function handleLineHeightChange(e) {
  const value = e.target.value;

  clearTimeout(lineHeightDebounceTimer);

  const valueSpan = document.getElementById('lineHeightValue');
  if (valueSpan) valueSpan.textContent = value;

  updateLineHeightPreview(value);
  applyLineHeight(value);
  saveLineHeight(value);
}

/**
 * Handle touchmove on slider for mobile
 * @param {TouchEvent} e
 */
export function handleLineHeightTouch(e) {
  const slider = e.target;
  if (!slider || slider.id !== 'lineHeightSlider') return;

  const value = slider.value;
  const valueSpan = document.getElementById('lineHeightValue');
  if (valueSpan) valueSpan.textContent = value;
  updateLineHeightPreview(value);
}

/**
 * Initialize line height slider in Settings modal
 */
export function initLineHeightSlider() {
  const slider = document.getElementById('lineHeightSlider');
  const valueSpan = document.getElementById('lineHeightValue');
  if (!slider || !valueSpan) return;

  const currentValue = getSavedLineHeight();

  slider.value = currentValue;
  valueSpan.textContent = currentValue;
  updateLineHeightPreview(currentValue);

  // Remove old listeners
  slider.removeEventListener('input', handleLineHeightInput);
  slider.removeEventListener('change', handleLineHeightChange);
  slider.removeEventListener('touchmove', handleLineHeightTouch);

  // Add new listeners
  slider.addEventListener('input', handleLineHeightInput);
  slider.addEventListener('change', handleLineHeightChange);
  slider.addEventListener('touchmove', handleLineHeightTouch, { passive: true });
}

/**
 * Initialize line height on page load
 */
export function initLineHeight() {
  const value = getSavedLineHeight();
  applyLineHeight(value);
}

// ========================================
// Toast Notifications
// ========================================

let toastTimeout = null;

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toast.textContent = message;
  toast.classList.add('show');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * Hide any visible toast
 */
export function hideToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.remove('show');
  }
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
}

// ========================================
// Body Scroll Lock (for modals)
// ========================================

let scrollY = 0;
let isScrollLocked = false;

/**
 * Lock body scroll (for modals)
 */
export function lockBodyScroll() {
  if (isScrollLocked) return;

  scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  isScrollLocked = true;
}

/**
 * Unlock body scroll
 */
export function unlockBodyScroll() {
  if (!isScrollLocked) return;

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
  isScrollLocked = false;
}

/**
 * Check if scroll is locked
 * @returns {boolean}
 */
export function isBodyScrollLocked() {
  return isScrollLocked;
}

// ========================================
// Splash Screen
// ========================================

let splashHidden = false;

/**
 * Hide the splash screen with fade-out animation
 */
export function hideSplash() {
  if (splashHidden) return;

  const splashScreen = document.getElementById('splashScreen');
  const splashVideo = document.getElementById('splashVideo');

  if (!splashScreen) return;

  splashScreen.classList.add('hidden');
  splashHidden = true;

  // Remove from DOM after animation
  setTimeout(() => {
    if (splashVideo) {
      splashVideo.pause();
      splashVideo.src = '';
    }
    splashScreen.remove();
  }, 1000);
}

/**
 * Initialize splash screen - hides after 8s AND DOM ready
 */
export function initSplash() {
  const splashScreen = document.getElementById('splashScreen');
  if (!splashScreen) return;

  let domReady = false;
  let timeElapsed = false;

  function checkHideSplash() {
    if (domReady && timeElapsed) {
      hideSplash();
    }
  }

  // Wait 8 seconds for verse read time
  setTimeout(() => {
    timeElapsed = true;
    checkHideSplash();
  }, 8000);

  // Track DOM ready state
  if (document.readyState === 'complete') {
    domReady = true;
    checkHideSplash();
  } else {
    window.addEventListener('load', () => {
      domReady = true;
      checkHideSplash();
    });
  }
}

// ========================================
// Back to Top Button
// ========================================

/**
 * Initialize back to top button behavior
 */
export function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  // Show/hide based on scroll position
  const handleScroll = () => {
    const threshold = 200;
    if (window.scrollY > threshold) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // Smooth scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'instant' : 'smooth'
    });
  });
}

// ========================================
// Scroll to Reading Top
// ========================================

/**
 * Scroll to the reading content area
 * @param {boolean} instant - If true, scroll instantly
 */
export function scrollToReadingTop(instant = false) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: 0,
    behavior: (instant || prefersReducedMotion) ? 'instant' : 'smooth'
  });
}

// ========================================
// Chapter Fade Animation
// ========================================

/**
 * Run chapter fade-in animation
 */
export function runChapterFadeIn() {
  const container = document.getElementById('versesContainer');
  if (!container) return;

  container.classList.remove('chapter-loaded');
  // Force reflow
  void container.offsetWidth;
  container.classList.add('chapter-loaded');
}

// ========================================
// Module API (for window attachment)
// ========================================
export const UI = {
  // Theme
  getSavedTheme,
  saveTheme,
  applyTheme,
  toggleTheme,
  initTheme,
  isDarkTheme,
  THEME_DARK,
  THEME_LIGHT,

  // Font Size
  getSavedFontSize,
  saveFontSize,
  applyFontSize,
  changeFontSize,
  initFontSize,
  FONT_SIZES,

  // Line Height
  getSavedLineHeight,
  saveLineHeight,
  applyLineHeight,
  updateLineHeightPreview,
  initLineHeightSlider,
  initLineHeight,
  handleLineHeightInput,
  handleLineHeightChange,
  handleLineHeightTouch,

  // Toast
  showToast,
  hideToast,

  // Scroll Lock
  lockBodyScroll,
  unlockBodyScroll,
  isBodyScrollLocked,

  // Splash
  hideSplash,
  initSplash,

  // Back to Top
  initBackToTop,
  scrollToReadingTop,

  // Animation
  runChapterFadeIn
};

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.UI = UI;

  // Also expose commonly used functions directly for HTML onclick handlers
  window.toggleTheme = toggleTheme;
  window.changeFontSize = changeFontSize;
  window.showToast = showToast;
  window.lockBodyScroll = lockBodyScroll;
  window.unlockBodyScroll = unlockBodyScroll;
}
