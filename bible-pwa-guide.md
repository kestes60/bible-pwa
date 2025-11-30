# Bible PWA Development Guide: Free Translations and Integration

This Markdown file compiles all the guidance provided on building a Progressive Web App (PWA) for Bible reading, starting with the World English Bible (WEB) and expanding to other freely available versions. It covers recommended translations, best practices for dynamic loading from the [open-bibles GitHub repository](https://github.com/seven1m/open-bibles), your JSON schema, a JavaScript parser mock-up, and details on ancient language support. 

The goal is to help you create a scalable, offline-first app with user-driven downloads. All content is based on public domain or open-licensed resources as of the latest repo state (circa 2022, with no major updates since).

## 1. Freely Available English Bible Translations

To expand beyond the WEB (which is public domain and modern), focus on public domain or open-licensed English versions. These are ideal for PWAs due to no restrictions on use, modification, or distribution. Most are available in XML formats (OSIS, USFX, Zefania) via the open-bibles repo.

### Public Domain English Translations

| Translation | Description | Key Features | Download/Source |
|-------------|-------------|--------------|-----------------|
| **King James Version (KJV)** | Classic 1611 English translation, widely used and poetic. | Archaic language; full Bible; great for traditional readers. | [open-bibles GitHub](https://github.com/seven1m/open-bibles) (OSIS XML); or [Project Gutenberg](https://www.gutenberg.org/ebooks/10) (plain text). |
| **American Standard Version (ASV, 1901)** | Formal, literal update of the KJV with improved accuracy. | More readable than KJV; full Bible; excellent for study. | [open-bibles GitHub](https://github.com/seven1m/open-bibles) (Zefania XML); or [Bible Study Tools](https://www.biblestudytools.com/asv/) (free export). |
| **Young's Literal Translation (YLT)** | Extremely literal word-for-word rendering, emphasizing original tenses. | Unique for deep exegesis; full Bible (NT complete, OT partial in some sources). | [open-bibles GitHub](https://github.com/seven1m/open-bibles) (Zefania XML); or [Bible Hub](https://biblehub.com/ylt/) (API-friendly). |
| **Darby Bible (DARBY)** | Literal translation by John Nelson Darby, focused on dispensationalism. | Precise and scholarly; full Bible. | [open-bibles GitHub](https://github.com/seven1m/open-bibles) (Zefania XML). |
| **Douay-Rheims (DRA, 1899 American Edition)** | Catholic translation from Latin Vulgate, with Challoner revisions. | Traditional Catholic perspective; full Bible including Deuterocanonicals. | [open-bibles GitHub](https://github.com/seven1m/open-bibles) (Zefania XML); or [Sacred Bible](http://www.drbo.org/) (text files). |
| **Bible in Basic English (BBE)** | Simplified English for global accessibility (850-word vocabulary). | Easy to read; full Bible; great for ESL users or beginners. | [open-bibles GitHub](https://github.com/seven1m/open-bibles) (USFX XML); or [Bible Gateway](https://www.biblegateway.com/versions/Bible-in-Basic-English-BBE/) (free export). |

### Open License English Translations

These are free but may require attribution (check specifics).

| Translation | Description | Key Features | Download/Source | License |
|-------------|-------------|--------------|-----------------|---------|
| **Berean Standard Bible (BSB)** | Modern, accurate translation blending literal and readable styles. | Natural flow; full Bible; notes included in some editions. | [Berean Bible site](https://berean.bible/) (PDF/EPUB/text); or [CrossBible](https://crossbible.com/versions) (API access). | Public domain (as of 2023). |
| **Open English Bible (OEB)** | Collaborative modern English translation, ongoing and community-driven. | Contemporary language; US/Commonwealth editions; full Bible (OT in progress). | [Open English Bible site](https://openenglishbible.org/) (HTML/text); or [open-bibles GitHub](https://github.com/seven1m/open-bibles) (OSIS XML). | CC0 (public domain equivalent). |

**Tips for Initial Integration**:
- Formats: XML files from open-bibles are structured for easy parsing to JSON.
- Resources: [Digital Bible Library](https://library.bible/) for more (sign-up for downloads).
- Legal: Verify licenses; avoid copyrighted ones like NIV/ESV.

## 2. Dynamic Download Functionality: Pros, Cons, and Best Practices

Rather than pre-downloading, dynamically listing and converting from open-bibles (47 translations in 30+ languages) keeps your app lightweight. Use GitHub's API for the catalog.

### Pros and Cons

| Aspect | Pros | Cons |
|--------|------|------|
| **App Size & Performance** | Keeps core PWA under 1MB initially; only downloads what users want (XML files range from 1-5MB each). | Initial download/parsing could take 10-30 seconds on mobile (XML to JSON conversion in JS); repeated use without caching feels sluggish. |
| **User Experience** | Personalized—users browse a full catalog (e.g., KJV, ASV, OEB, plus non-English like Albanian or Swahili) and install like an "app store" for Bibles. | Requires internet for first-time access; offline users stuck with pre-loaded WEB only. Discovery might overwhelm casual users if the list isn't filtered (e.g., by language/popularity). |
| **Maintenance & Updates** | Automatic—use GitHub's API to fetch the latest file list; no need to bundle updates in app releases. All content is PD/CC, so no legal hurdles. | Repo hasn't seen major updates since ~2022, so the list is somewhat static; varying XML formats mean your converter needs to handle OSIS (most common), USFX, and Zefania robustly. |
| **Development Effort** | One-time build: Fetch repo files, parse, convert/store. Scales to any new additions. | Custom parsing logic (e.g., extracting verses/books) adds complexity; test for edge cases like partial translations (e.g., YLT NT-only). |

### Best Practices: Hybrid Model
- **Pre-Load Essentials**: Bundle WEB + KJV, ASV, BBE as JSON (<10MB total). Use IndexedDB + Service Worker.
- **On-Demand Catalog**: Fetch via `https://api.github.com/repos/seven1m/open-bibles/contents`, filter `.xml`, display searchable list (group by language/popularity).
- **Download Flow**: Fetch raw XML, parse/convert to JSON, cache in IndexedDB. Use `DOMParser` + libraries like fast-xml-parser.
- **User Features**: Filters (e.g., "Study" vs. "Readability"), install/uninstall, compare mode, progress bars.
- **Technical**: Handle formats (OSIS primary), compress JSON, Web Worker for parsing. Fallback to static manifest.
- **Inspiration**: AndBible (on-demand SWORD modules), Scripture App Builder (bundled + downloads), API.Bible (JSON API alternative).

## 3. JSON Schema for Bible Data

Your schema is efficient for navigation and caching. Here's the structure for WEB (adaptable to others):

### 1. Version Registry Entry (e.g., for "en-web")
```json
{
  "id": "en-web",
  "name": "World English Bible",
  "shortName": "WEB",
  "language": "en",
  "languageName": "English",
  "dataPath": "data/",
  "booksFile": "books.json",
  "description": "Modern English translation, public domain"
}
```

### 2. data/books.json (Books Metadata)
```json
{
  "books": [
    {
      "name": "Genesis",
      "shortName": "Gen",
      "filename": "Genesis.json",
      "testament": "OT",
      "order": 1,
      "chapters": 50
    },
    {
      "name": "Exodus",
      "shortName": "Exo",
      "filename": "Exodus.json",
      "testament": "OT",
      "order": 2,
      "chapters": 40
    }
    // ... (full list of 66 books)
  ]
}
```
- **Schema per Entry**:
  - `name`: Full book name (string), e.g., "Genesis".
  - `shortName`: Short code (string), e.g., "Gen".
  - `filename`: JSON filename in data/ (string), e.g., "Genesis.json".
  - `testament`: "OT" or "NT".
  - `order`: Canonical order index (number).
  - `chapters`: Number of chapters (number).

### 3. Per-Book JSON (e.g., data/John.json)
```json
{
  "1": {
    "1": "In the beginning was the Word, and the Word was with God, and the Word was God.",
    "2": "The same was in the beginning with God.",
    // ... (verses 3+)
  },
  "2": {
    "1": "The third day, there was a marriage in Cana of Galilee. Jesus' mother was there.",
    // ... 
  }
  // ... (up to chapter 21)
}
```
- **Structure**:
  - Top level: Chapter numbers as strings ("1", "2", ...).
  - Each chapter: Verse numbers as strings ("1", "2", ...) → verse text (string).

## 4. JavaScript Parser for Open-Bibles XML to JSON

Mock-up function to fetch/parse OSIS XML (extend for USFX/Zefania). Outputs your schema. Add to `utils/bible-parser.js`.

```javascript
// Canonical book metadata (expand to all 66; derived from standard orders)
const CANONICAL_BOOKS = {
  // OT
  'Gen': { name: 'Genesis', shortName: 'Gen', testament: 'OT', order: 1, chapters: 50 },
  'Exo': { name: 'Exodus', shortName: 'Exo', testament: 'OT', order: 2, chapters: 40 },
  'Lev': { name: 'Leviticus', shortName: 'Lev', testament: 'OT', order: 3, chapters: 27 },
  'Num': { name: 'Numbers', shortName: 'Num', testament: 'OT', order: 4, chapters: 36 },
  'Deu': { name: 'Deuteronomy', shortName: 'Deu', testament: 'OT', order: 5, chapters: 34 },
  // ... Add rest: Jos, Jdg, Rth, 1Sa, etc. up to Mal
  // NT
  'Mat': { name: 'Matthew', shortName: 'Mat', testament: 'NT', order: 39, chapters: 28 }, // Order 1 in NT, but global 39
  'Mrk': { name: 'Mark', shortName: 'Mrk', testament: 'NT', order: 40, chapters: 16 },
  'Luk': { name: 'Luke', shortName: 'Luk', testament: 'NT', order: 41, chapters: 24 },
  'Jhn': { name: 'John', shortName: 'Jhn', testament: 'NT', order: 43, chapters: 21 }, // Note: Jhn for John to match common osisIDs
  // ... Add rest: Act, Rom, 1Co, etc. up to Rev (order: 66, chapters: 22)
};

// Simple version name map (from filename; expand based on repo)
const VERSION_NAMES = {
  'eng-kjv': 'King James Version',
  'eng-asv': 'American Standard Version',
  'eng-web': 'World English Bible', // For consistency
  // Add more as needed, or extract from XML header <title>
};

export async function parseOpenBiblesVersion(versionId, format = 'osis') { // format: 'osis', 'usfx', 'zefania'
  const filename = `${versionId}.${format === 'usfx' ? 'usfx' : format}.xml`; // e.g., eng-kjv.osis.xml
  const url = `https://raw.githubusercontent.com/seven1m/open-bibles/master/${filename}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const xmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error(`XML parse error: ${parseError.textContent}`);

    const osisText = doc.querySelector('osisText') || doc.documentElement; // Fallback for root

    // Extract metadata
    const langMatch = versionId.match(/^([a-z]{3})-/) || ['en']; // e.g., 'eng' → 'en'
    const lang = langMatch[1].substring(0, 2); // 'eng' → 'en'
    const shortName = versionId.split('-')[1]?.toUpperCase() || 'UNK'; // e.g., 'kjv' → 'KJV'
    const name = VERSION_NAMES[versionId] || `${shortName} Bible`; // Or extract: osisText.querySelector('title')?.textContent
    const description = 'Public domain translation from open-bibles'; // Customize per version

    // Parse books
    const books = [];
    const bookFiles = {};
    let bookGroup = osisText.querySelector('div[type="bookGroup"]') || osisText; // Handle grouping
    const bookDivs = bookGroup.querySelectorAll('div[type="book"]');

    bookDivs.forEach((bookDiv) => {
      const osisID = bookDiv.getAttribute('osisID'); // e.g., 'Gen'
      const bookInfo = CANONICAL_BOOKS[osisID];
      if (!bookInfo) return; // Skip unknown books

      const chapters = {};
      const chapterEls = bookDiv.querySelectorAll('chapter'); // OSIS-specific
      chapterEls.forEach((chapterEl) => {
        const chOsisID = chapterEl.getAttribute('osisID'); // e.g., 'Gen.1'
        const chNum = chOsisID.split('.')[1]; // '1'
        const verses = {};
        const verseEls = chapterEl.querySelectorAll('verse');
        verseEls.forEach((verseEl) => {
          const vOsisID = verseEl.getAttribute('osisID'); // e.g., 'Gen.1.1'
          const vNum = vOsisID.split('.')[2]; // '1'
          verses[vNum] = verseEl.textContent.trim(); // Flatten text; extend for inline tags if needed
        });
        if (Object.keys(verses).length > 0) {
          chapters[chNum] = verses;
        }
      });

      if (Object.keys(chapters).length > 0) {
        const filename = `${bookInfo.name}.json`;
        bookFiles[filename] = chapters;
        books.push({
          name: bookInfo.name,
          shortName: bookInfo.shortName,
          filename,
          testament: bookInfo.testament,
          order: bookInfo.order,
          chapters: bookInfo.chapters // Canonical; or Object.keys(chapters).length if dynamic
        });
      }
    });

    // Sort books by order
    books.sort((a, b) => a.order - b.order);

    // Registry entry
    const registry = {
      id: versionId,
      name,
      shortName,
      language: lang,
      languageName: lang === 'en' ? 'English' : 'Unknown', // Map more langs
      dataPath: `data/${versionId}/`, // For your storage structure
      booksFile: 'books.json',
      description
    };

    return {
      registry,
      books, // For books.json
      bookFiles // For per-book files
    };

  } catch (error) {
    console.error(`Parse failed for ${versionId}:`, error);
    throw error;
  }
}

// Example usage in your PWA (e.g., on user select):
// async function downloadVersion(versionId) {
//   const { registry, books, bookFiles } = await parseOpenBiblesVersion(versionId);
//   // Store to IndexedDB
//   const db = await openDB('BibleDB', 1, { upgrade(db) { db.createObjectStore('versions'); } });
//   await db.put('versions', { registry, books, bookFiles }, registry.id);
//   // Update UI: Add to version list, etc.
// }
```

**Integration Notes**:
- Catalog: Use GitHub API for file list.
- Storage: IndexedDB with key `version.id`.
- Extensions: Add USFX/Zefania branches (e.g., `<f book="Gen"><c num="1"><v num="1">text</v></c></f>`).
- Performance: Web Worker for large files; test with `eng-kjv.osis.xml`.

## 5. Ancient Language Support in Open-Bibles

The repo includes limited ancient/original language versions (public domain classics). No NT Greek or interlinears, but useful for parallels.

| Language | Version/File | Description | Format | Coverage |
|----------|--------------|-------------|--------|----------|
| **Hebrew** | `heb-leningrad.usfx.xml` | Leningrad Codex (Masoretic Text base for most modern OT translations). | USFX | Full OT (39 books); public domain. |
| **Greek** | `grc-septuagint.osis.xml` | Septuagint (LXX), the ancient Greek translation of the Hebrew Scriptures. | OSIS | OT (including Deuterocanonicals); public domain. |
| **Latin** | `lat-clementine.usfx.xml` | Clementine Vulgate, Jerome's classic Latin translation. | USFX | Full Bible (OT + NT, with Deuterocanonicals); public domain. |

**Ideas**: Add a "Original Languages" filter; use parser for polyglot views (e.g., Hebrew + WEB side-by-side). Supplement with STEP Bible for more.

## Next Steps
- Test the parser with a sample XML.
- Implement catalog UI with filters.
- For non-English/ancient: Extend `VERSION_NAMES` and language maps.

This guide is self-contained—save as `bible-pwa-guide.md` and reference in your project! If you need expansions (e.g., full canonical books array, UI wireframes), let me know.