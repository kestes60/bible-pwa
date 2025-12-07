// scripts/storage/reading-plans.js
// Reading plan & history storage for Bible Reader (local-only, v1)
// Exposes window.BibleReading API for managing reading plans and events

(function () {
  'use strict';

  const READING_STATE_KEY = 'bibleReader.readingState.v1';

  /**
   * Built-in reading plan templates (placeholders for now).
   * These are static plans that will be selectable in a future update.
   */
  const BUILTIN_PLANS = [
    {
      id: 'nt-90-days',
      name: 'New Testament in 90 Days',
      description: 'Read the entire New Testament at a gentle pace—perfect for daily devotion.',
      meta: '27 books • ~260 chapters • Est. 3 months',
      isBuiltin: true,
      comingSoon: true
    },
    {
      id: 'psalms-30-days',
      name: 'Psalms in 30 Days',
      description: 'Journey through the Psalms, one a day, with space for reflection.',
      meta: '150 Psalms • 30-day plan',
      isBuiltin: true,
      comingSoon: true
    },
    {
      id: 'gospels-40-days',
      name: 'Gospels in 40 Days',
      description: 'Follow Jesus through Matthew, Mark, Luke, and John during Lent or anytime.',
      meta: '89 chapters • Lent-friendly',
      isBuiltin: true,
      comingSoon: true
    },
    {
      id: 'bible-in-year',
      name: 'Whole Bible in a Year',
      description: 'Classic one-year plan mixing OT/NT/Psalms daily.',
      meta: '1,189 chapters • Chronological mix',
      isBuiltin: true,
      comingSoon: true
    }
  ];

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
   * Get all plans (stored + built-in templates).
   * Stored plans take priority over built-ins with the same ID.
   * @returns {Object} Object mapping plan IDs to plan objects
   */
  function getPlans() {
    const state = loadReadingState();
    const storedPlans = state.plans;

    // Convert builtins array to object
    const builtinPlansObj = {};
    BUILTIN_PLANS.forEach(plan => {
      builtinPlansObj[plan.id] = plan;
    });

    // Merge: stored plans override builtins
    return { ...builtinPlansObj, ...storedPlans };
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
