# Research and inventory

Load before investigating an existing app, choosing a new app's scope, or estimating API-change work.
The output is a read-only evidence package and a bounded proposal, not permission to edit or publish.

## 1. Define the question

Record the requested outcome, acceptance criteria, known symptoms, named components, and exclusions.
A ticket, spreadsheet export, internal account, or knowledge-base clone is not a prerequisite.

| Work type | Investigation focus |
| --- | --- |
| New app | Real provider API, authentication, safe validation request, useful module set, unsupported capabilities. |
| Bug | Exact failing configuration, expected versus observed behavior, request/response trace, reproducibility. |
| Feature | Provider support, existing coverage, new inputs/outputs, dependencies and compatibility. |
| API change | Each changed path, field, enum, authentication requirement, behavior, and effective date. |
| Upgrade | Old/new provider contracts, migration requirements, app-version strategy and parity expectations. |

For a new app, state that no remote app snapshot exists yet; do not invent an app identifier or version.
For an existing app, a display label or old report is only a discovery lead, not verified identity.

## 2. Resolve identity and access

Fix the exact app name, Make app major version, selected Make zone, and owning origin before analysis.
Preserve identifier case and prefixes. Do not default to version `1` or silently choose the highest number.
The public app API supports app/version reads and an `origin` column; request only needed metadata.[37]
Compare returned identity with the requested target. A disagreement requires resolution, not a workaround.
Use public example zones such as `us1.make.com`; actual reads use the explicitly selected origin.

Keep these separate in the evidence header:

- Make app version and development/published variant.
- Apps platform/manifest version, where available.
- Provider API version from base URL, headers, connections and component overrides.
- App-level and component-level visibility, approval, deprecation and archival flags as actually returned.
- Source interface/package version, retrieval time, and the scope of successfully retrieved detail.

Unknown flags stay unknown. A hidden module can still run in an existing scenario.[6]
Private/new components belong in development and review inventories.
Apply a **public-only** filter only to an explicitly requested published-impact view, never to all research.
Keep legacy versions separate; include them when maintenance, migration or regression scope calls for them.

## 3. Build a complete inventory before narrowing detail

Discover supported read operations in the current public interface; see [tooling and release](tooling-and-release.md).
List every component kind independently, following that operation's pagination contract if it has one.
Record returned count, pagination/completion state and errors per kind; calculate totals from saved records.
A failed, truncated, unauthorized or unsupported list is **not an empty list**.
Only a successful complete listing can establish zero components.

| Component | Inventory fields and detail to inspect when relevant |
| --- | --- |
| App | Name/version/origin, base configuration, groups, documentation and declared API versions. |
| Modules | Stable name, label, type, connection/webhook bindings, visibility; communication, static/mappable inputs, interface, samples, scope and polling epoch. |
| Connections | Definition name/type, attached consumers, parameters, validation/authentication/refresh flow and scopes; exclude secret common-data values. |
| RPCs | Name, connection, parameters, communication, consumers and output purpose. |
| Webhooks | Name, connection, parameters, incoming payload handling, attach/detach lifecycle and consumers. |
| Custom IML functions | Name, callers, implementation and executable tests, if enabled and accessible. |
| SDK Endpoints | Separate optional definition inventory; use [Endpoint gates](sdk-endpoints.md), not module names as substitutes. |

For every HTTP-bearing component, record the method and effective URL(s), including inherited base and
version overrides. Record no HTTP call only when inspected code confirms that absence.

Module sections are documented independently; an API/communication-only download cannot establish input,
output or sample correctness.[39] RPCs can supply options, dynamic fields or samples, so record
purpose rather than assuming every RPC is a dropdown.[31]
Custom IML functions require enablement; unavailable access is not evidence that an app has none.[27]
The connection listing is app-scoped rather than app-version-scoped: retain exact bindings instead of
assuming every returned connection belongs exclusively to the selected major version.[38]

Fetch detail progressively: named components first, then their dependencies and affected consumers.
Independent reads can run in bounded batches. Persist each completed batch before continuing.
For an explicitly exhaustive audit, fetch every required section of every listed in-scope component.
Never silently convert a scoped download into a claim of whole-app coverage.

## 4. Keep a trustworthy snapshot

Store sensitive snapshots outside published skill/examples directories with restricted access.
A snapshot manifest should record:

- Target tuple, capture time, source/version and inventory completeness by component kind.
- Detail scope: inventory-only, named components, or all components.
- Retrieved relative paths and tool-computed checksums of the saved bytes.
- Confirmed absent optional sections separately from unsupported, failed or unrequested sections.
- Unresolved dependencies, missing pages, and any redactions that limit analysis.

Parse exports by their observed structure; do not count guessed dictionary keys as an empty inventory.
Verify requested names against the inventory. Reconcile duplicate names by component kind and scope.
Keep raw section names separate from local filenames; local layout is not a remote API contract.
Stage refreshes separately and retain the last valid snapshot if the new retrieval fails.
Do not mark a refresh complete until every required list/detail read has succeeded.
Widening detail does not refresh the original inventory timestamp; record the additional fetch separately.
Refresh stale or contradictory evidence before a decision or write; file presence alone proves nothing.
Never print common-data secrets, invite tokens, credentials or personal records in the report.

## 5. Trace implementation against provider evidence

Prefer the provider's current API reference, OpenAPI document, changelog and migration guide.
Record source URL, version/date, method/path, authentication/scopes, inputs, response and error shapes,
pagination, rate/cost limits, webhook registration/signatures and test-environment availability.
Use public SDK documentation for Make semantics; provider examples cannot define IML semantics.
When sources disagree, identify which behavior was documented and which was actually observed.
Blocked documentation limits conclusions; it does not justify guessed URLs, fields or auth flows.

Trace each requested capability through its request, transformation, interface and dependencies.
A shared base/connection/function change requires consumer discovery, not just the originally named module.
Include polling static parameters and attached webhook parameters when tracing trigger inputs.
A changed Create/Update field can require matching Get/Search/Watch output updates; verify each consumer.
Expand optional product opportunities only when requested; keep them separate from the required fix.
A similar label, universal API-call module, or Endpoint does not prove equivalent first-class coverage.

## 6. Deliver an actionable research result

Include the verified target, evidence freshness, inventory/detail counts, exclusions and unresolved reads.
For each capability, record **Covered**, **Partial**, **Missing**, or **Broken**, with a component path and
provider source. Use **Needs verification** instead when incomplete evidence prevents a classification.
Explain the smallest implementation option, dependency impact and compatibility risk.
For bugs, distinguish static code reasoning from an actual reproduction and identify the failing layer.
For API changes, use the evidence gates in [maintenance](maintenance.md).

Count verified components when useful; never invent affected user, scenario, installation or team counts.
Use app-relative paths in reports. Link public evidence; share source material only within authorized scope
and after removing credentials, personal/tenant identifiers and private hosts.
End with the decision supported by the evidence and the next approval needed, not an unrequested mutation.

## Sources

[6] https://developers.make.com/custom-apps-documentation/create-your-first-app/app-visibility.md
[27] https://developers.make.com/custom-apps-documentation/app-components/iml-functions.md
[31] https://developers.make.com/custom-apps-documentation/app-components/rpcs.md
[37] https://developers.make.com/api-documentation/api-reference/sdk-apps.md
[38] https://developers.make.com/api-documentation/api-reference/sdk-apps/connections.md
[39] https://developers.make.com/api-documentation/api-reference/sdk-apps/modules.md
