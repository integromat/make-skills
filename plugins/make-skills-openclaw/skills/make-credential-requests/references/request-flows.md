# Request flows and published contracts

Load before creating a request, selecting its recipient, resolving credential requirements, or extending
scopes. For readback and uncertain outcomes, load [verification and recovery](verification-and-recovery.md).

## Contract basis and client boundary

The SDK examples target published **`@makehq/sdk@1.7.1`**, whose npm `gitHead` is
`a21b6b60de71ca96341da76b5329eff83c9ebc2a`; its declarations and runtime map the methods below.[1][6]
These are static contract facts, not proof of runtime acceptance, plan eligibility, or provider access.
Inspect another installed version before transferring the examples to it.

For MCP, discover the active tool surface first. Plugin/V2 flows use `connection_create` and
`connection_get`; use their own input/output schemas, not the SDK payloads below. A supported module or
Endpoint selection does not imply explicit-type, scope-extension, external-recipient, or version-pinning
support. Report a required capability gap instead of guessing a parameter or installing the SDK.

The SDK-generated MCP surface separately defines `credential-requests_create` → `createAction()`,
`credential-requests_get` → `getDetail()`, `credential-requests_create-by-credentials` →
`createByCredentials()`, and `credential-requests_extend-connection` → `extendConnection()`.[7]
Use these only when the active catalog actually exposes them. For module selection, its discovery tool is
`credential-requests_list-app-modules-with-creds`.[7] Tool schemas remain authoritative; do not copy them
into a parallel local contract.

The examples define helpers, not additional SDK methods. `make` is an already configured, authorized
server-side `Make` client. All other arguments are approved, discovered **metadata placeholders**, not
secrets. Invoke creation helpers only after identity, compatibility, duplicate-request, and approval checks.
Their returned links are for private persistence and delivery, never logging.

Paths below are relative to the intended zone's `/api/v2` base:

| Intent | Interface | Route | SDK result |
| --- | --- | --- | --- |
| Current-user app/module/Endpoint selection | `make.credentialRequests.createAction(body)` | POST `/credential-requests/actions/create` | `{ request, publicUri }` |
| Current-user explicit connection/key types | `make.credentialRequests.createByCredentials(body)` | POST `/credential-requests/actions/create-by-credentials` | `{ request, credentials, publicUri }` |
| Approved extension of an existing connection | `make.credentialRequests.extendConnection(body)` | POST `/credential-requests/actions/extend` | `{ request, publicUri }` |
| Explicitly different recipient | Documented REST V2 contract | POST `/credential-requests/requests/v2` | No named V2 SDK wrapper |

The SDK resource and tool definitions establish the current-user actions; neither creation action accepts
a recipient `provider` selector.[6][7] The V2 REST response is `{ request, publicUri }`.[2]

**SDK-only naming trap:** SDK `credentialRequests.create()` calls legacy `/credential-requests/requests`,
returning the unwrapped request; it is neither `createAction()` nor V2 and must not be used for these flows.[6]
This warning does not apply to MCP `credential-requests_create` or CLI `credential-requests create`, which
call the current-user action.[3][7] The legacy REST creation route is deprecated.[2] Do not invent `createV2`
or use `Make.fetch`, annotated internal, as the transport for this workflow.[6][19]

Make API scopes and provider scopes are separate: credential-request reads use `credential-requests:read`,
creation actions use `credential-requests:write`, and module-credential discovery uses `apps:read`.[2][7]
These scope names do not establish the caller's team, role, or feature entitlement.

## Discover selection and credential kind

For modules, call `make.credentialRequests.listAppModulesWithCredentials(appName, appVersion)`, where the
version is a major number or `'latest'`.[6] Use `'latest'` only for exploration; resolve the numeric major
from app/version metadata before creating a request, rather than expecting a version field in this result.
Use returned **`id`**, not a guessed module name: multi-credential configurations can return
`moduleName:paramName`.[6][7] Preserve `app#` for custom-app discovery; the SDK encodes `#` in the URL.[6]

Inspect returned `type` and optional `scope`. A type can identify an `account`, a `keychain`, or multiple
alternatives; select only a kind the consumer actually accepts.[6][7] For Endpoint selection, load
[Endpoints and app testing](endpoints-and-app-testing.md) to obtain exact Endpoint names and requirements.

For explicit types, a managed connection's `accountName` is its internal type identifier, not its display
name or authentication category `accountType`.[8] Discover key-type names with `make.keys.types()`.[9]
Ground provider scopes in current Make metadata and provider permission documentation. Do not copy scopes
across providers or assume a generic API-call module declares every scope needed for arbitrary operations.

## Current-user app/module/Endpoint selection

`createAction` accepts `teamId`, `credentials`, and optional request `name`/`description`. Each selection
contains `appName`, optional numeric `appVersion`, `nameOverride`/`description`, and at least one of
`appModules` or `appEndpoints`; both are supported.[6] Require nonempty selected identifiers and a nonempty
credentials array. Pin the discovered version rather than relying on a changing latest version. Although
`['*']` is supported, it is not the least-privilege default.[6]

```javascript
async function requestEndpointAuthorization(make, target) {
  const { teamId, appName, appVersion, endpointName, purpose } = target;
  const { request, publicUri } = await make.credentialRequests.createAction({
    teamId,
    name: "Endpoint access",
    description: purpose,
    credentials: [{
      appName,
      appVersion,
      appEndpoints: [endpointName],
      nameOverride: "endpoint-access",
      description: purpose,
    }],
  });
  return { requestId: request.id, publicUri }; // Private handoff only.
}
```

For a module consumer, use `appModules` with discovered credential-configuration IDs instead of
`appEndpoints`. Neither selection requires a scenario.[6]

### Outdated REST example

For `/credential-requests/actions/create`, use top-level `teamId` and `credentials[]`, as the SDK and its
MCP tool contract do; the REST page's nested `connection`/`key` example is outdated, not an alternative
request body.[2][6][7] Do not mix the shapes or treat that page as the `create-by-credentials` contract.

## Current-user explicit types

`createByCredentials` accepts `teamId`, optional request `name`/`description`, and `connections` and/or
`keys`. Each connection has `type`, optional **`scope`** (singular array), `description`, and `nameOverride`;
each key has `type`, optional `description` and `nameOverride`, but no scope field.[6]
Require at least one connection or key; optional TypeScript arrays alone do not enforce this rule.[6][7]

```javascript
async function requestConnectionAuthorization(make, target) {
  const { teamId, connectionType, requiredScopes, purpose } = target;
  const { request, publicUri } = await make.credentialRequests.createByCredentials({
    teamId,
    name: "Provider access",
    description: purpose,
    connections: [{
      type: connectionType,
      scope: requiredScopes,
      nameOverride: "provider-access",
      description: purpose,
    }],
  });
  return { requestId: request.id, publicUri }; // Do not expose raw credentials.
}
```

For a key consumer, replace `connections` with `keys: [{ type: discoveredKeyType }]`; do not request both
kinds unnecessarily. The SDK also permits `prefill.hard`/`prefill.soft`, but this workflow does not prefill
secrets.[6] The owner supplies sensitive values only through Make's secure flow. Field-format instructions,
when necessary, must come from the selected app/provider contract, not a cross-provider paste-format table.

## Existing connection: approved scope extension

`make.credentialRequests.extendConnection({ connectionId, scopes })` creates a consent request for adding
OAuth scopes to an **existing** connection and returns `{ request, publicUri }`.[6]
Here **`scopes` is plural**, unlike `createByCredentials`' singular `scope`.

Use only when the selected interface supports it and the owner explicitly approves the connection and
additional scopes. Creating the request does not mean scopes were granted. Read back the request, verify
the resulting resource and scopes, then test the approved operation. An approved new connection and explicit
consumer rebinding are alternatives, not a mandatory replacement rule. Never silently broaden access on an
existing connection used by other jobs.

## Another recipient: external V2

Use this path only for an explicitly different intended recipient and with authorization for its effects.
When REST is the explicitly selected and approved transport, send **raw REST POST
`/credential-requests/requests/v2`** through an already authorized server-side HTTP client using its existing
Make API authorization; if that transport is unavailable, stop and report the gap. An MCP-only agent reports
the external-recipient capability gap rather than switching to REST or using credentials found elsewhere.
Do not use SDK `credentialRequests.create()` or internal `Make.fetch` as a substitute, expose a Make
token in chat or command arguments, or switch away from a denied MCP operation. Plugin/V2 `connection_create`
has no external-recipient selector; a body-building helper does not add that capability.
The documented body requires `name`, `teamId`, `credentials`, and `provider`; credentials are app/module
selections with required `appModules`, not documented Endpoint selections.[2] Do not use V2 as an automatic
fallback for Endpoints or add an unsupported `appEndpoints` field.

This helper constructs metadata only; it does not send a request:

```javascript
function externalModuleRequest(target) {
  const { name, teamId, appName, appVersion, moduleIds, providerMakeUserId } = target;
  return {
    name,
    teamId,
    credentials: [{ appName, appVersion, appModules: moduleIds }],
    provider: { providerMakeUserId },
  };
}
```

For an invited person, replace the provider object with
`{ newUser: { name: recipientName, email: recipientEmail } }`, **not** a flat name/email object.[2]
An existing user can be added to the team; a new user can be invited.[2] Confirm those effects before
submitting. The documented body has no `shouldSendEmail` control; do not promise email suppression.[2]
Do not switch an external recipient to a current-user action merely because that action exists.

## Eligibility and denials

The Help Center describes the third-party request feature with Partner/Enterprise eligibility, per-user
enablement, and role restrictions: team members request within their team, team admins within their
organization, and organization admins/owners can also request from external people.[4]
Enablement is for a user, not the organization.[4] This is flow-specific product guidance, not a universal
plan promise for current-user SDK actions. Public evidence here does not establish an enforceable
`license.credentialRequests` capability contract; the pinned organization type does not expose it.[13]

A generic 403 does not by itself diagnose licensing. Report the actual denied operation and sanitized error
category. An external-feature denial does not prove that a separate legitimate self-service path is denied
when the intended recipient was the authenticated user all along. That distinction never permits changing
the recipient, reducing requested scopes, cycling equivalent endpoints, or bypassing a denied operation.

For SDK/REST failures, inspect the selected API's authorization and request contract. Do not apply the
scenario MCP server's all-or-nothing OAuth-bundle rule to these calls. A permitted owner-driven Make UI
flow can be proposed when supported; it is not permission to evade a policy denial or collect secrets.

## Sources

[1] https://registry.npmjs.org/@makehq/sdk/1.7.1
[2] https://developers.make.com/api-documentation/api-reference/credential-requests
[3] https://developers.make.com/make-cli/make-cli/make-cli-reference/credentials
[4] https://help.make.com/credential-requests
[6] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/credential-requests.ts
[7] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/credential-requests.tools.ts
[8] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/connections.ts
[9] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/keys.ts
[13] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/organizations.ts
[19] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/make.ts
