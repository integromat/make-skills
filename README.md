# Make Skills for AI Coding Agents

Give your AI coding agent deep Make expertise — for building, explaining, running and debugging Make scenarios through Make's scenario-management MCP server. Works with any agent that reads skill folders and speaks MCP — Claude Code, Codex, Cursor, GitHub Copilot, Windsurf, Cline, and others.

## Skills

| Skill | What it does |
|-------|-------------|
| **make-scenario-reference** | The conventions every tool shares — scopes, the data/remark contract, structure vs configuration, the one-save write model, and what the surface refuses to author — for when a tool answers 403 or refuses something |
| **make-scenario-explore** | Orienting in an account — organizations, teams, listing scenarios, explaining what one does, connection health, account-wide checks |
| **make-scenario-building** | Creating and editing scenarios — app and module discovery, connections, resolving account-dependent values, flow control, error handling, subscenarios, AI agents; with references and complete examples |
| **make-scenario-operations** | Running, activating and deactivating, reviewing and debugging executions, investigating a webhook |
| **make-api-shell** | A reusable API-call or HTTP shell scenario used as a retrieval transport into a SaaS account (email, CRM, tickets) |

## Prerequisites

- A [Make](https://www.make.com) account

## Installation

There are two pieces, and both are needed: the **skills** (the expertise) and the **MCP server** (the tools the skills drive).

### 1. Install the skills

**By hand — copy the folders**

Clone the repository and copy the contents of `skills/` into your agent's skills folder:

```bash
git clone --branch v2 https://github.com/integromat/make-skills.git
cp -r make-skills/skills/* <your-agent-skills-directory>/
```

| Agent | Skills directory |
|-------|-----------------|
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |
| Cline | `.cline/skills/` |
| Generic | `.agents/skills/` |

**By upload — download zips**

For agents that take skills as uploads (Claude Cowork, Claude Chat, and similar), download a skill and upload it to your project:

| Skill | Download |
|-------|----------|
| Scenario Reference | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-reference.zip) |
| Scenario Explore | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-explore.zip) |
| Scenario Building | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-building.zip) |
| Scenario Operations | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-operations.zip) |
| API Shell | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-api-shell.zip) |

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-skills.zip) with all skills plus the MCP config.

### 2. Add the MCP server

The skills target Make's scenario-management MCP server at `https://mcp.make.com/v2`, over HTTP.

**Claude Code**

```bash
claude mcp add --transport http make https://mcp.make.com/v2
```

**Codex**

```bash
codex mcp add make --url https://mcp.make.com/v2
codex mcp login make
```

**Any agent with a JSON MCP config**

Add the server to the agent's MCP configuration file:

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

Open pull requests against **`main`** — that's the trunk. Use squash merges and Conventional Commit PR titles (`feat:`, `fix:`, `docs:`, …), since release-please relies on them. A separate `latest` branch is fast-forwarded to each released tag, so `main` can carry reviewed-but-unreleased commits.

## License

MIT
