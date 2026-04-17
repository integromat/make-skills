---
name: make-api-shell-connection-workflow
description: Build or reuse a reusable Make API-call shell by discovering the correct app-specific Make an API Call module, resolving or requesting the right connection, explicitly setting the scenario interface, running the scenario, and using that shell as the retrieval transport for email, CRM, tickets, and similar SaaS systems.
license: MIT
compatibility: Requires a Make.com account with API access and permissions to create scenarios or credential requests. Works best in environments that can call Make APIs or Make MCP tools.
metadata:
  author: Make
  version: "0.3.0"
  homepage: https://www.make.com
  repository: https://github.com/MAKESEB/make-skills
---

# Make API Shell + Connection Workflow

Use this skill for one specific workflow family:
- discover the correct Make app and app-specific API-call module
- reuse or build a reusable shell scenario with StartSubscenario, one app API-call module, and ReturnData
- reuse an existing suitable connection or create the connection request needed by that shell
- patch the shell with the selected connection once authorization is complete
- run the scenario and use it as a generic SaaS retrieval transport for email, CRM, tickets, and similar systems

This skill is primarily about provisioning and shell construction. Treat business retrieval as a second phase that starts only after the connection is ready and the shell has been validated against current workspace metadata.

The generic shell described here is an API transport wrapper, not business logic. It should behave like a reusable API endpoint for any SaaS app that Make can front, including email, CRM, ticketing, support, marketing, or task systems.

## Quick routing

Read the file that matches the current task:

| Task | Reference |
|------|-----------|
| Discover the app, module, and connection type layers | [Discovery and Shells](./discovery-and-shells.md) |
| Create, inspect, or resolve a credential request | [Connection Requests](./connection-requests.md) |
| Choose and execute the post-connection retrieval path | [Retrieval Execution](./retrieval-execution.md) |
| Sanitize examples and prepare a public shareable version | [Sanitization and Sharing](./sanitization-and-sharing.md) |
| Start from a generic blueprint template | [Example shell blueprint](./examples/generic-api-shell-blueprint.json) |

## Fresh-agent operating sequence

When a fresh agent gets a request such as "get my unread emails", "pull my open CRM leads", or "fetch my Jira tickets", the default operating sequence is:

1. Resolve the provider anchor.
   - email: Gmail vs Outlook vs other
   - CRM: HubSpot vs Salesforce vs other
   - ticketing: Jira vs Zendesk vs Linear vs other
2. Resolve the target account, mailbox, workspace, project, or queue if the request is ambiguous.
3. Resolve the active Make zone, organization, and team.
4. Search the Make app catalog for the provider candidate using `GET /api/v2/imt/apps?organizationId=ORG_ID&teamId=TEAM_ID&scoredSearch=true`.
5. Inspect the chosen app with `GET /api/v2/imt/apps/{appName}/{version}` and record the exact API-call module slug and both connection type layers.
6. Reuse an existing suitable connection if one already matches the app, account identity, and required scope.
7. Reuse an existing shell only when reusing an existing suitable connection. If a new connection must be created, create a new shell for that new connection instead of patching an old shell onto a newly authorized account.
8. Only if no suitable connection exists, create a credential request.
9. After the connection decision is settled, create or patch the shell according to the reuse rule above and verify that the shell can run.
10. Run the narrowest possible retrieval request first through the API-call shell.
11. Expand into list/search -> detail -> normalization only after the first shell run proves the path works.

The agent should not jump straight from "user wants SaaS data" to "create a new connection" or "call a direct SDK" without walking this sequence.

## Input-resolution gates

Before provisioning or retrieval, explicitly resolve these inputs:
- provider anchor
- target account identity if multiple accounts or mailboxes are possible
- intended credential-request recipient if it may differ from the current token owner
- Make zone, organization, and team

If one of those items is missing and cannot be discovered safely, stop and ask only for that exact missing item.

## Core rules

1. Never guess the API-call module name. Discover it from current Make metadata.
2. Treat example apps such as Gmail, Outlook, or HubSpot as illustrations, not as universal defaults.
3. Keep the two type layers separate:
   - scenario/module connection parameter type
   - connection listing or credential request type
4. Prefer reuse before creation:
   - existing suitable connection before new credential request
   - existing shell scenario only when reusing an existing suitable connection
   - a newly authorized connection must get a newly created shell
5. Do not route business retrieval to native Make search/list/get modules. For this workflow family, always retrieve through the Make app's API-call shell.
6. Ask for confirmation before writing into an existing live scenario or replacing a connection mapping.
7. Keep public examples sanitized. Do not include real names, user IDs, team IDs, organization IDs, tenant-specific hosts, or claims that a single private workspace proves a universal rule.
8. Use a clean base URL variable in examples. For public examples, prefer `https://us1.make.com` and do not mention `we.make.com`. Keep placeholders generic unless the current user explicitly provides the Make zone. Zones can be `eu1`, `eu2`, `us1`, `us2`, or `we`. If the user wants to give a custom zone or `BASE_URL`, accept it.
9. Separate four phases explicitly:
   - provider and app resolution
   - connection provisioning
   - shell provisioning
   - retrieval execution and output normalization
10. Do not assume the generic three-module blueprint is automatically activatable for every app. Before activation, compare the middle module metadata with a real current blueprint or module export for the same app and version in the active workspace.
11. For the generic API shell contract that uses `scenario-service:ReturnData` with ExpectDataAny, the final mapper must return the app module response body as `data: {{3.body}}`.
12. Never replace that shell-contract default with `{{3}}` or `{{3.data}}` just because the full bundle looks tempting. The shell is meant to return the API response body, not the entire Make module bundle.
13. Still inspect a real execution bundle for validation, but use that to confirm that `body` contains the intended payload or error object — not to redefine the generic shell contract.
14. Resolve the active workspace zone before any team-scoped call. `GET /api/v2/users/me` and `GET /api/v2/imt/apps/...` can succeed on multiple zones, while `GET /api/v2/connections?teamId=...` or scenario endpoints on the wrong zone can fail with `403 Permission denied`.
15. For the REST `/api/v2/connections` endpoint, filter with `type=...` or `type[]=...`. Do not assume query parameters such as `accountName=...` are honored just because an MCP tool uses `accountName` terminology.
16. Do not ask the user to paste raw OAuth secrets, API keys, or passwords into chat. Use a credential request whenever a new connection must be created.
17. If the user request is ambiguous, resolve the concrete provider and account first; if it is already explicit, do not ask again.
18. If the Module 2 request method is `PUT`, `PATCH`, or `DELETE`, warn explicitly before execution. Treat those methods as mutating live SaaS operations, not passive retrieval.
19. Do not assume `StartSubscenario.metadata.interface` is enough for scenario runs. After creating or updating an on-demand shell, explicitly set the scenario-level interface with `/api/v2/scenarios/{scenarioId}/interface` and verify it before the first run.
20. Treat `/api/v2/scenarios/{scenarioId}/run` as the standard execution path for this shell family. Pass the business payload under `data` with keys that match the scenario interface exactly, and prefer `responsive: true` for validation runs.
21. Shell reuse is app-specific, not just provider-family-specific. A shell built around one app module should not be repointed to another app module just because both belong to the same vendor suite.

## App binding and connection-family matrix

The shell pattern is generic, but each actual shell is bound to one discovered Make app module.

Do not treat “Google” or “Microsoft” as a single interchangeable connection family. In Make, app families often split by product surface.

Common examples:

| Business surface | Example API-call module | Scenario/module connection parameter type | Common connection listing or request type |
|---|---|---|---|
| Gmail | `google-email:makeAnApiCall` | `account:google-email` | `google-email` or workspace-specific variants such as `google-restricted` |
| Google Calendar / Sheets / Drive style apps | app-specific Google module discovered from metadata | commonly `account:google` | commonly `google` |
| Outlook / Microsoft mail | `microsoft-email:makeApiCall` | `account:azure` | `azure` |

Rules that follow from this:
- Reuse a shell only when the discovered app, module slug, version, and connection family still match.
- Reuse a connection only when the account identity and scopes still fit the requested operation.
- If a new connection is authorized for a different account or connection family, create a new shell for it instead of silently repointing an old shell.

When in doubt, inspect the exact app metadata and existing connection detail instead of inferring compatibility from the vendor name.

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

## Generic shell contract

This shell is a generic API endpoint wrapper.

It receives:
- `path`
- `method`
- `header`
- `body`

It forwards those values into the app-specific Make API-call module.

Default retrieval should use `GET`. Treat `PUT`, `PATCH`, and `DELETE` as write/destructive methods and require explicit user confirmation before running them.

It returns exactly one thing:
- the response body from the app-specific Make API-call module

Therefore the shell contract is:

```json
{
  "data": "{{3.body}}"
}
```

That contract is generic across SaaS providers. It applies whether the middle module fronts Gmail, Outlook, HubSpot, Jira, or another provider-specific Make API-call module.

The shell should not try to return:
- the whole Make bundle `{{3}}`
- a guessed nested field such as `{{3.data}}`
- transport metadata mixed together with the body

The shell is transport only. Business interpretation happens later.

## Two-phase operating model

### Phase A: provisioning
Complete these steps first:
1. identify the provider and exact Make app
2. discover the exact app version and module slug
3. determine both connection type layers
4. look for an existing suitable connection for the correct account identity and scope
5. look for an existing shell scenario that already fits the contract for that existing connection
6. create or resolve the credential request only if reuse failed
7. create a new shell if a new connection was created, or patch an existing shell only when reusing an existing connection
8. verify that the shell runs with the chosen connection

Deliverable at the end of Phase A:
- a connection-ready API-call shell scenario

### Phase B: retrieval
Only after Phase A succeeds:
1. configure the retrieval call through the API-call shell
2. run a narrow validation query or lookup
3. inspect the real output bundle shape
4. keep `ReturnData` fixed as the generic shell contract and update only downstream normalization if needed
5. rerun and verify the user-facing payload

Do not treat a successful credential request as proof that the retrieval stage is already solved.

Important:
- the generic three-module API shell remains the only retrieval transport in this workflow family
- keep the shell contract fixed as `data: {{3.body}}`
- do not switch to native retrieval/search/list modules as a fallback or optimization
- if authorization fails because an existing connection is expired or invalid, do not try to re-auth that connection in place; go through the credential-request path and then create a new shell for the new connection

### Interface-and-run rule

For on-demand shells, treat interface provisioning as a separate deployment step:
1. create or update the scenario blueprint
2. explicitly set `/api/v2/scenarios/{scenarioId}/interface`
3. verify the interface shape before the first run
4. only then call `/api/v2/scenarios/{scenarioId}/run`

Use a run payload shaped like:

```json
{
  "data": {
    "path": "...",
    "method": "GET",
    "header": [],
    "body": null
  },
  "responsive": true
}
```

The key names under `data` must match the scenario interface exactly. If the interface was never explicitly set, `run` can reject the call even when the `StartSubscenario` module itself contains interface metadata.

### Body-handling compatibility rule

Keep the generic shell contract stable, but do not assume every provider module tolerates an empty or null body the same way.

Observed-safe pattern:
- write-capable shells can expose and map `body`
- read-heavy shells may need to omit the Module 2 `body` mapper entirely when the provider module serializes empty payloads badly on `GET` or `DELETE`

If a provider-specific Make API-call module fails only when `body` is present-but-empty, prefer one of these patterns:
- a read shell without a `body` mapper
- a write shell with a `body` mapper
- two separate shells when the provider behavior differs between read and write paths

Do not change `ReturnData` for this. This is a Module 2 request-shape compatibility issue, not a shell-output-contract issue.

## Response behavior

When using this skill:
- first summarize the discovered app, version, exact API-call module name, and both connection type layers
- explicitly state how the provider was resolved: user statement, existing Make artifacts, or Make app-catalog lookup
- explicitly say whether the shell is being reused or newly created
- explicitly say whether the connection is being reused or newly requested
- explicitly state which phase you are in: provisioning or retrieval
- when retrieval begins, state the API-call plan: list/search path, any follow-up detail paths, and normalization plan
- if a new connection was created, explicitly state that a new shell was created for it
- if the request started as a business ask such as email, CRM, or tickets, state the business target and the exact API path pattern you chose
- explicitly label any assumptions
- keep write-operation prompts brief and concrete
- if Module 2 is about to run a `PUT`, `PATCH`, or `DELETE`, stop and warn before execution
- if activation fails or `ReturnData` looks wrong, stop calling the flow complete and report the exact failing phase
- if sharing publicly, rewrite examples with placeholders and neutral labels before finalizing

## Related skills

- `make-scenario-building` for broader scenario architecture beyond this shell pattern
- `make-module-configuring` for detailed module configuration, mapping, webhooks, keys, and data stores
- `make-mcp-reference` for Make MCP connection methods, scopes, and timeout behavior
