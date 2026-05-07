# Make Skills for AI Coding Agents

Give your AI coding agent deep Make expertise — for building workflow automation and Make AI Agents. Works with Claude Code and Codex via dedicated plugins, and with Cursor, GitHub Copilot, Windsurf, Cline, and [40+ other agents](https://skills.sh) via the [Open Agent Skills](https://skills.sh) protocol.

> **Recommended:** The Claude Code plugin gives the best experience — skills and MCP server load automatically, with no manual setup.

## Skills

| Skill | What it does |
|-------|-------------|
| **make-scenario-building** | End-to-end scenario design — app discovery, module selection, blueprint construction, routing, error handling, deployment |
| **make-module-configuring** | Module configuration workflow — parameter filling, connections, mapping, webhooks, data stores, IML expressions, validation |
| **make-mcp-reference** | MCP server reference — configuration, OAuth/token auth, scopes, troubleshooting |
| **make-api-shell-connection-workflow** | Reusable Make API-call shell provisioning — app discovery, connection request/reuse, interface setup, shell execution, SaaS retrieval transport |

## Prerequisites

- A [Make](https://www.make.com) account
- Active scenarios with on-demand scheduling (for MCP tool access)

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
| Scenario Building | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-building.zip) |
| Module Configuring | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-module-configuring.zip) |
| MCP Reference | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-mcp-reference.zip) |
| API Shell + Connection Workflow | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-api-shell-connection-workflow.zip) |

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-skills.zip) with all 4 skills + MCP config.

### Codex

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make-skills`.

If the MCP server is not registered automatically after install, add it manually:

```bash
codex mcp add make --url https://mcp.make.com
codex mcp login make
```

### Cursor, GitHub Copilot, Windsurf, Cline, and others (via Open Agent Skills)

```bash
npx skills add integromat/make-skills
```

Installs all four skills into your agent's skills directory. Works with any agent that supports the [Open Agent Skills](https://skills.sh) protocol — Cursor, GitHub Copilot, Windsurf, Cline, and [40+ others](https://skills.sh). Technical setup required.

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

### OAuth (Recommended)

Add to your agent's MCP configuration:

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
2. Select the `mcp:use` scope plus any additional scopes for resources you want to access (e.g., `scenarios:read`, `scenarios:write`, `connections:read`)
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
