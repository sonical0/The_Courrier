# Documentation Guide - The Courrier

**Last Updated:** January 21, 2026

This guide defines the purpose of each documentation file to prevent duplications and ensure clarity.

---

## Documentation Architecture

### Core Documentation Files

| File | Purpose | Update Trigger |
|------|---------|----------------|
| **README.md** | Main project documentation: pitch, features, stack, installation, architecture | Major features or project changes |
| **CHANGELOG.md** | **SOURCE OF TRUTH** for version history. All changes must be logged here | Every code/feature change |
| **DEPLOYMENT.md** | Vercel deployment instructions only | Deployment process changes |
| **TESTING_GUIDE.md** | Manual test scenarios + test credentials | New features requiring tests |
| **CREDENTIALS_CONFIG.md** | Technical deep-dive on credentials system | Credential system changes |
| **SUMMARY.md** | User-friendly overview + quick start guide | User-facing feature changes |

### Specialized Guides

| File | Purpose | Update Trigger |
|------|---------|----------------|
| **ADDING_GAME_CATEGORIES.md** | How to add new game categories (extraction workflow) | Category system changes |
| **PRE_DEPLOYMENT_CHECK.md** | Pre-deployment checklist (reference other docs) | Major architectural changes |
| **.github/copilot-instructions.md** | AI agent development guide (patterns, gotchas) | Code patterns or architecture changes |

### Meta Files

| File | Purpose |
|------|---------|
| **README_react.md** | Default Create React App documentation (DO NOT EDIT) |
| **screenshots/README.md** | Screenshot index |

---

## What Goes Where

### Version History → CHANGELOG.md ONLY
- **DO**: Document all changes in CHANGELOG.md with version number and date
- **DON'T**: Duplicate version info in other files
- **Reference**: Other files should link to CHANGELOG.md

### Deployment Instructions → DEPLOYMENT.md ONLY
- **DO**: Keep all Vercel-specific deployment steps here
- **DON'T**: Duplicate deployment instructions in README.md or SUMMARY.md
- **Reference**: Link to DEPLOYMENT.md from other files

### Test Scenarios → TESTING_GUIDE.md ONLY
- **DO**: Document all manual tests and test credentials here
- **DON'T**: Duplicate test procedures elsewhere
- **Exception**: PRE_DEPLOYMENT_CHECK.md can reference tests as checklist items

### Credentials Technical Details → CREDENTIALS_CONFIG.md ONLY
- **DO**: Deep technical explanations of credential flow
- **DON'T**: Duplicate in README.md (keep high-level there)
- **Reference**: Link from README.md and DEPLOYMENT.md

### Quick User Guide → SUMMARY.md ONLY
- **DO**: User-friendly overview for end users
- **DON'T**: Duplicate technical details from README.md
- **Reference**: Link to other docs for details

---

## Update Checklist

### Automatic Update Workflow

**STEP 1: ALWAYS Update CHANGELOG.md First**

```markdown
## Version X.Y.Z - Brief Description (DD Month YYYY)

### [Category]
- What changed and why
- Files modified: list.all, modified.files

### Impact Technique
- Performance/behavior/compatibility impact

---
```

**Version Numbering:**
- **Major (X.0.0)**: Breaking changes, major architecture changes
- **Minor (X.Y.0)**: New features, backward compatible additions
- **Patch (X.Y.Z)**: Bug fixes, documentation updates, minor tweaks

**Categories:** `Nouvelles Fonctionnalités`, `Corrections Critiques`, `Améliorations`, `Documentation`

**STEP 2: Update Conditional Files Based on Change Type**

| If you changed... | Then update... | Why |
|-------------------|----------------|-----|
| **Frontend component** | README.md (architecture section) | Document new component pattern |
| **Backend API** | README.md (API section) + verify sync | Keep API docs current |
| **Serverless function** | Sync with server.mjs + update both | Dev/prod must match |
| **User-facing feature** | SUMMARY.md + TESTING_GUIDE.md | User docs + test scenarios |
| **Code pattern/hook** | .github/copilot-instructions.md | AI agents need to know |
| **Deployment process** | DEPLOYMENT.md | Deployment instructions |
| **Credentials flow** | CREDENTIALS_CONFIG.md | Technical deep-dive |
| **Category system** | ADDING_GAME_CATEGORIES.md | Category workflow |
| **Critical check added** | PRE_DEPLOYMENT_CHECK.md | Add to checklist |
| **File added/removed** | README.md (Structure des Composants) | Keep file tree current |

**STEP 3: Update Version References**

- PRE_DEPLOYMENT_CHECK.md → Update header date and version
- All other files → Verify they link to CHANGELOG.md (no version duplication)

**STEP 4: Verify Synchronization (If Backend Change)**

When modifying `server.mjs` or `api/nexus/*.mjs`, verify these 7 blocks are identical:

```bash
# Quick check - these should match:
grep -A 5 "CATEGORIES_BY_GAME" server.mjs api/nexus/tracked.mjs
grep -A 10 "toEpoch" server.mjs api/nexus/tracked.mjs api/nexus/validate.mjs
grep -A 5 "nexusHeaders" server.mjs api/nexus/*.mjs
```

1. ✅ `CATEGORIES_BY_GAME` constant
2. ✅ `toEpoch()` utility function  
3. ✅ `nexusHeaders(username, apiKey)` helper
4. ✅ `getCategoryName()` function
5. ✅ `withPool()` concurrency helper
6. ✅ `getGameInfo()` game metadata fetcher
7. ✅ Changelog version sorting (semantic)

### Quick Reference Matrix

**For AI Agents: Use this decision tree**

```
Code change made
    ↓
1. Generate CHANGELOG entry
    ↓
2. Determine version bump (major/minor/patch)
    ↓
3. Check change type → update conditional files
    ↓
4. Backend change? → Verify dev/prod sync
    ↓
5. Update PRE_DEPLOYMENT_CHECK.md header
    ↓
6. Verify no version duplication in other files
    ↓
Done ✓
```

---

## Cross-Reference Pattern

### Good Practice ✅
```markdown
## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Vercel deployment instructions.
```

### Bad Practice ❌
```markdown
## Deployment

1. Go to vercel.com
2. Import your repo
3. Configure build settings...
[100 lines of duplicated instructions]
```

---

## Version Consistency

**Current Version:** 3.3.0 (January 21, 2026)

All files should reference this version number consistently:
- CHANGELOG.md - Latest entry at top
- PRE_DEPLOYMENT_CHECK.md - Date + version in header
- Other files - No need to mention version (they link to CHANGELOG.md)

---

## When to Create New Documentation

### Create a New File When:
- Topic is substantial (>100 lines)
- Topic is independent/self-contained
- Multiple people need to reference it separately
- Example: ADDING_GAME_CATEGORIES.md (specific workflow)

### Add to Existing File When:
- Topic is small (<50 lines)
- Topic is tightly coupled with existing content
- Splitting would create more confusion than clarity

---

## File Maintenance

### Regular Reviews (Monthly)
- Check for duplicate information across files
- Verify all links are working
- Update dates where relevant
- Remove outdated information

### After Major Changes
- Update CHANGELOG.md immediately
- Review all affected documentation files
- Update cross-references if file purposes shift
- Verify consistency of terminology

---

## Terminology Standards

Use these terms consistently across all documentation:

- **credentials** (not "API keys", "tokens", "auth")
- **localStorage** (not "local storage", "browser storage")
- **serverless functions** (not "cloud functions", "lambdas")
- **headers** `X-Nexus-Username`/`X-Nexus-ApiKey` (exact format)
- **dev server** for server.mjs, **serverless** for api/nexus/*.mjs

## Style Guidelines

### Professional Tone
- Keep documentation professional and technical
- Remove emojis from all .md files except when necessary for clarity
- Exception: Minimal emojis allowed in user-facing guides (SUMMARY.md, TESTING_GUIDE.md)
- Technical documentation must be emoji-free:
  - CHANGELOG.md
  - DEPLOYMENT.md
  - CREDENTIALS_CONFIG.md
  - PRE_DEPLOYMENT_CHECK.md
  - copilot-instructions.md
  - ADDING_GAME_CATEGORIES.md

### When Emojis Are Acceptable
- Screenshots or UI documentation showing actual emoji usage
- User-facing error messages that include emojis
- Quoting external sources that use emojis

### Writing Style
- Use clear, concise technical language
- Prefer bullet points over long paragraphs
- Use code blocks for examples
- Use tables for structured data
- Bold for emphasis, not emojis

---

## Automation Rules for AI Agents

### Rule 1: Automatic CHANGELOG Updates
**Trigger:** Any code modification
**Action:** Add entry to CHANGELOG.md top with format:
- Version number (calculate from last + change type)
- Date (current date)
- Category (Nouvelles Fonctionnalités/Corrections/Améliorations/Documentation)
- Change description
- Files modified
- Technical impact

### Rule 2: Conditional Documentation Updates
**Trigger:** Specific change types (see matrix above)
**Action:** Update corresponding documentation file(s)
**Verification:** No content duplication between files

### Rule 3: Dev/Prod Synchronization
**Trigger:** Modification of server.mjs or api/nexus/*.mjs
**Action:** Ensure 7 critical blocks are identical
**Verification:** Grep comparison or manual review

### Rule 4: Version Consistency
**Trigger:** New CHANGELOG entry created
**Action:** Update PRE_DEPLOYMENT_CHECK.md header
**Verification:** No version numbers in other files (only links to CHANGELOG)

### Rule 5: Cross-Reference Integrity
**Trigger:** File purpose changes or new file added
**Action:** Update README.md documentation index
**Verification:** All links work, no broken references

## Documentation Maintenance Todos

- [ ] Monthly: Review all .md files for duplications
- [ ] Weekly: Verify CHANGELOG.md has all recent changes
- [ ] After each change: Check cross-references are up-to-date
- [ ] After version bump: Update PRE_DEPLOYMENT_CHECK.md header
- [ ] Quarterly: Remove outdated information
- [ ] Before deploy: Verify dev/prod sync (7 blocks)

---

**For AI Agents:** Follow the automation rules above. Each file has ONE purpose - duplication = error.

**For Humans:** Use the update checklist. CHANGELOG.md is always step 1.
