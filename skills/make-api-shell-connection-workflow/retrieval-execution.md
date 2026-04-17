# Retrieval Execution

This file covers what happens after connection provisioning succeeds.

Provisioning success is not the same thing as retrieval success. Treat retrieval as a separate phase with its own strategy choice, validation run, and output normalization.

## Goal

Given a connection-ready Make API-call shell:
- configure the right API path pattern for the business request
- run a narrow validation request through the shell
- inspect the real output bundle
- normalize the result for Hermes or the user-facing caller

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
    "body": null
  },
  "responsive": true
}
```

This is the default execution contract for the shell across providers.

The concrete `path` changes by provider, but the scenario-run payload shape stays the same.

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

Confirmed example to remember, but not to universalize: Google Calendar has been observed around the order of a few hundred requests per minute per user in some environments, which is high enough for bursts but still easy to exceed with naive fan-out. Treat provider documentation and live error responses as the actual source of truth.

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
  "data": "{{3.body}}"
}
```

That is the contract. It should stay stable across providers.

Do not switch that generic contract to:
- `{{3}}`
- `{{3.data}}`
- another guessed nested field

### B. Retrieval-specific normalization

Only after the body has been returned through the generic shell may you decide how to interpret the business payload:
- messages
- records
- issues
- tickets
- errors

If `data: null`, a bare number, or another unusable shape appears, first ask:
1. did the generic shell still return `{{3.body}}`?
2. did the API path, method, headers, or body match the provider requirement?
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
