# Dual CLI/MCP Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dual Make-CLI/MCP interface support to the skills; rename `make-mcp-reference` → `make-interface-reference`; introduce a build-time stripper that produces MCP-only ZIPs while keeping the source tree CLI-aware.

**Architecture:** Single source tree serves plugin/npx consumers as the full (CLI+MCP) variant. A new `scripts/strip-variants.sh` script strips `<!-- variant:cli-* -->` blocks and deletes `references/cli-*.md` files to produce MCP-only ZIPs. Building skills gain a short preamble pointing to the renamed `make-interface-reference` skill, which is the single source of truth for CLI↔MCP invocation syntax.

**Tech Stack:** Bash, awk, markdown, YAML frontmatter, JSON; `commit-and-tag-version` for version bumping.

**Spec:** `docs/superpowers/specs/2026-04-20-dual-cli-mcp-interface-design.md`

**Supersedes:** `docs/superpowers/plans/2026-04-12-open-agent-skills-compatibility.md` (earlier compatibility plan; the frontmatter + README work there is folded into this plan).

---

### Task 1: Create strip-variants stripper script with TDD

The stripper is the linchpin of the build-variant system. Write it with a small test harness first so marker-balance detection and file-deletion rules are verified before any content files are touched.

**Files:**
- Create: `scripts/strip-variants.sh`
- Create: `scripts/test-strip-variants.sh`
- Create: `scripts/fixtures/strip-variants/balanced-input/skills/example/SKILL.md`
- Create: `scripts/fixtures/strip-variants/balanced-input/skills/example/references/cli-intro.md`
- Create: `scripts/fixtures/strip-variants/balanced-input/skills/example/references/mcp-intro.md`
- Create: `scripts/fixtures/strip-variants/unbalanced-input/skills/example/SKILL.md`

---

- [ ] **Step 1: Create the balanced-input fixture (SKILL.md)**

Create `scripts/fixtures/strip-variants/balanced-input/skills/example/SKILL.md` with the following exact contents:

```markdown
---
name: example
description: Example skill.
---

# Example

Always visible.

<!-- variant:cli-start -->
## CLI section

CLI-only content. Multiple lines.

More CLI content.
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
Fallback text used in both variants.
<!-- variant:mcp-only-end -->

## Always-visible footer

The end.
```

- [ ] **Step 2: Create the balanced-input fixture (references)**

Create `scripts/fixtures/strip-variants/balanced-input/skills/example/references/cli-intro.md`:

```markdown
# CLI intro

This file should be deleted when stripping.
```

Create `scripts/fixtures/strip-variants/balanced-input/skills/example/references/mcp-intro.md`:

```markdown
# MCP intro

This file should survive.
```

- [ ] **Step 3: Create the unbalanced-input fixture**

Create `scripts/fixtures/strip-variants/unbalanced-input/skills/example/SKILL.md`:

```markdown
---
name: example
description: Example skill.
---

# Broken file

<!-- variant:cli-start -->
Missing end marker.
```

- [ ] **Step 4: Create the test harness**

Create `scripts/test-strip-variants.sh`:

```bash
#!/usr/bin/env bash
# Test harness for scripts/strip-variants.sh
#
# Verifies:
#   1. Balanced markers: CLI blocks stripped, mcp-only content kept, cli-*.md deleted,
#      other reference files preserved.
#   2. Unbalanced markers: stripper exits non-zero with a clear error.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURES="$REPO_ROOT/scripts/fixtures/strip-variants"
STRIPPER="$REPO_ROOT/scripts/strip-variants.sh"

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Test 1: balanced input
OUTDIR=$(mktemp -d)
trap 'rm -rf "$OUTDIR"' EXIT
bash "$STRIPPER" "$FIXTURES/balanced-input" "$OUTDIR"

# CLI block must be gone
if grep -q 'CLI-only content' "$OUTDIR/skills/example/SKILL.md"; then
  fail "CLI block was not stripped"
fi
# variant:cli markers must be gone
if grep -q 'variant:cli-' "$OUTDIR/skills/example/SKILL.md"; then
  fail "variant:cli markers not removed"
fi
# mcp-only fallback must remain
if ! grep -q 'Fallback text used in both variants' "$OUTDIR/skills/example/SKILL.md"; then
  fail "mcp-only block was incorrectly removed"
fi
# Always-visible content must remain
if ! grep -q 'Always visible' "$OUTDIR/skills/example/SKILL.md"; then
  fail "Always-visible content missing"
fi
if ! grep -q 'The end' "$OUTDIR/skills/example/SKILL.md"; then
  fail "Footer content missing"
fi
# cli-*.md must be deleted
if [ -f "$OUTDIR/skills/example/references/cli-intro.md" ]; then
  fail "cli-intro.md was not deleted"
fi
# non-cli reference must survive
if [ ! -f "$OUTDIR/skills/example/references/mcp-intro.md" ]; then
  fail "mcp-intro.md was incorrectly deleted"
fi
pass "balanced input stripped correctly"

# Test 2: unbalanced input
OUTDIR2=$(mktemp -d)
trap 'rm -rf "$OUTDIR" "$OUTDIR2"' EXIT
if bash "$STRIPPER" "$FIXTURES/unbalanced-input" "$OUTDIR2" 2>/dev/null; then
  fail "stripper did not fail on unbalanced markers"
fi
pass "unbalanced input correctly rejected"

echo ""
echo "All strip-variants tests passed."
```

Make it executable:

```bash
chmod +x scripts/test-strip-variants.sh
```

- [ ] **Step 5: Run the test — expect failure (stripper does not exist)**

Run:

```bash
bash scripts/test-strip-variants.sh
```

Expected output: error indicating `scripts/strip-variants.sh` not found (exit code non-zero).

- [ ] **Step 6: Implement strip-variants.sh**

Create `scripts/strip-variants.sh`:

```bash
#!/usr/bin/env bash
# Copy a skills tree to a destination, stripping CLI-only content:
#   1. Remove blocks between <!-- variant:cli-start --> and <!-- variant:cli-end -->.
#   2. Leave <!-- variant:mcp-only-start --> and <!-- variant:mcp-only-end --> markers
#      in place but remove just the marker lines (content between is kept).
#   3. Delete any references/cli-*.md files.
#
# Fails with a clear error if any SKILL.md has unbalanced variant markers.
#
# Usage: strip-variants.sh <src-dir> <dest-dir>

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <src-dir> <dest-dir>" >&2
  exit 2
fi

SRC="$1"
DEST="$2"

if [ ! -d "$SRC" ]; then
  echo "Error: source directory does not exist: $SRC" >&2
  exit 2
fi

rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$SRC/." "$DEST/"

# Check marker balance across all SKILL.md files.
# Emits one line per problem, then exits non-zero if any were found.
check_balance() {
  local file="$1"
  awk '
    /<!-- variant:cli-start -->/  { cli++ }
    /<!-- variant:cli-end -->/    { cli-- }
    /<!-- variant:mcp-only-start -->/ { mcp++ }
    /<!-- variant:mcp-only-end -->/   { mcp-- }
    END {
      if (cli != 0) { print "unbalanced variant:cli markers (net " cli ")"; exit 1 }
      if (mcp != 0) { print "unbalanced variant:mcp-only markers (net " mcp ")"; exit 1 }
    }
  ' "$file"
}

errors=0
while IFS= read -r -d '' f; do
  if ! out=$(check_balance "$f" 2>&1); then
    echo "Error: $f: $out" >&2
    errors=$((errors + 1))
  fi
done < <(find "$DEST" -name 'SKILL.md' -print0)

if [ "$errors" -ne 0 ]; then
  echo "Aborting: $errors file(s) have unbalanced variant markers." >&2
  exit 1
fi

# Strip CLI blocks (including the marker lines themselves).
# Also strip only the mcp-only marker lines, keeping the content inside.
while IFS= read -r -d '' f; do
  awk '
    /<!-- variant:cli-start -->/ { in_cli = 1; next }
    /<!-- variant:cli-end -->/   { in_cli = 0; next }
    /<!-- variant:mcp-only-start -->/ { next }
    /<!-- variant:mcp-only-end -->/   { next }
    { if (!in_cli) print }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done < <(find "$DEST" -name 'SKILL.md' -print0)

# Delete cli-*.md reference files.
find "$DEST" -type f -path '*/references/cli-*.md' -delete

echo "Stripped CLI content from $DEST"
```

Make it executable:

```bash
chmod +x scripts/strip-variants.sh
```

- [ ] **Step 7: Run the test — expect pass**

Run:

```bash
bash scripts/test-strip-variants.sh
```

Expected output:

```
PASS: balanced input stripped correctly
PASS: unbalanced input correctly rejected

All strip-variants tests passed.
```

- [ ] **Step 8: Commit**

```bash
git add scripts/strip-variants.sh scripts/test-strip-variants.sh scripts/fixtures/
chmod +x scripts/strip-variants.sh scripts/test-strip-variants.sh
git commit -m "feat(build): add strip-variants script with balance check and tests"
```

---

### Task 2: Rename make-mcp-reference directory to make-interface-reference

Rename the skill directory. Do not touch SKILL.md contents yet — later tasks rewrite them. This task is just the file-level move plus updates to references in build scripts and config.

**Files:**
- Move: `skills/make-mcp-reference/` → `skills/make-interface-reference/`
- Modify: `build.sh:27` (SKILLS array)
- Modify: `.versionrc.json:8`
- Modify: `package.json:41-44` (agents.skills entry)

- [ ] **Step 1: Rename the skill directory with `git mv`**

Run:

```bash
git mv skills/make-mcp-reference skills/make-interface-reference
```

- [ ] **Step 2: Update `build.sh` SKILLS array**

Replace in `build.sh:24-28`:

```bash
SKILLS=(
    "make-scenario-building"
    "make-module-configuring"
    "make-mcp-reference"
)
```

with:

```bash
SKILLS=(
    "make-scenario-building"
    "make-module-configuring"
    "make-interface-reference"
)
```

- [ ] **Step 3: Update `.versionrc.json` bumpFiles entry**

Replace in `.versionrc.json`:

```json
    { "filename": "skills/make-mcp-reference/SKILL.md", "updater": "scripts/skill-version.js" }
```

with:

```json
    { "filename": "skills/make-interface-reference/SKILL.md", "updater": "scripts/skill-version.js" }
```

- [ ] **Step 4: Update `package.json` agents.skills entry**

Replace in `package.json`:

```json
      {
        "name": "make-mcp-reference",
        "path": "./skills/make-mcp-reference"
      }
```

with:

```json
      {
        "name": "make-interface-reference",
        "path": "./skills/make-interface-reference"
      }
```

- [ ] **Step 5: Verify the rename by running build.sh as-is**

Run:

```bash
bash build.sh
```

Expected: succeeds; `dist/make-interface-reference-v0.1.3.zip` exists; no `make-mcp-reference` references anywhere in `dist/` filenames.

Inspect:

```bash
ls dist/ | grep interface
```

Expected: `make-interface-reference-v0.1.3.zip`, `make-interface-reference.zip`.

- [ ] **Step 6: Commit**

```bash
git add skills/ build.sh .versionrc.json package.json
git commit -m "refactor: rename make-mcp-reference to make-interface-reference"
```

---

### Task 3: Integrate strip-variants into build.sh

Wire the stripper into `build.sh`. Both individual-skill ZIPs and the complete bundle are produced from a stripped copy of `skills/`. Source tree stays untouched.

**Files:**
- Modify: `build.sh:41-66`

- [ ] **Step 1: Update build.sh to strip before zipping**

Replace the entire region from line 37 to the end of the bundle-creation block (line 66) with:

```bash
# Strip CLI content from a copy of skills/ for MCP-only ZIPs
echo "Stripping CLI content for MCP-only ZIPs..."
STRIP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$STRIP_DIR")
bash "$REPO_ROOT/scripts/strip-variants.sh" "$REPO_ROOT/skills" "$STRIP_DIR/skills"
echo ""

# Build individual skill zips (for Claude Desktop / Claude.ai)
# Structure: skill-name/ at zip root
echo "Building individual skill zips..."

for skill in "${SKILLS[@]}"; do
    echo "  - $skill"
    TMPDIR_PKG=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
    _CLEANUP_DIRS+=("$TMPDIR_PKG")
    cp -r "$STRIP_DIR/skills/$skill" "$TMPDIR_PKG/$skill"
    (cd "$TMPDIR_PKG" && zip -rq "$DIST_DIR/${skill}-v${VERSION}.zip" "$skill/" -x "*.DS_Store")
    # Stable alias (version-free) so docs don't 404 after a bump
    cp "$DIST_DIR/${skill}-v${VERSION}.zip" "$DIST_DIR/${skill}.zip"
done

# Build complete bundle (for Claude Code)
echo "Building complete bundle..."

TMPDIR_BUNDLE=$(mktemp -d "${TMPDIR:-/tmp}/make-skills.XXXXXX")
_CLEANUP_DIRS+=("$TMPDIR_BUNDLE")
BUNDLE="$TMPDIR_BUNDLE/make-skills"
mkdir -p "$BUNDLE"
cp -r "$REPO_ROOT/.claude-plugin" "$BUNDLE/.claude-plugin"
cp -r "$STRIP_DIR/skills" "$BUNDLE/skills"
cp "$REPO_ROOT/.mcp.json" "$BUNDLE/.mcp.json"
cp "$REPO_ROOT/README.md" "$BUNDLE/README.md"
cp "$REPO_ROOT/LICENSE" "$BUNDLE/LICENSE"
cp "$REPO_ROOT/CLAUDE.md" "$BUNDLE/CLAUDE.md"
(cd "$TMPDIR_BUNDLE" && zip -rq "$DIST_DIR/make-skills-v${VERSION}.zip" "make-skills/" -x "*.DS_Store")
# Stable alias
cp "$DIST_DIR/make-skills-v${VERSION}.zip" "$DIST_DIR/make-skills.zip"
```

Note: the original variables `TMPDIR` were renamed (`TMPDIR_PKG`, `TMPDIR_BUNDLE`) to avoid clobbering the OS `TMPDIR` env var used in the `mktemp` fallback. Functionally identical.

- [ ] **Step 2: Run the build to verify integration**

Run:

```bash
bash build.sh
```

Expected: build succeeds, no errors, all ZIPs listed.

- [ ] **Step 3: Verify source tree was not modified**

Run:

```bash
git status skills/
```

Expected: clean (no modifications to skills/).

- [ ] **Step 4: Commit**

```bash
git add build.sh
git commit -m "feat(build): strip CLI content from ZIPs via strip-variants"
```

---

### Task 4: Create cli-install-and-auth.md reference file

This is the CLI-only installation and authentication reference, consumed only by agents with shell access.

**Files:**
- Create: `skills/make-interface-reference/references/cli-install-and-auth.md`

- [ ] **Step 1: Create the file**

Create `skills/make-interface-reference/references/cli-install-and-auth.md` with this content:

```markdown
# Make CLI: Install & Authenticate

The Make CLI (`@makehq/cli`) exposes every Make MCP tool as a command-line subcommand. When an AI agent has shell access, invoking the CLI via Bash is the recommended interface.

## Installation

### Homebrew (macOS / Linux)

```bash
brew install integromat/tap/make-cli
```

### npm (global or npx)

```bash
npm install -g @makehq/cli
```

Or run without installing:

```bash
npx @makehq/cli scenarios list --team-id=123
```

### Binary releases

Pre-built binaries are available at <https://github.com/integromat/make-cli/releases>:

| Platform | Architecture       | File                            |
|----------|--------------------|---------------------------------|
| Linux    | x86_64             | `make-cli-linux-amd64.tar.gz`   |
| Linux    | arm64              | `make-cli-linux-arm64.tar.gz`   |
| macOS    | Intel              | `make-cli-darwin-amd64.tar.gz`  |
| macOS    | Apple Silicon      | `make-cli-darwin-arm64.tar.gz`  |
| Windows  | x86_64             | `make-cli-windows-amd64.tar.gz` |

Extract the archive and place the binary on the `PATH`.

### Debian / Ubuntu

```bash
sudo dpkg -i make-cli-linux-amd64.deb
```

## Authentication

### Interactive login (recommended)

```bash
make-cli login
```

Guides the user through selecting a zone, opening the Make API keys page in a browser, and validating the key. Credentials are saved to:

- **macOS / Linux:** `~/.config/make-cli/config.json`
- **Windows:** `%APPDATA%\make-cli\config.json`

Verify:

```bash
make-cli whoami
```

Clear saved credentials:

```bash
make-cli logout
```

### Environment variables

```bash
export MAKE_API_KEY="your-api-key"
export MAKE_ZONE="eu2.make.com"
```

### Per-command flags

```bash
make-cli --api-key YOUR_KEY --zone eu2.make.com scenarios list --team-id=123
```

### Priority

Flags > environment variables > saved credentials.

## Usage shape

```
make-cli [--api-key=…] [--zone=…] [--output=json|table|compact] <category> <action> [flags]
```

Global options relevant to agent usage:

| Option              | Description                                         |
|---------------------|-----------------------------------------------------|
| `--api-key <key>`   | Make API key (or set `MAKE_API_KEY`)                |
| `--zone <zone>`     | Make zone, e.g. `eu2.make.com` (or `MAKE_ZONE`)     |
| `--output <format>` | `json` (default), `compact`, or `table`             |

When an agent parses the response programmatically, always pass `--output=json`.

## Authoritative help

For the definitive list of categories and actions, run:

```bash
make-cli --help
make-cli <category> --help
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/make-interface-reference/references/cli-install-and-auth.md
git commit -m "docs(interface-reference): add CLI install and auth reference"
```

---

### Task 5: Create mcp-install-and-auth.md reference file

Relocate the OAuth / MCP-token / scopes / access-control content out of the current SKILL.md into a dedicated reference file. Content is copied verbatim from the existing SKILL.md so no information is lost.

**Files:**
- Create: `skills/make-interface-reference/references/mcp-install-and-auth.md`

- [ ] **Step 1: Create the file**

Create `skills/make-interface-reference/references/mcp-install-and-auth.md` with the following exact content:

```markdown
# Make MCP Server: Install & Authenticate

Technical reference for connecting an AI client to the Make MCP server.

## Connection Methods

### OAuth (Default)

Connect via OAuth consent flow. Select organization and scopes during authentication.

**Endpoint:** `https://mcp.make.com`

**URL variants:**

| Transport                            | URL                          |
|--------------------------------------|------------------------------|
| Stateless Streamable HTTP (default)  | `https://mcp.make.com`       |
| Streamable HTTP                      | `https://mcp.make.com/stream`|
| SSE                                  | `https://mcp.make.com/sse`   |

For clients without SSE support, a legacy transport using the Cloudflare `mcp-remote` proxy wrapper is available: `npx -y mcp-remote https://mcp.make.com/sse`.

**Configuration for Claude Code:**

```json
{
  "mcpServers": {
    "make": {
      "type": "http",
      "url": "https://mcp.make.com"
    }
  }
}
```

**Access control:** Restrict to specific organizations during OAuth consent. Teams plan or higher enables team-level restrictions.

### MCP Token

Generate a token in Make profile → API access tab → Add token.

**Endpoint:** `https://<MAKE_ZONE>/mcp/u/<MCP_TOKEN>/stateless`

**URL variants:**

| Transport                  | URL                                          |
|----------------------------|----------------------------------------------|
| Stateless Streamable HTTP  | `https://<ZONE>/mcp/u/<TOKEN>/stateless`     |
| Streamable HTTP            | `https://<ZONE>/mcp/u/<TOKEN>/stream`        |
| SSE                        | `https://<ZONE>/mcp/u/<TOKEN>/sse`           |
| Header Auth                | `https://<ZONE>/mcp/stateless` + `Authorization: Bearer <TOKEN>` |

**Configuration for Claude Code:**

```json
{
  "mcpServers": {
    "make": {
      "type": "http",
      "url": "https://<MAKE_ZONE>/mcp/u/<MCP_TOKEN>"
    }
  }
}
```

Replace `<MAKE_ZONE>` with the organization's hosting zone (e.g., `eu1.make.com`, `eu2.make.com`, `us1.make.com`).

**Security:** Treat MCP tokens as secrets. Never commit them to version control.

## Scopes

### Scenario Run Scopes

Allow AI clients to view and run active, on-demand scenarios.

- **OAuth scope:** "Run your scenarios"
- **Token scope:** `mcp:use`
- **Available on:** All plans

### Management Scopes

Allow AI clients to view and modify account contents (scenarios, connections, webhooks, data stores, teams).

- **Available on:** Paid plans only
- Enable granular control over Make account management

## Configuring Scenarios as MCP Tools

For a scenario to appear as an MCP tool:

1. Set scenario to **active** status
2. Set scheduling to **on-demand**
3. Select the appropriate scope (`mcp:use` for tokens, "Run your scenarios" for OAuth)
4. Configure **scenario inputs** — these become tool parameters
5. Configure **scenario outputs** — these become tool return values
6. Add a detailed **scenario description** — strongly recommended to help AI understand the tool's purpose and improve discoverability

**Input/output best practices:**

- Write clear, descriptive names (AI agents rely on these)
- Add detailed descriptions explaining expected data
- Use specific data types over `Any`
- Keep execution time under timeout limits

## Access Control (Token Auth)

Restrict which scenarios are available via URL query parameters:

**Organization level:**

```
?organizationId=<id>
```

**Team level:**

```
?teamId=<id>
```

**Scenario level (single):**

```
?scenarioId=<id>
```

**Multiple scenarios:**

```
?scenarioId[]=<id1>&scenarioId[]=<id2>
```

Levels are mutually exclusive — cannot combine organization, team, and scenario filters.

## Timeouts

| Tool Type     | OAuth | Token (Stateless) | Token (SSE/Stream) |
|---------------|-------|-------------------|--------------------|
| Scenario Run  | 25s   | 40s               | 40s                |
| Management    | 30s   | 60s               | 320s               |

When a scenario run exceeds the timeout, the response includes an `executionId`. The scenario continues running in Make for up to 40 minutes. Use `executions_get` with that ID to poll for results.

## Advanced Configuration

### Tool Name Length

Customize maximum tool name length with query parameter:

```
?maxToolNameLength=<32-160>
```

Default: 56 characters.
```

- [ ] **Step 2: Commit**

```bash
git add skills/make-interface-reference/references/mcp-install-and-auth.md
git commit -m "docs(interface-reference): extract MCP install and auth reference"
```

---

### Task 6: Create tool-invocation-mapping.md reference file

Authoritative mapping between MCP tool names and `make-cli` subcommands. Visible in both variants (the table helps MCP readers understand the underlying tool shape too).

**Files:**
- Create: `skills/make-interface-reference/references/tool-invocation-mapping.md`

- [ ] **Step 1: Create the file**

Create `skills/make-interface-reference/references/tool-invocation-mapping.md` with:

```markdown
# Tool Invocation Mapping: MCP ↔ CLI

The Make CLI is built from the same `MakeMCPTools` SDK definition as the MCP server. Every MCP tool has a matching CLI subcommand. The table below covers the high-traffic tools used across the building skills.

For the authoritative, always-up-to-date command list, run `make-cli --help` and `make-cli <category> --help`.

## Core mapping

| Capability                          | MCP tool                            | CLI command                                                                     |
|-------------------------------------|-------------------------------------|---------------------------------------------------------------------------------|
| Recommend apps                      | `apps_recommend`                    | `make-cli apps recommend --query='…' --output=json`                             |
| List modules for an app             | `app_modules_list`                  | `make-cli app-modules list --app-name=X --app-version=1 --output=json`          |
| Get app documentation               | `app_documentation_get`             | `make-cli app-documentation get --app-name=X --output=json`                     |
| Get module interface                | `app-module_get`                    | `make-cli app-module get --app-name=X --module-name=Y --output-format=instructions --output=json` |
| Execute RPC                         | `rpc_execute`                       | `make-cli rpc execute … --output=json`                                          |
| Validate module configuration       | `validate_module_configuration`     | `make-cli validate module-configuration … --output=json`                        |
| Validate blueprint schema           | `validate_blueprint_schema`         | `make-cli validate blueprint-schema … --output=json`                            |
| Extract blueprint components        | `extract_blueprint_components`      | `make-cli extract blueprint-components … --output=json`                         |
| List connections                    | `connections_list`                  | `make-cli connections list --team-id=123 --output=json`                         |
| Create credential request           | `credential_requests_create`        | `make-cli credential-requests create … --output=json`                           |
| Poll credential request             | `credential_requests_get`           | `make-cli credential-requests get --credential-request-id=… --output=json`      |
| List / create webhooks              | `hooks_list` / `hooks_create`       | `make-cli hooks list …` / `make-cli hooks create …`                             |
| List / create data stores           | `data-stores_list` / `data-stores_create` | `make-cli data-stores list …` / `make-cli data-stores create …`           |
| List / create data structures       | `data-structures_list` / `data-structures_create` | `make-cli data-structures list …` / `make-cli data-structures create …` |
| Create / update / activate scenario | `scenarios_create` / `scenarios_update` / `scenarios_activate` | `make-cli scenarios create` / `update` / `activate`          |
| Deactivate scenario                 | `scenarios_deactivate`              | `make-cli scenarios deactivate --scenario-id=456`                               |
| Run scenario                        | `scenarios_run`                     | `make-cli scenarios run --scenario-id=456 --output=json`                        |
| List executions                     | `executions_list`                   | `make-cli executions list --scenario-id=456 --output=json`                      |
| Get execution                       | `executions_get`                    | `make-cli executions get --execution-id=… --output=json`                        |
| Update scheduling                   | `scenario_scheduling_update`        | `make-cli scenario-scheduling update … --output=json`                           |
| List keys                           | `keys_list`                         | `make-cli keys list --team-id=123 --output=json`                                |

## Notes

- **`--output=json`** — always pass when an agent needs to parse the response. `--output=table` is human-readable only.
- **Subcommand naming** — CLI subcommands follow the MCP tool name with underscores converted to kebab-case per the CLI's internal `camelToKebab` convention. When in doubt, run `make-cli <category> --help`.
- **Credentials** — after `make-cli login`, no credential flags needed per call. Override with `MAKE_API_KEY` / `MAKE_ZONE` env vars or `--api-key` / `--zone` flags.
- **Flag format** — CLI flags accept either `--flag=value` or `--flag value`. This document uses `=` consistently for clarity.

## Parameter-passing patterns

For tools that accept complex JSON payloads (e.g., `scenarios_create` with a blueprint), pass the JSON inline as a quoted string:

```bash
make-cli scenarios create \
  --team-id=123 \
  --scheduling='{"type":"on-demand"}' \
  --blueprint='{"name":"My Scenario","flow":[],"metadata":{}}'
```

For large payloads, write to a file and use shell substitution:

```bash
make-cli scenarios create \
  --team-id=123 \
  --scheduling='{"type":"on-demand"}' \
  --blueprint="$(cat blueprint.json)"
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/make-interface-reference/references/tool-invocation-mapping.md
git commit -m "docs(interface-reference): add MCP-to-CLI tool invocation mapping"
```

---

### Task 7: Rewrite make-interface-reference/SKILL.md

Replace the existing `SKILL.md` with a dual-interface body. New frontmatter name, broadened description, version 0.2.0. Body structure: opening, detection rule, CLI section (in variant markers), MCP section (summary + link to extracted reference), troubleshooting (combined), resources.

**Files:**
- Modify: `skills/make-interface-reference/SKILL.md` (full replacement)

- [ ] **Step 1: Replace SKILL.md contents**

Overwrite `skills/make-interface-reference/SKILL.md` with:

```markdown
---
name: make-interface-reference
description: This skill should be used when the user asks about "Make CLI", "make-cli", "Make MCP server", "Make MCP tools", "MCP token", "Make OAuth", "scenario as tool", "MCP scopes", "Make API access", "connect Make to Claude", "scenario not appearing", "MCP timeout", "MCP connection refused", or discusses configuring, troubleshooting, or understanding how an AI agent connects to Make via the Make CLI or the Make MCP server. Provides technical reference for both interfaces, including install, authentication, scopes, access control, invocation syntax, and troubleshooting.
license: MIT
compatibility: Requires a Make.com account with permissions to create scenarios. Works with any agent that supports either shell access (for the Make CLI) or MCP tool calling.
metadata:
  author: Make
  version: "0.2.0"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Interface Reference

AI agents interact with Make through one of two interfaces:

- **Make CLI** (`@makehq/cli`) — a local binary the agent invokes through shell (Bash). Preferred when the agent has shell access.
- **Make MCP server** (`https://mcp.make.com`) — a hosted MCP service the agent calls via native tool invocation. Required when the agent has no shell access (Claude Desktop, claude.ai).

Both expose the same tool set. The CLI is generated from the same `MakeMCPTools` SDK definition that backs the MCP server, so every MCP tool has a matching CLI subcommand.

## Choosing an interface (detection order)

Run this check once at the start of any Make-related task and remember the result for the session. Do not re-detect per tool call.

<!-- variant:cli-start -->
1. **Check for the CLI.** Run `command -v make-cli` (Bash).
   - Found? Run `make-cli whoami` to verify authentication.
     - Success → use the **CLI path** for this session.
     - Authentication failure → tell the user: "The Make CLI is installed but not authenticated. Run `make-cli login` to authenticate, or I can fall back to the MCP server if it is configured."
   - Not found → go to step 2.
2. **Check for the MCP server.** Is the `make` MCP server connected? Attempt a lightweight tool call (e.g. `apps_recommend`) to verify.
   - Yes → use the **MCP path**.
   - No → go to step 3.
3. **Neither available.** Tell the user: "I need either the Make CLI or the Make MCP server. Easiest: install the CLI with `brew install integromat/tap/make-cli` (or `npm install -g @makehq/cli`) then run `make-cli login`. Alternative: configure the Make MCP server at `https://mcp.make.com`."
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
This environment uses the Make MCP server. Configure it at `https://mcp.make.com` (see below).
<!-- variant:mcp-only-end -->

<!-- variant:cli-start -->
## Make CLI

Install, authenticate, and invoke: see **[cli-install-and-auth.md](./references/cli-install-and-auth.md)**.

Invocation shape:

```
make-cli <category> <action> --flag=value --output=json
```

- Always pass `--output=json` when the agent parses the response programmatically.
- For the full category/action list, run `make-cli --help` and `make-cli <category> --help`.
- After `make-cli login`, subsequent calls need no credential flags.

For the MCP-tool ↔ CLI-command mapping used by the building skills, see **[tool-invocation-mapping.md](./references/tool-invocation-mapping.md)**.
<!-- variant:cli-end -->

## Make MCP server

Install, authenticate, scopes, access control, transports, timeouts, configuring scenarios as MCP tools: see **[mcp-install-and-auth.md](./references/mcp-install-and-auth.md)**.

Transport comparison and URL construction: see **[transport-details.md](./references/transport-details.md)**.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No scenarios appearing as tools | Verify scenario is active, scheduled on-demand, and the authenticated user/token has the required scope. |
| Permission denied | For MCP token auth: check token scopes (`mcp:use` plus any management scopes). For OAuth: re-consent with the needed scopes. |
| MCP connection refused / timeout | Verify zone URL; for long-running management tools, switch to `https://<MAKE_ZONE>/mcp/<TRANSPORT>` URLs that support longer timeouts; consider SSE. |
| Stale MCP tool list | Reconnect the MCP client to refresh available tools. |
<!-- variant:cli-start -->
| `make-cli: command not found` | Install via `brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`. |
| `make-cli whoami` returns "not logged in" | Run `make-cli login` to authenticate interactively. |
| CLI call returns `401 Unauthorized` | Saved credentials are invalid or expired. Run `make-cli logout` then `make-cli login`, or override via `MAKE_API_KEY` / `MAKE_ZONE`. |
| CLI call hangs or times out | Check network to the zone URL; add `--zone <correct-zone>` if the saved zone is wrong. |
<!-- variant:cli-end -->

## Resources

<!-- variant:cli-start -->
- **[cli-install-and-auth.md](./references/cli-install-and-auth.md)** — Make CLI install and authentication.
- **[tool-invocation-mapping.md](./references/tool-invocation-mapping.md)** — MCP tool ↔ CLI subcommand mapping.
<!-- variant:cli-end -->
- **[mcp-install-and-auth.md](./references/mcp-install-and-auth.md)** — Make MCP server connection methods, scopes, access control.
- **[transport-details.md](./references/transport-details.md)** — Transport comparison, URL construction, zone list.
- **[Make MCP Server docs](https://developers.make.com/mcp-server)** — Official documentation.

## Related skills

- **make-scenario-building** — Scenario design: app discovery, module selection, routing, error handling, deployment.
- **make-module-configuring** — Module configuration: parameters, connections, mapping, webhooks, data stores, validation.
```

- [ ] **Step 2: Verify marker balance manually**

Run:

```bash
grep -c 'variant:cli-start' skills/make-interface-reference/SKILL.md
grep -c 'variant:cli-end' skills/make-interface-reference/SKILL.md
grep -c 'variant:mcp-only-start' skills/make-interface-reference/SKILL.md
grep -c 'variant:mcp-only-end' skills/make-interface-reference/SKILL.md
```

Expected: first two counts equal (5 each based on the draft above — adjust if content changed); last two counts equal.

- [ ] **Step 3: Run the stripper to confirm balance validation passes**

Run:

```bash
TMPOUT=$(mktemp -d)
bash scripts/strip-variants.sh skills/ "$TMPOUT/skills"
echo "exit: $?"
rm -rf "$TMPOUT"
```

Expected: exit code 0, "Stripped CLI content from …" line printed.

- [ ] **Step 4: Commit**

```bash
git add skills/make-interface-reference/SKILL.md
git commit -m "feat(interface-reference): rewrite SKILL.md for dual CLI/MCP support"
```

---

### Task 8: Add interface preamble to make-scenario-building/SKILL.md

Insert a single new section at the top of the skill body, right after the frontmatter and before the existing `# Make Scenario Building` H1 is irrelevant — the preamble comes after the H1 and before the existing `## Phase 1` section. No other changes to this file.

**Files:**
- Modify: `skills/make-scenario-building/SKILL.md` (insertion between H1 block and Phase 1)

- [ ] **Step 1: Insert the preamble**

Find the lines in `skills/make-scenario-building/SKILL.md` that contain:

```
# Make Scenario Building

This skill guides building a scenario in Make. A scenario is an automated workflow composed of modules connected together. Before building anything, Phase 1 below MUST be completed.


## Phase 1: Understand the Business Need & Identify Modules
```

Replace the blank line(s) between the introductory paragraph and `## Phase 1` with:

```markdown
## Interface: CLI or MCP

Before invoking any tool in this skill, determine which interface to use.

<!-- variant:cli-start -->
1. **CLI (preferred).** Run `command -v make-cli` (Bash). If found, run `make-cli whoami` to verify authentication. If both succeed, invoke tools via:
   `make-cli <category> <action> --flag=value --output=json`.
2. **MCP (fallback).** If no CLI, check whether the `make` MCP server is connected and call tools natively.
3. **Neither available.** Ask the user to install the Make CLI (`brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`, then `make-cli login`) or to configure the Make MCP server (`https://mcp.make.com`).

All tool names used below (`apps_recommend`, `app-module_get`, `rpc_execute`, `validate_module_configuration`, `extract_blueprint_components`, etc.) exist in both interfaces. See **make-interface-reference** for the full MCP↔CLI mapping and invocation syntax.
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
This skill uses the Make MCP server. Tool names referenced below (`apps_recommend`, `app-module_get`, `rpc_execute`, `validate_module_configuration`, `extract_blueprint_components`, etc.) are MCP tools. See **make-interface-reference** for connection setup.
<!-- variant:mcp-only-end -->

```

The result should read: existing intro paragraph, blank line, the new preamble above, blank line, `## Phase 1: …`.

- [ ] **Step 2: Verify marker balance**

Run:

```bash
bash scripts/strip-variants.sh skills/ /tmp/strip-check
rm -rf /tmp/strip-check
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add skills/make-scenario-building/SKILL.md
git commit -m "feat(scenario-building): add interface selection preamble"
```

---

### Task 9: Add interface preamble to make-module-configuring/SKILL.md

Same preamble, placed after the existing "Quick Routing" section (or after the intro paragraph, whichever comes first — insert so it is near the top, clearly visible before any tool-invocation references in the body).

**Files:**
- Modify: `skills/make-module-configuring/SKILL.md`

- [ ] **Step 1: Locate insertion point**

Open the file. The first lines are:

```markdown
---
(frontmatter)
---

# Make Module Configuration

This skill covers configuring individual modules within a Make scenario. Once a scenario's module composition is decided (see **make-scenario-building**), each module must be configured: connections assigned, parameters filled, data mapped from upstream modules, and special components (webhooks, data stores, keys) wired up.

## Quick Routing
```

Insert the preamble between the intro paragraph and `## Quick Routing`, so `## Interface: CLI or MCP` comes first.

- [ ] **Step 2: Insert the preamble**

Insert the following block immediately before `## Quick Routing`:

```markdown
## Interface: CLI or MCP

Before invoking any tool in this skill, determine which interface to use.

<!-- variant:cli-start -->
1. **CLI (preferred).** Run `command -v make-cli` (Bash). If found, run `make-cli whoami` to verify authentication. If both succeed, invoke tools via:
   `make-cli <category> <action> --flag=value --output=json`.
2. **MCP (fallback).** If no CLI, check whether the `make` MCP server is connected and call tools natively.
3. **Neither available.** Ask the user to install the Make CLI (`brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`, then `make-cli login`) or to configure the Make MCP server (`https://mcp.make.com`).

All tool names used below (`app-module_get`, `rpc_execute`, `validate_module_configuration`, `connections_list`, `credential_requests_create`, etc.) exist in both interfaces. See **make-interface-reference** for the full MCP↔CLI mapping and invocation syntax.
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
This skill uses the Make MCP server. Tool names referenced below (`app-module_get`, `rpc_execute`, `validate_module_configuration`, `connections_list`, `credential_requests_create`, etc.) are MCP tools. See **make-interface-reference** for connection setup.
<!-- variant:mcp-only-end -->

```

Note the subtle difference from Task 8: the tool name list is tuned to what this skill actually references (connection and configuration tools), not scenario-level tools.

- [ ] **Step 3: Verify marker balance**

Run:

```bash
bash scripts/strip-variants.sh skills/ /tmp/strip-check
rm -rf /tmp/strip-check
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add skills/make-module-configuring/SKILL.md
git commit -m "feat(module-configuring): add interface selection preamble"
```

---

### Task 10: Update README.md for dual-interface positioning

Two-part change: (a) replace the three-skill description table to reference `make-interface-reference`; (b) replace the MCP-only setup section with a pair of sibling sections (CLI setup + MCP setup) and add an Interfaces overview.

**Files:**
- Modify: `README.md` (full rewrite)

- [ ] **Step 1: Overwrite README.md**

Replace the entire contents of `README.md` with:

```markdown
# make-skills

Expert skills for designing, building, and deploying [Make.com](https://www.make.com) automation scenarios — for Claude Code, Cursor, GitHub Copilot, and [other AI agents](https://skills.sh).

## Skills

| Skill | What it does |
|-------|-------------|
| **make-scenario-building** | End-to-end scenario design — app discovery, module selection, blueprint construction, routing, error handling, deployment |
| **make-module-configuring** | Module configuration workflow — parameter filling, connections, mapping, webhooks, data stores, IML expressions, validation |
| **make-interface-reference** | Reference for both interfaces — Make CLI and Make MCP server: install, auth, scopes, invocation mapping, troubleshooting |

## Interfaces

Skills work with two interchangeable interfaces; whichever is available is used, with the CLI preferred when both are present:

- **Make CLI** (recommended) — `brew install integromat/tap/make-cli` then `make-cli login`. Works with any agent that has shell/Bash access (Claude Code, Cursor, Windsurf, Cline, …).
- **Make MCP server** — configure `https://mcp.make.com` in the agent. Required for agents without shell access (Claude Desktop, claude.ai).

Both expose the same tool set — the CLI is generated from the same `MakeMCPTools` SDK definition that backs the MCP server. See the `make-interface-reference` skill for detection order, install, and syntax mapping.

## Prerequisites

- A [Make.com](https://www.make.com) account
- Active scenarios with on-demand scheduling (for MCP tool access)

## Installation

### Any Agent (via Open Agent Skills)

```bash
npx skills add integromat/make-skills
```

Installs all three skills into the agent's skills directory. Works with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, and [40+ other agents](https://skills.sh).

### Claude Code Plugin (Marketplace)

```bash
claude
/plugin marketplace add integromat/make-skills
/plugin install make-skills@make-marketplace
```

### Claude Code Plugin (Manual)

```bash
git clone https://github.com/integromat/make-skills.git
claude
/plugin add /path/to/make-skills
```

### Claude Desktop / Claude.ai

Download individual skills as zip files:

| Skill | Download |
|-------|----------|
| Scenario Building | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-building.zip) |
| Module Configuring | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-module-configuring.zip) |
| Interface Reference | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-interface-reference.zip) |

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-skills.zip).

> ZIP downloads target agents without shell access (Claude Desktop, claude.ai) and include MCP-only content (CLI sections and `cli-*.md` references are stripped). For CLI support, install via the Claude Code plugin or `npx skills add integromat/make-skills`.

### Manual Installation (Any Agent)

Copy the `skills/` directory into the agent's skills folder:

| Agent | Skills directory |
|-------|-----------------|
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |
| Cline | `.cline/skills/` |
| Generic | `.agents/skills/` |

## CLI Setup (Claude Code, Cursor, Windsurf, Cline, …)

Recommended for any agent with shell access.

1. Install:

    ```bash
    brew install integromat/tap/make-cli
    ```

    Or via npm:

    ```bash
    npm install -g @makehq/cli
    ```

2. Authenticate:

    ```bash
    make-cli login
    ```

3. Verify:

    ```bash
    make-cli whoami
    ```

Credentials are saved locally and reused by every `make-cli` invocation. For environment-variable or per-command-flag authentication, see the `make-interface-reference` skill.

## MCP Server Setup (Claude Desktop, claude.ai, …)

Required when the agent has no shell access.

### OAuth (Recommended)

Add to the agent's MCP configuration:

```json
{
  "mcpServers": {
    "make": {
      "type": "http",
      "url": "https://mcp.make.com"
    }
  }
}
```

On first use, the user authenticates through Make's OAuth consent screen.

### MCP Token

For granular access control (team/scenario-level filtering):

1. Generate a token in Make: Profile → API access → Add token
2. Select the `mcp:use` scope plus any additional scopes for resources to access (e.g., `scenarios:read`, `scenarios:write`, `connections:read`)
3. Configure:

    ```json
    {
      "mcpServers": {
        "make": {
          "type": "http",
          "url": "https://<MAKE_ZONE>/mcp/u/<MCP_TOKEN>"
        }
      }
    }
    ```

Replace `<MAKE_ZONE>` with the hosting zone (e.g., `eu1.make.com`) and `<MCP_TOKEN>` with the token.

### Access Control (Token Auth)

Restrict access via URL query parameters:

- Organization: `?organizationId=<id>`
- Team: `?teamId=<id>`
- Scenario: `?scenarioId=<id>` or `?scenarioId[]=<id1>&scenarioId[]=<id2>`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `make-cli: command not found` | Install via `brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`. |
| `make-cli whoami` returns "not logged in" | Run `make-cli login`. |
| MCP server not connecting | Check network connectivity to Make servers. |
| No scenarios available | Set scenarios to active + on-demand scheduling. |
| Permission denied | Check token scopes (`mcp:use`). |
| Timeout errors | Use SSE transport, reduce scenario complexity. |

For Claude Code: run `claude --debug` for detailed MCP connection logs.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for dual CLI/MCP interface support"
```

---

### Task 11: Update CLAUDE.md

Two changes: project overview paragraph, and a new "Build variants" subsection documenting the variant markers.

**Files:**
- Modify: `CLAUDE.md` (two in-place edits)

- [ ] **Step 1: Update the Project Overview paragraph**

Replace the current Project Overview paragraph:

```markdown
## Project Overview

**make-skills** provides expert skills for designing, building, and deploying Make.com automation scenarios. Distributed as both a Claude Code plugin and as Open Agent Skills (compatible with 40+ AI agents via `npx skills add integromat/make-skills`). Published by Make under MIT license.

The skills connect to the remote Make MCP server:

- **`make`** — Make.com's hosted MCP server at `https://mcp.make.com`. Provides tools for app discovery, module configuration, connections, webhooks, data stores, and scenario lifecycle. Authenticated via OAuth (default) or MCP token.
```

with:

```markdown
## Project Overview

**make-skills** provides expert skills for designing, building, and deploying Make.com automation scenarios. Skills work with two interchangeable interfaces — the Make CLI (preferred when the agent has shell access) and the Make MCP server (required for shell-less environments like Claude Desktop and claude.ai). Distributed as both a Claude Code plugin and as Open Agent Skills (compatible with 40+ AI agents via `npx skills add integromat/make-skills`). Published by Make under MIT license.

The skills connect to Make via one of:

- **Make CLI (`@makehq/cli`)** — a local binary installed via Homebrew, npm, or binary release. Authenticated once via `make-cli login`; credentials stored at `~/.config/make-cli/config.json`. Invoked by the agent through Bash.
- **Make MCP server (`https://mcp.make.com`)** — Make's hosted MCP service. Authenticated via OAuth (default) or MCP token. Used when the agent has no shell access or when the CLI is not installed.

The CLI is built from the same `MakeMCPTools` SDK definition as the MCP server, so every MCP tool has a matching `make-cli` subcommand. There is no capability gap between the two interfaces.
```

- [ ] **Step 2: Update skill table entry and description**

Find in CLAUDE.md:

```
  make-mcp-reference/      # MCP config & troubleshooting (1 reference file)
    SKILL.md
    references/transport-details.md
```

Replace with:

```
  make-interface-reference/ # CLI & MCP config + troubleshooting (3 reference files)
    SKILL.md
    references/
      cli-install-and-auth.md
      mcp-install-and-auth.md
      tool-invocation-mapping.md
      transport-details.md
```

Find in CLAUDE.md (the skills section):

```
### make-mcp-reference

MCP server configuration, OAuth vs token auth, scopes, troubleshooting connection issues. Activated when users ask about MCP setup, tokens, OAuth, or connection errors.

Reference: `references/transport-details.md`
```

Replace with:

```
### make-interface-reference

Reference for both interfaces: Make CLI install/auth, Make MCP server OAuth/token auth, scopes, tool-invocation mapping, and troubleshooting. Activated when users ask about CLI install, `make-cli`, MCP setup, tokens, OAuth, connection errors, or which interface to use.

References: `cli-install-and-auth.md`, `mcp-install-and-auth.md`, `tool-invocation-mapping.md`, `transport-details.md`
```

- [ ] **Step 3: Add Build variants section**

After the existing "### Modifying MCP configuration" section under "Working with This Repository", insert:

```markdown
### Build variants

`build.sh` produces MCP-only ZIPs in `dist/` by running `scripts/strip-variants.sh` on a copy of `skills/` before zipping. The source tree (`skills/`) is the full CLI+MCP variant, consumed directly by plugin install and `npx skills add`.

Marker pairs in SKILL.md files:

- `<!-- variant:cli-start -->...<!-- variant:cli-end -->` — CLI-specific content. Visible in source; stripped from ZIPs.
- `<!-- variant:mcp-only-start -->...<!-- variant:mcp-only-end -->` — short fallback text (kept in both variants; only the marker lines are removed by the stripper).

File-level: `references/cli-*.md` files are deleted when building ZIPs. MCP-related reference files are always kept.

The stripper fails the build if any SKILL.md has unbalanced variant markers. Run `bash scripts/test-strip-variants.sh` to verify the stripper itself.

When adding CLI-only content, wrap it in `variant:cli-*` markers. Prefer keeping `variant:mcp-only-*` blocks short (a sentence or two) since they are visible to plugin/npx consumers alongside CLI content.
```

- [ ] **Step 4: Update the Releasing a new version section**

Find:

```markdown
### Releasing a new version

1. Run `npm run release` — bumps version in `package.json`, `plugin.json`, `marketplace.json`, and all `skills/*/SKILL.md` frontmatter, then runs `build.sh`
2. Publish versioned artifacts: `gh release create v${VERSION} dist/*-v${VERSION}.zip`
```

Replace with:

```markdown
### Releasing a new version

1. Run `bash scripts/test-strip-variants.sh` — sanity-check the stripper is working.
2. Run `npm run release` — bumps version in `package.json`, `plugin.json`, `marketplace.json`, and all `skills/*/SKILL.md` frontmatter, then runs `build.sh` (which strips CLI content before zipping).
3. Publish versioned artifacts: `gh release create v${VERSION} dist/*-v${VERSION}.zip`
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for dual interface and build variants"
```

---

### Task 12: Update plugin.json and marketplace.json descriptions

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Update plugin.json description**

Replace in `.claude-plugin/plugin.json`:

```json
  "description": "Expert skills for designing, building, and deploying Make.com automation scenarios — for Claude Code and other AI agents",
```

with:

```json
  "description": "Expert skills for designing, building, and deploying Make.com automation scenarios via the Make CLI or MCP server — for Claude Code and other AI agents",
```

- [ ] **Step 2: Update marketplace.json descriptions**

Replace the two description fields in `.claude-plugin/marketplace.json`:

```json
  "description": "Design, build, and deploy Make.com automation scenarios using expert skills — directly from Claude Code",
```

with:

```json
  "description": "Design, build, and deploy Make.com automation scenarios using expert skills — via the Make CLI or MCP server",
```

And:

```json
      "description": "Expert skills for scenario architecture, module configuration, and MCP troubleshooting",
```

with:

```json
      "description": "Expert skills for scenario architecture, module configuration, and Make CLI/MCP troubleshooting",
```

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "docs: update plugin/marketplace descriptions for dual interface"
```

---

### Task 13: Update package.json description and keywords

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update description**

Replace in `package.json`:

```json
  "description": "Expert skills for designing, building, and deploying Make.com automation scenarios — for Claude Code, Cursor, GitHub Copilot, and other AI agents",
```

with:

```json
  "description": "Expert skills for designing, building, and deploying Make.com automation scenarios via the Make CLI or MCP server — for Claude Code, Cursor, GitHub Copilot, and other AI agents",
```

- [ ] **Step 2: Update keywords**

Replace the `keywords` array in `package.json`:

```json
  "keywords": [
    "agent-skills",
    "skills",
    "make",
    "mcp",
    "automation",
    "scenarios",
    "integration",
    "workflow",
    "blueprint",
    "no-code",
    "claude-code",
    "cursor",
    "github-copilot",
    "ai-agents"
  ],
```

with:

```json
  "keywords": [
    "agent-skills",
    "skills",
    "make",
    "make-cli",
    "mcp",
    "automation",
    "scenarios",
    "integration",
    "workflow",
    "blueprint",
    "no-code",
    "claude-code",
    "cursor",
    "github-copilot",
    "ai-agents"
  ],
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(package): add make-cli keyword, update description"
```

---

### Task 14: Verify CLI subcommand mapping against live make-cli

The tool-invocation-mapping table in Task 6 was derived from the `make-cli` source layout. Before tagging a release, verify each mapped command actually exists in the installed CLI.

**Files:** None (verification only).

- [ ] **Step 1: Install make-cli locally for verification**

Run:

```bash
npm install -g @makehq/cli
make-cli --version
```

Expected: prints a version string.

If the preferred install is Homebrew:

```bash
brew install integromat/tap/make-cli
```

- [ ] **Step 2: Produce a flat list of mapped CLI commands**

From `skills/make-interface-reference/references/tool-invocation-mapping.md`, extract each `make-cli <category> <action>` pair from the table. For each one, run:

```bash
make-cli <category> --help | grep -E '^\s*<action>'
```

For example:

```bash
make-cli apps --help | grep -E '^\s*recommend'
make-cli app-modules --help | grep -E '^\s*list'
make-cli app-documentation --help | grep -E '^\s*get'
make-cli app-module --help | grep -E '^\s*get'
make-cli rpc --help | grep -E '^\s*execute'
make-cli validate --help | grep -E '^\s*(module-configuration|blueprint-schema)'
make-cli extract --help | grep -E '^\s*blueprint-components'
make-cli connections --help | grep -E '^\s*list'
make-cli credential-requests --help | grep -E '^\s*(create|get)'
make-cli hooks --help | grep -E '^\s*(list|create)'
make-cli data-stores --help | grep -E '^\s*(list|create)'
make-cli data-structures --help | grep -E '^\s*(list|create)'
make-cli scenarios --help | grep -E '^\s*(create|update|activate|deactivate|run)'
make-cli executions --help | grep -E '^\s*(list|get)'
make-cli scenario-scheduling --help | grep -E '^\s*update'
make-cli keys --help | grep -E '^\s*list'
```

Expected: each grep matches a line indicating the action exists.

- [ ] **Step 2a: Reconcile any mismatches**

If any command returns no match:

1. Inspect the category's full help: `make-cli <category> --help`.
2. Find the closest-matching action.
3. Update the table in `skills/make-interface-reference/references/tool-invocation-mapping.md` to reflect the actual name.
4. If a mapped MCP tool has no CLI equivalent (unexpected, but possible), mark it in the table as "MCP only — no CLI equivalent available yet."

- [ ] **Step 3: If the mapping file was updated, commit**

```bash
git add skills/make-interface-reference/references/tool-invocation-mapping.md
git commit -m "docs(interface-reference): reconcile tool mapping with make-cli --help output"
```

If no updates were needed, skip the commit.

---

### Task 15: End-to-end build verification

Run the full build and inspect ZIP contents to confirm CLI content is excluded.

**Files:** None (verification only).

- [ ] **Step 1: Run the full build**

Run:

```bash
rm -rf dist/
bash build.sh
```

Expected: clean build, all ZIPs listed, no errors.

- [ ] **Step 2: Verify ZIP filenames**

Run:

```bash
ls dist/
```

Expected output includes:

```
make-interface-reference-v0.1.3.zip
make-interface-reference.zip
make-module-configuring-v0.1.3.zip
make-module-configuring.zip
make-scenario-building-v0.1.3.zip
make-scenario-building.zip
make-skills-v0.1.3.zip
make-skills.zip
```

- [ ] **Step 3: Verify CLI content is absent from ZIPs**

Extract the interface-reference ZIP and inspect:

```bash
TMP=$(mktemp -d)
unzip -q dist/make-interface-reference.zip -d "$TMP"
echo "--- SKILL.md ---"
grep -c 'make-cli' "$TMP/make-interface-reference/SKILL.md" || true
grep -c 'variant:cli' "$TMP/make-interface-reference/SKILL.md" || true
echo "--- references ---"
ls "$TMP/make-interface-reference/references/"
rm -rf "$TMP"
```

Expected:
- `make-cli` count in SKILL.md is **0** (CLI block stripped).
- `variant:cli` marker count is **0**.
- References directory contains `mcp-install-and-auth.md`, `transport-details.md`, `tool-invocation-mapping.md`; does **not** contain any `cli-*.md` file.

- [ ] **Step 4: Verify CLI content is present in source tree**

Run:

```bash
grep -c 'variant:cli-start' skills/make-interface-reference/SKILL.md
grep -c 'make-cli' skills/make-interface-reference/SKILL.md
ls skills/make-interface-reference/references/
```

Expected:
- `variant:cli-start` count ≥ 1 (source still has markers).
- `make-cli` count ≥ 1 (source still has CLI content).
- References directory contains `cli-install-and-auth.md` plus the other files.

- [ ] **Step 5: Verify building skills also had CLI content stripped in ZIPs**

Run:

```bash
TMP=$(mktemp -d)
unzip -q dist/make-scenario-building.zip -d "$TMP"
grep -c 'make-cli' "$TMP/make-scenario-building/SKILL.md" || true
grep -c 'variant:cli' "$TMP/make-scenario-building/SKILL.md" || true
rm -rf "$TMP"
```

Expected: both counts are **0**.

- [ ] **Step 6: Run strip-variants test suite**

```bash
bash scripts/test-strip-variants.sh
```

Expected: "All strip-variants tests passed."

- [ ] **Step 7: No commit (verification only)**

If step 5 or step 3 showed any CLI content leaking, go back and find the root cause in `strip-variants.sh` or the affected SKILL.md (likely a typo in marker names).

---

### Task 16: Bump version to 0.2.0

The rename plus dual-interface support is a minor-version change. Use the repo's release script for consistency across all bumpFiles.

**Files:**
- Modify: `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, all `skills/*/SKILL.md` (via `commit-and-tag-version`)

- [ ] **Step 1: Dry-run the release**

Run:

```bash
npx commit-and-tag-version --release-as minor --dry-run
```

Expected: shows that version will bump from 0.1.3 → 0.2.0 across all bumpFiles listed in `.versionrc.json`.

- [ ] **Step 2: Check that all bumpFile paths exist**

Since `.versionrc.json` was updated in Task 2 to point to `skills/make-interface-reference/SKILL.md`, run:

```bash
for f in $(jq -r '.bumpFiles[].filename' .versionrc.json); do
  if [ -f "$f" ]; then
    echo "OK:  $f"
  else
    echo "MISSING: $f"
  fi
done
```

Expected: all `OK:` lines; no `MISSING:` lines.

- [ ] **Step 3: Perform the bump**

Run:

```bash
npx commit-and-tag-version --release-as minor
```

Expected: version bumped to 0.2.0 across `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and all `skills/*/SKILL.md` files. `commit-and-tag-version` creates a commit and a git tag `v0.2.0`.

- [ ] **Step 4: Rebuild with the new version**

Run:

```bash
bash build.sh
ls dist/ | grep v0.2.0
```

Expected: all ZIPs now carry `-v0.2.0` in their versioned filenames, plus stable aliases.

- [ ] **Step 5: Verify stripper still passes**

```bash
bash scripts/test-strip-variants.sh
```

Expected: "All strip-variants tests passed."

- [ ] **Step 6: No additional commit needed**

The bump commit was created by `commit-and-tag-version`. The rebuilt `dist/` stable aliases will be committed as part of the release flow (existing repo convention; see `dist/` contents already tracked in main).

If `dist/` contents need to be committed as part of this plan, run:

```bash
git add dist/
git commit -m "chore(release): rebuild dist/ for v0.2.0"
```

Otherwise, skip.

---

### Task 17: Final review and push

**Files:** None (review + push).

- [ ] **Step 1: Review commit history**

Run:

```bash
git log --oneline origin/main..HEAD
```

Expected: a clean series of feat/docs/chore commits covering the tasks above, plus the bump commit and tag from Task 16.

- [ ] **Step 2: Verify ZIPs one more time**

```bash
bash scripts/test-strip-variants.sh
bash build.sh
TMP=$(mktemp -d)
unzip -q dist/make-interface-reference.zip -d "$TMP"
grep -rc 'make-cli' "$TMP/" | grep -v ':0' || echo "CLEAN: no make-cli leakage"
rm -rf "$TMP"
```

Expected: "CLEAN: no make-cli leakage" (and the `tool-invocation-mapping.md` file, which is intentionally kept and does mention `make-cli`, is **not** considered leakage — the CLI mapping is intentional content in the MCP-only variant too). If the script prints files from `tool-invocation-mapping.md`, that is expected — only SKILL.md files and `cli-*.md` files should be affected by stripping.

Revised check:

```bash
TMP=$(mktemp -d)
unzip -q dist/make-interface-reference.zip -d "$TMP"
grep -l 'make-cli' "$TMP/make-interface-reference/SKILL.md" && echo "FAIL: CLI leaked into SKILL.md" || echo "OK: SKILL.md clean"
[ -f "$TMP/make-interface-reference/references/cli-install-and-auth.md" ] && echo "FAIL: cli-*.md not deleted" || echo "OK: cli-*.md deleted"
rm -rf "$TMP"
```

Expected: both lines print "OK: …".

- [ ] **Step 3: Push branch and tag**

```bash
git push origin main
git push origin v0.2.0
```

Expected: remote accepts both the commit range and the new tag.

- [ ] **Step 4: Publish release artifacts (optional, per repo convention)**

If the repo follows the convention of attaching versioned ZIPs to GitHub Releases:

```bash
gh release create v0.2.0 dist/*-v0.2.0.zip \
  --title "v0.2.0 — dual CLI/MCP interface" \
  --notes "Adds Make CLI support alongside the MCP server. Renames make-mcp-reference to make-interface-reference. MCP-only ZIPs strip CLI content automatically via scripts/strip-variants.sh."
```

Expected: release created with 4 attached ZIPs.

- [ ] **Step 5: Done**

Inform the user: plan complete, v0.2.0 released with dual CLI/MCP support; invite them to verify against skills.sh directory (manual action outside this plan).
