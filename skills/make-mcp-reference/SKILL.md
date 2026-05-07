---
name: make-mcp-reference
description: This skill should be used when the user asks about "Make MCP server", "Make MCP tools", "MCP token", "Make OAuth", "scenario as tool", "MCP scopes", "Make API access", "connect Make to Claude", "scenario not appearing", "MCP timeout", "MCP connection refused", or discusses configuring, troubleshooting, or understanding the Make.com MCP server integration. Provides technical reference for connection methods, scopes, access control, and troubleshooting.
license: MIT
compatibility: Requires a Make.com account with permissions to create scenarios. Works with any agent that supports MCP (Claude Code, Cursor, GitHub Copilot, etc.).
metadata:
  author: Make
  version: "0.1.3"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make MCP Server Reference

Technical reference for the Make.com MCP server — enables AI clients to execute scenarios and manage Make accounts.

## Connection Methods

### Codex Quick Setup

If the Codex plugin installs but the Make MCP server is not present in `codex mcp list`, add it manually:

```bash
codex mcp add make --url https://mcp.make.com
codex mcp login make
```

After login, reconnect the Codex session or start a new one before testing tools.

### OAuth (Default)

Connect via OAuth consent flow. Select organization and scopes during authentication.

**Endpoint:** `https://mcp.make.com`

**URL variants:**
| Transport | URL |
|-----------|-----|
| Stateless Streamable HTTP (default) | `https://mcp.make.com` |
| Streamable HTTP | `https://mcp.make.com/stream` |
| SSE | `https://mcp.make.com/sse` |

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
| Transport | URL |
|-----------|-----|
| Stateless Streamable HTTP | `https://<ZONE>/mcp/u/<TOKEN>/stateless` |
| Streamable HTTP | `https://<ZONE>/mcp/u/<TOKEN>/stream` |
| SSE | `https://<ZONE>/mcp/u/<TOKEN>/sse` |
| Header Auth | `https://<ZONE>/mcp/stateless` + `Authorization: Bearer <TOKEN>` |

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

| Tool Type | OAuth | Token (Stateless) | Token (SSE/Stream) |
|-----------|-------|--------------------|--------------------|
| Scenario Run | 25s | 40s | 40s |
| Management | 30s | 60s | 320s |

When a scenario run exceeds the timeout, the response includes an `executionId`. The scenario continues running in Make for up to 40 minutes. Use `executions_get` with that ID to poll for results.

## Advanced Configuration

### Tool Name Length

Customize maximum tool name length with query parameter:
```
?maxToolNameLength=<32-160>
```
Default: 56 characters.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Scenario not appearing as tool | Verify: active status, on-demand scheduling, correct scope |
| Timeout errors | Switch from `https://mcp.make.com` to a zone-specific `https://<MAKE_ZONE>/mcp/<TRANSPORT>` URL for longer timeouts. Alternatively, reduce scenario complexity or use SSE transport |
| Permission denied | Check token scopes and access control parameters |
| Connection refused | Verify zone URL and token validity |
| Stale tool list | Reconnect MCP client to refresh available tools |

## Resources

- **`references/transport-details.md`** — Detailed transport comparison, URL construction, and zone list
- **[Make MCP Server docs](https://developers.make.com/mcp-server)** — Official documentation
- **make-scenario-building** skill — Scenario construction: routing, filtering, iterations, aggregations, error handling, blueprint construction
- **make-module-configuring** skill — Module configuration: parameters, connections, mapping, webhooks, data stores
