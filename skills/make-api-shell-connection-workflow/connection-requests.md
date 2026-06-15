# Connection Requests

This file covers how to request authorization for the shell, inspect the result, and patch the selected connection into the scenario.

## Authentication format

Use a Make API token in the header:
```text
Authorization: Token YOUR_API_KEY
```

## Choose the request path by recipient first

Resolve WHO the credential is for before picking an endpoint. There are two
separate flows with different gating:

| Recipient | Endpoint | Gating |
|---|---|---|
| The current Make user (default) | `POST /api/v2/credential-requests/actions/create` — self-service, no `provider` field, one `connection` or `key` object per call, returns `publicUri` | Available to a wide range of plans; not gated by the Enterprise credential-requests license |
| A colleague, employee, or service-account owner — only when the task explicitly says so | `POST /api/v2/credential-requests/requests/v2` — requires `provider` (`providerMakeUserId` or invite by name/email) | Enterprise/Partner feature; check the plan gate below first |

Unless the task explicitly states that the credential must come from another
person or a shared/service account, use the self-service flow. The external
request flow exists for delegating authorization to someone else; that
delegation is the heavily gated feature.

The guided connection flow (below) remains the last fallback for BOTH paths:
when a request endpoint fails with a policy denial, create the shell without
a credential and walk the user through adding the connection in the UI.

## Plan gate: external credential requests are an Enterprise/Partner feature

The gate applies to the external request flow (`requests/v2`). Free/Core/Pro
organizations cannot request credentials from other people; the self-service
path above is the route that works on a wider range of plans. Check the
capability BEFORE creating an external request — the authoritative source is
the organization license flag, not the plan name:

```bash
curl -sS "${BASE_URL}/api/v2/organizations/${ORG_ID}" \
  -H "authorization: Token $API_KEY" | jq '.organization.license.credentialRequests'
```

(In helper environments: `get_organization_capabilities()`.)

When the flag is `false` (or the create call fails with a policy denial), do
NOT give up and do NOT ask the user to paste secrets into chat. Switch to the
**guided connection flow** instead:

1. Create (or reuse) the shell scenario first, without a working credential.
2. Hand the user the scenario editor URL
   (`https://<zone>.make.com/<teamId>/scenarios/<scenarioId>/edit`) and a
   click path: open the middle module -> click "Add" next to the
   connection/keychain field -> fill the fields -> Save.
3. State the **exact paste format** for the credential fields (see
   "Credential paste formats" below) — this is mandatory, users cannot know
   provider-specific shapes such as Bearer prefixes.
4. Ask the user to reply "done" when finished, then verify the connection
   with `POST /connections/{id}/test` or a narrow shell test run before any
   real retrieval.

In helper environments `connection_setup_guide(scenario_id, module_label=...,
provider=...)` generates this guide.

## Credential paste formats (state these verbatim to the user)

Always include the exact expected format in the credential-request
`description` AND in chat. Known shapes:

| Provider / type | What to paste |
|---|---|
| HTTP app, API Key Auth keychain | Fields: Key, Placement, Name. Provider expects `Authorization: Bearer <key>` -> Key = `Bearer <key>` (literal prefix + space), Placement = header, Name = `Authorization`. Provider uses a plain key header (e.g. `X-API-Key`) -> Key = raw key, Name = header name. |
| Daytona (HTTP app keychain) | Key = `Bearer <daytona-key>`, Placement = header, Name = `Authorization` |
| e2b app connection | raw API Key starting with `e2b_` — no `Bearer ` prefix, no quotes, and NOT the `sk_e2b_...` Access Token (app sends `X-API-Key` itself; any value not starting with `e2b_` fails with `401: authorization header is malformed`) |
| Basic auth keychain | username/password exactly as issued, no encoding |

When the provider is unknown, say explicitly which of the two API-key
conventions applies after checking the provider's API docs.

If a pasted value keeps failing after UI edits (verified live with the e2b
connection — multiple UI re-saves did not fix a malformed key), write it
programmatically instead: `GET /connections/{id}/editable-data-schema` lists
the writable fields, then `POST /connections/{id}/set-data` (e.g.
`{"apiKey": "..."}`) updates the connection guaranteed whitespace-free.
Verify with a real module run, not just `/connections/{id}/test` — the test
endpoint can report `verified: true` for basic-type connections even when the
stored secret is wrong.

## Decision ladder

Prefer the most current supported path first, then fall back only when needed.

0. Before creating anything, list existing connections for the target app in the active team and reuse one if it already satisfies the workflow.
1. Decide the recipient (see "Choose the request path by recipient first").
2. For the current Make user (default), use the self-service path:
   - for API-call shells: `POST /api/v2/credential-requests/actions/create-by-credentials` with an explicit connection `type` and `scope` array (see the scope rule for universal API-call modules below)
   - for regular modules that declare their own scopes: `POST /api/v2/credential-requests/actions/create` with the app/module selection, or the equivalent MCP credential-request tool
3. Only for an explicitly external recipient: check the plan gate above (on `credentialRequests: false` use the guided connection flow), then:
   - `POST /api/v2/credential-requests/requests/v2`
4. Use older legacy request paths only when the workspace clearly still depends on them.

Important branching rule:
- if the workspace returns a policy or permission denial such as `403 Permission denied` or a message indicating credential requests are not enabled for the target user/workspace, stop retrying request endpoints and switch to the guided connection flow above
- do not keep retrying equivalent credential-request endpoints when the failure is clearly policy-based rather than endpoint-shape-based
- only fall back to another endpoint when the evidence suggests API-version mismatch, route availability, or request-shape incompatibility
- if authorization fails because an existing connection is expired, revoked, or otherwise invalid, do not try to re-auth that connection in place; use the credential-request path to create a fresh connection

## Preflight: reuse before create

Before opening a new credential request, verify all of the following:
- correct zone
- correct organization and team
- the provider has already been proven in the Make app catalog for this organization/team
- existing connections for the target app in that team
- whether one of those connections is already suitable for the requested account and scope

Use a two-tier proof model:
- A connection is a reuse candidate when the app or connection family matches the discovered module, the account identity matches the requested target, `POST /api/v2/connections/{connectionId}/test` returns `verified: true`, and the required scope fit is known or can be checked.
- A connection is proven for retrieval only after a real `POST /api/v2/scenarios/{scenarioId}/run` succeeds through a shell bound to that connection for the intended path, method, query, and body.

A proven run validates that operation. It does not prove unrelated future provider paths or write methods.

No-duplicate request rule:
- before initial provisioning, search existing requests for the same app, account target, recipient, and required scope or credential shape
- if an active request already exists for the same fresh authorization incident, return its `publicUri` instead of creating another duplicate link
- a stale `pending` request status never overrides a verified connection, and a completed request is not proof that the resulting connection is usable until the connection and a real shell run are verified
- after a live shell run proves an existing connection has provider auth, permission, or insufficient-scope failure, do not repair that old OAuth connection in place; create or return a fresh Make Credential Request/new connection link for the missing authorization

REST example:
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'user-agent: Mozilla/5.0' \
  "${BASE_URL}/api/v2/connections?teamId=${TEAM_ID}&type[]=azure"
```

For REST calls, prefer the `type` filter. Do not rely on `accountName=...` query parameters to filter the response.

Do not treat a type match alone as enough to reuse the connection. Also confirm:
- the connection family matches the discovered module's expected connection family
- the account identity matches the requested mailbox, tenant, workspace, or user
- the scope set is sufficient for the intended API path and method
- the connection is not known to be expired, revoked, or otherwise invalid

If Make MCP or another supported surface exposes connection detail, inspect it before reuse. Useful checks include the visible account label and scope count.

## Connection verification before reuse

Before reusing a connection, or before trusting an existing shell that already points at a connection, verify the connection through Make itself:

1. Get connection detail:
   - `GET /api/v2/connections/{connectionId}`
2. Test the saved credentials:
   - `POST /api/v2/connections/{connectionId}/test`
3. When scope IDs are available and scope fit matters, check scope explicitly:
   - `POST /api/v2/connections/{connectionId}/scoped`

Treat `{"verified": true}` from `/test` as the liveness proof. Treat `verified: false`, provider auth errors, revoked credentials, or a past `expire` value as not reusable. Liveness is necessary for reuse, but it is not provider authorization proof for every path or scope; the first successful shell run proves only the tested operation.

Important nuance:
- a future `expire` timestamp means the connection is still usable
- Credential Request detail can lag or remain `pending` even after the UI shows a credential as authorized
- when `/connections/{connectionId}/test` returns `verified: true`, that verified connection wins over stale request-detail status

Do not create a second Credential Request for the same app/account just because an old request detail still says `pending` during initial provisioning. Reuse the saved `requestId`, inspect it, list matching connections again, verify candidate connections, and continue if a verified connection is found. This preflight rule does not override a live shell-run authorization failure: when a run proves the old connection lacks the needed provider permission, create or return a fresh request link for a new connection.

## Recipient and account-identity gate

Before creating a new credential request, resolve two separate questions:

1. Who should complete the authorization flow?
2. Which provider account should the resulting connection point at?

Do not assume the current Make token owner is automatically the right credential-request recipient if the task is for another human or shared account.

Do not assume the first matching connection is correct when multiple connections exist for the same app. Compare at least:
- connection type
- account metadata such as email, domain, tenant, or UID when available
- scenario usage if the shell is expected to reuse a known existing scenario
- scope fit for the requested operation

If the intended recipient or target account identity is unclear, stop and ask for that exact missing item before creating a new request.

## New-connection rule

If a new credential request results in a newly authorized connection, create a new shell for that new connection.

The same rule applies when an old connection exists but its authorization is expired or invalid.

Do not automatically patch a pre-existing shell to point at the newly created connection unless the user explicitly wants that exact shell replaced.

Reason:
- it keeps shell ownership and account identity clear
- it avoids silently repointing an existing reusable scenario from one account to another
- it generalizes across email, CRM, ticketing, and other SaaS providers

It also prevents a different class of mismatch: same vendor suite, wrong connection family. Example: a provider's mail app and calendar app may both authenticate through the same vendor, while the discovered Make modules still require different app bindings or different connection families.

## External-recipient V2 request style

Use this style only when the credential must come from a different person or
a service-account owner (see the recipient decision above). Why this style
for that case:
- you specify the app and module context directly
- Make can derive required credential types more reliably
- the request is less dependent on hardcoded connection-type assumptions

Example body with placeholders:
```json
{
  "name": "Outlook API shell connection",
  "teamId": TEAM_ID,
  "description": "Authorize Outlook for the generic API shell scenario.",
  "credentials": [
    {
      "appName": "microsoft-email",
      "appModules": ["makeApiCall"],
      "appVersion": 2,
      "nameOverride": "outlook-api-shell"
    }
  ],
  "provider": { "providerMakeUserId": MAKE_USER_ID }
}
```

`provider` is required by `POST /credential-requests/requests/v2`: either
`{"providerMakeUserId": <existing Make user id>}` or
`{"name": "...", "email": "..."}` to invite a new user. A current Make user
id for the active account is visible as `authorId` in scenario run logs and
via `GET /api/v2/users/me`. Requests without `provider` are rejected with a
payload-shape error.

`appModules` entries are module IDs (for example `["makeApiCall"]`, or
`["*"]` for all modules with credentials) — not `appName`/`moduleName`
pairs. `appVersion` matters: request the version that carries the universal
API-call module (see the version sweep rule in discovery-and-shells.md).

`appVersion` is app-specific — never copy it from another app's example;
two apps, even from the same vendor, can sit on different current versions.
Take it from `apps_recommend` output, which returns the current `appVersion`
per app, or sweep versions with `app_modules_list`. Module validation on
credential requests only checks the module list of the requested version, so
an API-call module that lives in a different version produces a misleading
"module does not exist" error.

Use this external path only for a different recipient, and only when the workspace can infer the needed connection family from the discovered app/module context; when an explicit connection type or scope must be encoded, hand the recipient a `create-by-credentials`-shaped request instead.

## Scope rule for universal API-call modules

Module-derived credential requests inherit OAuth scopes from the modules
named in `appModules`. Universal API-call modules declare no provider scopes
themselves, so a request derived only from the API-call module yields a
connection that authenticates but carries only baseline identity scopes —
every provider API call through the shell then fails with an
insufficient-scope error.

`["*"]` module derivation is not a safe substitute here either: it can
resolve to a different connection family of the same vendor than the one the
API-call module requires.

For API-call shells, request the connection with `create-by-credentials` and
an explicit `scope` array. Reserve module-derived requests for regular
modules that declare their own scopes.

## Insufficient-scope failures on existing connections

A structurally compatible connection can still fail at run time with
`403 Request had insufficient authentication scopes` or a similar provider
permission error. Provider wording varies, but the meaning is the same: the
connection exists and authenticates, yet it was authorized without the scope
or permission the intended call needs.

Handling rule:
- treat insufficient-scope as "no suitable connection exists" in the decision
  ladder, even though the connection tests as valid
- follow the [Authorization Repair Playbook](./retrieval-execution.md#authorization-repair-playbook)
- create one credential request for the target app/module, or use
  `create-by-credentials` when the exact connection type and scope must be
  encoded
- after authorization, bind the shell to the new connection; do not expect
  the old connection to gain scopes in place

## Self-service create-by-credentials style

This is the standard self-service choice for API-call shells: it is not
gated like the external request flow, and it encodes the connection type and
scope explicitly instead of deriving them from modules.

Example body with placeholders:
```json
{
  "name": "Provider API shell connection",
  "description": "Authorize the provider account for the generic API shell scenario.",
  "teamId": TEAM_ID,
  "connections": [
    {
      "type": "PROVIDER_CONNECTION_TYPE",
      "description": "Readonly provider connection for the API shell example.",
      "scope": ["PROVIDER_READ_SCOPE"],
      "nameOverride": "provider-api-shell"
    }
  ]
}
```

This fallback is often the safer generic choice when you already know the exact connection family and scope requirement and want the request to encode them directly.

Practical rule:
- for the current user, prefer `create-by-credentials` with explicit type and scope (API-call shells) or `actions/create` with module selection (regular modules)
- use the external V2 request style only when the credential must come from a different recipient
- for vendor suites with multiple connection families, verify whether the discovered module expects an app-specific family (such as a mail-specific connection) or a broader vendor-wide family before encoding the type

## Inspect authorization state

After the user opens the public authorization URL and completes consent, inspect the request:
- `GET /api/v2/credential-requests/requests/{requestId}/detail`

Confirm:
- request status
- credential state
- resulting credential or connection identifier

Also confirm whether the resulting connection is usable in the target scenario or module family. Authorization success alone does not prove that retrieval execution is correctly configured. A credential request appearing in a list, reporting `completed`, or returning a connection identifier is still only request-state evidence; it is not authorization proof for the intended provider operation.

After inspecting the request detail, list connections again and match the resulting connection back to the target identity before patching the scenario.

Then verify the matched connection:
- `GET /api/v2/connections/{connectionId}` for visible details
- `POST /api/v2/connections/{connectionId}/test` for credential liveness
- `POST /api/v2/connections/{connectionId}/scoped` if the required scope IDs are known and scope fit is still uncertain

Only patch or create a shell after the target connection is verified. If verification fails, treat the credential as not ready and go back to the same Credential Request or create a new request only when the old request can no longer satisfy the app/account requirement.

## Patch the scenario after authorization

Once the chosen connection exists:
1. inspect the current blueprint
2. inject the confirmed connection value in the correct module field or restore structure
3. update the scenario
4. activate it if needed
5. run a verification execution

If a reusable shell scenario already exists, prefer patching that shell only when reusing an existing suitable connection. If the connection is newly created, create a new shell for that new connection.

## What to record before patching

Always record these values first:
- scenario ID
- target module ID in the blueprint
- exact connection field or restore path to update
- selected connection ID
- both connection type layers for the app

If the request was created for a different recipient than the current token owner, also record:
- intended recipient identity
- recipient Make user ID if known
- any workspace or feature limitations discovered during request creation

## Safe user-facing write prompt

Use a brief confirmation prompt before patching an existing scenario:

```text
You asked me to patch the Make shell with the authorized connection.
Risk: this can overwrite the current connection mapping and stop the scenario if the wrong connection is inserted.
Example: if the shell expects an Outlook connection and I patch a different credential, the API-call module can fail until corrected.
Reply with YES to proceed, or tell me what to change first.
```

## Public sharing rule

If this workflow is being published or contributed to a shared repository:
- replace real team IDs, organization IDs, user IDs, connection IDs, and workspace-specific names with placeholders
- use neutral labels such as `provider-api-shell` instead of personal labels
- avoid phrases such as `verified live` or `worked in tenant X`
- describe fallbacks as compatibility options, not as tenant-specific facts
