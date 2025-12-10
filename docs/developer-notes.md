# Bible Reader – Developer Notes

_Last updated: 2025-12-06_

This document is a quick reference for how the Bible Reader PWA works and how to develop on it without having to re-figure everything each time.

---

## 1. Quick Commands Cheat Sheet

### Local desktop dev (simple static server)

Use **one** of these from the project root:

```bash
# Option A – Python
python3 -m http.server 8000

# Option B – serve on the PWA port you’ve been using
npx serve . -l 4173

Then open:

http://localhost:8000 or http://localhost:4173 in your desktop browser.

Test on phone (same Wi-Fi)

Run:

npx serve . -l 4173


Find your computer’s IP address on the LAN (e.g. 192.168.1.23).

On your phone’s browser (same Wi-Fi), open:

http://192.168.1.23:4173


That will load the local dev version of the app on your phone.

2. Service Worker & Cache Busting

File: sw.js

Cache version constant:

// Cache version constant - increment this to bust the cache
const CACHE_VERSION = "bible-pwa-v15"; // example


When you make changes that affect cached files (HTML, JS, CSS, data):

Increment CACHE_VERSION (e.g. v15 → v16).

Commit and push to main.

Wait for the GitHub Actions deploy to finish (green check).

On each device:

Close the PWA / browser tab.

Re-open the site.

The new SW will install and old cache will be cleared.

If something looks “stuck,” do a hard refresh or clear this site’s data in the browser.

3. Deployment (GitHub Pages + GitHub Actions)

The site is deployed from the main branch using a GitHub Actions workflow (in .github/workflows/deploy.yml).

Deploy steps

From project root:

git status            # check changes
git add .
git commit -m "Meaningful message here"
git push origin main


Then:

Go to the repo on GitHub.

Click Actions → look for the latest run of the deploy workflow
(e.g., “Deploy Bible PWA to GitHub Pages”).

Wait for it to finish with a ✅ green check.

Live site URL:
https://kestes60.github.io/bible-pwa/

4. Project Structure (high-level)

Only the pieces you’re most likely to touch:

index.html
Main HTML shell, header buttons, modals (book selector, bookmarks, version manager, reading history).

scripts/app.js
Core UI logic: navigation, modals, theme, font size, bookmarks, reading history UI, etc.

scripts/config/versions.js
Bible version metadata:

Installed versions (WEB, KJV, KRV, RVR, CUV, …)

Source URLs for converters

Version IDs used throughout the app.

scripts/storage/reading-plans.js
Local storage for:

Reading plans (future expansion)

Reading history events
Exposes the window.BibleReading API.

styles/main.css
All styling: layout, theme, modals, buttons, history modal styles, etc.

sw.js
Service worker for offline support and pre-caching all installed versions.

data/<versionId>/
Per-version JSON files:

data/en-web/ – WEB

data/en-kjv/ – KJV

data/krv/ – Korean

data/rvr/ – Spanish

data/cuv/ – Chinese
Each folder contains 67 book JSON files.

scripts/tools/convert-osis-to-json.mjs
Generic OSIS → JSON converter.

scripts/tools/convert-usfx-to-json.mjs
Generic USFX → JSON converter.

scripts/tools/download-openbible-source.mjs
Helper to download source files from seven1m/open-bibles and run the appropriate converter.

5. Bible Versions – How to Add Another Version

Current versions installed:

en-web – World English Bible (WEB)

en-kjv – King James Version

krv – Korean Revised Version

rvr – Reina Valera 1909 (Spanish)

cuv – Chinese Union Version

General pattern

Add a source entry in scripts/tools/download-openbible-source.mjs under VERSION_SOURCES.

Run the download script from project root:

node scripts/tools/download-openbible-source.mjs <version-id>


This:

Downloads the OSIS or USFX file from open-bibles.

Calls the appropriate converter.

Writes JSON files into data/<version-id>/.

Add/verify the version entry in scripts/config/versions.js.

(If needed) update sw.js to pre-cache the new version and bump CACHE_VERSION.

Once that’s done and deployed, the version appears in the Manage Versions modal.

6. Reading History Storage (v1)
Where it lives

File: scripts/storage/reading-plans.js

Storage key (localStorage):

const READING_STATE_KEY = 'bibleReader.readingState.v1';


Structure example:

{
  "currentPlanId": null,
  "plans": {
    // future reading plans will live here
  },
  "readingEvents": {
    "events": [
      {
        "id": "re_...",
        "versionId": "en-web",
        "bookId": "Genesis",
        "chapter": 1,
        "completedAt": "2025-12-02T23:37:13.833Z"
      }
    ]
  }
}

BibleReading API

Available globally as window.BibleReading:

loadReadingState()

saveReadingState(state)

logReadingEvent({ versionId, bookId, chapter, completedAt? })

getRecentReadingEvents(limit = 20)

clearReadingEvents()

getCurrentPlanId()

setCurrentPlanId(planId)

getPlans()

upsertPlan(plan)

deletePlan(planId)

How events get logged

File: scripts/app.js

Function: logCurrentChapterReading()

Called from displayChapter() after a chapter is successfully shown and reading state is saved.

This guarantees:

One event per chapter view.

Events are stored most-recent-first.

Reading History Modal

HTML: index.html → #historyModalOverlay

JS functions in scripts/app.js:

openReadingHistory()

closeReadingHistory(event?)

navigateToHistoryItem(bookId, chapter)

Helper: timeSince(date) → 5s, 2m, 3h, 2d

Shortcut:

Header button 📜 opens the modal.

Esc closes it (handled in global keydown listener).

7. Data Safety & Backups (future)

Right now, all user data (reading history, future notes, etc.) lives in:

localStorage (for reading state & events)

Browser/PWA storage on that device only

This means:

Clearing site data, using private mode, or reinstalling the browser/PWA can erase this data.

Desktop and mobile do not sync yet.

Planned safety features (not implemented yet)

Manual Export / Import:

Export reading state & notes to a JSON file.

Let users import it back later.

Optional auto-backup:

Periodic export to a file or a chosen cloud location (OneDrive, Google Drive, etc.) via a simple user flow.

Later: server-backed sync (Firebase / Supabase / similar) for:

Cross-device sync.

Safe storage of notes & voice notes (with strong privacy guarantees).

8. Feature Roadmap (current order)

Short-term roadmap we agreed on:

Reading plans – v1

Simple “free-form” plan (e.g., track my current book / chapters).

Use BibleReading.plans and currentPlanId.

Custom reading plans

Create/rename/delete plans.

Plan types: e.g., “Read Bible in a Year”, “Gospels in 30 Days”, etc.

Export / Import backup

Export all user data (plans, history, notes) to JSON.

Import to restore.

Notes & voice notes

Per-verse notes:

Text notes

Voice notes (transcribed via Faster Whisper or similar).

Inline indicators (e.g., “N” for note, “V” for voice) next to verses.

Memorization tools

Mark verses for memorization (icon or “M”/brain symbol).

Simple practice/review flow using the marked verses.

Golden Thread

User-defined “paths” across verses (themes, promises, prophecies, etc.).

Saved as named sequences the user can follow & revisit.

Parallel view

Show two versions side-by-side (e.g., English + original language, or English + Korean/Spanish/Chinese).

Audio Bible / narration support

Optional streaming or integration with local audio.

Tie into notes & memorization (e.g., listen + record reflections).

Sync & accounts (longer term)

Use a backend (Firebase/Supabase/other) for:

Cross-device sync

Encrypted storage of personal data

Account-based plans & backups.

9. UX Behaviors

### Auto-scroll on chapter load

When a chapter loads (via book selector, chapter selector, Next/Previous buttons, bookmarks, reading history, "Continue in…" button, or restore-reading-state), the page automatically scrolls to the top of the reading area.

- **Helper function**: `scrollToReadingTop()` in `scripts/app.js`
- **Called from**: `displayChapter()` — all navigation paths funnel through this function
- **Accessibility**: Respects `prefers-reduced-motion`:
  - If user prefers reduced motion → instant jump
  - Otherwise → smooth scroll
- **Target**: Scrolls to the `#chapterIndicator` element (or falls back to page top)

The same reduced-motion logic is applied to `scrollToTop()` (used by the back-to-top button).

### Chapter fade-in animation

When a new chapter loads, the chapter content fades in with a subtle animation (opacity + slight translateY movement over 220ms).

- **Helper function**: `runChapterFadeIn()` in `scripts/app.js` (near `scrollToReadingTop()`)
- **Called from**: `displayChapter()` — right after DOM updates, before scrolling
- **CSS**: `.chapter-fade-in` class and `@keyframes chapterFadeIn` in `styles/main.css`
- **Accessibility**: Respects `prefers-reduced-motion`:
  - CSS `@media (prefers-reduced-motion: reduce)` disables the animation
  - JS guard in `runChapterFadeIn()` skips class toggling entirely
- **Target**: Applied to `#versesContainer` element

### Header spacing & mobile layout

The header uses a responsive layout that adapts to different screen sizes:

- **Desktop (>600px)**: Flexbox layout with `.header-center` absolutely positioned for true centering
- **Mobile (≤600px)**: CSS Grid two-row layout:
  - Row 1: menu button + action buttons (font-size, bookmarks, history, settings, theme)
  - Row 2: centered title + version chip
- **Extra narrow (≤400px)**: Further tightened spacing and slightly larger tap targets (40px min)

All header buttons maintain a minimum tap target size of 36-40px for accessibility. The `.last-read-hint` label is hidden below 768px to save space.

**CSS files**: Header layout in `styles/main.css` around lines 58-170 (desktop) and in `@media (max-width: 600px)` / `@media (max-width: 400px)` sections.

**Future consideration**: If more header controls are added, we may need to move some buttons into an overflow menu.

### Settings Modal (Accordion ToC)

The Settings modal uses an accordion layout with a sticky Table of Contents (ToC) for easy navigation.

**Accordion Structure:**
- 5 collapsible sections: Reading Preferences, Reading Plans, Backup & Restore, Manage Versions, Appearance
- Sticky ToC bar at top with quick-jump links to each section
- Collapsed by default on first open; first section auto-expands if none persisted
- Click header or ToC link to expand/collapse sections with smooth CSS transitions
- Chevron (▶/▼) rotates 90° on expand via CSS transform
- Persisted state in: `localStorage.getItem('bibleReader.settingsExpanded')` (JSON array of section IDs)

**ARIA Accessibility:**
- Headers: `aria-expanded`, `aria-controls`, `tabindex="0"`, keyboard Enter/Space toggle
- Content: `aria-expanded` synced with header
- ToC links: `aria-label` for navigation context

**Key CSS classes:**
- `.settings-toc` - Sticky ToC bar (`position: sticky; top: 0`)
- `.accordion-header` - Clickable section headers
- `.accordion-content` - Collapsible content areas (`max-height: 0` → `1200px` on expand)
- `.accordion-chevron` - Rotating arrow indicator

**JS functions** (in `scripts/app.js`):
- `initSettingsAccordion()` - Sets up handlers, restores state, ToC navigation
- `toggleAccordionSection(header, forceOpen)` - Toggle with optional force
- `getExpandedSections()` / `saveExpandedSections()` - localStorage persistence

---

### Reading preferences (inside Settings accordion)

The Reading Preferences section includes adjustable settings that persist in localStorage.

**Line Height Slider:**
- Range: 1.4 (Compact) to 1.8 (Spacious), step 0.1
- Default: 1.6
- Persisted in: `localStorage.getItem('bibleReader.lineHeight')`
- Applied via: CSS custom property `--line-height` on `:root`
- Affects: `.verses-container { line-height: var(--line-height); }`
- Live update: Changes apply immediately as slider moves
- **JS functions**: `getSavedLineHeight()`, `saveLineHeight()`, `applyLineHeight()`, `initLineHeightSlider()`, `updateLineHeightPreview()`, `handleLineHeightInput()`, `handleLineHeightChange()`, `handleLineHeightTouch()` in `scripts/app.js`

**Mobile-specific handling:**
- Preview pane (`#lineHeightPreview`) shows John 3:16-17 with live line-height updates (visible only on mobile ≤600px)
- Three event listeners for reliability: `input` (drag), `change` (release), `touchmove` (fallback)
- Debounced CSS property updates (50ms) to prevent mobile touch event spam
- Force reflow via `.reflow-trigger` class toggle for stubborn mobile browsers
- Console logging (`[LineHeight]`) for debugging touch event issues
- CSS: `.line-height-preview`, `.preview-verse-num`, `.reflow-trigger` in `styles/main.css`

**Future preferences**: Font family selector, text alignment, margin controls.

### Reading plans menu

The Reading Plans menu lives inside the Settings modal (⚙ button). It displays reading plan cards using `BibleReading.getPlans()` and `BibleReading.getCurrentPlanId()`.

**Current behavior:**
- Shows the auto-generated `current-book` plan (tracks progress through whichever book you're reading)
- Displays 4 built-in plans: NT 90 Days, Psalms 30 Days, Gospels 40 Days, Whole Bible in a Year
- Displays an "Active" badge on the current plan
- Shows book name and chapter progress for current-book (e.g., "Book: Hebrews • Last: 8 / 13")
- Built-in plans show meta info (e.g., "27 books • ~260 chapters • Est. 3 months")
- Sort order: active first, then all others alphabetically by name (explicit JS sort for cross-device consistency)

**Plan switching:**
- Click any plan card to switch to it
- Switching to a built-in plan clears reading history (fresh start)
- Switching to `current-book` preserves reading history
- Clicking the already-active plan shows "Already on this plan" toast
- Toast notification confirms switch with plan name
- Badge moves to new active plan immediately

**Key files:**
- **HTML**: `#readingPlansList` container inside Settings modal in `index.html`
- **CSS**: `.reading-plans-section`, `.reading-plan-card`, `.reading-plan-badge-active` in `styles/main.css`
- **JS**: `renderReadingPlansList()` in `scripts/app.js`, called from `openSettingsModal()`
- **Data**: `BUILTIN_PLANS` array in `scripts/storage/reading-plans.js`, merged with stored plans via `getPlans()`

**Future steps:**
- Add scoped progress resets (only clear events outside plan's book scope)
- Add daily tracking and progress indicators per plan
- Allow users to create and manage custom plans

### Modal transitions (one modal at a time)

When opening a modal from within another modal, we close the first modal before opening the second. This prevents modals from stacking on top of each other.

**Example**: "See what's new in this version" link in Settings modal uses `openWhatsNewFromSettings()` which:
1. Closes the Settings modal
2. Opens the What's New modal

**Pattern**: For any future in-modal links that open another modal, create a transition helper function following the same pattern in `scripts/app.js`.

### Body scroll lock (prevents overscroll)

When a modal is open, body scroll is locked to prevent the background content from scrolling when the user scrolls to the edge of the modal content.

**Implementation:**
- `lockBodyScroll()` / `unlockBodyScroll()` helpers in `scripts/app.js`
- CSS class `body.modal-open` in `styles/main.css` (applies `overflow: hidden; position: fixed;`)
- Saves/restores scroll position to prevent jump when closing modal

**Applied to all modals:**
- Book Selector, Chapter Selector, Bookmarks, Reading History, Version Manager, Settings, What's New

**Modal-to-modal transitions:** `lockBodyScroll()` is idempotent—safe to call multiple times without overwriting the saved scroll position. This allows transitions like Settings → What's New without scroll jumps.

### Parallel View (side-by-side translations)

Displays two Bible versions horizontally side-by-side, inspired by Blue Letter Bible's mobile layout. Always horizontal (no stacking)—users zoom if needed on mobile.

**Core behavior:**
- Toggle in Settings modal → "Enable Parallel View" checkbox
- Secondary version picker shows installed versions (excludes current primary)
- Both panes load same chapter with bidirectional scroll sync
- Mobile: Tighter gaps/padding (0.5rem) for portrait fit

**Storage keys:**
- `bibleReader.parallelEnabled` - Boolean for toggle state
- `bibleReader.parallelVersionId` - Secondary version ID (default: `en-kjv`)

**HTML structure:**
- `#parallelContainer` - Main flex container (hidden by default)
- `.parallel-pane.left-pane` - Primary version pane
- `.parallel-pane.right-pane` - Secondary version pane
- `#primaryVersesContainer`, `#secondaryVersesContainer` - Verse content
- `#parallelVersionModalOverlay` - Version picker modal

**CSS classes:**
- `.parallel-container` - Flex row, always horizontal, responsive height
- `.parallel-pane` - Individual pane styling with overflow-y auto
- `.pane-header` - Version name headers (uppercase, accent color)
- `.pane-verses .verse` - Verse styling within panes
- Mobile breakpoints at 600px and 400px for tighter layout

**JS functions in `scripts/app.js`:**
- `isParallelEnabled()`, `setParallelEnabled()` - Toggle state
- `getSecondaryVersionId()`, `setSecondaryVersionId()` - Version preference
- `showParallelView()`, `hideParallelView()` - Container visibility
- `handleParallelToggle()` - Toggle change handler
- `loadParallelChapter()` - Load both versions into panes
- `loadVersesToContainer()` - Generic verse loader for any container
- `initParallelScrollSync()` - Bidirectional scroll sync setup
- `handleLeftPaneScroll()`, `handleRightPaneScroll()` - Scroll handlers
- `openParallelVersionModal()`, `closeParallelVersionModal()` - Picker modal
- `renderParallelVersionList()`, `selectSecondaryVersion()` - Picker logic

**Scroll sync algorithm:**
- Uses scroll ratio (scrollTop / scrollableHeight) to sync position
- `isParallelSyncing` flag prevents infinite scroll loops
- `requestAnimationFrame` clears sync flag for smooth performance

**Future enhancements:**
- Interlinear toggle (word-by-word alignment)
- Premium lock for certain version combinations
- Verse-by-verse sync instead of percentage-based

---

10. "First Day Back" Checklist

When you return to this project after a break:

Pull latest changes:

git pull origin main


Start local server:

npx serve . -l 4173
# or python3 -m http.server 8000


Open:

Desktop: http://localhost:4173

Phone (same Wi-Fi): http://<your-ip>:4173

To find your ip address to view on phone:

In a Command Prompt, enter: ipconfig

Then look for: Wireless LAN adapter Wi-Fi

Under that look for: 
IPv4 Address. . . . . . . . . . . : 192.168.1.156

---

Confirm:

Versions load (WEB/KJV/KRV/RVR/CUV).

Reading history button 📜 opens modal and shows events.

Skim this file (docs/developer-notes.md) to remember:

Where reading storage lives.

How deployment & cache bumping works.

Check the roadmap in section 8 and pick the next concrete task.

“Breathing Life Into Dreams” – Yahtsar


---

If you’d like, our **next step** can be:

- Adding a tiny “developer notes” link in a comment at the top of `app.js` and `reading-plans.js` pointing to this file, so you never forget it exists.

And then we can dive straight into **Reading Plans – v1**.
::contentReference[oaicite:0]{index=0}
