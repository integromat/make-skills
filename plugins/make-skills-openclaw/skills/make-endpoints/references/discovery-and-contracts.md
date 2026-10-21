# Discovery, connections, and schemas

Load when choosing an action/connection, checking live availability, using a custom app, or resolving a
schema mismatch. Avoid loading the complete catalog and every output schema for a single operation.

## Three distinct questions

1. **What does this installed package describe?** `list`, `describe`, generated app clients, and
   `EndpointTools` answer from bundled definitions.
2. **What can this team use now?** Live Make discovery and current connections answer after authorization.
3. **What is authorized for this task?** The user's request and host policy decide; neither of the catalogs
   grants permission to write.

## Narrow bundled discovery

```bash
make-endpoints-cli list
make-endpoints-cli list google-docs v1
make-endpoints-cli describe google-docs v1 get-document
```

`describe` includes the input schema, accepted account types, scopes, context, and behavioral annotations.
Add `--output-schema` only to inspect the returned structure. Pin an app version for repeatable calls;
omitting it selects the latest version bundled in that package, not a live service lookup.

The app package name, JavaScript client/property name, CLI kebab-case action, and wire Endpoint name can
differ. Discover the mapping rather than converting an unverified string. In the documented example,
`google-docs`, `GoogleDocsV1Sdk`, `get-document`, and `getDocument` identify different parts of one contract.

## Establish live team/connection availability

Use an already authenticated platform client or CLI to inspect the intended team's connections:

```bash
make-cli connections list --team-id "$MAKE_TEAM_ID" --output json
```

A connection must match the Endpoint's account type and required provider scopes, not just the app's display
name. If several candidates remain, confirm the intended account. For identity-sensitive retrieval or
writes, a documented read-only account/profile operation can establish which account the connection serves.
Never use a write as a credential test.

Some enabled environments expose the team-filtered catalog through
`GET /api/v2/imt/endpoints-usable?teamId=<TEAM_ID>`. This is a beta interface, not a command provided by the
current Endpoints CLI. Call it only through an authorized Make client when the current environment exposes
that contract; do not turn its refusal into an empty inventory or route around an access restriction.

Its structure is `packages -> versions -> endpoints`. Preserve returned names and inspect
`credentialsRequired` and `credentialsAvailable`:

- Required credentials: select an explicitly compatible returned connection.
- No required credentials: an empty connection list can be valid; do not invent a connection requirement.
- Missing action: distinguish catalog/version coverage, app availability, insufficient provider scopes, and
  missing team access. No single empty list proves which cause applies.

Both native apps and custom `app#...` apps can appear. Listing metadata does not bypass the runtime's own
permission checks. When live usable discovery is unavailable, bundled definitions plus an authorized
connection listing remain useful, but report compatibility/enablement as unverified until a permitted read
succeeds.

## Use the exact input contract

Treat the generated definition, current app-version schema, or authoritative custom-app definition as the
field contract. Do not infer schemas from an app label, scenario module, or another version. For native app
schemas, some environments expose `GET /api/v2/imt/apps/<app>/<major>`; custom-app authoring/read interfaces
are separate and require their own permissions. Recheck the exposed contract rather than assuming every
app resolves through one metadata URL.

The execution envelope and business input have different jobs:

- `appName`, `appVersion`, `endpointName`: exact target.
- `teamId`: Make execution scope.
- `connectionId`: managed connection, when required, outside `input`.
- `input`: only the selected Endpoint's business fields.

Use the types the interface actually accepts. Do not silently coerce identifiers, fill unknown required
values, remove meaningful `false`/`0`, or put a provider token into the input. Validate required fields even
when a README example is shorter. For example, the current Google Docs `getDocument` contract requires
both `documentId` and `filter`.

## Generic execution is not generic discovery

`make-endpoints-cli endpoints execute` and SDK `execute(pointer, options)` can call a known target outside
the bundled generated clients, including a custom app. They cannot infer its schema or prove entitlement.
Use a verified contract and preserve literal `app#` names. Prefer dedicated Endpoints over `arbitraryCall`
when available; a generic API-call Endpoint still needs an authoritative provider method/path/body and
explicit authorization for the intended operation.

For code-generated agent tools, expose a small allowlist of definitions. Keep credential resolution and
execution in the trusted host. Validate model-produced arguments and approved identifiers before dispatch;
`readOnlyHint` or `destructiveHint` is metadata, not an access-control implementation.
