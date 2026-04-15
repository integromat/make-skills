---
name: make-api-shell-connection-workflow
description: Build a reusable Make API-call shell by discovering the correct app-specific Make an API Call module, generating the shell blueprint, and creating or resolving the required connection request. Use when a user wants to connect an app for a generic API shell, create a reusable API-call scenario, find the right Make API-call module, request authorization, or patch the shell with the chosen connection.
license: MIT
compatibility: Requires a Make.com account with API access and permissions to create scenarios or credential requests. Works best in environments that can call Make APIs or Make MCP tools.
metadata:
  author: Hermes Agent
  version: "0.1.0"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make API Shell + Connection Workflow

Use this skill for one specific workflow family:
- discover the correct Make app and app-specific API-call module
- build a reusable shell scenario with StartSubscenario, one app API-call module, and ReturnData
- create or resolve the connection request needed by that shell
- patch the shell with the selected connection once authorization is complete

## Quick routing

Read the file that matches the current task:

| Task | Reference |
|------|-----------|
| Discover the app, module, and connection type layers | [Discovery and Shells](./discovery-and-shells.md) |
| Create, inspect, or resolve a credential request | [Connection Requests](./connection-requests.md) |
| Sanitize examples and prepare a public shareable version | [Sanitization and Sharing](./sanitization-and-sharing.md) |
| Start from a generic blueprint template | [Example shell blueprint](./examples/generic-api-shell-blueprint.json) |

## Core rules

1. Never guess the API-call module name. Discover it from current Make metadata.
2. Treat example apps such as Gmail, Outlook, or HubSpot as illustrations, not as universal defaults.
3. Keep the two type layers separate:
   - scenario/module connection parameter type
   - connection listing or credential request type
4. Ask for confirmation before writing into an existing live scenario or replacing a connection mapping.
5. Keep public examples sanitized. Do not include real names, user IDs, team IDs, organization IDs, tenant-specific hosts, or claims that a single private workspace proves a universal rule.
6. Use a clean base URL variable in examples. Keep placeholders generic unless the current user explicitly provides the Make zone.

## Standard shell shape

The reusable shell has exactly three modules:
1. `scenario-service:StartSubscenario`
2. one app-specific Make API-call module discovered from metadata
3. `scenario-service:ReturnData`

Expose these shell inputs through StartSubscenario:
- `path`
- `method`
- `header`
- `body`

Use the discovered middle module as the only app-specific part of the shell.

## Response behavior

When using this skill:
- first summarize the discovered app, version, exact API-call module name, and both connection type layers
- explicitly label any assumptions
- keep write-operation prompts brief and concrete
- if sharing publicly, rewrite examples with placeholders and neutral labels before finalizing

## Related skills

- `make-scenario-building` for broader scenario architecture beyond this shell pattern
- `make-module-configuring` for detailed module configuration, mapping, webhooks, keys, and data stores
- `make-mcp-reference` for Make MCP connection methods, scopes, and timeout behavior
