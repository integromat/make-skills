# Reliable reads and approval-bound writes

Load for pagination, date windows, bulk work, retries, scheduled workflows, or any operation that changes
external state. These rules concern business behavior, not a particular mail, chat, CRM, or document app.

## Complete a read

1. Define the requested scope: account, collection, filters, time interval, and required detail fields.
   Resolve relative dates in the intended timezone. Derive each local-day boundary independently so daylight
   saving changes do not become a hardcoded 24-hour window. Disclose exclusions instead of silently adding
   unread-only, inbox-only, or other narrowing filters.
2. Start with one bounded page using the Endpoint's documented limit/cursor fields. Validate the envelope
   and provider error state. A Make HTTP success, `statusCode`, or estimated result count alone does not
   establish successful and complete business retrieval.
3. Continue using the actual returned next cursor/offset. Bound pages, records, response size, and time.
   Reject repeated or non-advancing cursors. Reaching a safety bound means partial results, not success.
4. Deduplicate stable resource IDs. If full records are needed, fetch and validate every selected ID; check
   returned identity and requested date bounds. Do not confuse a message count with a thread count or a
   search summary with complete objects.
5. Preserve batches in an approved private workspace when the result is larger than the tool/context window.
   Compute counts and completeness from the collected data. For a provider without snapshot semantics,
   disclose changes during pagination rather than promising a transactional export.
6. If incremental output was requested, emit sanitized records as they arrive. Escape terminal control
   characters in provider-supplied titles, headers, and names; do not wait until the final aggregate to make
   a streaming script appear responsive.

Empty, partial, failed, and forbidden are different outcomes. A missing field or provider error is not an
empty array. For `arbitraryCall`, inspect the documented inner HTTP status and provider error envelope;
providers may report application failure inside an HTTP 200 response.

## Bound retries and concurrency

Classify the business operation first. Make's POST execution route is also used for read-only Endpoints.
Retries that are safe for a read can duplicate a send or create action. Retry transient read failures only
within explicit bounds; follow a documented retry delay where available. Do not blanket-enable server-error
retries on a client that also performs non-idempotent writes.

For bulk work, keep a stable input-ID set and bounded concurrency. Stop scheduling new work on failure,
drain in-flight operations, and report completed/failed/unknown IDs separately. A timeout is not permission
to skip verification or to call the next mutation batch before the previous batch is resolved.

## Bind approval to the actual action

Before a write, record a narrow intent: authorized actor/account, exact resource/destination, operation,
payload, and any approval/version reference. Separate provider permission from user approval; successfully
reading a resource does not authorize sending, labeling, editing, or deleting it.

For mutable drafts or records:

- Use the provider's stable container ID and check any changing underlying message/version ID.
- Re-read before execution; compare the full approval-relevant payload, not just a summary.
- For messages, include recipients, thread/reply routing, subject/body, attachments, and alternative MIME
  content where relevant. An extracted plain-text body can miss an unauthorized change.
- Prefer a documented operation that binds the exact approved payload or conditional version. If the API
  only acts on a mutable ID and cannot enforce that binding, disclose the race and require an appropriate
  user-controlled/manual flow; do not claim a pre-read locks the external object.
- Never invent universal idempotency, dry-run, conditional-write, or transactional guarantees.

An explicit one-off delivery is not approval to activate a scheduler, mark source records processed, or send
related replies. Define those follow-on actions separately.

## Verify and recover

Treat a successful response as a receipt, not the final proof. Save the stable returned ID and read the
exact target back. Verify account, destination, content, state, and completeness. Match expected and returned
identities; mere existence somewhere in a search result is insufficient.

Some providers normalize text, emoji, or formatting. Compare using only documented equivalences; never
normalize arbitrary whitespace, links, mentions, recipients, or business values to force a match. Actor
metadata can contain both a user and an app/bot marker—verify the documented identity combination rather
than assuming that any marker proves the post is absent or unauthorized.

After an uncertain write, do not immediately repeat it. Use an idempotency receipt when the provider
actually supports one, or narrow read-based recovery using the saved intent, exact destination and unique
correlation evidence. Ambiguity remains an unknown outcome requiring review, not a reason to resend.

Only mark upstream records processed after the explicitly required downstream readbacks are complete. Keep
published numbering/references stable when processing resumes. A failed readback does not justify silently
replacing the published content or extending a prior approval.

## Evidence and sensitive data

Keep secrets and raw private provider payloads out of public logs, examples, issues, and commits. Store
necessary checkpoints privately and retain only what the workflow needs. Endpoint execution logs/artifacts
are a separate capability; the basic SDK response does not guarantee an execution ID or a logs client.

Report package/schema checks, local tests, real read calls, write receipts, and verified external state as
separate evidence levels. Unit tests and intercepted requests can validate client logic, not prove a live
provider action. In a recurring workflow, a verified one-off run is not proof that scheduling, recovery, or
future approvals are correctly configured.
