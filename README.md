# make-skills

Claude Code plugin for [Make.com](https://www.make.com) MCP integration — run scenarios, manage automations, and get best practice guidance directly from Claude Code.

## Features

- **MCP Integration**: Make's hosted MCP server for app discovery, module configuration, connection management, and scenario lifecycle
- **Scenario Building Skill**: End-to-end scenario design methodology — app discovery, module selection, blueprint construction, and deployment
- **Module Configuring Skill**: 5-phase module configuration workflow — interface reading, RPC resolution, parameter filling, validation, and documentation
- **MCP Reference Skill**: Technical reference for Make MCP server configuration, OAuth/token auth, and troubleshooting

## Prerequisites

- A [Make.com](https://www.make.com) account
- Active scenarios with on-demand scheduling (for MCP tool access)

## Installation

### Method 1: Plugin Installation (Recommended)

```bash
# Install directly as a Claude Code plugin
claude
/plugin install integromat/make-skills
```

### Method 2: Via Marketplace

```bash
claude
# Add as marketplace, then browse and install
/plugin marketplace add integromat/make-skills

# Then browse available plugins
/plugin install
# Select "make-skills" from the list
```

### Method 3: Manual Installation

```bash
# 1. Clone this repository
git clone https://github.com/integromat/make-skills.git

# 2. Add as a local plugin
claude plugin add /path/to/make-skills

# 3. Reload Claude Code
# Skills will activate automatically
```

## Setup

### OAuth (Recommended)

The plugin defaults to OAuth via `https://mcp.make.com`. On first session, you'll be prompted to authenticate through Make's OAuth consent screen where you select your organization and grant scopes.

### MCP Token

For more granular access control (team/scenario-level filtering):

1. Generate a token in Make: Profile → API access → Add token
2. Select the `mcp:use` scope
3. Update `.mcp.json` with your zone and token (see Configuration below)

## Usage

### Skills (Auto-Activated)

- **make-scenario-building**: Triggers when designing scenarios — covers app discovery, module selection, blueprint construction, routing, branching, error handling, and deployment
- **make-module-configuring**: Triggers when configuring modules — covers parameter filling, connections, mapping, webhooks, data stores, IML expressions, and validation
- **make-mcp-reference**: Triggers when discussing MCP configuration, scopes, OAuth/token auth, or troubleshooting

## Configuration

### OAuth (Default)

The `.mcp.json` is pre-configured for OAuth:

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

### MCP Token

For token-based auth, update `.mcp.json`:

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

| Issue                      | Solution                                       |
|----------------------------|------------------------------------------------|
| MCP server not connecting  | Check network connectivity to Make servers      |
| No scenarios available     | Set scenarios to active + on-demand scheduling  |
| Permission denied          | Check token scopes (`mcp:use`)                 |
| Timeout errors             | Use SSE transport, reduce scenario complexity   |

Run `claude --debug` for detailed MCP connection logs.

## License

MIT
