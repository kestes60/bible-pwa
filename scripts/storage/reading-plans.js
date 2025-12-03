// scripts/storage/reading-plans.js
// Reading plan & history storage for Bible Reader (local-only, v1)
// Exposes window.BibleReading API for managing reading plans and events

(function () {
  'use strict';

  const READING_STATE_KEY = 'bibleReader.readingState.v1';

  /**
   * Returns the default empty reading state structure.
   * @returns {Object} Default reading state
   */
  function getDefaultReadingState() {
    return {
      currentPlanId: null,
      plans: {},
      readingEvents: {
        events: []
      }
    };
  }

  /**
   * Load reading state from localStorage with validation and migration support.
   * @returns {Object} Current reading state (or default if none/invalid)
   */
  function loadReadingState() {
    try {
      const raw = localStorage.getItem(READING_STATE_KEY);
      if (!raw) return getDefaultReadingState();

      const parsed = JSON.parse(raw);

      // Basic shape validation / migration hook
      if (!parsed || typeof parsed !== 'object') {
        return getDefaultReadingState();
      }

      // Ensure readingEvents structure
      if (!parsed.readingEvents || !Array.isArray(parsed.readingEvents.events)) {
        parsed.readingEvents = { events: [] };
      }

      // Ensure plans structure
      if (!parsed.plans || typeof parsed.plans !== 'object') {
        parsed.plans = {};
      }

      // Ensure currentPlanId exists
      if (!('currentPlanId' in parsed)) {
        parsed.currentPlanId = null;
      }

      return parsed;
    } catch (e) {
      console.warn('[BibleReading] Error loading reading state, resetting:', e);
      return getDefaultReadingState();
    }
  }

  /**
   * Save reading state to localStorage.
   * @param {Object} state - The reading state to save
   */
  function saveReadingState(state) {
    try {
      localStorage.setItem(READING_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[BibleReading] Error saving reading state:', e);
    }
  }

  /**
   * Log a completed chapter reading event.
   * Events are stored newest-first for efficient recent history access.
   * This does NOT change the existing "resume last chapter" logic in app.js.
   *
   * @param {Object} params - Event parameters
   * @param {string} params.versionId - Bible version (e.g., "en-web", "en-kjv")
   * @param {string} params.bookId - Book name from books.json (e.g., "Genesis")
   * @param {number} params.chapter - 1-based chapter number
   * @param {string} [params.completedAt] - ISO timestamp (defaults to now)
   * @returns {Object} The created event object
   */
  function logReadingEvent({ versionId, bookId, chapter, completedAt }) {
    const state = loadReadingState();
    const now = completedAt || new Date().toISOString();

    const event = {
      id: 're_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      versionId: versionId,
      bookId: bookId,
      chapter: Number(chapter),
      completedAt: now
    };

    // Prepend newest-first for efficient recent history access
    state.readingEvents.events.unshift(event);
    saveReadingState(state);

    return event;
  }

  /**
   * Get the N most recent reading events.
   * @param {number} [limit=20] - Maximum number of events to return
   * @returns {Array} Array of reading event objects (newest first)
   */
  function getRecentReadingEvents(limit) {
    if (limit === undefined) limit = 20;
    const state = loadReadingState();
    return state.readingEvents.events.slice(0, limit);
  }

  /**
   * Get the current active plan ID.
   * @returns {string|null} Current plan ID or null if none set
   */
  function getCurrentPlanId() {
    const state = loadReadingState();
    return state.currentPlanId;
  }

  /**
   * Set the current active plan ID.
   * @param {string|null} planId - Plan ID to set as current (or null to clear)
   */
  function setCurrentPlanId(planId) {
    const state = loadReadingState();
    state.currentPlanId = planId;
    saveReadingState(state);
  }

  /**
   * Get all plans.
   * @returns {Object} Object mapping plan IDs to plan objects
   */
  function getPlans() {
    const state = loadReadingState();
    return state.plans;
  }

  /**
   * Create or update a plan. Merges with existing plan data if present.
   * @param {Object} plan - Plan object with at least an 'id' property
   * @param {string} plan.id - Unique plan identifier
   * @param {string} [plan.name] - Display name for the plan
   * @param {string} [plan.type] - Plan type: "free" or "structured"
   * @param {Object} [plan.config] - Plan-specific configuration
   * @param {Object} [plan.progress] - Plan progress data
   * @returns {Object|undefined} The merged plan object, or undefined if invalid
   */
  function upsertPlan(plan) {
    if (!plan || !plan.id) {
      console.error('[BibleReading] upsertPlan requires a plan with an id');
      return;
    }

    const state = loadReadingState();
    const existing = state.plans[plan.id] || {};

    const merged = {
      id: plan.id,
      name: plan.name || existing.name || plan.id,
      type: plan.type || existing.type || 'free',
      createdAt: existing.createdAt || new Date().toISOString(),
      config: plan.config !== undefined ? plan.config : existing.config,
      progress: plan.progress !== undefined ? plan.progress : existing.progress
    };

    state.plans[plan.id] = merged;
    saveReadingState(state);

    return merged;
  }

  /**
   * Delete a plan by ID.
   * @param {string} planId - Plan ID to delete
   * @returns {boolean} True if plan was deleted, false if not found
   */
  function deletePlan(planId) {
    const state = loadReadingState();
    if (!(planId in state.plans)) {
      return false;
    }

    delete state.plans[planId];

    // Clear currentPlanId if we just deleted the active plan
    if (state.currentPlanId === planId) {
      state.currentPlanId = null;
    }

    saveReadingState(state);
    return true;
  }

  /**
   * Clear all reading events (for testing/reset purposes).
   */
  function clearReadingEvents() {
    const state = loadReadingState();
    state.readingEvents.events = [];
    saveReadingState(state);
  }

  // Expose a global API under window.BibleReading
  window.BibleReading = {
    // State management
    loadReadingState: loadReadingState,
    saveReadingState: saveReadingState,

    // Reading events
    logReadingEvent: logReadingEvent,
    getRecentReadingEvents: getRecentReadingEvents,
    clearReadingEvents: clearReadingEvents,

    // Plan management
    getCurrentPlanId: getCurrentPlanId,
    setCurrentPlanId: setCurrentPlanId,
    getPlans: getPlans,
    upsertPlan: upsertPlan,
    deletePlan: deletePlan
  };
})();
