# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla HTML/CSS/JavaScript Progressive Web App (PWA) for a Bible application. The project uses **no build tools, no frameworks, and no package manager** - it's pure static files served directly.

## Architecture

### Core PWA Components

**Service Worker Pattern** (`sw.js`):
- Cache-first strategy with network fallback
- Cache name: `bible-pwa-v1`
- Caches: root (`/`) and `index.html`
- Standard PWA lifecycle: `install` event → cache resources, `fetch` event → serve from cache or network

**Manifest** (`manifest.json`):
- Standalone display mode for app-like experience
- 9 icon sizes (72px to 512px) located in `/icons/`
- White theme and background colors

**Entry Point** (`index.html`):
- Inline styles in `<head>` (no external CSS files)
- Service Worker registration in inline `<script>` at bottom
- Minimal system UI font stack

### File Structure

```
/
├── index.html          # Main entry point with inline styles/scripts
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── favicon.ico        # Browser favicon
├── icons/             # PWA icons (72x72 to 512x512)
└── assets/            # Currently empty
```

## Development Workflow

### Running Locally

This PWA requires an HTTP server (Service Workers don't work with `file://` protocol):

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if http-server is installed globally)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000`

### Testing Service Worker

1. Open browser DevTools → Application/Storage tab
2. Check "Service Workers" section for registration status
3. Check "Cache Storage" for `bible-pwa-v1` cache
4. Use "Offline" checkbox to test offline functionality

### Updating the Service Worker

When modifying cached resources:

1. Update cache version in `sw.js` (e.g., `bible-pwa-v1` → `bible-pwa-v2`)
2. Add cleanup logic to remove old caches:
   ```javascript
   self.addEventListener('activate', (event) => {
     event.waitUntil(
       caches.keys().then(names =>
         Promise.all(names.filter(n => n !== 'bible-pwa-v2').map(n => caches.delete(n)))
       )
     );
   });
   ```

### PWA Installation Testing

1. Serve over HTTPS (required for PWA install prompt on most browsers)
2. Use localhost for development (treated as secure context)
3. Check manifest validation: DevTools → Application → Manifest
4. Verify all icon sizes exist and load correctly

## Key Constraints

- **No Build Step**: All changes are direct edits to HTML/CSS/JS files
- **No Module System**: Use inline scripts or traditional `<script src="">` tags
- **No Package Manager**: All dependencies must be via CDN or inline code
- **Cache Management**: Manual cache versioning required for updates
- **HTTPS Required**: Service Workers require HTTPS (except localhost)

## Common Patterns

### Adding New Pages

1. Create new HTML file in root
2. Add to Service Worker cache in `install` event:
   ```javascript
   cache.addAll(["/", "/index.html", "/new-page.html"])
   ```
3. Increment cache version

### Adding External Libraries

Use CDN links in HTML:
```html
<script src="https://cdn.example.com/library.js"></script>
```

Or inline the code directly in `<script>` tags.

### Styling Approach

Currently all styles are inline in `index.html` `<head>`. For more complex styling, consider:
- External CSS file linked in `<head>`
- Add CSS file to Service Worker cache
