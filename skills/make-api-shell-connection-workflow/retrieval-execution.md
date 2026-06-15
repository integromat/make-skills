# Retrieval Execution

This file covers what happens after connection provisioning succeeds.

Provisioning success is not the same thing as retrieval success. Treat retrieval as a separate phase with its own strategy choice, validation run, and output normalization.

## Goal

Given a connection-ready Make API-call shell:
- configure the right API path pattern for the business request
- run a narrow validation request through the shell
- inspect the real output bundle
- normalize the result for the user-facing caller

## Retrieval transport rule

For this workflow family, the Make API-call shell is always the retrieval transport.

Do not switch to provider-native Make search/list/get modules for the first retrieval step or for follow-up enrichment.

If the business request needs multiple steps, perform all of them through repeated runs of the API-call shell.

## Execution workflow

1. Confirm the provider and the exact Make app version again.
2. Resolve the business target precisely: mailbox, inbox, account, pipeline, board, queue, or project.
3. Choose the API endpoint pattern that best matches the business request.
4. Run the narrowest possible validation call first through the shell.
5. Inspect the real output bundle from that run.
6. Keep `scenario-service:ReturnData` fixed to the generic shell contract and adjust only downstream normalization.
7. Re-run and verify the final payload.

## Generic shell run contract

When using the generic three-module shell, run it with a payload shaped like this:

```json
{
  "data": {
    "path": "...",
    "method": "GET",
    "header": [],
    "qs": [],
    "body": null
  },
  "responsive": true
}
```

This is the default execution contract for the shell across providers.

The concrete `path` changes by provider, but the scenario-run payload shape stays the same.

Use `qs` for query-string parameters. Do not hide provider options inside a concatenated URL when the shell supports `qs`; normalize `path?x=1&y=2` into `path` plus `qs` before the run.

The provider module's base URL may already include a service segment. This
applies to any provider: when a 404 error output echoes a doubled path
segment (`/<segment>/<segment>/...`), the `path` value repeated a segment the
module base already carries — remove the duplicated prefix from `path` and
retry. Confirm the effective base by checking the provider module
documentation or a single probe call before composing further paths.

Important deployment precondition:
- do not assume the `StartSubscenario` module metadata alone made this callable
- explicitly set the scenario-level input interface first
- verify `/api/v2/scenarios/{scenarioId}/interface` before the first run

The keys under `data` must match the deployed interface exactly. For reusable shells, the standard execution path is:
1. `PATCH /api/v2/scenarios/{scenarioId}/interface`
2. `GET /api/v2/scenarios/{scenarioId}/interface`
3. `POST /api/v2/scenarios/{scenarioId}/run`

Use `responsive: true` for validation runs and for normal interactive retrieval whenever the response size is still manageable.

Default retrieval should use `GET`. Treat `PUT`, `PATCH`, and `DELETE` as write/destructive methods and require explicit user confirmation before running them.

## Large payloads, timeouts, and extraction path

Two separate limits matter here:
- Make scenario execution limits and provider API limits during the run
- post-run inspection limits when reading full execution detail

Practical guidance:
1. Start with the narrowest possible list/search call.
2. Prefer `responsive: true` so the shell returns the business payload directly when feasible.
3. Read the returned payload from `outputs.data` first instead of forcing an execution-detail round trip.
4. Add provider-side narrowing such as `limit`, `maxResults`, `pageSize`, `fields`, `updatedSince`, or a search query before trying to inspect giant payloads.
5. Split list/search from detail enrichment instead of fetching everything in one run.

Do not treat a timeout or a heavy `executions_get-detail` response as evidence that the shell contract is wrong. First narrow the retrieval and reduce payload size.

## Rate limiting and write safety

Even when `scenarios_run` itself is exempt from an organization's general request-rate bucket, provider APIs behind Module 2 still enforce their own limits.

Generic operating rules:
- rate-limit write methods more aggressively than reads
- use backoff and replay for 429-style provider errors
- keep batch sizes modest on detail-enrichment loops
- separate read-heavy and write-heavy workloads when the provider module behaves differently

Treat provider documentation and live error responses as the actual rate-limit source of truth. Even generous read limits are easy to exceed with naive fan-out.

If a provider module shows empty-body serialization issues on `GET` or `DELETE`, split the shell design:
- read/delete shell without a Module 2 `body` mapper
- write shell with a Module 2 `body` mapper

That split is about request-shape compatibility and rate safety, not about changing `ReturnData`.

## Common retrieval pattern for SaaS data

For most business retrieval tasks, use this pattern through the API-call shell:

1. Run a narrow list/search call first.
2. Collect stable identifiers from that first result.
3. Run follow-up detail calls only for the shortlisted records.
4. Normalize the detail payload into a user-facing summary.

This keeps the first execution cheap, proves that the shell works, and avoids over-fetching.

### Email pattern

Use:
1. list or search messages/threads with a narrow filter
2. fetch message detail only for the returned IDs or thread IDs
3. normalize sender, subject, date, labels, snippet, and whether a reply seems needed

### CRM pattern

Use:
1. search or list records with a narrow filter such as owner, stage, or updated-after
2. fetch detail only for the returned record IDs
3. normalize owner, company/contact, stage, last activity, next action, and urgency

### Ticketing pattern

Use:
1. search or list issues or tickets with a narrow filter such as assignee, state, queue, or updated-after
2. fetch detail only for the shortlisted IDs
3. normalize requester, status, SLA or priority, latest comment, and next action

### Chat/messaging pattern

Chat providers usually require a container identifier before any message
read. Confirmed example: Slack's `/conversations.history` rejects calls
without `channel` (`missing required field: channel`).

Use:
1. list conversations first (`/conversations.list` with `types` and a small `limit`)
2. pick the target container by recency or by the user's naming
3. fetch history only for that container id, with a small `limit`
4. normalize channel name, sender, timestamp, and text; note that bot or
   attachment-only messages can have empty `text` fields and still be valid

## Suggested normalization contract

For user-facing summaries, normalize the provider payload into a stable business shape whenever practical:

```json
{
  "id": "provider-specific-id",
  "title": "subject or record title",
  "actor": "sender, requester, owner, or customer",
  "status": "state or stage",
  "updatedAt": "timestamp",
  "summary": "snippet or compact summary",
  "recommendedAction": "reply | inspect | ignore",
  "reason": "why that action is recommended"
}
```

The shell still returns raw `body`. This normalization happens after retrieval, not inside the shell contract.

## Output-mapping rule

Do not mix the generic shell contract with retrieval-specific normalization.

### A. Generic API shell contract

For the three-module generic API transport shell:

```json
{
  "data": "{{MIDDLE_API_MODULE_ID.body}}"
}
```

That is the contract. It should stay stable across providers.

In the generic example blueprint, `MIDDLE_API_MODULE_ID` is `3`, so the example mapping is `{{3.body}}`. In real Make exports, inspect the module ids and map to the actual middle API-call module. For example, a flow with StartSubscenario id `2`, API-call module id `5`, and ReturnData id `4` must use `{{5.body}}`.

Do not switch that generic contract to:
- `{{MIDDLE_API_MODULE_ID}}`
- `{{MIDDLE_API_MODULE_ID.data}}`
- another guessed nested field

### B. Retrieval-specific normalization

Only after the body has been returned through the generic shell may you decide how to interpret the business payload:
- messages
- records
- issues
- tickets
- errors

If `data: null`, a bare number, or another unusable shape appears, first ask:
1. did the generic shell still return `{{MIDDLE_API_MODULE_ID.body}}` for the actual middle module id?
2. did the API path, method, headers, query parameters, or body match the provider requirement?
3. is the downstream interpreter reading the body correctly?

If the failure is actually an authorization failure from an expired or invalid connection, stop retrieval debugging and go back to the credential-request path instead of trying to re-auth the old connection in place.

Do not redefine the generic shell contract to compensate for a retrieval problem.


## Failure interpretation

Keep failure diagnosis phase-specific:
- connection request failure: provisioning problem
- scenario activation failure: shell-provisioning problem
- empty or unusable payload from a successful run: retrieval or output-normalization problem

If activation fails with a generic validation error, go back to shell metadata.
If the run succeeds but the payload is wrong, stay in Make and fix the API-call plan or downstream normalization before considering fallback.

## Private debug bundle

For hard SaaS retrieval failures, collect one private troubleshooting bundle before changing strategy:
- original user request and resolved business target
- agent step log with timestamps and phase labels
- Make zone, organization, team, app name, app version, and API-call module slug
- scenario ID plus the relevant `GET /api/v2/scenarios/{scenarioId}/blueprint` excerpt showing the middle module and `__IMTCONN__`
- bound connection ID, connection detail summary, `/connections/{connectionId}/test` result, and `/connections/{connectionId}/scoped` result when scope IDs are known
- credential request IDs, recipient, app or connection type, scope or credential shape, and current status
- failing shell run payload summary (`path`, `method`, `qs`, `body` shape) and the exact provider or Make error
- execution-log reference from `GET /api/v2/scenarios/{scenarioId}/logs/{executionId}` when an execution ID exists
- final proof result: `success`, `auth_request_pending`, `missing_scope`, `wrong_connection`, `path_error`, or `unknown`

This bundle is for private debugging. Before sharing publicly, sanitize it according to [Sanitization and Sharing](./sanitization-and-sharing.md).

## Authorization Repair Playbook

Use this sequence for provider authentication, authorization, insufficient-scope, wrong-account, or shell-bound-to-old-connection failures after a shell run:

1. Preserve the failing request payload exactly: `path`, `method`, `header`, `qs`, and `body` shape.
2. Read the shell blueprint with `GET /api/v2/scenarios/{scenarioId}/blueprint` and extract the middle module app, version, module slug, and bound `__IMTCONN__`.
3. If the shell has no bound connection, the wrong app/module, or the wrong connection family, treat it as shell provisioning or binding drift before changing API paths.
4. Inspect the bound connection with `GET /api/v2/connections/{connectionId}` and test liveness with `POST /api/v2/connections/{connectionId}/test`.
5. If the connection is not live, expired, revoked, or belongs to the wrong account/workspace, treat it as no suitable connection. Return to the credential-request path.
6. If the connection is live but the provider returns auth, permission, or scope errors, do not try to repair the old OAuth connection in place. Derive the minimal missing permission from the selected endpoint, provider documentation, or live error. When scope IDs are known, check with `POST /api/v2/connections/{connectionId}/scoped` only as evidence for the new request shape.
7. Create or return a fresh Make Credential Request/new connection for this auth failure. If an already-created fresh pending request for the same app, recipient, account target, and required scope exists, return its `publicUri` instead of creating another duplicate during the same incident. Otherwise create exactly one new request.
8. The user-facing answer must include the exact request `publicUri` auth link. If Make does not return a URL, state the exact `publicUriUnavailableReason` and the request status; do not collapse this into a vague "reauthorize" answer. For scope-based providers, include explicit connection `type` and explicit `scope`. For API-key, Basic, or other non-scope credential families, follow the credential paste-format rules instead of inventing scopes.
9. After authorization, list connections again, match the resulting connection to the target identity, test it, and run `/scoped` when scope IDs are known.
10. Bind according to the shell ownership rule: a newly authorized connection gets a newly created shell; patch an existing shell only when reusing a connection for the same automation and after the required write confirmation.
11. Rerun the same request payload (`path`, `method`, `header`, `qs`, `body`) through the correctly bound shell. This proves that operation only; repeat scope/path validation for materially different operations.

Do not keep guessing provider paths while the evidence points to connection identity, liveness, or scope. Path repair and authorization repair are separate loops.

## Generic debugging matrix

Scenario exists but `/run` returns no useful output:
- check the output interface
- check `scenario-service:ReturnData` mapping if used
- verify `responsive: true` behavior and response shape
- verify the output keys the downstream reader expects

`400` or `422` from `/run`:
- compare submitted `data` keys and types against `/api/v2/scenarios/{scenarioId}/interface`
- verify required inputs and defaults

Empty business data:
- check the retrieval query or filter
- check the target account/workspace identity
- check the provider API endpoint and permissions

Authentication or authorization error:
- stop path guessing and use the Authorization Repair Playbook

Wrong account/workspace data:
- treat this as a connection identity mismatch and use the Authorization Repair Playbook

Scope or permission error:
- use the Authorization Repair Playbook; do not treat connection liveness as scope proof

Existing shell points to an old connection:
- use the Authorization Repair Playbook and preserve the new-connection/new-shell rule

## Definition of Done

Do not call retrieval complete just because the scenario exists. Done means:
- target provider confirmed
- target account/workspace/mailbox/tenant confirmed
- retrieval target and operation confirmed
- connection identity and scope verified
- connection liveness verified by Make's connection test API
- Credential Request completed if needed
- resulting connection ID extracted and recorded
- real Make scenario exists with `scenario-service:StartSubscenario`, the app-specific API-call module, and `scenario-service:ReturnData`
- scenario-level input/output interface patched and verified
- blueprint shows the correct app module and connection ID
- `/run` with `responsive: true` returns real output data
- the first real run proves the intended path, method, query, and body through the bound shell
- retrieval returns records from the intended account/workspace
- downstream normalization/reporting works if requested
- schedule points to the final validated configuration if scheduling was requested
