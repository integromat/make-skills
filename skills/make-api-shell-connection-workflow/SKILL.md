---
name: make-api-shell-connection-workflow
description: Build a reusable Make API-call shell by discovering the correct app-specific Make an API Call module, generating the shell blueprint, and creating or resolving the required connection request. Use when a user wants to connect an app for a generic API shell, create a reusable API-call scenario, find the right Make API-call module, request authorization, or patch the shell with the chosen connection.
license: MIT
compatibility: Requires a Make.com account with API access and permissions to create scenarios or credential requests. Works best in environments that can call Make APIs or Make MCP tools.
metadata:
  author: Hermes Agent
  version: "0.2.0"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make API Shell + Connection Workflow

Use this skill for one specific workflow family:
- discover the correct Make app and app-specific API-call module
- build a reusable shell scenario with StartSubscenario, one app API-call module, and ReturnData
- create or resolve the connection request needed by that shell
- patch the shell with the selected connection once authorization is complete

This skill is primarily about provisioning and shell construction. Treat business retrieval as a second phase that starts only after the connection is ready and the shell or native retrieval path has been validated against current workspace metadata.

## Quick routing

Read the file that matches the current task:

| Task | Reference |
|------|-----------|
| Discover the app, module, and connection type layers | [Discovery and Shells](./discovery-and-shells.md) |
| Create, inspect, or resolve a credential request | [Connection Requests](./connection-requests.md) |
| Choose and execute the post-connection retrieval path | [Retrieval Execution](./retrieval-execution.md) |
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
6. Use a clean base URL variable in examples. For public examples, prefer `https://us1.make.com` and do not mention `we.make.com`. Keep placeholders generic unless the current user explicitly provides the Make zone.
7. Separate four phases explicitly:
   - connection provisioning
   - shell provisioning
   - retrieval execution
   - output normalization
8. Do not assume the generic three-module blueprint is automatically activatable for every app. Before activation, compare the middle module metadata with a real current blueprint or module export for the same app and version in the active workspace.
9. Prefer provider-native search/list/get modules for business retrieval when they match the user request. Use the generic API-call shell when native retrieval modules are missing, insufficient, or the endpoint must stay open-ended.
10. Never lock in a `ReturnData` mapper until at least one real execution bundle from the chosen retrieval module has been inspected.

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

## Two-phase operating model

### Phase A: provisioning
Complete these steps first:
1. identify the provider and exact Make app
2. discover the exact app version and module slug
3. determine both connection type layers
4. create or patch the shell scenario
5. create or resolve the credential request
6. patch in the authorized connection

Deliverable at the end of Phase A:
- a connection-ready scenario or a connection-ready native retrieval module plan

### Phase B: retrieval
Only after Phase A succeeds:
1. choose the retrieval strategy
2. run a narrow validation query or lookup
3. inspect the real output bundle shape
4. update `ReturnData` or downstream normalization based on the observed shape
5. rerun and verify the user-facing payload

Do not treat a successful credential request as proof that the retrieval stage is already solved.

## Retrieval strategy ladder

Prefer this order unless current metadata shows otherwise:
1. provider-native search/list/get modules for business retrieval
2. provider-native detail/get-by-id modules for follow-up enrichment
3. generic API-call shell for unsupported or custom endpoints

Examples of provider-native retrieval families include:
- email providers: search/list messages, then get message detail if needed
- CRM providers: search/list records, then get record detail
- issue trackers: search/list issues, then get issue detail

Use the generic API-call shell when the user truly needs arbitrary endpoint access or when native modules cannot express the needed operation cleanly.

## Response behavior

When using this skill:
- first summarize the discovered app, version, exact API-call module name, and both connection type layers
- explicitly state which phase is active: provisioning or retrieval
- when retrieval begins, state the chosen retrieval strategy and why it won over the alternatives
- explicitly label any assumptions
- keep write-operation prompts brief and concrete
- if activation fails or `ReturnData` looks wrong, stop calling the flow complete and report the exact failing phase
- if sharing publicly, rewrite examples with placeholders and neutral labels before finalizing

## Related skills

- `make-scenario-building` for broader scenario architecture beyond this shell pattern
- `make-module-configuring` for detailed module configuration, mapping, webhooks, keys, and data stores
- `make-mcp-reference` for Make MCP connection methods, scopes, and timeout behavior
