---
name: make-interface-reference
description: This skill should be used when the user asks about "Make CLI", "make-cli", "Make MCP server", "MCP token", "Make OAuth", "scenario as tool", "MCP scopes", "MCP timeout", or "MCP connection refused", or discusses configuring, troubleshooting, or choosing how an AI agent connects to Make via the Make CLI or the Make MCP server. Provides install, authentication, scopes, access control, invocation syntax, and troubleshooting for both interfaces.
license: MIT
compatibility: Requires a Make.com account with permissions to create scenarios. Works with any agent that supports either shell access (for the Make CLI) or MCP tool calling.
metadata:
  author: Make
  version: "0.1.3"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Interface Reference

AI agents interact with Make through one of two interfaces:

- **Make MCP server** (`https://mcp.make.com`) — a hosted MCP service the agent calls via native tool invocation. The default path; works in every supported host (Claude Desktop, claude.ai, Claude Code, Cursor, Copilot, etc.).
- **Make CLI** (`@makehq/cli`) — a local binary the agent invokes through shell (Bash). An alternative when the agent has shell access; wraps the same tool set as the MCP server.

Both expose the same tool set. The CLI is generated from the same `MakeMCPTools` SDK definition that backs the MCP server, so every MCP tool has a matching CLI subcommand.

## Choosing an interface

Run this check once at the start of any Make-related task and remember the result for the session. Do not re-detect per tool call.

**Check for the MCP server first.** Is the `make` MCP server connected? Attempt a lightweight tool call (e.g. `apps_recommend`) to verify. If yes, use the **MCP path** for this session.

<!-- variant:cli-start -->
**If the MCP server isn't connected and the agent has shell access, check for the CLI.** Run `command -v make-cli` (Bash).

- Found? Run `make-cli whoami` to verify authentication.
  - Success → use the **CLI path** for this session — it wraps the same tool set and avoids a network round-trip per call.
  - Authentication failure → tell the user: "The Make CLI is installed but not authenticated. Run `make-cli login`, or I can use the MCP server instead if it is configured."
- Not found → tell the user: "I need either the Make MCP server or the Make CLI. Easiest: configure the Make MCP server at `https://mcp.make.com`. Alternative: install the CLI with `brew install integromat/tap/make-cli` (or `npm install -g @makehq/cli`) then run `make-cli login`."
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
If the MCP server isn't connected, tell the user to configure it at `https://mcp.make.com` (see below).
<!-- variant:mcp-only-end -->

<!-- variant:cli-start -->
## Make CLI

Install, authenticate, and invoke: see **[cli-install-and-auth.md](./references/cli-install-and-auth.md)**.

Invocation shape:

```
make-cli <category> <action> --flag=value --output=json
```

- Always pass `--output=json` when the agent parses the response programmatically.
- For the full category/action list, run `make-cli --help` and `make-cli <category> --help`.
- After `make-cli login`, subsequent calls need no credential flags.

For the MCP-tool ↔ CLI-command mapping used by the building skills, see **[cli-tool-invocation-mapping.md](./references/cli-tool-invocation-mapping.md)**.
<!-- variant:cli-end -->

## Make MCP server

Install, authenticate, scopes, access control, transports, timeouts, configuring scenarios as MCP tools: see **[mcp-install-and-auth.md](./references/mcp-install-and-auth.md)**.

Transport comparison and URL construction: see **[transport-details.md](./references/transport-details.md)**.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No scenarios appearing as tools | Verify scenario is active, scheduled on-demand, and the authenticated user/token has the required scope. |
| Permission denied | For MCP token auth: check token scopes (`mcp:use` plus any management scopes). For OAuth: re-consent with the needed scopes. |
| MCP connection refused / timeout | Verify the zone URL pattern matches the auth mode — token-in-path: `https://<ZONE>/mcp/u/<TOKEN>[/<TRANSPORT>]`; header auth: `https://<ZONE>/mcp[/<TRANSPORT>]` with `Authorization: Bearer <TOKEN>`. For long-running management tools, use `/sse`. Details in [mcp-install-and-auth.md](./references/mcp-install-and-auth.md). |
| Stale MCP tool list | Reconnect the MCP client to refresh available tools. |

<!-- variant:cli-start -->
### Make CLI issues

| Issue | Solution |
|-------|----------|
| `make-cli: command not found` | Install via `brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`. |
| `make-cli whoami` returns "not logged in" | Run `make-cli login` to authenticate interactively. |
| CLI call returns `401 Unauthorized` | Saved credentials are invalid or expired. Run `make-cli logout` then `make-cli login`, or override via `MAKE_API_KEY` / `MAKE_ZONE`. |
| CLI call hangs or times out | Check network to the zone URL; add `--zone <correct-zone>` if the saved zone is wrong. |
<!-- variant:cli-end -->

## Resources

<!-- variant:cli-start -->
- **[cli-install-and-auth.md](./references/cli-install-and-auth.md)** — Make CLI install and authentication.
- **[cli-tool-invocation-mapping.md](./references/cli-tool-invocation-mapping.md)** — MCP tool ↔ CLI subcommand mapping.
<!-- variant:cli-end -->
- **[mcp-install-and-auth.md](./references/mcp-install-and-auth.md)** — Make MCP server connection methods, scopes, access control.
- **[transport-details.md](./references/transport-details.md)** — Transport comparison, URL construction, zone list.
- **[Make MCP Server docs](https://developers.make.com/mcp-server)** — Official documentation.

## Related skills

- **make-scenario-building** — Scenario design: app discovery, module selection, routing, error handling, deployment.
- **make-module-configuring** — Module configuration: parameters, connections, mapping, webhooks, data stores, validation.
