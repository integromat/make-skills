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
