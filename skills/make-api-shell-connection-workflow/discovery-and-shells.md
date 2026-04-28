# Discovery and Shells

This file covers how to discover the correct Make app and module, distinguish connection type layers, and build the reusable shell blueprint.

It does not guarantee that the first generic shell draft is directly activatable. Treat the generic blueprint as a starting template that must be reconciled with current app-specific metadata.

## Goal

Build one reusable scenario pattern for many apps:
- `scenario-service:StartSubscenario`
- one app-specific `Make an API Call` style module in the middle
- `scenario-service:ReturnData`

The middle module is the only app-specific part.

This goal is about shell provisioning, not about proving the final business retrieval output. Retrieval strategy and output normalization come after the shell is connection-ready.

The shell described here is generic for any SaaS provider that exposes an app-specific Make API-call module. It is a reusable API transport scenario, not a business-specific scenario.

## Source of truth

Use current Make metadata as the source of truth.
Preferred evidence sources:
1. current IMT app metadata
2. current module metadata from Make MCP or Make APIs
3. current connection listing behavior in the active workspace

Local notes, old blueprints, and example apps are only hints.

## Provider-to-app resolution

When the user asks for business data such as emails, CRM records, or tickets, do not start with shell creation.

Resolve the app in this order:
1. explicit user statement about the provider or system
2. existing Make artifacts that unambiguously prove the provider and account
3. Make app-catalog lookup for the provider candidate
4. if still ambiguous, ask only for the missing provider or account identity

Examples:
- `Get my emails from user@example.com on Gmail` already gives both the provider and the account target
- `Get my emails from today` does not; resolve provider and account first
- `Get my open leads` requires provider resolution such as HubSpot vs Salesforce before any shell work

Do not invent a provider from the business object alone.

## Standard shell contract

### Module 1: StartSubscenario
Use:
- `scenario-service:StartSubscenario`

Expose these inputs:
- `path`
- `method`
- `header`
- `body`

Important:
- treat this as module-level intent, not as proof that the scenario-level interface is deployed
- after creating or updating the scenario, explicitly set `/api/v2/scenarios/{scenarioId}/interface`
- verify the deployed interface before the first `/run` call

### Module 2: app-specific API-call module
Examples only:
- Gmail: `google-email:makeAnApiCall`
- Outlook: `microsoft-email:makeApiCall`
- HubSpot: `hubspotcrm:MakeAPICall`

Typical mapper:
```json
{
  "url": "{{2.path}}",
  "method": "{{2.method}}",
  "headers": "{{2.header}}",
  "body": "{{2.body}}"
}
```

Default retrieval should use `GET`. Treat `PUT`, `PATCH`, and `DELETE` as write/destructive methods and require explicit user confirmation before running them.

### Body-mapper compatibility rule

The generic shell exposes `body`, but some provider modules do not behave well when `body` is present and empty on read-style calls.

Use this decision rule:
- default shell template: include the `body` mapper
- if the provider module serializes empty/null bodies badly on `GET` or `DELETE`, remove the Module 2 `body` mapper for the read shell
- keep or reintroduce the `body` mapper for write shells that need request payloads

This is a provider-module compatibility choice, not a reason to change the generic shell output contract.

Confirmed example to remember, but not to universalize: `google-calendar:makeApiCall` v5 has been observed to work better when a read/delete shell omits the `body` mapper entirely.

### Module 3: ReturnData
Use:
- `scenario-service:ReturnData`

Typical mapper:
```json
{
  "data": "{{3.body}}"
}
```

For the generic API shell contract, `{{3.body}}` is not just a heuristic. It is the intended transport contract.

Do not replace it with `{{3}}` or `{{3.data}}` inside this generic shell pattern.

Use bundle inspection only to confirm that `body` contains the expected payload or error object. Do not use bundle inspection to redefine the generic shell contract.

## Activation readiness rule

Do not assume a minimal middle-module block is valid just because the slug and mapper are correct.

Before activation, compare the generated middle module with current evidence from the same app and version in the active workspace, such as:
- a current scenario blueprint that already uses the module
- current module metadata from Make
- a current exported module block from the same app/version

Specifically verify whether the module requires app-specific metadata structures such as:
- `expect`
- `metadata.restore.expect`
- connection restore blocks
- parameter restore hints

If activation returns a generic validation error such as `Scenario contains errors`, inspect the live blueprint and reconcile the metadata structure before retrying.

## Important discovery rule

The API-call module name is not standardized across apps.
Common variants include:
- `makeAnApiCall`
- `makeApiCall`
- `MakeAPICall`
- `MakeAnAPICall`
- `ActionMakeAnApiCall`

Never guess the exact name or casing.

## API surfaces

### IMT app discovery
List apps:
- `GET /api/v2/imt/apps?organizationId=ORG_ID&teamId=TEAM_ID&scoredSearch=true`

Get one app in detail:
- `GET /api/v2/imt/apps/{appName}/{version}`

Use the app-catalog endpoint to prove that the provider exists in Make for the active organization/team context before provisioning a shell.

### Scenario APIs
Create scenario:
- `POST /api/v2/scenarios?confirmed=true`

Update scenario:
- `PATCH /api/v2/scenarios/{scenarioId}?confirmed=true`

Activate scenario:
- `POST /api/v2/scenarios/{scenarioId}/start`

Run scenario:
- `POST /api/v2/scenarios/{scenarioId}/run`

Inspect interface:
- `GET /api/v2/scenarios/{scenarioId}/interface`

Set interface:
- `PATCH /api/v2/scenarios/{scenarioId}/interface`

Inspect blueprint:
- `GET /api/v2/scenarios/{scenarioId}/blueprint`

For on-demand API shells, do not stop after scenario create or update. Explicitly patch the scenario-level interface, then verify it:

```json
{
  "input": [
    { "name": "path", "type": "text", "required": false, "label": "Path" },
    { "name": "method", "type": "text", "required": false, "label": "Method" },
    { "name": "header", "type": "any", "required": false, "label": "Header" },
    { "name": "body", "type": "any", "required": false, "label": "Body" }
  ]
}
```

Reason: `StartSubscenario.metadata.interface` documents the shell shape, but it does not reliably deploy the scenario-level run interface by itself. Treat `PATCH /interface` as mandatory for reusable on-demand shells.

## Base URL and zone

Do not treat a successful user-scoped endpoint as proof that the workspace zone is correct.

Observed practical behavior:
- `GET /api/v2/users/me` can return `200` on multiple zones
- `GET /api/v2/imt/apps/...` can also return `200` on multiple zones
- team-scoped endpoints such as `GET /api/v2/connections?teamId=...` can still fail with `403 Permission denied` on the wrong zone

Therefore resolve the zone before team-scoped work.

Preferred order:
1. infer the probable zone from the user's dashboard URL if provided
2. list organizations on that zone
3. list teams for the matching organization
4. confirm with a team-scoped read such as `GET /api/v2/connections?teamId=TEAM_ID`

Ask the user which Make zone or base URL applies only if it is still not recoverable from the environment or their provided links.
For generic examples, define:

```bash
BASE_URL="https://us1.make.com"
```

Then use that variable consistently in examples. Replace it with the actual zone only when the user provides or confirms it.

### Resolve organizations and teams

List organizations first:

```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'user-agent: Mozilla/5.0' \
  "${BASE_URL}/api/v2/organizations"
```

Then list teams for the organization that owns the target workspace:

```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'user-agent: Mozilla/5.0' \
  "${BASE_URL}/api/v2/teams?organizationId=${ORG_ID}"
```

Finally confirm the zone with a team-scoped call:

```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'user-agent: Mozilla/5.0' \
  "${BASE_URL}/api/v2/connections?teamId=${TEAM_ID}"
```

If that final call returns `403 Permission denied`, treat the zone as wrong or the team as inaccessible and stop guessing.

## Discover the app and module

### Step 1: list candidate apps
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  "${BASE_URL}/api/v2/imt/apps?organizationId=${ORG_ID}&teamId=${TEAM_ID}&scoredSearch=true"
```

### Step 2: find apps exposing API-call modules
Search module names case-insensitively for strings such as:
- `makeapicall`
- `makeanapicall`

### Step 3: inspect one app in detail
Example:
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  "${BASE_URL}/api/v2/imt/apps/hubspotcrm/2"
```

Confirm:
- exact app name
- app version
- exact module slug and casing
- any module-specific parameter shape that differs from the standard mapper

## Two different type layers

Do not mix these concepts.

### 1. Scenario or module connection parameter type
Used in blueprint metadata or module restore data.
Examples:
- `account:google-email`
- `account:azure`

### 2. Connection listing or credential request type
Used when listing connections or creating fallback credential requests.
Examples:
- `google-email`
- `azure`

Document both values explicitly before building or patching the shell.

## Existing-connection preflight

Before creating any credential request, check whether the workspace already has a usable connection for the app.

Do not stop at “same vendor”. Check structural compatibility:
- same app family and connection family required by the discovered module
- same target account identity when available
- same or broader scope set than the requested operation needs
- no evidence that the connection is expired, revoked, or otherwise invalid

If the tooling exposes detailed connection metadata, inspect it before testing reuse. Useful evidence includes:
- connection type
- account or accountName
- scope list or scope count
- last validation or health indicators when available

Common examples:
- Gmail-style module: `google-email:makeAnApiCall` usually expects `account:google-email`; do not assume a generic `google` connection is interchangeable
- Google workspace app modules such as Calendar/Sheets/Drive often use `account:google`; do not assume a Gmail-specific connection is interchangeable
- Microsoft mail modules commonly use `account:azure`

For the REST API, filter `/api/v2/connections` with `type` or `type[]`:

```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'user-agent: Mozilla/5.0' \
  "${BASE_URL}/api/v2/connections?teamId=${TEAM_ID}&type[]=google-email"
```

Notes:
- `type=google-email` and `type[]=google-email` are both accepted by the REST endpoint
- do not assume `accountName=google-email` will filter correctly in REST just because Make MCP tooling uses `accountName` terminology
- only create a credential request when no suitable existing connection is available for the target app and scope

## Existing-shell preflight

Before creating a new shell scenario, check whether the active team already has one that matches the generic shell contract.

Look for a scenario that has all of the following:
- `scenario-service:StartSubscenario`
- the exact app-specific API-call module for the resolved app and version
- `scenario-service:ReturnData`
- on-demand execution or another explicit reusable shell shape

Prefer reusing a shell when:
- the module slug and app version still match current metadata
- the shell is still bound to the same app family and connection family
- the scenario interface still exposes `path`, `method`, `header`, and `body`
- the shell is already linked to a suitable connection or can be patched safely

Do not reuse a shell for a newly created connection. When the connection is new, create a new shell dedicated to that connection.

Do not treat “same SaaS vendor” as enough for shell reuse. A Gmail shell, a Google Calendar shell, and a Google Sheets shell may all live under Google but still require different Make apps, different module slugs, and different connection families.

Only create a new shell when:
- no matching shell exists
- the existing shell uses the wrong app, wrong module slug, or wrong contract
- the existing shell cannot be patched safely without breaking a live flow
- a new connection has just been created for a new account or authorization context
- the old connection exists but authorization failed because it is expired or invalid

Record these values before deciding to reuse or create:
- scenario ID
- scenario name
- app name and version
- middle-module slug
- whether the current `ReturnData` mapper still returns `{{3.body}}`

## Practical workflow

1. Identify the target app.
2. Prove that the target provider exists in the Make app catalog for the active organization/team.
3. Discover the exact app name, version, and API-call module slug.
4. Determine both connection type layers.
5. Check whether a suitable connection already exists.
6. Check whether a matching shell scenario already exists for that existing connection.
7. Create or resolve the credential request only if a suitable connection does not already exist.
8. Generate the three-module shell blueprint when no reusable shell exists or when a new connection has just been created.
9. Reconcile the middle-module metadata against a real current module blueprint for the same app/version.
10. Create the scenario when required by the shell-reuse rule.
11. Patch the selected existing connection only when reusing an existing shell.
12. Explicitly set the scenario-level interface.
13. Verify the interface.
14. Activate and run the scenario.

## Shell output vs. retrieval output

Keep these separate:

- Shell output contract: a transport shape for passing data through `ReturnData`
- Retrieval output contract: the user-facing payload for messages, records, issues, or tickets

For this generic shell pattern, the shell output contract is fixed:

```json
{
  "data": "{{3.body}}"
}
```

The shell may activate successfully while still returning an unusable payload for the business question. That is a retrieval/output-normalization problem, not a shell-contract problem.

## Safety gate for write operations

Before any operation that changes a live scenario, ask for explicit confirmation.
Keep it short and concrete:

```text
You asked me to update an existing Make scenario.
Risk: this can replace a module mapper or connection value and break a live flow until it is repaired.
Example: changing the API-call module connection could stop the shell from authenticating until the correct connection is restored.
Reply with YES to proceed, or tell me what to change first.
```
