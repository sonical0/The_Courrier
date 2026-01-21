# Quick Update Guide - The Courrier

**For AI Agents & Developers**: Use this when making ANY code change.

---

## Automatic Workflow

### Step 1: Update CHANGELOG.md (ALWAYS)

```markdown
## Version X.Y.Z - Brief Description (DD Month YYYY)

### [Category]
- What changed
- Files modified: file1.js, file2.mjs

### Impact Technique
- Performance/behavior impact
```

**Version Bump:**
- `X.0.0` = Breaking change
- `X.Y.0` = New feature
- `X.Y.Z` = Bug fix or doc update

**Categories:** `Nouvelles Fonctionnalités`, `Corrections Critiques`, `Améliorations`, `Documentation`

---

### Step 2: Update Conditional Files

| I changed... | Update these files |
|--------------|-------------------|
| **Frontend component** | README.md (architecture) |
| **API endpoint** | README.md (API section) + sync check |
| **Serverless function** | server.mjs + api/nexus/*.mjs (verify 7 blocks) |
| **User feature** | SUMMARY.md + TESTING_GUIDE.md |
| **Code pattern** | .github/copilot-instructions.md |
| **Deployment** | DEPLOYMENT.md |
| **Credentials** | CREDENTIALS_CONFIG.md |
| **Categories** | ADDING_GAME_CATEGORIES.md |
| **Critical check** | PRE_DEPLOYMENT_CHECK.md |
| **File added/removed** | README.md (Structure des Composants section) |

---

### Step 3: Verify Sync (Backend Changes Only)

When touching `server.mjs` or `api/nexus/*.mjs`, verify these are identical:

```bash
1. CATEGORIES_BY_GAME constant
2. toEpoch() function
3. nexusHeaders(username, apiKey) function
4. getCategoryName() function
5. withPool() function
6. getGameInfo() function
7. Changelog sorting (semantic versioning)
```

**Quick Check:**
```bash
diff <(grep -A 10 "toEpoch" server.mjs) <(grep -A 10 "toEpoch" api/nexus/tracked.mjs)
```

---

### Step 4: Update Version Header

Update `PRE_DEPLOYMENT_CHECK.md` header:
```markdown
**Date de vérification** : DD Month YYYY
**Version** : X.Y.Z
```

---

## Quick Examples

### Example 1: Bug Fix
```
Changed: Fixed version sorting in tracked.mjs
Update: CHANGELOG.md (3.3.0) + verify sync with server.mjs
```

### Example 2: New Feature
```
Changed: Added game icon display
Update: CHANGELOG.md (3.4.0) + README.md + SUMMARY.md + TESTING_GUIDE.md
```

### Example 3: Documentation
```
Changed: Updated deployment steps
Update: CHANGELOG.md (3.3.1) + DEPLOYMENT.md
```

### Example 4: Code Pattern
```
Changed: New custom hook pattern
Update: CHANGELOG.md (3.4.0) + .github/copilot-instructions.md + README.md
```

---

## Don't Do This

- Update other files without updating CHANGELOG.md
- Duplicate version info across multiple files
- Modify server.mjs without checking api/nexus/*.mjs
- Copy content between documentation files
- Skip version bump in PRE_DEPLOYMENT_CHECK.md
- Use emojis in technical documentation

---

## Do This

- Update CHANGELOG.md first (always)
- Use conditional file updates (see table)
- Verify dev/prod sync for backend changes
- Link to other docs instead of duplicating
- Update PRE_DEPLOYMENT_CHECK.md version
- Keep documentation professional and emoji-free

---

## Decision Tree

```
Made a code change?
    ↓
1. Add CHANGELOG entry
    ↓
2. Calculate version bump (major/minor/patch)
    ↓
3. Check change type → update conditional files
    ↓
4. Backend change? → Verify 7 blocks sync
    ↓
5. Update PRE_DEPLOYMENT_CHECK.md header
    ↓
6. Verify no version duplication
    ↓
✓ Done!
```

---

## Full Documentation

For complete rules, see:
- [.github/DOCUMENTATION_GUIDE.md](./.github/DOCUMENTATION_GUIDE.md) - Full automation rules
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - AI agent patterns
- [CHANGELOG.md](../CHANGELOG.md) - Complete version history

---

**Remember:** CHANGELOG.md is ALWAYS step 1. Everything else is conditional.
