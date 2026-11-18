# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**make-skills** provides expert skills for building, explaining, running and debugging Make automation scenarios, Functions v2 authoring and execution, plus direct app Endpoint workflows. Installed by copying the skill folders into an agent's skills directory or by uploading the per-skill zips. Scenario and Functions v2 skills use the Make MCP server; the standalone Endpoints skill uses the Endpoints SDK/CLI. Published by Make under MIT license.
For Make app development, use [Make Apps Skill](https://github.com/integromat/make-apps-skill).

The scenario and Functions v2 skills connect to the remote Make MCP server:

- **`make`** — Make's curated MCP server (platform endpoints: `https://mcp.make.com/claude`, `/cursor`, `/openai`). Tools are named `{subject}_{action}` (`environment_get`, `scenario_get`, `module_spec`, …) with category-based authorization; the Functions v2 tools are enabled per team. Authenticated via OAuth.

**`make-endpoints`** is a separate interface: `@makehq/endpoints-sdk` contains its SDK, `make-endpoints-cli`, and `EndpointTools`. It uses Make API credentials, explicit team/connection scope, and requires Endpoints beta access. Do not apply the scenario MCP server's OAuth-bundle or capped-list rules to SDK/CLI calls. Skills/plugins do not install the package or enable the beta.

## Repository Structure

```
.claude-plugin/
  marketplace.json         # Claude Code marketplace manifest (repo root)
.cursor-plugin/
  marketplace.json         # Cursor Team Marketplace manifest (repo root)
plugins/                   # one folder per client; skills/ + assets/ in each are generated copies
  make-skills-claude/      # Claude Code / Claude.ai plugin (.claude-plugin/, .mcp.json)
  make-skills-codex/       # ChatGPT / Codex plugin (.codex-plugin/, .mcp.json)
  make-skills-cursor/      # Cursor plugin (.cursor-plugin/, mcp.json)
  make-skills-openclaw/    # OpenClaw native plugin (openclaw.plugin.json, package.json)
  make-skills-devin/       # Devin plugin (.devin-plugin/, inline mcpServers)
  make-skills-copilot/     # GitHub Copilot CLI plugin (plugin.json, .mcp.json)
  make-skills-grok/        # Grok Build plugin (.grok-plugin/, .mcp.json)
assets/                    # SOURCE OF TRUTH for plugin icons
skills/                    # SOURCE OF TRUTH — edit skills here only (npx skills add, build.sh, zips)
  make-scenario-reference/   # Shared conventions — load first
    SKILL.md
  make-scenario-explore/     # Orienting, listing, explaining, health checks
    SKILL.md
  make-scenario-building/    # Creating and editing scenarios
    SKILL.md
    references/              # mapping, iml-functions, flow-control, error-handling,
                             # subscenarios, ai-agents, app-gotchas, data-stores
    examples/                # complete scenario_create calls per pattern
  make-scenario-operations/  # Running, activating, debugging runs and webhooks
    SKILL.md
  make-functions-v2/         # Curated MCP authoring, execution and recovery
    SKILL.md
    references/ examples/
  make-endpoints/            # Direct app actions through the standalone SDK/CLI
    SKILL.md
    references/ examples/   # Setup, discovery, reliable reads/writes, complete starters
```

## Skills

Four scenario skills, one Functions v2 skill and one standalone Endpoints skill, split by use case:

- **make-scenario-reference** — what every tool assumes: scopes, `content` remarks are instructions, the structure-vs-configuration split, one call = one save, the refusal contract, "state a guess before acting on it". Loaded on a 403, an unexplained refusal, or a request no tool covers; the three or four rules a routine task needs are inlined as a "Ground rules" block in each task skill instead.
- **make-scenario-explore** — `environment_get` → `scenario_list` → `scenario_get` → `scenario_module_get`, and how to read the structural fields for a non-technical user.
- **make-scenario-building** — the build and edit workflows (`app_find` → `module_spec` → connections → `module_field_resolve` → `scenario_create` / `scenario_patch`), the decisions the tools leave to the model, and on-demand references for everything past a straight line.
- **make-scenario-operations** — `scenario_run` by trigger kind, activation, the execution list → get → inspect → module-get chain, webhook learning and inspection.
- **make-endpoints** — app-action discovery, compatible managed connections, SDK/CLI execution, complete pagination, approval-bound writes and readback. Not scenario building or custom-app Endpoint authoring.

- **make-functions-v2** — Functions v2 authoring, Endpoint discovery, inline testing, publication, execution and recovery through curated `function_*` tools on the same connection. Separate from legacy IML custom functions; no scenario-reference dependency.

## Writing skills for this surface

- **Less is more.** The MCP server performs well with no skill loaded; a skill nudges and sequences. Tool-specific facts (what a field means, which values it takes) belong in the tool's own description or schema in the server repo, not here — a skill should not repeat what `tools/list` already says.
- **SKILL.md is workflows.** Numbered steps and the decisions the tools cannot make. Concepts go in `references/`, complete calls in `examples/`.
- **Say when to load a reference.** Each reference link states the trigger that makes it worth reading, so an agent does not load error-handling guidance for a notification scenario.
- **Only what the selected surface can do.** Scenario guidance must match the current MCP tool contracts; unsupported custom IML functions or DLQ retry are not implied by related reads. Endpoints guidance must match the published SDK/CLI and distinguish bundled metadata from live team availability. Do not promise future interface centralisation or discovery features.
- Skill descriptions use third person; the body avoids second person. Size budget, enforced in CI by `scripts/check-skill-content.mjs` (`npm run check:content`): SKILL.md ≤ 10,000 chars and ≤ 1,200 words, each other `.md` ≤ 2,000 words, a whole skill ≤ 10,000 words and ≤ 40 files. The same check fails on broken relative links, references SKILL.md never links, frontmatter `name` ≠ folder, and credentials or internal Make hosts; it warns on pinned package versions.

## Working with This Repository

### Adding a new skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`), per the [Agent Skills spec](https://agentskills.io/specification).
2. Add reference files under `references/` and examples under `examples/`.
3. Run `node scripts/sync-plugins.mjs`.
4. Add the skill to `skills.json` (`publish`, and `mcp` when it needs the Make MCP server) and, if published, to `package.json` `agents.skills[]` (`npm run check:skills` fails otherwise).

### Modifying MCP configuration

Edit each plugin's MCP config under `plugins/` — Claude: `make-skills-claude/.mcp.json` (`https://mcp.make.com/claude`), Cursor: `make-skills-cursor/mcp.json` (`/cursor`), Codex: `make-skills-codex/.mcp.json` (`/openai`), Devin: `make-skills-devin/.devin-plugin/plugin.json` (`/v2`), Copilot: `make-skills-copilot/.mcp.json` (`/copilot`), Grok: `make-skills-grok/.mcp.json` (`/v2`), OpenClaw: `make-skills-openclaw/openclaw.plugin.json` (`/v2`).

### Branching, versioning & releasing

Everything lives on `main` (the default branch): PRs squash-merge there and every client installs from it. There are no release branches.

**Edit skills only in the root `skills/` (and `assets/`)**, then run `node scripts/sync-plugins.mjs`. It writes real copies into every `plugins/*/` folder, because Codex drops symlinks on install and every client rejects skill paths outside the plugin folder. CI runs it with `--check`; the copies are marked `linguist-generated` so PR diffs collapse them.

The install paths published on [skills.make.com](https://skills.make.com/) are a public contract — keep them working: marketplace `integromat/make-skills` with plugin `make-skills@make-marketplace` (Claude Code, Claude.ai/Desktop), `copilot plugin install integromat/make-skills:plugins/make-skills-copilot`, the Cursor Marketplace listing, the ChatGPT/Codex plugin, `npx skills add integromat/make-skills` (root `skills/`), the `raw.githubusercontent.com/integromat/make-skills/main/dist/*.zip` links, and MCP Registry `com.make/mcp-server`.

**One version** covers the repo: `package.json` is the source, and `scripts/version.mjs` writes it into `package-lock.json`, `server.json`, `.claude-plugin/marketplace.json`, and every plugin manifest that has a version field (Devin's has none). Skills carry no version: `npx skills add` detects updates from a content hash, so a version line would mark every skill as changed on each release. CI fails on drift (`npm run check:version`). To cut a version:

1. `npm version <major|minor|patch|x.y.z>` — `.npmrc` disables the git commit/tag; the `version` hook syncs every target and rebuilds `dist/`.
2. Update `CHANGELOG.md`, open a `chore: release x.y.z` PR, squash-merge.
3. A maintainer creates the GitHub Release `vx.y.z` on that commit.

Merging the bump already ships to clients that compare manifest versions (Claude, Codex, Cursor); clients that follow `main` HEAD (Copilot, `npx skills add`, raw zips) pick up every merged commit — an accepted gap.

**Publishing outside GitHub is manual:**

- **OpenClaw** ships through [ClawHub](https://clawhub.ai/make/plugins/openclaw-make) as `clawhub:@make/openclaw-make`, uploaded via ClawHub's web UI from `plugins/make-skills-openclaw`. It is not published to npm; the `@make` namespace is Make's ClawHub namespace.
- **MCP Registry:** `server.json` (`com.make/mcp-server`) is published with `mcp-publisher` under the DNS-verified `com.make` namespace. Registry versions are immutable, so each publish needs a version not yet published.
- **Claude, OpenAI and Cursor directories** review their listings separately.

Which skills ship, and where, is controlled by `skills.json` (single source of truth). Each skill sets two flags: `publish` (shipped through the plugins, release zips and `npx skills add`; `false` holds it back) and `mcp` (needs the Make MCP server, which also serves it to MCP clients; requires `publish`). `build.sh` (zips + bundle) takes the published skills from it; Make's MCP server bundles the `mcp` ones and serves them to MCP clients. `scripts/check-skill-manifests.mjs` (run in CI via `manifest-check.yml`) fails if a skill folder is not listed, a flag is missing, or `package.json` `agents.skills[]` drifts from the published skills.

## Key Conventions

- All file paths in scripts must use `${CLAUDE_PLUGIN_ROOT}` — never hardcode absolute paths.
- No secrets (API keys, tokens) in committed files. Example JSON uses placeholder ids only.
- OAuth is the only auth on the scenario `/v2` server; the standalone Endpoints SDK/CLI uses its own documented credential flow.
