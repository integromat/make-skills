# Codex Plugin Support — Design

**Date:** 2026-04-22
**Status:** Approved for implementation

## Goal

Add OpenAI Codex as a third distribution target for `make-skills`, alongside the existing Claude Code plugin and Open Agent Skills (`npx skills add`) channels. Users install via `codex plugin marketplace add integromat/make-skills`.

## Non-goals

- No changes to existing skills' content.
- No changes to `.mcp.json` — the same HTTP endpoint works for Codex.
- No changes to the Claude Code plugin — it stays fully functional.
- No publication to Codex's official Plugin Directory (not yet available per Codex docs).
- No `$plugin-creator` scaffolding — files are authored manually.

## File layout

Three new paths added to the repo; everything else stays as-is.

```
.codex-plugin/
  plugin.json              # Codex plugin manifest (rich, with interface{})
.agents/plugins/
  marketplace.json         # Codex-native marketplace, points to repo root
assets/
  icon.png                 # from https://www.make.com/apple-touch-icon.png
  logo.png                 # from the Contentful-hosted Make logo PNG
```

Unchanged files that Codex consumes in place:

- `.mcp.json` — Codex loads MCP config from the plugin root.
- `skills/**/SKILL.md` — Codex uses the same skill layout as Claude Code.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — kept for Claude Code.

Both `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` coexist. Codex can read both; the `.agents/plugins/` one is the Codex-native form and the one we install under.

## `.codex-plugin/plugin.json`

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
  "keywords": ["make", "mcp", "automation", "scenarios", "integration", "workflow", "blueprint", "no-code"],
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

Version is kept in lockstep with the existing `.claude-plugin/plugin.json` via the release script (see below).

## `.agents/plugins/marketplace.json`

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

`source.path: "./"` resolves from the marketplace root (`.agents/plugins/`) back to the repo root, where `.codex-plugin/plugin.json` lives. This matches Codex's rule that `source.path` is relative to the marketplace root, not the `.agents/plugins/` folder.

`authentication: ON_INSTALL` aligns with the existing Make OAuth flow.

## Assets

Fetched once during implementation and committed to the repo:

- `assets/icon.png` ← `https://www.make.com/apple-touch-icon.png` (PNG, ~6 KB)
- `assets/logo.png` ← `https://images.ctfassets.net/un655fb9wln6/5drzJqeJykwoS5uqQRr4in/6a1e399130f279aee935213d5df437a5/Copy_of_Logo-RGB-Color_2x.png`

## Release script change

The existing `npm run release` bumps version in: `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and all `skills/*/SKILL.md`.

Add `.codex-plugin/plugin.json` to the same version-bump list. `.agents/plugins/marketplace.json` has no per-plugin version field and does not need updating.

## Build and distribution

`build.sh` requires no changes. The main bundle zip already copies the plugin root, and will pick up `.codex-plugin/`, `.agents/`, and `assets/` automatically. Per-skill zips are unaffected since they do not ship plugin manifests.

## README update

Add a Codex install section alongside the existing Claude Code and Open Agent Skills sections:

```markdown
### Codex

    codex plugin marketplace add integromat/make-skills

Then open the plugin directory, select the Make marketplace, and install make-skills.
```

## Open items (deferred, not blocking)

- **Brand color `#6D00CC`** is a best-guess placeholder for Make purple. If the official hex differs, update `interface.brandColor` in `.codex-plugin/plugin.json` before release.
- **Privacy / ToS URLs** (`/en/privacy-notice`, `/en/terms`) were confirmed by the user but should be sanity-checked during implementation; if the canonical URLs differ, update the manifest.

## Implementation order

1. Download assets → `assets/icon.png`, `assets/logo.png`.
2. Write `.codex-plugin/plugin.json`.
3. Write `.agents/plugins/marketplace.json`.
4. Extend the release script to bump `.codex-plugin/plugin.json` version.
5. Add Codex install section to `README.md`.
6. Smoke-test locally: `codex plugin marketplace add ./` (or the repo path) and verify the plugin appears with logo, brand color, and description.
7. Commit, push, cut a new patch release.
