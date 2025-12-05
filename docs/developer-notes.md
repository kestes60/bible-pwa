# Bible Reader – Developer Notes

_Last updated: 2025-12-02_

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

9. “First Day Back” Checklist

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
