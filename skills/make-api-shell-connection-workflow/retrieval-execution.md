# Retrieval Execution

This file covers what happens after connection provisioning succeeds.

Provisioning success is not the same thing as retrieval success. Treat retrieval as a separate phase with its own strategy choice, validation run, and output normalization.

## Goal

Given a connection-ready Make app or shell:
- choose the best retrieval path
- run a narrow validation request
- inspect the real output bundle
- normalize the result for Hermes or the user-facing caller

## Retrieval strategy ladder

Prefer this order unless current metadata proves a different path is required:
1. provider-native search or list modules for the first retrieval step
2. provider-native get/detail modules for follow-up enrichment
3. generic API-call shell only when native retrieval modules are missing, insufficient, or too restrictive for the endpoint the user needs

Examples of native retrieval families:
- email providers: search/list messages, then get message detail
- CRM providers: search/list records, then get record detail
- issue trackers: search/list issues, then get issue detail

Do not assume the API-call shell used during provisioning is also the best retrieval path.

## Execution workflow

1. Confirm the provider and the exact Make app version again.
2. Choose the retrieval module family that best matches the business request.
3. Run the narrowest possible validation call first.
4. Inspect the real output bundle from that run.
5. Map `scenario-service:ReturnData` from the observed bundle shape, not from guesswork.
6. Re-run and verify the final payload.

## Output-mapping rule

Do not finalize `ReturnData` until a real execution bundle has been seen.

Common starting patterns:
- `{{3.body}}` for many raw API-call modules that return a body object
- `{{3}}` when the module returns the useful payload as the whole bundle
- a specific property such as `{{3.data}}`, `{{3.messages}}`, or another discovered field only after current evidence shows that field exists

Signals that the mapping is wrong:
- `data: null`
- a bare number where structured data is expected
- only transport metadata and no business payload

When this happens, inspect the run output and correct the mapping before calling the retrieval complete.

## Raw API vs native retrieval modules

Use raw API shell calls when:
- the endpoint is custom or unsupported by native modules
- the request shape must remain open-ended
- native modules cannot express the needed filters or payload shape cleanly

Use native search/get modules when:
- the user wants normal business retrieval such as emails, leads, contacts, tickets, or issues
- the provider already exposes modules that handle the search semantics cleanly
- predictable bundles are needed for follow-up mapping or enrichment

## Failure interpretation

Keep failure diagnosis phase-specific:
- connection request failure: provisioning problem
- scenario activation failure: shell-provisioning problem
- empty or unusable payload from a successful run: retrieval or output-normalization problem

If activation fails with a generic validation error, go back to shell metadata.
If the run succeeds but the payload is wrong, stay in Make and fix the retrieval strategy or `ReturnData` mapping before considering fallback.
