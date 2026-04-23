# Make MCP Server Transport Details

## Transport Methods Comparison

### Stateless Streamable HTTP (Default)

- Each request is independent — no session state
- Best for simple tool calls and management operations
- Fastest for single operations
- Default transport when no suffix is specified

**When to use:** Most use cases, especially quick scenario executions and management queries.

### Streamable HTTP

- Maintains streaming connection for longer operations
- Supports real-time progress updates
- Better for operations that may take longer than a few seconds

**When to use:** Long-running scenarios, operations where progress feedback is valuable.

### Server-Sent Events (SSE)

- Persistent connection with server-push capability
- Longest timeout limits (320s for token-based management tools)
- Best for management operations that may take extended time

**When to use:** Extended management operations, clients that require SSE transport.

## URL Construction

### Base URL Pattern

**OAuth:** `https://mcp.make.com[/suffix]`
**Token (path):** `https://<ZONE>/mcp/u/<TOKEN>[/suffix]`
**Token (header):** `https://<ZONE>/mcp[/suffix]` + `Authorization: Bearer <TOKEN>`

### Suffixes

| Suffix | Transport |
|--------|-----------|
| (none) | Stateless Streamable HTTP |
| `/stateless` | Stateless Streamable HTTP (explicit) |
| `/stream` | Streamable HTTP |
| `/sse` | Server-Sent Events |

### Query Parameters

Append to any URL:
- `?organizationId=<id>` — restrict to organization
- `?teamId=<id>` — restrict to team
- `?scenarioId=<id>` — restrict to scenario
- `?scenarioId[]=<id1>&scenarioId[]=<id2>` — multiple scenarios
- `?maxToolNameLength=<32-160>` — tool name length

The access control parameters (`organizationId`, `teamId`, `scenarioId`) apply only to scenario run tools and do not restrict management tools. The `maxToolNameLength` parameter applies to all tools.

### Complete URL Examples

**OAuth SSE with tool name config:**
```
https://mcp.make.com/sse?maxToolNameLength=100
```

**Token stateless with org restriction:**
```
https://eu2.make.com/mcp/u/abc123/stateless?organizationId=456
```

**Token SSE with multiple scenarios:**
```
https://us1.make.com/mcp/u/abc123/sse?scenarioId[]=1&scenarioId[]=2
```

**Header auth with team restriction:**
```
https://eu1.make.com/mcp/sse?teamId=789
Authorization: Bearer abc123
```

## Make Zones

Example hosting zones:
- `eu1.make.com` — Europe 1
- `eu2.make.com` — Europe 2
- `us1.make.com` — United States 1
- `us2.make.com` — United States 2
- `eu1.make.celonis.com` — Enterprise Europe 1
- `us1.make.celonis.com` — Enterprise United States 1

There are more zones available beyond these examples. Find your zone in Make account settings or from the URL when logged into Make.

## Official Documentation

- [MCP Server](https://developers.make.com/mcp-server)
- [Connect Using OAuth](https://developers.make.com/mcp-server/connect-using-oauth)
- [Connect Using MCP Token](https://developers.make.com/mcp-server/connect-using-mcp-token)
