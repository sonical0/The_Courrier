# The Courrier - AI Agent Guide

## Project Overview
React 19 SPA for tracking Nexus Mods updates. Serverless architecture (Vercel) with user-provided credentials stored in localStorage. No backend database—all state is client-side or cached in serverless functions.

## Architecture

### Frontend Structure
- **Pages**: [ActuUpdatePage.jsx](../src/pages/ActuUpdatePage.jsx) (recent updates), [NexusModsPage.jsx](../src/pages/NexusModsPage.jsx) (all tracked mods)
- **Custom Hooks Pattern**: All logic in `src/components/use*.js` hooks, not components
  - `useNexusMods.js`: API calls with credential headers, data normalization
  - `useNexusCredentials.js`: localStorage management for username/apiKey
  - `useLastVisit.js`: Track visit timestamps for "NEW" badges
  - `useTheme.js`: Dark/light mode persistence
- **Components**: Only UI components (modals, changelog displays)

### Backend Structure
- **Dev Server**: [server.mjs](../server.mjs) (Express, port 4000, run with `npm run server`)
- **Production**: Serverless functions in [api/nexus/](../api/nexus/) (Vercel)
  - `tracked.mjs`: Fetch tracked mods with enrichment (game names, categories, changelogs)
  - `untrack.mjs`: Remove mod from tracking
  - `validate.mjs`: Validate credentials
- **Dual Auth**: Functions read credentials from `X-Nexus-Username`/`X-Nexus-ApiKey` headers (user-provided) OR env vars (legacy fallback)

### Data Flow
1. User enters credentials → stored in localStorage
2. `useNexusMods` hook passes credentials as headers to `/api/nexus/*`
3. Serverless function adds credentials to Nexus API requests
4. Response enriched with game names, categories, changelogs
5. Frontend normalizes data (see `toEpoch` helper for timestamp handling)

## Critical Patterns

### Timestamp Normalization
Nexus API returns inconsistent timestamp formats. Always use the `toEpoch` utility (exists in hooks and backend):
```javascript
const toEpoch = (v) => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  // handles both Unix timestamps and ISO strings
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) return n;
    const d = Date.parse(v);
    if (!Number.isNaN(d)) return Math.floor(d / 1000);
  }
  return 0;
};
```

### Code Synchronization (Critical!)
**Dev server ([server.mjs](../server.mjs)) and serverless functions ([api/nexus/](../api/nexus/)) must stay in sync.** Changes to one require updating the other.

Duplicated code to keep synchronized:
- `toEpoch()` utility function (all 3 files)
- `nexusHeaders()` helper (all 3 files - must accept username/apiKey params)
- `getCategoryName()` function (server.mjs + api/nexus/tracked.mjs)
- `withPool()` concurrency helper (server.mjs + api/nexus/tracked.mjs)
- `getGameInfo()` game metadata fetcher (server.mjs + api/nexus/tracked.mjs)
- Changelog version sorting logic (semantic versioning, not alphabetical)

### Category System
Game mod categories are centralized in [src/data/nexus-categories.json](../src/data/nexus-categories.json). To add a new game:
1. Follow [ADDING_GAME_CATEGORIES.md](../ADDING_GAME_CATEGORIES.md) extraction script
2. Add category mapping to the JSON file (automatically used by both server.mjs and api/nexus/tracked.mjs)
3. Use game's `domain_name` as key (e.g., `skyrimspecialedition`)

### Caching Strategy
Both dev server and serverless functions use in-memory `Map` cache with TTLs:
- Tracked mods: 60s
- Individual mod details: 10 min
- Game metadata: 24h

Cache keys follow pattern: `tracked:${username}`, `mod:${domain}:${id}`, `game:${domain}`

### Vercel Configuration
[vercel.json](../vercel.json) includes critical rewrite for untrack endpoint:
```json
"/api/nexus/tracked/(.*)/(.*)$" → "/api/nexus/untrack?domain=$1&modId=$2"
```
This allows DELETE requests to `/api/nexus/tracked/{domain}/{modId}` to work.

## Development Workflow

### Local Development
```bash
npm install
npm run server  # Starts Express on port 4000
npm start       # Starts React dev server (proxies to 4000)
```
The `proxy` field in [package.json](../package.json) routes `/api/*` to Express server.

### Testing
- Manual tests: [TESTING_GUIDE.md](../TESTING_GUIDE.md) includes test credentials
- No automated tests yet (React Testing Library set up but unused)
- Test both with/without localStorage credentials

### Deployment
Follow [DEPLOYMENT.md](../DEPLOYMENT.md). Key points:
- Vercel auto-detects Create React App
- No env vars required (user credentials only)
- Serverless functions auto-deployed from `api/` folder

## Common Tasks

### Adding API Functionality
1. Create new file in `api/nexus/` (e.g., `api/nexus/feature.mjs`)
2. Export default async handler: `export default async function handler(req, res) {...}`
3. Copy CORS headers setup from existing serverless functions
4. Use `nexusHeaders(username, apiKey)` helper (read from `req.headers["x-nexus-*"]` OR `process.env`)
5. Add corresponding route to `server.mjs` for local development
6. Update `useNexusMods.js` hook to call new endpoint with credential headers

### Adding UI Features
1. If state/logic needed: Create `useFeatureName.js` hook in `src/components/`
2. If pure UI: Create component in `src/components/`
3. Import hook in `App.jsx` or page component
4. Never put business logic in JSX components

### Styling
- Tailwind CSS for layouts/spacing (utility classes)
- Dark mode: Use `dark:` prefix (theme toggled via `useTheme` hook)
- Bootstrap 5 only for modal components
- Custom classes use `pico-*` prefix (see [App.css](../src/App.css))

## Gotchas
- React Router v7: Import from `react-router-dom`, not `react-router`
- React 19: No need for `React.` prefix, imports are auto-detected
- Nexus API rate limits: 100 req/hour for free accounts (why user credentials matter)
- localStorage keys: `nexusCredentials` (JSON), `lastVisit` (timestamp), `theme` (string)
- Game identifiers: Use `domain` (string) not `gameId` (number) for API calls

## Documentation Updates (REQUIRED)

**ALWAYS update CHANGELOG.md when making code changes.** Follow this workflow:

### 1. Update CHANGELOG.md (Mandatory)
Add entry at the top with this format:
```markdown
## Version X.Y.Z - Description (DD Month YYYY)

### [Category]
- Change description
- Files modified: file1.ext, file2.ext

### Impact Technique
- Impact description
```

Categories: `Nouvelles Fonctionnalités`, `Corrections`, `Améliorations`, `Documentation`

Version numbering:
- Major (X): Breaking changes or major features
- Minor (Y): New features, backward compatible
- Patch (Z): Bug fixes, documentation

### 2. Update Other Files (Conditional)
Based on change type, update:

| Change Type | Files to Update |
|-------------|----------------|
| New feature | CHANGELOG.md + README.md + TESTING_GUIDE.md |
| Bug fix | CHANGELOG.md + README.md (if user-facing) |
| Code pattern change | CHANGELOG.md + .github/copilot-instructions.md |
| Deployment change | CHANGELOG.md + DEPLOYMENT.md |
| Credentials change | CHANGELOG.md + CREDENTIALS_CONFIG.md |
| Category system | CHANGELOG.md + ADDING_GAME_CATEGORIES.md |
| Sync dev/prod | CHANGELOG.md + verify 7 critical blocks |
| File added/removed | CHANGELOG.md + README.md (Structure section) |

### 3. Sync Dev/Prod (Critical)
When modifying serverless functions, update BOTH:
- `server.mjs` (dev)
- `api/nexus/*.mjs` (prod)

Verify these 6 blocks stay identical:
1. `toEpoch()`
2. `nexusHeaders(username, apiKey)`
3. `getCategoryName()`
4. `withPool()`
5. `getGameInfo()`
6. Changelog sorting logic

Note: `CATEGORIES_BY_GAME` is now centralized in [src/data/nexus-categories.json](../src/data/nexus-categories.json) and no longer requires manual sync.

### 4. Update Version References
- PRE_DEPLOYMENT_CHECK.md header (date + version)
- All other files link to CHANGELOG.md (no version duplication)

### 5. Documentation Style (Professional)
- Remove emojis from .md files unless strictly necessary for clarity
- Exception: User-facing guides (SUMMARY.md, TESTING_GUIDE.md) may use minimal emojis for readability
- Technical docs must remain emoji-free: CHANGELOG.md, DEPLOYMENT.md, CREDENTIALS_CONFIG.md
- Code comments and commit messages: no emojis
