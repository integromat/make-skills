# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**make-skills** provides expert skills for building, explaining, running and debugging Make automation scenarios. Distributed as both a Claude Code plugin and as Open Agent Skills (compatible with 40+ AI agents via `npx skills add integromat/make-skills`). Published by Make under MIT license.

The skills connect to the remote Make MCP server:

- **`make`** — Make's scenario-management MCP server (platform endpoints: `https://mcp.make.com/claude`, `/cursor`, `/openai`). Tools are named `{subject}_{action}` (`environment_get`, `scenario_get`, `module_spec`, …) and the surface is gated by one all-or-nothing scope bundle. Authenticated via OAuth.

## Repository Structure

```
.claude-plugin/
  marketplace.json         # Claude Code marketplace manifest (repo root)
.cursor-plugin/
  marketplace.json         # Cursor Team Marketplace manifest (repo root)
plugins/
  make-skills-claude/      # Claude Code plugin (.claude-plugin/, .mcp.json)
  make-skills-cursor/      # Cursor plugin (.cursor-plugin/, mcp.json)
  make-skills-codex/       # OpenAI Codex plugin (.codex-plugin/, .mcp.json)
skills/
  make-scenario-reference/   # Shared conventions — load first
    SKILL.md
  make-scenario-explore/     # Orienting, listing, explaining, health checks
    SKILL.md
  make-scenario-building/    # Creating and editing scenarios
    SKILL.md
    references/              # mapping, iml-functions, flow-control, error-handling,
                             # subscenarios, ai-agents, app-gotchas
    examples/                # complete scenario_create calls per pattern
  make-scenario-operations/  # Running, activating, debugging runs and webhooks
    SKILL.md
  make-api-shell/            # Reusable API-call / HTTP shell as a retrieval transport
    SKILL.md
    references/http-fallback.md
    examples/
```

## Skills

Five auto-activated skills, split by use case:

- **make-scenario-reference** — what every tool assumes: scopes, `content` remarks are instructions, the structure-vs-configuration split, one call = one save, the refusal contract, "state a guess before acting on it". Loaded on a 403, an unexplained refusal, or a request no tool covers; the three or four rules a routine task needs are inlined as a "Ground rules" block in each task skill instead.
- **make-scenario-explore** — `environment_get` → `scenario_list` → `scenario_get` → `scenario_module_get`, and how to read the structural fields for a non-technical user.
- **make-scenario-building** — the build and edit workflows (`app_find` → `module_spec` → connections → `module_field_resolve` → `scenario_create` / `scenario_patch`), the decisions the tools leave to the model, and on-demand references for everything past a straight line.
- **make-scenario-operations** — `scenario_run` by trigger kind, activation, the execution list → get → inspect → module-get chain, webhook learning and inspection.
- **make-api-shell** — a three-module on-demand scenario (`StartSubscenario` → *Make an API Call* → `ReturnData`) or its `http:MakeRequest` fallback, built once per provider and connection and run through `scenario_run`.

## Writing skills for this surface

- **Less is more.** The MCP server performs well with no skill loaded; a skill nudges and sequences. Tool-specific facts (what a field means, which values it takes) belong in the tool's own description or schema in the server repo, not here — a skill should not repeat what `tools/list` already says.
- **SKILL.md is workflows.** Numbered steps and the decisions the tools cannot make. Concepts go in `references/`, complete calls in `examples/`.
- **Say when to load a reference.** Each reference link states the trigger that makes it worth reading, so an agent does not load error-handling guidance for a notification scenario.
- **Only what the surface can do.** Do not port guidance for capabilities the `/v2` server does not implement (data stores, custom IML functions, data structures, DLQ retry).
- Skill descriptions use third person; the body avoids second person; target 500–5000 words per SKILL.md.

## Working with This Repository

### Adding a new skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`, `metadata.version` with the `# x-release-please-version` annotation).
2. Add reference files under `references/` and examples under `examples/`.
3. Add the skill to `skills.publish.json` and to `package.json` `agents.skills[]` (`npm run check:skills` fails otherwise).

### Modifying MCP configuration

Edit each plugin's MCP config under `plugins/` — Claude: `make-skills-claude/.mcp.json` (`https://mcp.make.com/claude`), Cursor: `make-skills-cursor/mcp.json` (`/cursor`), Codex: `make-skills-codex/.mcp.json` (`/openai`).

### Branching & releasing (trunk-based)

`main` is the GitHub default branch, the trunk, and the working branch — all PRs land there directly. A separate **`latest`** branch is fast-forwarded to each released tag and stays reserved for that — don't push to it directly.

The Claude Code plugin marketplace pins plugin *content* to the **`v2`** branch (`.claude-plugin/marketplace.json`'s `source: { source: "git-subdir", url: "integromat/make-skills", path: "plugins/make-skills-claude", ref: "v2" }`). Switch `ref` to `latest` after release if you want marketplace installs to track released tags only. The Codex plugin dir and `npx skills add` via the bare `owner/repo` shorthand still resolve `main` HEAD directly, so they can pick up reviewed-but-unreleased commits between releases — an accepted gap for those two channels.

- **Work:** open PRs against **`main`**, squash merge. PR titles are linted as Conventional Commits by the org `validate-pr.yml` (mono-generated), which release-please relies on.
- **Release cut:** release-please runs on `main` (org-managed `.github/workflows/release-please.yml`, generated from mono `libs/github-resources/src/repositories/make-skills.ts` via stock `releasePleaseWorkflow: true`). It opens/updates a **Release PR** that bumps the version across `package.json`, `package-lock.json`, the Claude, Cursor, and Codex plugin manifests, `marketplace.json`, and each published `skills/*/SKILL.md` frontmatter (via the `# x-release-please-version` annotation), and regenerates `CHANGELOG.md`.
- **Promote:** merge the Release PR. release-please (authenticating as a GitHub App) creates the tag + GitHub Release, which fires `.github/workflows/build-release-assets.yml`. That workflow, in order: (1) `build.sh` → uploads zips as Release assets, (2) deploys GitHub Pages from the tag, (3) **fast-forwards `latest` to the tag** (App token; creates the branch on the first release).

The version-bump targets beyond `package.json` live in `actions-toolkit.config.mjs` (`releasePlease.extraFiles`). Stable-alias zips (`dist/<name>.zip`) are committed so raw download links work before the first release; versioned zips are built ad-hoc in CI and attached to the Release. Download links resolve via `https://github.com/integromat/make-skills/releases/latest/download/<name>.zip` (a GitHub Release API alias, unrelated to the `latest` git branch).

Which skills ship is controlled by `skills.publish.json` (single source of truth) — both `build.sh` (zips + bundle) and `actions-toolkit.config.mjs` (SKILL.md bump targets) derive from it. `skills.internal.json` holds skills back. `scripts/check-skill-manifests.mjs` (run in CI via `manifest-check.yml`) fails if a skill folder is left unclassified or `package.json` `agents.skills[]` drifts from the publish list.

## Key Conventions

- All file paths in scripts must use `${CLAUDE_PLUGIN_ROOT}` — never hardcode absolute paths.
- No secrets (API keys, tokens) in committed files. Example JSON uses placeholder ids only.
- OAuth is the only auth on the `/v2` server.
