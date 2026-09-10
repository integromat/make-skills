# Make Skills for AI Coding Agents

Give your AI coding agent deep Make expertise — for building, explaining, running and debugging Make scenarios through Make's scenario-management MCP server. Works with Claude Code and Codex via dedicated plugins, and with Cursor, GitHub Copilot, Windsurf, Cline, and [40+ other agents](https://skills.sh) via the [Open Agent Skills](https://skills.sh) protocol.

> **Recommended:** The Claude Code plugin gives the best experience — skills and MCP server load automatically, with no manual setup.

## Skills

| Skill | What it does |
|-------|-------------|
| **make-scenario-reference** | Load first — the conventions every tool shares: scopes, the data/remark contract, structure vs configuration, the one-save write model, and what the surface refuses to author |
| **make-scenario-explore** | Orienting in an account — organizations, teams, listing scenarios, explaining what one does, connection health, account-wide checks |
| **make-scenario-building** | Creating and editing scenarios — app and module discovery, connections, resolving account-dependent values, flow control, error handling, subscenarios, AI agents; with references and complete examples |
| **make-scenario-operations** | Running, activating and deactivating, reviewing and debugging executions, investigating a webhook |
| **make-api-shell** | A reusable API-call or HTTP shell scenario used as a retrieval transport into a SaaS account (email, CRM, tickets) |

## Prerequisites

- A [Make](https://www.make.com) account

## Installation

### Claude Code Plugin ⭐ Recommended

```bash
claude
/plugin marketplace add integromat/make-skills
/plugin install make-skills@make-marketplace
```

Skills and MCP server load automatically — nothing to configure manually.

### Claude Code Plugin (Manual)

```bash
git clone https://github.com/integromat/make-skills.git
claude
/plugin add /path/to/make-skills
```

### Claude Cowork / Claude Chat

Download individual skills as zip files and upload to your project:

| Skill | Download |
|-------|----------|
| Scenario Reference | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-reference.zip) |
| Scenario Explore | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-explore.zip) |
| Scenario Building | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-building.zip) |
| Scenario Operations | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-operations.zip) |
| API Shell | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-api-shell.zip) |

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-skills.zip) with all skills + MCP config.

### Codex

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make-skills`.

If the MCP server is not registered automatically after install, add it manually:

```bash
codex mcp add make --url https://mcp.make.com/v2
codex mcp login make
```

### Cursor, GitHub Copilot, Windsurf, Cline, and others (via Open Agent Skills)

```bash
npx skills add integromat/make-skills
```

Installs all five skills into your agent's skills directory. Works with any agent that supports the [Open Agent Skills](https://skills.sh) protocol — Cursor, GitHub Copilot, Windsurf, Cline, and [40+ others](https://skills.sh). Technical setup required.

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

The skills target Make's scenario-management MCP server. Add it to your agent's MCP configuration:

```json
{
  "mcpServers": {
    "make": {
      "type": "http",
      "url": "https://mcp.make.com/v2"
    }
  }
}
```

On first use, you'll authenticate through Make's OAuth consent screen. The server asks for one bundle of permissions and works only when every one of them is granted — if a tool answers with a permission error, reconnect and grant everything it asks for.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP server not connecting | Check network connectivity to Make servers |
| Permission denied / 403 | Reconnect the Make MCP server and grant every requested permission |
| A tool refuses to create something | Read the refusal — the surface deliberately cannot author data stores, custom functions or data structures; create those in the Make editor |

For Claude Code: run `claude --debug` for detailed MCP connection logs.

## Contributing

Open pull requests against **`main`** — that's the trunk. Use squash merges and Conventional Commit PR titles (`feat:`, `fix:`, `docs:`, …), since release-please relies on them. A separate `latest` branch is fast-forwarded to each released tag; the Claude Code plugin installs its content from there, so `main` can carry reviewed-but-unreleased commits without affecting that channel. Codex and `npx skills add` still track `main` HEAD directly.

## License

MIT
