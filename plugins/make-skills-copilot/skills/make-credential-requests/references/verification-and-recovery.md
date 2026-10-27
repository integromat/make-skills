# Verification and recovery

Load before reusing authorization, checking a completed request, handling stale/partial states, or repairing
access. Contracts below are from SDK 1.7.1 and the public REST references; they are not live-test results.

## Keep private, resumable evidence

Before creating, compare existing resources and active saved requests for the exact zone/team, recipient,
provider account, purpose, kind, and permissions. SDK inventory methods include
`credentialRequests.list(teamId, options)`, `connections.list(teamId, { type: [...] })`, and
`keys.list(teamId, { typeName })`.[6][8][9] Honor each method's actual filters and pagination contract; a
partial or forbidden listing is not proof that no authorization exists.

Retain only necessary private metadata in session state or an approved private store: approved intent,
selected identifiers/version, required scopes, request ID, required credential-record IDs, resulting
resource IDs, evidence state, and the returned
`publicUri` where needed for later completion. Treat that link as sensitive even though its field is named
“public.” The intended owner's current private one-to-one chat is a valid delivery channel, not a reason to
write the link to a repository file. No extra storage service is required. Do not put it in telemetry or
shared artifacts. Do not log raw SDK errors, full request/detail objects, provider response bodies,
`prefill`, connection `data`, or token-bearing fields.

Creation acknowledgements, metadata readback, consent, identity verification, and operation tests are
separate evidence. Read back the exact request after creation and again after consent. Validate its team,
requester, recipient where represented, and correspondence to the approved selection. Missing fields are
unknown, not confirmation. Preserve the original selected Endpoint metadata privately: the SDK credential
detail type exposes module/app fields but does not declare an `appEndpoints` field.[6]

## Resolve the right IDs and every required state

`make.credentialRequests.getDetail(requestId)` returns the already-unwrapped `requestDetail`, including
`credentials`; do not access another `.requestDetail` wrapper.[6]

| Identifier | Meaning | Use |
| --- | --- | --- |
| `request.id` / detail `id` | Credential request ID | `getDetail(requestId)` |
| `credentials[].id` | Credential-record ID within a request | Correlate each required credential |
| `credentials[].remoteId` | Resulting connection/key ID, when present | Read the resource for its actual kind |

Each credential also carries `requestId`, `component`, `state`, optional `scope`/`remoteScope`, and app
metadata.[6] Components are `account` or `keychain`; the credential's `type` (`oauth`, `basic`, or `key`)
is not interchangeable with the resulting connection's internal `accountName`.[2][8]

Project metadata before returning SDK results to a model or log. This example performs only a request-detail
read and deliberately omits raw objects, names/emails, descriptions, arbitrary provider metadata, and
secret-bearing fields. Its arguments are metadata placeholders; `make` is an existing authorized SDK client.

```javascript
async function readRequestState(make, requestId) {
  const detail = await make.credentialRequests.getDetail(requestId);
  return {
    requestId: detail.id,
    teamId: detail.teamId,
    requesterId: detail.userId,
    recipientId: detail.makeProvider?.id ?? null,
    status: detail.status,
    expiresAt: detail.expiresAt ?? null,
    credentials: detail.credentials.map((credential) => ({
      credentialId: credential.id,
      requestId: credential.requestId,
      component: credential.component,
      state: credential.state,
      remoteId: credential.remoteId ?? null,
      requestedScopes: credential.scope ?? null,
      grantedScopes: credential.remoteScope ?? null,
    })),
  };
}
```

Null in this projection means unavailable, not a passed check. Validate identities and selection against
trusted intent in the host before declaring readiness; expose any further metadata only when necessary and
safe. The projection is private evidence, not a readiness validator or a public logging payload.

Documented request statuses include `authorized`, `partially_authorized`, `pending`, `incomplete`,
`declined`, and `invalid`; individual credential states additionally include `reauthorizing`, but not
`partially_authorized`.[2] Require each credential needed by the intended operation to be `authorized`
with a valid `remoteId`. Do not invent a `completed` success state or assume aggregate authorization proves
identity, type, scope, or provider functionality.

The SDK types `remoteId` as an optional string.[6] Validate the complete decimal representation and positive
safe-integer range before passing a numeric ID to a connection/key API. Do not trim, truncate, parse a numeric
prefix, or substitute the request/credential-record ID. Verify every required credential; testing an
explicitly approved ready subset does not establish that the whole request is ready.

## Resulting connection verification

For an `account` credential, use the exact validated connection ID:

1. `make.connections.get(connectionId)` unwraps the connection. Confirm `id`, `teamId`, compatible
   `accountName`, relevant account identity metadata, and `scopes[].id` against intent.[8]
   Missing metadata, identity, or scope fields remain unknown; they do not satisfy the check.
2. `make.connections.scoped(connectionId, requiredScopes)` returns a **boolean**; its request field is
   singular `scope`, not `scopes`.[8] Check the exact provider scope IDs, not a scope count or label.
3. `make.connections.verify(connectionId)` also returns a **boolean**, through POST
   `/connections/{id}/test`.[8] This normally contacts the provider; it is not merely a metadata read.[17]
   Inspect the selected app's validation behavior and authorize its effects before running it, especially
   for custom apps. If unsafe or unsupported, state the verification gap rather than forcing a test.
4. Verify the intended provider identity and smallest approved operation through the original consumer.
   Check both transport and provider-level errors. A test returning true can still be insufficient for
   that operation; a successful read establishes neither unrelated operations nor write permission.

An expiry timestamp, connection label, future expiry, or metadata lookup alone is not provider-operation
proof. A failed/unknown scope or identity check blocks the intended use until resolved.

## Resulting key verification

For `keychain`, use `make.keys.get(keyId)` and verify expected `id`, team, and `typeName`; use
`make.keys.types()` to inspect supported types.[9][18] SDK 1.7.1 and the inspected Keys reference expose
**no `keys.verify()` equivalent**.[9][18] Metadata does not prove the key works. Test only through a
consumer that explicitly supports that key kind, with a narrow approved operation. Never pass a key ID to
an Endpoint's `connectionId`, or collect the raw key to work around an incompatible consumer.

## Reconcile instead of guessing

| Observation | Safe next step |
| --- | --- |
| Pending, incomplete, or reauthorizing credential | Keep the saved handle; wait for owner completion and perform bounded detail reads. Do not start an unbounded polling loop. |
| Partially authorized request | Inspect each required credential and resource. Report exactly what remains; do not treat partial as complete. |
| Aggregate status appears stale | Re-read the exact request, per-credential states, and correlated resource IDs. Match team, type, identity, and scopes; do not let one aggregate label override stronger or contradictory evidence. |
| Per-credential state is unresolved but a similar connection exists | A matching name or successful connection test does not prove association. Reconcile exact IDs. An independently verified existing authorization may be reused for its approved purpose while the request remains unresolved; do not claim the request completed. |
| Declined, invalid, expired, or wrong-account authorization | Explain the blocker. Seek an owner decision to repair or replace; do not silently recreate, change recipients, or delete resources. |
| Timeout or ambiguous create/extend response | Preserve the intent and any returned IDs. Use safe exact reads or scoped request discovery. If the outcome cannot be established, report uncertainty and seek review before another creation. |
| Make API denial | Report the denied API operation and sanitized reason. Do not substitute another identity or equivalent route. A denial is not an empty inventory. |
| Provider authorization/scope failure | Distinguish it from a Make API denial or input error. Diagnose the operation and required permission from current contracts before requesting more access. |

After a genuine missing-scope failure, obtain approval for the exact additional access. Where supported,
`credentialRequests.extendConnection({ connectionId, scopes })` creates a consent request for the existing
connection.[6] Do not assume the old connection must always be replaced. An approved fresh authorization
and explicitly approved consumer rebinding are alternatives. Verify consent, resulting resource identity,
scopes, and the particular operation again; do not silently alter existing jobs or broaden shared access.

Never repair by submitting secrets through programmatic `set-data`, copying credentials from another
project, or changing the selected execution surface. If the owner must use Make's secure UI, provide a
contract-grounded completion step only when permitted; policy denials are not bypass instructions.

## Destructive cleanup is not request housekeeping

`make.credentialRequests.delete(requestId)` deletes the request **and associated connections and keys**;
the SDK always sends `confirmed=true`, so the API's guard against deleting attached credentials without
confirmation does not protect SDK callers.[2][6] `deleteCredential(credentialId)` calls `delete-remote`,
removing the live connection or key and resetting the credential state to pending.[2][6]
Neither is a harmless way to tidy a fulfilled request, retry consent, or clear stale status.
SDK-generated MCP `credential-requests_delete` and `credential-requests_credential-delete` call these same
destructive methods; their tool descriptions do not make them automatic reauthorization or scope-repair
steps.[7]
Do not invoke either automatically. Any intentional deletion requires separate authorization covering the
exact affected resources and their consumers, followed by appropriate readback.

Keep reporting stages separate: **created**, **waiting**, **authorized and identity verified**, and
**operation tested**. Record the actual tested operation and limitations privately. Static schemas, mock
checks, and successful resource reads must never be reported as live provider-operation proof.

## Sources

[2] https://developers.make.com/api-documentation/api-reference/credential-requests
[6] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/credential-requests.ts
[7] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/credential-requests.tools.ts
[8] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/connections.ts
[9] https://github.com/integromat/make-typescript-sdk/blob/a21b6b60de71ca96341da76b5329eff83c9ebc2a/src/endpoints/keys.ts
[17] https://developers.make.com/api-documentation/api-reference/connections
[18] https://developers.make.com/api-documentation/api-reference/keys
