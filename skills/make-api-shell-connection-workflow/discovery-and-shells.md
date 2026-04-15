# Discovery and Shells

This file covers how to discover the correct Make app and module, distinguish connection type layers, and build the reusable shell blueprint.

It does not guarantee that the first generic shell draft is directly activatable. Treat the generic blueprint as a starting template that must be reconciled with current app-specific metadata.

## Goal

Build one reusable scenario pattern for many apps:
- `scenario-service:StartSubscenario`
- one app-specific `Make an API Call` style module in the middle
- `scenario-service:ReturnData`

The middle module is the only app-specific part.

This goal is about shell provisioning, not about proving the final business retrieval output. Retrieval strategy and output normalization come after the shell or native module path is connection-ready.

## Source of truth

Use current Make metadata as the source of truth.
Preferred evidence sources:
1. current IMT app metadata
2. current module metadata from Make MCP or Make APIs
3. current connection listing behavior in the active workspace

Local notes, old blueprints, and example apps are only hints.

## Standard shell contract

### Module 1: StartSubscenario
Use:
- `scenario-service:StartSubscenario`

Expose these inputs:
- `path`
- `method`
- `header`
- `body`

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

### Module 3: ReturnData
Use:
- `scenario-service:ReturnData`

Typical mapper:
```json
{
  "data": "{{3.body}}"
}
```

Depending on the package, `{{3}}` or `{{3.data}}` may be more useful, but `{{3.body}}` is a reasonable default starting point for many API-call modules.

That mapper is only a starting hypothesis. Validate it against a real execution bundle before treating it as final.

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

Inspect blueprint:
- `GET /api/v2/scenarios/{scenarioId}/blueprint`

## Base URL and zone

Ask the user which Make zone or base URL applies if it is not already known from the environment.
For generic examples, define:

```bash
BASE_URL="https://us1.make.com"
```

Then use that variable consistently in examples. Replace it with the actual zone only when the user provides or confirms it.

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

## Practical workflow

1. Identify the target app.
2. Discover the exact app name, version, and API-call module slug.
3. Determine both connection type layers.
4. Generate the three-module shell blueprint.
5. Reconcile the middle-module metadata against a real current module blueprint for the same app/version.
6. Create the scenario.
7. Create or resolve the credential request.
8. Patch the scenario with the selected connection after authorization.
9. Activate and run the scenario.

## Shell output vs. retrieval output

Keep these separate:

- Shell output contract: a transport shape for passing data through `ReturnData`
- Retrieval output contract: the user-facing payload for messages, records, issues, or tickets

The shell may activate successfully while still returning an unusable payload for the business question. That is a retrieval/output-normalization problem, not a connection-provisioning success.

## Safety gate for write operations

Before any operation that changes a live scenario, ask for explicit confirmation.
Keep it short and concrete:

```text
You asked me to update an existing Make scenario.
Risk: this can replace a module mapper or connection value and break a live flow until it is repaired.
Example: changing the API-call module connection could stop the shell from authenticating until the correct connection is restored.
Reply with YES to proceed, or tell me what to change first.
```
