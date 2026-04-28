# make-skills

Expert skills for designing, building, and deploying [Make.com](https://www.make.com) automation scenarios — for Claude Code, Cursor, GitHub Copilot, and [other AI agents](https://skills.sh).

## Skills

| Skill | What it does |
|-------|-------------|
| **make-scenario-building** | End-to-end scenario design — app discovery, module selection, blueprint construction, routing, error handling, deployment |
| **make-module-configuring** | Module configuration workflow — parameter filling, connections, mapping, webhooks, data stores, IML expressions, validation |
| **make-mcp-reference** | MCP server reference — configuration, OAuth/token auth, scopes, troubleshooting |

## Prerequisites

- A [Make.com](https://www.make.com) account
- Active scenarios with on-demand scheduling (for MCP tool access)

## Installation

### Any Agent (via Open Agent Skills)

```bash
npx skills add integromat/make-skills
```

Installs all three skills into your agent's skills directory. Works with Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, and [40+ other agents](https://skills.sh).

### Codex

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make-skills`.

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
| MCP Reference | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-mcp-reference.zip) |

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-skills.zip) with all 3 skills + MCP config.

### Manual Installation (Any Agent)

Copy the `plugins/make-skills/skills/` directory into your agent's skills folder:

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
