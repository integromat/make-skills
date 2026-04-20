# Dual CLI/MCP Interface Support — Design Spec

**Date:** 2026-04-20
**Status:** Design approved, ready for implementation plan
**Target version:** 0.2.0

## Goal

Support two interchangeable ways for AI agents to interact with Make: the Make
CLI (`@makehq/cli`) and the Make MCP server (`https://mcp.make.com`). Both
expose the same underlying tool set; the CLI is preferred when shell access is
available, the MCP server is used as a fallback or when shell access is absent
(Claude Desktop, claude.ai).

The skills remain a single source of truth. Build-time variants generate
CLI-aware content for plugin/npx distributions and MCP-only content for ZIP
downloads consumed by shell-less agents.

## Context

The Make CLI is literally generated from the same `MakeMCPTools` SDK definition
that backs the MCP server (see `src/index.ts` in `integromat/make-cli`:
`buildCommands(program, MakeMCPTools)`). Every MCP tool has a matching CLI
subcommand. There is no capability gap between the two interfaces — only
an invocation-syntax difference:

- MCP: `app-module_get({ appName, moduleName, outputFormat: "instructions" })`
- CLI: `make-cli app-module get --app-name=X --module-name=Y --output-format=instructions --output=json`

This collapses what looked like a major architectural split into a single
concern: where the skills describe *how to invoke* a tool.

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Coexistence model | Both paths available in parallel | Maximum reach: CLI for shell-capable agents, MCP for shell-less agents |
| Closing capability gap | Not needed — CLI = MCP 1:1 at the tool level | Discovered by reading `make-cli` source: it's generated from `MakeMCPTools` |
| Session-level selection | Detect once per session; CLI preferred, MCP fallback | Predictable behavior; easy to document |
| Content organization | Single reference skill covering both interfaces | Keeps call sites interface-agnostic; matches existing abstract-name writing style |
| Distribution split | Source tree = full (CLI+MCP); ZIPs = MCP-only | Claude Desktop / claude.ai have no Bash; CLI content would mislead those users |
| Rename vs. additive | Rename `make-mcp-reference` → `make-interface-reference` | Single source of truth for interface choice; trigger phrases cover both CLI and MCP keywords |

## Architecture

### Source tree (after change)

```
skills/
  make-interface-reference/          ← renamed from make-mcp-reference
    SKILL.md                         ← CLI + MCP content with variant markers
    references/
      cli-install-and-auth.md        ← new; stripped from ZIPs
      mcp-install-and-auth.md        ← existing OAuth/token content, moved here
      tool-invocation-mapping.md     ← new; MCP tool ↔ CLI command mapping
      transport-details.md           ← unchanged
  make-module-configuring/
    SKILL.md                         ← gains "Interface: CLI or MCP" preamble;
                                       body unchanged (already abstract tool names)
    ... (existing reference files unchanged)
  make-scenario-building/
    SKILL.md                         ← gains "Interface: CLI or MCP" preamble;
                                       body unchanged
    ... (existing reference files unchanged)
```

### Variant markers

Two marker pairs in markdown; the stripper only runs when building ZIPs.

- `<!-- variant:cli-start -->...<!-- variant:cli-end -->` — CLI-specific content.
  Visible in the source tree (plugin/npx consumers see it). **Removed by the
  stripper** when building MCP-only ZIPs.
- `<!-- variant:mcp-only-start -->...<!-- variant:mcp-only-end -->` — short
  fallback text (2–3 lines) that fills sections from which CLI content was
  stripped. Visible in both variants. The block stays short so plugin/npx
  readers aren't bothered by informational overlap with the adjacent CLI block.

File-level:
- `references/cli-*.md` — present in the source tree; deleted by the stripper
  when building MCP-only ZIPs.
- No `mcp-*` file-level filtering; MCP content is always present.

### Build-time variant (ZIPs only)

Plugin install and `npx skills add` read `skills/` directly from the repo —
no build step on their end. The source tree **is** the full variant delivered
to shell-capable agents. `build.sh` only produces the MCP-only ZIPs.

**Output path: `build/mcp-only/`** — stripper runs with target=mcp-only:
removes `variant:cli-*` blocks; keeps `variant:mcp-only-*` blocks; deletes
`references/cli-*.md` files. ZIPs in `dist/` are produced from this tree.

ZIP filenames stay the same as today (no `-mcp-only` suffix).

**Implication for the source tree:** both `variant:cli-*` and
`variant:mcp-only-*` content is visible to plugin/npx readers. The
`variant:mcp-only-*` block is kept short (typically 2–3 lines of fallback
text pointing CLI users at the MCP reference) so its presence in the full
variant is informational, not noisy.

### Stripper sanity check

Every start marker must have a matching end marker on the same file; unbalanced
markers fail the build with a clear error naming the file and line. An awk
one-pass over each `SKILL.md` file is sufficient.

## Interface detection (runtime behavior documented in skills)

The building skills instruct the agent to run this detection **once** at the
start of a Make-related task and remember the result for the session:

```
1. Run: command -v make-cli
   → found? Run: make-cli whoami
     → success? Use CLI path for the session.
     → authentication failure? Tell the user: "Run `make-cli login` to
       authenticate, or I can fall back to the MCP server."
   → not found? Go to step 2.
2. Is the `make` MCP server connected? (Attempt a lightweight tool call,
   e.g. apps_recommend, to verify.)
   → yes? Use MCP path.
   → no? Go to step 3.
3. Tell the user: "I need either the Make CLI or the Make MCP server.
   Easiest: install the CLI with `brew install integromat/tap/make-cli`
   then run `make-cli login`. Alternative: configure the Make MCP server
   at https://mcp.make.com."
```

Subsequent tool calls use the chosen path — no re-detection.

## Content changes per file

### `skills/make-interface-reference/SKILL.md` (renamed)

New frontmatter description covers both keywords:

```yaml
---
name: make-interface-reference
description: This skill should be used when the user asks about "Make CLI",
  "make-cli", "Make MCP server", "Make MCP tools", "MCP token", "Make OAuth",
  "scenario as tool", "MCP scopes", "Make API access", "connect Make to Claude",
  "scenario not appearing", "MCP timeout", "MCP connection refused", or discusses
  configuring, troubleshooting, or understanding how an AI agent connects to Make
  (via CLI or MCP server).
license: MIT
compatibility: Requires a Make.com account with permissions to create scenarios.
  Works with any agent that supports either shell access (for CLI) or MCP
  tool calling.
metadata:
  author: Make
  version: "0.2.0"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---
```

Body outline:

```
# Make Interface Reference

Technical reference for the two ways AI agents interact with Make: the Make CLI
and the Make MCP server. Both expose the same tool set.

## Choosing an interface (detection order)
- CLI preferred (shell access); MCP fallback (shell-less agents)
- Detection steps (as specified above)

<!-- variant:cli-start -->
## Make CLI
- Install (brew, npm, binary) — see references/cli-install-and-auth.md
- Authenticate: `make-cli login` → `~/.config/make-cli/config.json`
- Invocation: `make-cli <category> <action> --flag=value --output=json`
- Output: always pass `--output=json` for machine-parseable responses
- Full tool mapping: references/tool-invocation-mapping.md
<!-- variant:cli-end -->

## Make MCP server
- (all existing content from current make-mcp-reference/SKILL.md —
   OAuth, MCP token, transports, scopes, access control, timeouts,
   configuring scenarios as MCP tools, advanced configuration)

## Troubleshooting
- Combined table; CLI rows wrapped in variant:cli-start/end markers
- Existing MCP troubleshooting rows unchanged

## Resources
- CLI references (variant:cli-start/end):
  - references/cli-install-and-auth.md
  - references/tool-invocation-mapping.md (covers both interfaces;
    included in both variants)
- MCP references:
  - references/mcp-install-and-auth.md
  - references/transport-details.md
- Related skills: make-scenario-building, make-module-configuring
```

### `skills/make-interface-reference/references/cli-install-and-auth.md` (new)

- Install options: Homebrew, npm (`@makehq/cli`), binary releases per platform, Debian/Ubuntu `.deb`.
- Authentication:
  - Interactive: `make-cli login`
  - Env vars: `MAKE_API_KEY`, `MAKE_ZONE`
  - Per-command flags: `--api-key`, `--zone`
  - Priority: flags > env vars > saved credentials
- `make-cli whoami` for verifying auth; `make-cli logout` to clear.
- Config file locations (macOS/Linux: `~/.config/make-cli/config.json`; Windows: `%APPDATA%\make-cli\config.json`).

### `skills/make-interface-reference/references/tool-invocation-mapping.md` (new)

Table mapping common MCP tools to their CLI subcommands. Present in both
variants (the table is useful even for MCP-only readers as documentation of the
underlying tool shape).

| Capability | MCP tool | CLI command |
|---|---|---|
| Recommend apps | `apps_recommend` | `make-cli apps recommend --query='...' --output=json` |
| List modules | `app_modules_list` | `make-cli app-modules list --app-name=X --app-version=1 --output=json` |
| Get app docs | `app_documentation_get` | `make-cli app-documentation get --app-name=X --output=json` |
| Get module interface | `app-module_get` | `make-cli app-module get --app-name=X --module-name=Y --output-format=instructions --output=json` |
| Execute RPC | `rpc_execute` | `make-cli rpc execute ... --output=json` |
| Validate module | `validate_module_configuration` | `make-cli validate module-configuration ... --output=json` |
| Validate blueprint | `validate_blueprint_schema` | `make-cli validate blueprint-schema ... --output=json` |
| Extract components | `extract_blueprint_components` | `make-cli extract blueprint-components ... --output=json` |
| List connections | `connections_list` | `make-cli connections list --team-id=123 --output=json` |
| Create credential request | `credential_requests_create` | `make-cli credential-requests create ... --output=json` |
| List/create hooks | `hooks_list`, `hooks_create` | `make-cli hooks list` / `make-cli hooks create ...` |
| List/create data stores | `data-stores_list`, `data-stores_create` | `make-cli data-stores list` / `make-cli data-stores create ...` |
| Create/update/activate scenario | `scenarios_create`, `scenarios_update`, `scenarios_activate` | `make-cli scenarios create` / `update` / `activate` |
| Run scenario | `scenarios_run` | `make-cli scenarios run --scenario-id=456 --output=json` |
| Get execution | `executions_get` | `make-cli executions get --execution-id=... --output=json` |
| Scheduling | `scenario_scheduling_update` | `make-cli scenario-scheduling update ... --output=json` |

Notes in the same file:
- Always pass `--output=json` when the agent parses results programmatically.
- `--output=table` is human-readable only.
- CLI subcommand names follow the MCP tool name with underscores/kebab-case
  translation per `make-cli`'s internal `camelToKebab` convention.
- Authoritative source for any subcommand name is `make-cli <category> --help`.

### `skills/make-interface-reference/references/mcp-install-and-auth.md` (new, content relocated)

Moves the existing OAuth, MCP token, transport, access-control, and timeouts
content out of `SKILL.md` into a dedicated reference file. SKILL.md keeps a
short summary and links to this file. No content loss.

### `skills/make-interface-reference/references/transport-details.md` (unchanged)

### `skills/make-scenario-building/SKILL.md` and `skills/make-module-configuring/SKILL.md`

Add a single preamble section near the top of each (after frontmatter, before
"Phase 1" in scenario-building; analogous location in module-configuring):

```markdown
## Interface: CLI or MCP

Before invoking any tool in this skill, determine which interface to use.

<!-- variant:cli-start -->
1. **CLI (preferred)** — run `command -v make-cli` (or `make-cli whoami`).
   If installed and authenticated, invoke tools as:
   `make-cli <category> <action> --flag=value --output=json`
2. **MCP (fallback)** — if no CLI, check for the `make` MCP server and call
   tools natively.
3. **Neither** — guide the user to install the Make CLI
   (`brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`,
   then `make-cli login`), or to configure the Make MCP server
   (`https://mcp.make.com`).

All tool names below (`apps_recommend`, `app-module_get`, `rpc_execute`,
`validate_module_configuration`, etc.) exist in both interfaces. See
**make-interface-reference** for the CLI ↔ MCP mapping and invocation syntax.
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
This skill uses the Make MCP server. Tool names below (`apps_recommend`,
`app-module_get`, `rpc_execute`, `validate_module_configuration`, etc.) are
MCP tools. See **make-interface-reference** for connection setup.
<!-- variant:mcp-only-end -->
```

All existing tool references in the bodies (`apps_recommend`, `app_modules_list`,
`rpc_execute`, `validate_module_configuration`, etc.) stay unchanged — they
already use abstract names that map cleanly to both interfaces.

### `README.md`

Three additions:

1. New **Interfaces** section after the Skills table:

```markdown
## Interfaces

Skills work with either interface — whichever is available, CLI preferred:

- **Make CLI** (recommended) — `brew install integromat/tap/make-cli`
  then `make-cli login`. Works with any agent that has shell/Bash access
  (Claude Code, Cursor, Windsurf, Cline).
- **Make MCP server** — configure `https://mcp.make.com` in your agent.
  Required for agents without shell access (Claude Desktop, claude.ai).

Both expose the same tool set. See the `make-interface-reference` skill for
detection order, install, and syntax mapping.
```

2. Download table note:

```markdown
> ZIP downloads target agents without shell access (Claude Desktop, claude.ai)
> and include MCP-only content. For CLI support, install via Claude Code plugin
> or `npx skills add integromat/make-skills`.
```

3. Split MCP Server Setup into two siblings:
   - **"CLI Setup (Claude Code / Cursor / Windsurf / …)"** — install + login.
   - **"MCP Server Setup (Claude Desktop / claude.ai)"** — existing OAuth/token
     config, unchanged.

### `CLAUDE.md`

Update Project Overview paragraph to mention both interfaces. Add a "Build
variants" section under "Working with This Repository" documenting the variant
markers and how to add CLI-only or MCP-only content.

### `.claude-plugin/plugin.json`

```json
"description": "Agent skills for designing, building, and deploying Make.com automation scenarios — via Make CLI or MCP server"
```

### `package.json`

```json
"keywords": ["make", "mcp", "cli", "automation", "scenarios", "integration",
             "workflow", "blueprint", "no-code", "agent-skills", "skill"]
```

Description updated to be interface-agnostic (consistent with plugin.json).

### `build.sh` / `scripts/strip-variants.sh`

New stripper script (awk-based, one pass per file):

```bash
# scripts/strip-variants.sh <src-dir> <dest-dir>
#
# Copies src-dir to dest-dir, removes variant:cli-* blocks from all SKILL.md
# files, deletes references/cli-*.md files. Fails with a clear error if any
# file has unbalanced variant markers.
```

`build.sh` flow:

```
1. rm -rf build/ dist/
2. mkdir -p build/mcp-only dist/
3. scripts/strip-variants.sh skills/ build/mcp-only/
4. For each skill in build/mcp-only/:
     zip -r dist/<skill-name>-v<version>.zip <skill-dir>
5. Zip bundle: dist/make-skills-v<version>.zip from build/mcp-only/
```

The source tree (`skills/`) is what plugin install and `npx skills add`
consume. No separate build output is generated for them.

Sanity check: after build, `grep -r 'make-cli' dist/` should return zero matches
inside any ZIP's extracted content.

## Release and verification

### Version bump

0.1.3 → 0.2.0 (minor bump due to rename).

### Verification checklist for implementation plan

- [ ] `make-cli --help` output on an installed CLI confirms every command in `tool-invocation-mapping.md`.
- [ ] `bash build.sh` produces all expected ZIPs with correct content.
- [ ] ZIP contents contain no `make-cli` references and no `cli-*.md` files.
- [ ] Source tree contains `cli-*.md` reference files and intact variant markers.
- [ ] Stripper fails on a deliberately unbalanced marker test fixture.
- [ ] Renamed skill is discoverable via existing "Make MCP server" and new "Make CLI" trigger phrases.

### CHANGELOG / README note

Single call-out for the rename: "`make-mcp-reference` has been renamed to
`make-interface-reference` and now covers both the Make CLI and the Make MCP
server."

## Out of scope

- Translating every MCP tool to CLI one-by-one inside the building skill bodies
  (kept abstract; mapping is in one reference file).
- Per-call heuristics for mixing CLI and MCP within a single session (session-level
  default only).
- Maintaining `make-mcp-reference` as a backward-compatibility stub.
- Authoring a standalone `make-cli` tutorial; link to upstream README instead.
- Changes to the Open Agent Skills submission flow.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| CLI subcommand names in mapping differ from actual CLI help output | Verification checklist requires running `make-cli --help` against each mapped command before release |
| Unbalanced variant markers break builds | Stripper has balance check with clear error message; dev-time script to lint markers |
| Renamed skill breaks downstream references to `make-mcp-reference` | Trigger phrases cover both keywords; README/CHANGELOG callout; minor version bump signals change |
| Claude Desktop users accidentally install full-variant content | ZIP download path is MCP-only; plugin/npx paths require shell access by nature |
| CLI is installed but user hasn't run `make-cli login` | Detection step 1 calls `make-cli whoami`; failure prompts user to authenticate or fall back |

## Dependencies on prior work

This design **supersedes** the existing, unmerged
`docs/superpowers/plans/2026-04-12-open-agent-skills-compatibility.md` plan in
two places:

- Task 3 of that plan (enrich `make-mcp-reference` frontmatter) is replaced by
  the rename + enrichment described here.
- Version bump rationale changes from patch (0.1.1) to minor (0.2.0).

All other tasks from the compatibility plan (package.json, README rewrite,
plugin.json description, skills.sh submission) remain applicable and are
re-stated in Section 5 of this spec. The implementation plan should sequence
this work so both efforts ship together.
