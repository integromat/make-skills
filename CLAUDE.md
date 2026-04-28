# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**make-skills** provides expert skills for designing, building, and deploying Make.com automation scenarios. Distributed as both a Claude Code plugin and as Open Agent Skills (compatible with 40+ AI agents via `npx skills add integromat/make-skills`). Published by Make under MIT license.

The skills connect to the remote Make MCP server:

- **`make`** — Make.com's hosted MCP server at `https://mcp.make.com`. Provides tools for app discovery, module configuration, connections, webhooks, data stores, and scenario lifecycle. Authenticated via OAuth (default) or MCP token.

## Repository Structure

```
.claude-plugin/
  marketplace.json         # Claude Code marketplace registry (points at plugins/make-skills)
.agents/plugins/
  marketplace.json         # OpenAI Codex marketplace registry
plugins/
  make-skills/             # The plugin
    .claude-plugin/
      plugin.json          # Claude Code plugin manifest
    .codex-plugin/
      plugin.json          # Codex plugin manifest (with interface block)
    .mcp.json              # MCP server configuration (remote Make server)
    assets/                # icon.png, logo.png
    skills/
      make-mcp-reference/      # MCP config & troubleshooting (1 reference file)
        SKILL.md
        references/transport-details.md
      make-module-configuring/  # Module configuration workflow (11 reference files)
        SKILL.md
        general-principles.md, connections.md, mapping.md, webhooks.md,
        data-stores.md, data-structures.md, keys.md, filtering.md,
        iml-expressions.md, aggregators.md, ai-agents.md
      make-scenario-building/   # Scenario design methodology (18 reference files)
        SKILL.md
        blueprint-construction.md, connections.md, webhooks.md,
        scheduling-and-triggers.md, routing.md, branching.md, merging.md,
        filtering.md, iterations.md, aggregations.md, mapping.md,
        error-handling.md, data-stores.md, subscenarios.md, bundles.md,
        ai-agents.md, quick-patterns.md, CONTRIBUTING.md
```

## Skills

Three auto-activated skills guide scenario building end-to-end. They divide responsibilities:

- **make-scenario-building** decides WHICH modules to use and WHY (scenario architecture)
- **make-module-configuring** handles HOW to configure each module (parameters, connections, mapping)
- **make-mcp-reference** covers MCP infrastructure (connection methods, scopes, troubleshooting)

### make-mcp-reference

MCP server configuration, OAuth vs token auth, scopes, troubleshooting connection issues. Activated when users ask about MCP setup, tokens, OAuth, or connection errors.

Reference: `references/transport-details.md`

### make-module-configuring

5-phase module configuration workflow: read interface (`app-module_get`), resolve RPCs, fill parameters, validate (`validate_module_configuration`), get app docs. Covers connections, mapping, webhooks, data stores, data structures, keys, filtering, IML expressions, and aggregators.

References: 11 files (general-principles, connections, mapping, webhooks, data-stores, data-structures, keys, filtering, iml-expressions, aggregators, ai-agents)

### make-scenario-building

Scenario design methodology: understand business need, discover apps/modules, select module composition, construct blueprint, deploy. Covers blueprint construction, routing, branching, merging, filtering, iterations, aggregations, error handling, scheduling, webhooks, data stores, subscenarios, bundles, AI agents, and provider disambiguation.

References: 18 files (see repository structure above)

## Key MCP Tools

### Remote Make server (`make`)

**Discovery:**
- `apps_recommend` — Find relevant Make apps for a use case (one app per call)
- `app_modules_list` — List modules for an app (triggers, actions, searches)
- `app_documentation_get` — Get detailed app documentation

**Module configuration:**
- `app-module_get` — Get module interface/schema (use `outputFormat: "instructions"`)
- `rpc_execute` — Resolve dynamic field options (dropdowns, resource lists)
- `validate_module_configuration` — Validate module config before committing

**Connections & keys:**
- `connections_list` — List existing connections (filter by `accountName`, not app name)
- `credential_requests_create` — Start OAuth flow for new connection
- `credential_requests_get` — Poll for credential request completion
- `keys_list` — List API keys

**Components:**
- `hooks_create` / `hooks_list` — Create and list webhooks
- `data-structures_create` / `data-structures_list` — Create and list data structures
- `data-stores_create` / `data-stores_list` — Create and list data stores

**Lifecycle:**
- `scenarios_create` — Create a scenario from a blueprint
- `scenario_scheduling_update` — Configure scenario scheduling

## Important Patterns

**App discovery chain:**
`apps_recommend` -> `app_modules_list` -> `app_documentation_get`

**Module config chain:**
`app-module_get` (instructions format) -> `rpc_execute` (resolve dynamic fields) -> `validate_module_configuration`

**Component creation order:**
data structures -> webhooks -> connections -> keys -> data stores (dependencies flow left to right)

**Credential flow:**
`credential_requests_create` (returns auth URL) -> user completes auth -> poll `credential_requests_get` -> get connection ID

**Blueprint flow:**
Construct blueprint JSON -> `validate_blueprint_schema` -> `scenarios_create`

**Router vs If-Else decision:**
- **If-Else + Merge**: Mutually exclusive branches that converge. Use when only one branch should fire per bundle and downstream modules are shared (e.g., "if slack, send Slack; else send WhatsApp; then update the row").
- **Router**: Multiple routes can fire, cannot merge back. Use when branches are independent endpoints or multiple can be true simultaneously.

**Connection type gotcha:**
`connections_list` type filter uses `accountName`, not the Make app name. Google Sheets, Calendar, and Drive all use `accountName: "google"`. Slack uses `"slack2"`, Notion uses `"notion2"` or `"notion3"`. Best practice: list without filter, then match by `accountName`.

**Scenario URL format:**
`https://<zone>.make.com/<teamId>/scenarios/<scenarioId>` (uses team ID, not organization ID)

## Working with This Repository

### Adding a new skill

1. Create `plugins/make-skills/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`)
2. Add reference files in the same directory (no `references/` subdirectory required, but supported)
3. Skill descriptions must use third person ("This skill should be used when...")
4. Skill body should avoid second person ("you should/need/must/can")
5. Target 500-5000 words
6. Add optional Open Agent Skills frontmatter: `license`, `compatibility`, `metadata` (with `author`, `version`, `homepage`, `repository`)
7. Register the new skill path in `package.json` (`agents.skills`), `.versionrc.json` (`bumpFiles`), and `build.sh` (`SKILLS` array)

### Modifying MCP configuration

Edit `plugins/make-skills/.mcp.json`. The `make` server uses HTTP transport to Make's hosted endpoint at `https://mcp.make.com`.

### Releasing a new version

1. Run `npm run release` — bumps version in `package.json`, `plugin.json`, `marketplace.json`, and all `skills/*/SKILL.md` frontmatter, then runs `build.sh`
2. Publish versioned artifacts: `gh release create v${VERSION} dist/*-v${VERSION}.zip`

## Key Conventions

- All file paths in scripts must use `${CLAUDE_PLUGIN_ROOT}` — never hardcode absolute paths.
- No secrets (API keys, tokens) in committed files.
- OAuth is the default auth; MCP token auth is for granular team/scenario filtering.
