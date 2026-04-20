# Open Agent Skills Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the make-skills repository fully compatible with the Open Agent Skills ecosystem (skills.sh / `npx skills`) while preserving Claude Code plugin functionality — no code duplication, single repo.

**Architecture:** The repo already uses the correct structure (`skills/<name>/SKILL.md` with YAML frontmatter). Changes are: (1) enrich SKILL.md frontmatter with optional spec fields for discoverability, (2) rewrite README to be agent-agnostic with multiple installation paths, (3) update package.json for npm/skills ecosystem, (4) update CLAUDE.md to reflect dual-purpose nature, (5) verify and submit to skills.sh.

**Tech Stack:** Markdown, YAML frontmatter, npm/package.json, `npx skills` CLI, GitHub

---

### Task 1: Enrich SKILL.md Frontmatter — make-scenario-building

The Open Agent Skills spec supports optional fields (`license`, `compatibility`, `metadata`) that improve discoverability on skills.sh. Add them to each SKILL.md without breaking the existing Claude Code plugin behavior (Claude Code ignores unknown frontmatter fields).

**Files:**
- Modify: `skills/make-scenario-building/SKILL.md:1-4`

- [ ] **Step 1: Update frontmatter**

Replace the existing frontmatter block (lines 1-4) with:

```yaml
---
name: make-scenario-building
description: This skill should be used when designing Make scenarios, choosing which modules to use, composing module flows, setting up routing/branching/filtering/iterations/aggregations, building blueprints, deploying scenarios, handling errors, configuring scheduling and triggers, or discussing scenario architecture. Covers WHICH modules to use and WHY — complementary to make-module-configuring which covers HOW to configure each module.
license: MIT
compatibility: Requires Make.com MCP server connection (https://mcp.make.com). Works with any AI agent that supports MCP tool calling.
metadata:
  author: Make
  version: 0.1.1
  tags: make automation scenarios workflow blueprint no-code mcp integration
---
```

- [ ] **Step 2: Verify SKILL.md still loads correctly**

Open the file, confirm the body content below the frontmatter is unchanged. The `---` delimiters must be exact — no extra blank lines inside the frontmatter block.

- [ ] **Step 3: Commit**

```bash
git add skills/make-scenario-building/SKILL.md
git commit -m "feat: enrich make-scenario-building SKILL.md frontmatter for Open Agent Skills"
```

---

### Task 2: Enrich SKILL.md Frontmatter — make-module-configuring

**Files:**
- Modify: `skills/make-module-configuring/SKILL.md:1-4`

- [ ] **Step 1: Update frontmatter**

Replace the existing frontmatter block (lines 1-4) with:

```yaml
---
name: make-module-configuring
description: This skill should be used when configuring Make module parameters, assigning connections, mapping data between modules, setting up webhooks or data stores in modules, working with IML expressions, handling keys, or defining data structures for module inputs/outputs. Covers the practical HOW of module configuration — complementary to make-scenario-building which covers WHICH modules to use and WHY.
license: MIT
compatibility: Requires Make.com MCP server connection (https://mcp.make.com). Works with any AI agent that supports MCP tool calling.
metadata:
  author: Make
  version: 0.1.1
  tags: make automation modules configuration webhook data-store mcp integration
---
```

- [ ] **Step 2: Verify SKILL.md still loads correctly**

Open the file, confirm the body content below the frontmatter is unchanged.

- [ ] **Step 3: Commit**

```bash
git add skills/make-module-configuring/SKILL.md
git commit -m "feat: enrich make-module-configuring SKILL.md frontmatter for Open Agent Skills"
```

---

### Task 3: Enrich SKILL.md Frontmatter — make-mcp-reference

**Files:**
- Modify: `skills/make-mcp-reference/SKILL.md:1-4`

- [ ] **Step 1: Update frontmatter**

Replace the existing frontmatter block (lines 1-4) with:

```yaml
---
name: make-mcp-reference
description: This skill should be used when the user asks about "Make MCP server", "Make MCP tools", "MCP token", "Make OAuth", "scenario as tool", "MCP scopes", "Make API access", "connect Make to Claude", "scenario not appearing", "MCP timeout", "MCP connection refused", or discusses configuring, troubleshooting, or understanding the Make.com MCP server integration. Provides technical reference for connection methods, scopes, access control, and troubleshooting.
license: MIT
compatibility: Requires Make.com MCP server connection (https://mcp.make.com). Works with any AI agent that supports MCP tool calling.
metadata:
  author: Make
  version: 0.1.1
  tags: make mcp oauth token troubleshooting connection authentication
---
```

- [ ] **Step 2: Verify SKILL.md still loads correctly**

Open the file, confirm the body content below the frontmatter is unchanged.

- [ ] **Step 3: Commit**

```bash
git add skills/make-mcp-reference/SKILL.md
git commit -m "feat: enrich make-mcp-reference SKILL.md frontmatter for Open Agent Skills"
```

---

### Task 4: Update package.json for Open Agent Skills Ecosystem

Remove `private: true` so the repo is discoverable by npm-based skill tools (skills-npm, npm-agentskills). Update the description to be agent-agnostic. Add an `agents` field pointing to the skills for tools that scan package.json.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update package.json**

Replace the entire content of `package.json` with:

```json
{
  "name": "make-skills",
  "version": "0.1.1",
  "description": "Agent skills for building, configuring, and deploying Make.com automation scenarios via MCP",
  "keywords": [
    "make",
    "mcp",
    "automation",
    "scenarios",
    "integration",
    "workflow",
    "blueprint",
    "no-code",
    "agent-skills",
    "skill"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/integromat/make-skills"
  },
  "homepage": "https://www.make.com",
  "author": {
    "name": "Make",
    "email": "support@make.com",
    "url": "https://www.make.com"
  },
  "agents": {
    "skills": [
      { "name": "make-scenario-building", "path": "./skills/make-scenario-building" },
      { "name": "make-module-configuring", "path": "./skills/make-module-configuring" },
      { "name": "make-mcp-reference", "path": "./skills/make-mcp-reference" }
    ]
  },
  "scripts": {
    "release": "commit-and-tag-version && bash build.sh"
  },
  "devDependencies": {
    "commit-and-tag-version": "12.7.1"
  }
}
```

Key changes:
- Removed `"private": true`
- Updated `description` to be agent-agnostic (not "Claude Code plugin")
- Added `keywords` including `agent-skills` and `skill`
- Added `license`, `repository`, `homepage`, `author` fields
- Added `agents.skills` array for npm-based skill discovery tools

- [ ] **Step 2: Verify release script still works**

Run: `npm run release -- --dry-run`
Expected: Version bump preview without actually committing. If `commit-and-tag-version` doesn't support `--dry-run`, just verify `npm run` lists the `release` script.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: update package.json for Open Agent Skills ecosystem discovery"
```

---

### Task 5: Rewrite README.md for Dual-Purpose Repo

The README currently positions the repo as "Claude Code plugin." Rewrite it to lead with the agent-agnostic value proposition, then show installation for all agents (npx skills, Claude Code plugin, manual), and keep all existing technical content.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md content**

```markdown
# make-skills

Agent skills for [Make.com](https://www.make.com) — design, build, and deploy automation scenarios using AI-assisted guidance via MCP.

Works with **Claude Code**, **Cursor**, **Windsurf**, **Cline**, **GitHub Copilot**, and [30+ other AI agents](https://skills.sh) that support the [Agent Skills](https://agentskills.io) standard.

## Skills

| Skill | What it does |
|-------|-------------|
| **make-scenario-building** | End-to-end scenario design — app discovery, module selection, blueprint construction, routing, branching, error handling, deployment |
| **make-module-configuring** | Module configuration workflow — interface reading, RPC resolution, parameter filling, connections, webhooks, data stores, IML, validation |
| **make-mcp-reference** | MCP server technical reference — OAuth/token auth, scopes, access control, troubleshooting |

## Prerequisites

- A [Make.com](https://www.make.com) account
- Active scenarios with on-demand scheduling (for MCP tool access)
- An AI agent with MCP support

## Installation

### Using npx skills (Any Agent)

```bash
npx skills add integromat/make-skills
```

This installs all 3 skills into your agent's skills directory. Works with Claude Code, Cursor, Windsurf, Cline, and others.

To install a specific skill:

```bash
npx skills add integromat/make-skills --skill make-scenario-building
```

### Claude Code Plugin (Recommended for Claude Code)

**From Marketplace:**

```bash
claude
/plugin marketplace add integromat/make-skills
/plugin install make-skills@make-marketplace
```

**Manual:**

```bash
git clone https://github.com/integromat/make-skills.git
claude
/plugin add /path/to/make-skills
```

### Download Individual Skills (Claude Desktop / Claude.ai)

| Skill | Download |
|-------|----------|
| Scenario Building | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-building.zip) |
| Module Configuring | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-module-configuring.zip) |
| MCP Reference | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-mcp-reference.zip) |

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-skills.zip) with all 3 skills + MCP config.

### Manual Installation (Any Agent)

Copy the `skills/` directory into your agent's skills folder:

| Agent | Skills directory |
|-------|-----------------|
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |
| Cline | `.cline/skills/` |
| Generic | `.agents/skills/` |

## MCP Server Setup

These skills work best with the Make MCP server connected. Add to your agent's MCP configuration:

### OAuth (Recommended)

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

On first use, you'll authenticate through Make's OAuth consent screen.

### MCP Token

For granular access control (team/scenario-level filtering):

1. Generate a token in Make: Profile → API access → Add token
2. Select the `mcp:use` scope
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

Replace `<MAKE_ZONE>` with your zone (e.g., `eu1.make.com`) and `<MCP_TOKEN>` with your token.

### Access Control (Token Auth)

Restrict access via URL query parameters:

- Organization: `?organizationId=<id>`
- Team: `?teamId=<id>`
- Scenario: `?scenarioId=<id>` or `?scenarioId[]=<id1>&scenarioId[]=<id2>`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP server not connecting | Check network connectivity to Make servers |
| No scenarios available | Set scenarios to active + on-demand scheduling |
| Permission denied | Check token scopes (`mcp:use`) |
| Timeout errors | Use SSE transport, reduce scenario complexity |

For Claude Code: run `claude --debug` for detailed MCP connection logs.

## License

MIT
```

- [ ] **Step 2: Review the rendered README**

Read through the complete file. Verify:
- All download links are correct (pointing to `main` branch `dist/` files)
- Installation instructions cover all agent types
- MCP configuration section is complete
- No broken markdown formatting

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for Open Agent Skills ecosystem compatibility"
```

---

### Task 6: Update CLAUDE.md to Reflect Dual-Purpose Nature

Update the project overview section in CLAUDE.md to reflect that this is now both a Claude Code plugin and an Open Agent Skills repo.

**Files:**
- Modify: `CLAUDE.md:5-8`

- [ ] **Step 1: Update the Project Overview section**

Replace the current Project Overview paragraph:

```markdown
## Project Overview

**make-skills** is a Claude Code plugin for Make.com MCP integration. It lets users run Make scenarios, manage automations, and get best-practice guidance directly from Claude Code. Published by Make under MIT license.
```

with:

```markdown
## Project Overview

**make-skills** provides agent skills for Make.com MCP integration — scenario building, module configuration, and MCP troubleshooting. Published by Make under MIT license.

The repo serves two distribution channels:
- **Open Agent Skills** — compatible with `npx skills add integromat/make-skills` and 30+ AI agents (Claude Code, Cursor, Windsurf, Cline, etc.)
- **Claude Code Plugin** — installable via marketplace or manual clone, with `.claude-plugin/` manifest and `.mcp.json`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md project overview for dual distribution"
```

---

### Task 7: Update plugin.json Description

Make the plugin description agent-agnostic to match the new positioning.

**Files:**
- Modify: `.claude-plugin/plugin.json:4`

- [ ] **Step 1: Update description**

Change the `description` field from:

```json
"description": "Design, build, and deploy Make.com automation scenarios using expert skills — directly from Claude Code",
```

to:

```json
"description": "Agent skills for designing, building, and deploying Make.com automation scenarios via MCP",
```

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "docs: update plugin.json description to be agent-agnostic"
```

---

### Task 8: Update .versionrc.json to Bump SKILL.md Metadata Versions

Since we added `version` to SKILL.md metadata, the version bumper should update those too. However, YAML frontmatter in markdown files is non-trivial to bump automatically — and the `metadata.version` field is informational only (not used for resolution). 

**Decision:** Skip automatic bumping for SKILL.md metadata versions. Instead, add a note in the build script or CLAUDE.md reminding to update them manually during releases. This avoids overengineering.

**Files:**
- Modify: `CLAUDE.md` (add a note under "Working with This Repository")

- [ ] **Step 1: Add version bump reminder**

After the existing "Modifying MCP configuration" section in CLAUDE.md, add:

```markdown
### Releasing a new version

1. Run `npm run release` — bumps version in `package.json`, `plugin.json`, `marketplace.json` and runs `build.sh`
2. Manually update `metadata.version` in each `skills/*/SKILL.md` frontmatter to match
3. Publish versioned artifacts: `gh release create v${VERSION} dist/*-v${VERSION}.zip`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add release process with SKILL.md version reminder"
```

---

### Task 9: Verify Open Agent Skills Compatibility

Test that `npx skills` can discover and install the skills from the local repo.

**Files:** None (verification only)

- [ ] **Step 1: List discoverable skills from local repo**

Run:
```bash
npx skills add ./  --list
```

Expected output: All 3 skills listed (`make-scenario-building`, `make-module-configuring`, `make-mcp-reference`).

If `--list` is not supported, try:
```bash
npx skills add ./ --all --dry-run
```

Or simply inspect that the directory structure matches the spec:
```bash
# Verify each skill directory name matches its SKILL.md name field
for skill in skills/*/SKILL.md; do
  dir_name=$(basename $(dirname "$skill"))
  yaml_name=$(head -5 "$skill" | grep '^name:' | sed 's/name: *//')
  if [ "$dir_name" = "$yaml_name" ]; then
    echo "OK: $dir_name"
  else
    echo "MISMATCH: dir=$dir_name yaml=$yaml_name"
  fi
done
```

Expected: All 3 show "OK".

- [ ] **Step 2: Validate YAML frontmatter**

Run:
```bash
for skill in skills/*/SKILL.md; do
  echo "=== $(basename $(dirname "$skill")) ==="
  # Extract frontmatter (between --- delimiters)
  sed -n '/^---$/,/^---$/p' "$skill" | head -20
  echo ""
done
```

Expected: Each shows `name`, `description`, `license`, `compatibility`, and `metadata` fields with valid YAML.

- [ ] **Step 3: Verify SKILL.md line counts are under 500**

Run:
```bash
wc -l skills/*/SKILL.md
```

Expected: Each file under 500 lines (Open Agent Skills spec recommendation).

- [ ] **Step 4: Commit (no changes expected — verification only)**

No commit needed unless fixes were required.

---

### Task 10: Submit to skills.sh

After all changes are pushed to `main` on GitHub, submit the repo to the skills.sh directory.

**Files:** None (external action)

- [ ] **Step 1: Push all changes to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Submit via npx skills (automatic discovery)**

Run:
```bash
TMPDIR=$(mktemp -d) && cd "$TMPDIR" && npx skills add integromat/make-skills --yes && rm -rf "$TMPDIR"
```

This triggers indexing on the skills.sh leaderboard.

- [ ] **Step 3: Submit via skills.sh web (manual verification)**

1. Navigate to https://skills.sh
2. Look for a "Submit" or "Add" option
3. Enter `https://github.com/integromat/make-skills`
4. Wait for the analysis/security scan to complete

- [ ] **Step 4: Verify listing**

Check https://skills.sh/trending and search for "make-skills" or "make-scenario-building". It may take some time to appear.
