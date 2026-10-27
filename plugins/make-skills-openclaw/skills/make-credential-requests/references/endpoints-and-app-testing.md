# Endpoints and custom-app testing

Load when handing a requested credential to an Endpoint or custom-app test. Provisioning supplies managed
authorization; it does not select a new execution architecture or authorize additional business operations.
For creation contracts, load [request flows](request-flows.md); before handoff, load
[verification and recovery](verification-and-recovery.md).

## Distinguish definitions, instances, and consumers

| Object or consumer | What it establishes | What it does not establish |
| --- | --- | --- |
| `make.sdk.connections` | Custom-app connection definitions, schemas, and sections | A team-owned, authorized connection instance |
| `make.connections` | Managed connection instances and their metadata | Correct provider identity or every operation's permission by existence alone |
| `make.keys` | Managed key instances/types | An interchangeable Endpoint `connectionId` or generic verification API |
| `@makehq/endpoints-sdk` | Execution of supported app Endpoints with their required context | App authoring, request entitlement, or organization beta access |

These definition and managed-resource namespaces are separate, not interchangeable forms of one
credential.[8][9][10]

The Endpoints SDK provides the execution surface.[15]
Request only the kind supported by the selected consumer. If the action requires no authentication, skip
credential requests entirely. A missing or denied discovery result does not justify creating credentials
without an established consumer contract.

## Endpoints: preserve the exact execution target

1. Discover the app, numeric major version, and **exact Endpoint name**. The Endpoints CLI's `list` and
   `describe` expose bundled definitions, including accepted connection types and required provider scopes,
   not live team entitlements or compatible authorized connections.[16] Preserve discovered case and
   namespaces; do not substitute a module name or infer the identifier from a generated method spelling.
2. Establish current team access and compatible managed connections using the authorized live interfaces
   available to the workflow. Fix the zone/team/app/version/Endpoint tuple and intended provider account.
   A bundled catalog entry is not evidence that the team can execute it.[16]
3. When the current user needs new authorization, SDK `createAction` explicitly accepts
   `credentials: [{ appName, appVersion, appEndpoints: [endpointName] }]`.[6] No scenario is required.
   Select only the intended Endpoints and validate their permissions; use explicit types/scopes only when
   those requirements are known. External V2 documents module selections, so it is not an automatic
   fallback for an Endpoints request; resolve that contract gap before any external-recipient write.
4. After consent, resolve each required credential's `remoteId` and validate the compatible connection,
   provider identity, and scopes. A key cannot be substituted for a connection simply because both have
   numeric IDs. Retain credential kind throughout the handoff.
5. Resume **`make-endpoints`** by skill name, preserving `@makehq/endpoints-sdk` or its selected CLI. Keep
   `teamId` and outer `connectionId` separate from business `input`; do not put provider credentials in
   input.[15] The approved connection must remain bound to the selected app/version/Endpoint/team.
6. Run the smallest approved identity/read operation and evaluate its actual result. Endpoints require
   their own `endpoints:run` permission, team/connection access, and organization enablement; the current
   documentation describes closed beta.[15][16] Successful credential provisioning does not enable beta
   access, install the Endpoints package, or prove provider-operation success.

Do not substitute a scenario, direct-provider SDK, raw provider key, or another transport to conceal a denied
or unavailable Endpoint. A runtime/beta blocker is a reported blocker, not a provisioning failure to retry.
A read-only task does not authorize side-effecting Endpoint tests or recurring-job activation.

## Custom apps: supply test instances, not definition objects

`make.sdk.connections.list(appName)`, `.get(connectionName)`, and
`.getSection(connectionName, section)` inspect app connection **definitions**, including scope-related
sections; they do not create an authorized team connection instance.[10] A successfully uploaded connection
definition is therefore not proof that a module, RPC, or Endpoint can authenticate at runtime.

For credential-bearing custom-app modules:

1. Confirm the actual app identifier, owning/version context, chosen test operation, and intended team.
   Read the selected module's declared credential requirements and provider permission documentation.
2. Discover through `make.credentialRequests.listAppModulesWithCredentials(appName, appVersion)` using the
   custom-app `app#` namespace; the SDK URL-encodes `#`.[6] Preserve the exact discovered app identifier and
   numeric major version. Use returned `id` values in `appModules`, including any `module:param` suffix;
   `name` alone can lose a multi-credential requirement.[6][7]
3. Inspect the definition and current consumer schema to determine the required connection/key kind and
   provider scopes. Do not treat `make.sdk.connections` identifiers as team connection IDs, copy another
   provider's scope list, or assume an arbitrary API-call declaration covers every intended test.
4. Reuse compatible known authorization or request the necessary test connection/key using the approved
   recipient-correct flow. If definitions or discovery are insufficient, resolve that gap; do not invent
   a generic connection family or create a scenario to manufacture a requirement.
5. Resolve and verify the resulting managed resource, then resume the **already selected authoring/test
   workflow**. Use SDK, CLI, or an actually exposed authorized tool according to that workflow's contract.
   This credential-request skill folder works without an additional authoring skill or its files.

For custom-app Endpoint tests, use the same Endpoint discovery, compatibility, and access checks above;
a definition in `make.sdk.endpoints` is not itself a successful runtime test. If the selected test interface
does not support a needed key or connection kind, report the incompatibility instead of casting IDs or
extracting secrets.

Inspect custom-app connection validation before invoking it: even a “test” can contact the provider or have
side effects. Require approval for side-effecting provider tests, app publication/sharing, broader scopes,
or activation. Credential provisioning alone authorizes none of these actions. Keep local syntax/schema
checks, remote definition readback, credential verification, and runtime operation results separate.

## Handoff evidence

Return a minimal private metadata projection sufficient to resume:

- Intended zone/team, recipient, and provider-account identity check.
- Selected consumer, exact app/major version and module credential IDs or Endpoint names.
- Request and credential-record IDs, supported kind, and verified connection/key `remoteId`.
- Requested and verified scopes, outstanding consent, and whether any rebinding was explicitly approved.
- Exact operation tested, result category, and untested permissions or beta/runtime blockers.

Do not return raw credential objects, `prefill`, connection `data`, secrets, or full provider payloads.
Deliver the saved authorization link only to the intended recipient when completion is still needed.
A successful read proves only that read; it does not authorize publishing, sending, editing, or deleting.

## Sources

[6] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/credential-requests.ts
[7] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/credential-requests.tools.ts
[8] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/connections.ts
[9] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/keys.ts
[10] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/sdk/connections.ts
[15] https://developers.make.com/make-sdk/make-endpoints-sdk
[16] https://developers.make.com/make-cli/make-endpoints-cli
