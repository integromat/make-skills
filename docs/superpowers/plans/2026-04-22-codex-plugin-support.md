# Codex Plugin Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenAI Codex as a third distribution target for `make-skills`, so users can install via `codex plugin marketplace add integromat/make-skills`.

**Architecture:** Add a `.codex-plugin/plugin.json` manifest (Codex's required entry point) alongside the existing `.claude-plugin/plugin.json`, plus a Codex-native marketplace at `.agents/plugins/marketplace.json`. Brand assets live in `assets/`. Skills and `.mcp.json` are already in Codex-compatible locations and need no changes.

**Tech Stack:** JSON manifests, static PNG assets, `commit-and-tag-version` (release versioning), Bash (build script, asset fetch).

**Spec:** `docs/superpowers/specs/2026-04-22-codex-plugin-support-design.md`

---

## Task 1: Fetch Make brand assets

**Files:**
- Create: `assets/icon.png`
- Create: `assets/logo.png`

- [ ] **Step 1: Create assets directory**

```bash
mkdir -p assets
```

- [ ] **Step 2: Download app icon**

```bash
curl -sL -A "Mozilla/5.0" https://www.make.com/apple-touch-icon.png -o assets/icon.png
```

Expected: `assets/icon.png` exists and is roughly 5–10 KB.

- [ ] **Step 3: Download logo**

```bash
curl -sL -A "Mozilla/5.0" "https://images.ctfassets.net/un655fb9wln6/5drzJqeJykwoS5uqQRr4in/6a1e399130f279aee935213d5df437a5/Copy_of_Logo-RGB-Color_2x.png" -o assets/logo.png
```

Expected: `assets/logo.png` exists and is several tens of KB.

- [ ] **Step 4: Verify both are valid PNGs**

```bash
file assets/icon.png assets/logo.png
```

Expected output: both lines say `PNG image data`. If either says `HTML` or `empty`, the download failed — stop and investigate before committing.

- [ ] **Step 5: Commit**

```bash
git add assets/icon.png assets/logo.png
git commit -m "chore: add Make brand assets for Codex plugin listing"
```

---

## Task 2: Add `.codex-plugin/plugin.json` manifest

**Files:**
- Create: `.codex-plugin/plugin.json`

- [ ] **Step 1: Create `.codex-plugin/` directory**

```bash
mkdir -p .codex-plugin
```

- [ ] **Step 2: Write manifest**

Create `.codex-plugin/plugin.json` with this exact content:

```json
{
  "name": "make-skills",
  "version": "0.1.3",
  "description": "Expert skills for designing, building, and deploying Make.com automation scenarios",
  "author": {
    "name": "Make",
    "email": "support@make.com",
    "url": "https://www.make.com"
  },
  "homepage": "https://www.make.com",
  "repository": "https://github.com/integromat/make-skills",
  "license": "MIT",
  "keywords": [
    "make",
    "mcp",
    "automation",
    "scenarios",
    "integration",
    "workflow",
    "blueprint",
    "no-code"
  ],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "interface": {
    "displayName": "Make",
    "shortDescription": "Build Make.com scenarios with expert skills",
    "longDescription": "Three auto-activated skills that guide Make.com scenario design end-to-end: choosing which modules to use and why, configuring each module, and troubleshooting the Make MCP connection. Works together with the hosted Make MCP server to discover apps, configure modules, manage connections and webhooks, and deploy scenarios.",
    "developerName": "Make",
    "category": "Productivity",
    "capabilities": ["Read", "Write"],
    "websiteURL": "https://www.make.com",
    "privacyPolicyURL": "https://www.make.com/en/privacy-notice",
    "termsOfServiceURL": "https://www.make.com/en/terms",
    "defaultPrompt": [
      "Build a Make scenario that sends a Slack message when a new row is added to Google Sheets.",
      "Design a Make scenario that summarizes daily emails and posts the summary to Notion.",
      "Help me configure a Make HTTP module to call my API with OAuth."
    ],
    "brandColor": "#6D00CC",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png"
  }
}
```

Version `0.1.3` must match the current value in `package.json` — check before writing with `node -p "require('./package.json').version"` and use whatever that prints.

- [ ] **Step 3: Verify JSON parses**

```bash
node -e "JSON.parse(require('fs').readFileSync('.codex-plugin/plugin.json', 'utf8'))"
```

Expected: no output, exit 0. Any syntax error here means the manifest is broken.

- [ ] **Step 4: Verify referenced paths exist**

```bash
test -d skills && test -f .mcp.json && test -f assets/icon.png && test -f assets/logo.png && echo OK
```

Expected: `OK`. If missing any, the manifest references a non-existent file — Codex will error on install.

- [ ] **Step 5: Commit**

```bash
git add .codex-plugin/plugin.json
git commit -m "feat: add Codex plugin manifest"
```

---

## Task 3: Add `.agents/plugins/marketplace.json` marketplace

**Files:**
- Create: `.agents/plugins/marketplace.json`

- [ ] **Step 1: Create directory**

```bash
mkdir -p .agents/plugins
```

- [ ] **Step 2: Write marketplace file**

Create `.agents/plugins/marketplace.json` with this exact content:

```json
{
  "name": "make-marketplace",
  "interface": {
    "displayName": "Make"
  },
  "plugins": [
    {
      "name": "make-skills",
      "source": {
        "source": "local",
        "path": "./"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

Note: `source.path: "./"` points at the repo root (marketplace root), **not** at `.agents/plugins/`. Codex resolves `source.path` relative to the marketplace root directory — in this layout that's the repo root, because `.agents/plugins/` is where the marketplace file sits but the marketplace root is the directory containing the `.agents/` folder.

- [ ] **Step 3: Verify JSON parses**

```bash
node -e "JSON.parse(require('fs').readFileSync('.agents/plugins/marketplace.json', 'utf8'))"
```

Expected: no output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add .agents/plugins/marketplace.json
git commit -m "feat: add Codex-native marketplace for make-skills"
```

---

## Task 4: Wire `.codex-plugin/plugin.json` into version bumping

**Files:**
- Modify: `.versionrc.json` (add one entry to `bumpFiles`)

- [ ] **Step 1: Read current `.versionrc.json`**

```bash
cat .versionrc.json
```

Expected current content:

```json
{
  "bumpFiles": [
    { "filename": "package.json", "type": "json" },
    { "filename": "package-lock.json", "type": "json" },
    { "filename": ".claude-plugin/plugin.json", "type": "json" },
    { "filename": ".claude-plugin/marketplace.json", "updater": "scripts/marketplace-version.js" },
    { "filename": "skills/make-scenario-building/SKILL.md", "updater": "scripts/skill-version.js" },
    { "filename": "skills/make-module-configuring/SKILL.md", "updater": "scripts/skill-version.js" },
    { "filename": "skills/make-mcp-reference/SKILL.md", "updater": "scripts/skill-version.js" }
  ],
  "packageFiles": [
    { "filename": "package.json", "type": "json" }
  ]
}
```

- [ ] **Step 2: Add Codex plugin manifest entry**

Edit `.versionrc.json` so `bumpFiles` includes `.codex-plugin/plugin.json` right after the `.claude-plugin/plugin.json` entry. Final file:

```json
{
  "bumpFiles": [
    { "filename": "package.json", "type": "json" },
    { "filename": "package-lock.json", "type": "json" },
    { "filename": ".claude-plugin/plugin.json", "type": "json" },
    { "filename": ".codex-plugin/plugin.json", "type": "json" },
    { "filename": ".claude-plugin/marketplace.json", "updater": "scripts/marketplace-version.js" },
    { "filename": "skills/make-scenario-building/SKILL.md", "updater": "scripts/skill-version.js" },
    { "filename": "skills/make-module-configuring/SKILL.md", "updater": "scripts/skill-version.js" },
    { "filename": "skills/make-mcp-reference/SKILL.md", "updater": "scripts/skill-version.js" }
  ],
  "packageFiles": [
    { "filename": "package.json", "type": "json" }
  ]
}
```

- [ ] **Step 3: Verify JSON parses**

```bash
node -e "JSON.parse(require('fs').readFileSync('.versionrc.json', 'utf8'))"
```

Expected: no output, exit 0.

- [ ] **Step 4: Dry-run a version bump to confirm `commit-and-tag-version` picks up the new file**

```bash
npx commit-and-tag-version --dry-run --release-as patch 2>&1 | grep -E "(bumping|plugin.json)"
```

Expected: output includes a line mentioning `.codex-plugin/plugin.json` alongside the other bumped files. If it does not appear, the filename path in `.versionrc.json` is wrong.

- [ ] **Step 5: Commit**

```bash
git add .versionrc.json
git commit -m "chore: bump Codex plugin manifest version with release"
```

---

## Task 5: Add Codex install section to README

**Files:**
- Modify: `README.md` (insert a new section under the Installation heading)

- [ ] **Step 1: Locate the insertion point**

The README has these install sub-sections under `## Installation`:

1. Any Agent (via Open Agent Skills) — lines ~20–26
2. Claude Code Plugin (Marketplace) — lines ~28–34
3. Claude Code Plugin (Manual) — lines ~36–42
4. Claude Desktop / Claude.ai — lines ~44–54
5. Manual Installation (Any Agent) — lines ~56–66

Insert the Codex section **between "Any Agent" and "Claude Code Plugin (Marketplace)"** — Codex is a marketplace install like Claude Code, and keeping marketplace-style installs grouped reads better.

- [ ] **Step 2: Insert the Codex section**

Add this block immediately before the `### Claude Code Plugin (Marketplace)` heading:

```markdown
### Codex

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make-skills`.

```

Note: the inner triple-backticks need to stay intact — do not collapse or escape them. The block is one ` ### Codex ` heading, one fenced `bash` code block with the install command, and one line of explanatory prose, followed by a blank line.

- [ ] **Step 3: Verify markdown structure**

```bash
grep -n "^### " README.md
```

Expected: a new `### Codex` line appears between `### Any Agent (via Open Agent Skills)` and `### Claude Code Plugin (Marketplace)`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add Codex install instructions to README"
```

---

## Task 6: Smoke-test local Codex install

This task verifies the plugin actually loads in Codex before we tag a release. Requires Codex CLI installed locally.

**Files:** none modified.

- [ ] **Step 1: Check Codex is installed**

```bash
codex --version
```

Expected: version string. If Codex is not installed, skip this task and record it as a manual verification step for the release — do not block on it.

- [ ] **Step 2: Add the local repo as a marketplace**

```bash
codex plugin marketplace add "$(pwd)"
```

Expected: Codex reports the `make-marketplace` was added. If it fails with "no marketplace file found", verify `.agents/plugins/marketplace.json` exists and is valid JSON.

- [ ] **Step 3: Verify the plugin appears in the directory**

Open Codex, navigate to the plugin directory, select the **Make** marketplace, and confirm:

- The listing shows `Make` as display name.
- The logo renders.
- The brand color is applied (purple accent).
- The short description reads "Build Make.com scenarios with expert skills".

If the logo does not render, verify the path in `.codex-plugin/plugin.json` starts with `./` and the file exists at `assets/logo.png`.

- [ ] **Step 4: Install the plugin and trigger MCP auth**

Install `make-skills`. On install, Codex should prompt for Make OAuth (per `authentication: ON_INSTALL`). Complete the flow and confirm one of the skills activates when asked a Make-related question such as "Help me plan a Make scenario that posts to Slack."

- [ ] **Step 5: Clean up the local test marketplace**

```bash
codex plugin marketplace remove make-marketplace
```

- [ ] **Step 6: No commit — this is verification only**

If anything in steps 3–4 failed, go back to the relevant earlier task (manifest, marketplace, or assets) and fix, then re-run this task.

---

## Task 7: Release a new patch version

**Files:**
- Modify: version in `package.json`, `package-lock.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.claude-plugin/marketplace.json`, all three `SKILL.md` files (all automated by `commit-and-tag-version`).
- Generates: `CHANGELOG.md` entry.
- Generates: `dist/*.zip` artifacts via `build.sh`.

- [ ] **Step 1: Confirm working tree is clean**

```bash
git status
```

Expected: `nothing to commit, working tree clean`. If not, stash or commit outstanding work first.

- [ ] **Step 2: Run release**

```bash
npm run release
```

Expected:
- Version bumps from `0.1.3` to `0.1.4` (or the next appropriate patch).
- `CHANGELOG.md` updated.
- `commit-and-tag-version` creates a release commit and tag.
- `build.sh` runs and produces versioned zips in `dist/`.

- [ ] **Step 3: Verify `.codex-plugin/plugin.json` was bumped**

```bash
node -p "require('./.codex-plugin/plugin.json').version"
```

Expected: matches `node -p "require('./package.json').version"`.

- [ ] **Step 4: Verify the bundle zip contains the new Codex files**

```bash
unzip -l dist/make-skills.zip | grep -E "(codex-plugin|agents/plugins|assets/)"
```

Expected: all three paths appear in the listing. If `.codex-plugin/plugin.json` is missing, `build.sh` is excluding it — fix `build.sh` to include the directory.

- [ ] **Step 5: Push and publish**

```bash
git push --follow-tags origin main
VERSION=$(node -p "require('./package.json').version")
gh release create "v${VERSION}" dist/*-v${VERSION}.zip --generate-notes
```

Expected: GitHub release created, tag pushed, zips attached.

- [ ] **Step 6: Confirm install works from the published repo**

From a temporary directory (not the repo):

```bash
cd /tmp
codex plugin marketplace add integromat/make-skills
```

Expected: Codex clones the repo, finds `.agents/plugins/marketplace.json`, and exposes the `make-skills` plugin. If it fails, the published repo is missing one of the new files — investigate which and re-release.

---

## Done

Plan is complete when all seven tasks are checked off and a user running `codex plugin marketplace add integromat/make-skills` in a fresh Codex install sees the Make plugin available, installable, and usable.
