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
