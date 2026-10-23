# Review and QA

Load before accepting an implementation, uploading a change, or preparing app-review evidence.
Review the exact app/version/origin and changed sections, including private/new components in scope.
Use the [inventory](research-and-inventory.md) to discover dependencies; notes alone are not complete coverage.

## 1. Keep four evidence gates separate

| Gate | What it establishes | What it does not establish |
| --- | --- | --- |
| Static validation | Files parse, references resolve, schemas/IML and tests were inspected or executed locally. | Remote installation or real provider behavior. |
| Upload and readback | Exact approved definitions persisted on the intended app/version/origin. | Correct credentials, outputs or side effects. |
| Live execution | Approved test cases exercised actual Make/provider behavior with recorded results. | Untested cases, all users, or publication. |
| Release/review approval | The requested distribution/release step was approved and its status verified. | A substitute for any earlier gate. |

A fixture, successful HTTP status, upload receipt, or operation count cannot stand in for output assertions.
Make's public review prerequisites require functional test scenarios and recent, non-sensitive logs.[8]

## 2. Static and UX review

Use the current public rules, not internal category codes or an old app's style as universal requirements.
Report an **Error** for a demonstrated defect, **Warning** for risk or missing evidence, and **Suggestion**
for optional improvement. Cite the applicable rule and exact component/section for each finding.

- Parse every changed JSON/JSONC/IMLJSON file with the appropriate parser; report the number checked.
  Count zero files as a failed validation setup, not a passing app. Parsing does not validate IML semantics.
- Trace base/auth/error handling, connection and webhook bindings, RPC references and function calls.
- Use accurate verb/entity module labels; current guidance calls for sentence case and familiar provider
  terminology. Do not rename stable technical identifiers just to align display text.[34]
- Check labels, descriptions, field types, required flags and defaults against actual behavior.
- Explain formats, constraints and omitted-value behavior in concise `help`; use supported Markdown,
  bold field references and code-formatted examples, not arbitrary HTML/CSS.[35]
- Test mapped input as well as picker selection. RPC options must provide usable values, not only labels;
  verify connection compatibility, dependent fields, search behavior and bounded pagination.[18]
- Compare output mapping, interface and sample bundle field-by-field, including nested/conditional fields.
  An interface should describe the available output, and a sample represents one outgoing bundle.[17][19]
- Preserve existing samples and unrelated section contents during updates; see [maintenance](maintenance.md).
- Review custom-function tests whenever implementation changes. Assert exact values/types and edge cases;
  distinguish local JavaScript tests from the restricted Make runtime.[27]
- Verify credential sanitization in connection and base requests, responses and error paths.[36]

Do not infer HTTP Basic authentication from a connection-definition category, or normalize stored type
values into CLI/API create values. Validate the selected operation's contract separately.[28][38]

## 3. Approve a bounded test plan

Before creating resources, verifying credentials through live calls, or executing scenarios, record:

- Target app/version/variant/origin, approved test team and explicit managed provider connection.
- What changed and why; exact components verified against the current inventory.
- Acceptance criterion and changed-field to test-case mapping, including dependency consumers.
- Each case's inputs, expected request/output or error, fixture/data preconditions and evidence source.
- Maximum runs, records, pages, requests, elapsed time and acceptable provider/Make cost.
- External side effects, notification destinations, cleanup steps and any proposed retained resources.

Obtain approval for this concrete scope. A plan-only review performs no remote writes or live tests.
Use synthetic data and the fewest necessary scenarios. Prefer a related Create → Get → Update → Delete
lifecycle, with search/list branches at the end so multiple bundles cannot repeat downstream writes.[8]
Do not create data stores, folders, manual copies or recurring schedules by default.
For formal app review, cover every module in at least one scenario and include the required error case.[8]
For a narrow fix, state exactly what was not tested rather than claiming whole-app QA.

## 4. Required cases by behavior

| Surface | Cases to include when relevant |
| --- | --- |
| Inputs | Required/optional, omitted/null/empty, `0`, `false`, min/max, invalid enum/type, encoded identifiers. |
| Action | Expected result, documented empty/delete response, provider errors, exact created/updated-object readback. |
| Search/list | Zero results, one result, multi-page results, limit boundary, stable IDs, order, duplicates and stop condition. |
| Polling trigger | Initial epoch, next run, cursor persistence, duplicates, no new items and limit boundaries. |
| Instant trigger | Registration/verification, genuine event payload, output mapping and cleanup of the test subscription. |
| RPC/dynamic UI | Options, labels/values, dependencies, mapping mode, empty choices, auth errors and interface refresh. |
| Custom function | Happy path, null/undefined, false/zero, unexpected types, boundaries and every changed branch. |
| Universal call | Allowed method/path/query/body/headers, real input mapping, provider errors and secret redaction. |
| Upgrade | Prior/current-version parity with equivalent data and explicit intentional differences. |

Test omitted, empty and erase semantics against the app's manifest version and provider behavior;
Make documents different empty-value processing for the two platform versions.[23]
Do not convert all falsy values into omitted fields or treat a valid zero-result search as a failure.

For pagination, establish enough data to cross a page boundary; lower page size in a safe test variant
when supported. Verify requests and returned IDs across multiple pages, not just the final bundle count.[25]
Exercise the user limit, final partial/empty page, non-advancing cursors and page-index boundary.
Make's `pagination.page` starts at one and advances automatically; verify the provider's indexing.[20]
If multi-page data is unavailable, mark that case **Inconclusive**, not Pass or a pagination defect.

## 5. Run and inspect safely

Confirm the connected provider identity and permissions through an approved lightweight read before setup.
Check every test module's actual version and connection; a successful run against the wrong variant is invalid.
Approved-app development testing follows the documented browser Run once/module-only behavior; do not assume
scheduled/API runs exercise uncommitted changes.[13]
Enable confidential scenario handling only if the selected public interface supports it. Never invent a flag.
Use synthetic fixtures and sanitized evidence; if confidentiality prevents payload inspection, record that
limit rather than disabling protection or copying sensitive data to a capture store.

Inspect actual request serialization, provider status/body, Make bundles and declared output types.
For a raw-provider comparison, use an approved equivalent request and account; avoid replaying writes.
Compare changed fields individually, including nested arrays, timestamps and false/zero values.
Treat elapsed time/operations/bytes as diagnostic signals only, not proof of field-level correctness.
Record execution identifiers and sanitized evidence, with enough detail to reproduce the result.

| Failure layer | Treatment |
| --- | --- |
| Make authentication/access | Check selected origin, permissions and resource visibility; stop rather than widening access. |
| Provider authentication/scopes | Verify the intended connection; distinguish expired credentials from app request defects. |
| Provider rate limit/outage | Bound retries for safe reads; preserve the actual error and mark blocked cases appropriately. |
| App configuration/runtime | Reproduce against the correct variant and document the faulty field/mapping/behavior. |
| Missing capture or test data | Inconclusive or Blocked; no success inferred from an empty capture. |

After an uncertain write, recover with safe reads by returned ID or a documented unique marker; never resend blindly.
A delete or an update of an existing record is still a write, including a supposedly unchanged-value update.
Self-addressed messages, fictitious recipients and absent cleanup paths do not make writes automatically safe.

## 6. Cleanup and verdict

Maintain a ledger of exact objects created by this test: provider records, hooks, scenarios and any storage.
Clean up only those objects and only within the approved plan; never delete by name pattern or clear a shared store.
Perform permitted cleanup even after a later assertion fails. Verify deletion or remaining state by readback.
If no safe cleanup exists, obtain retention approval before creation and report the leftover object afterwards.
Stop/deactivate test schedules that this test activated; do not alter pre-existing schedules or shared connections.

Report each criterion/case as **Pass**, **Fail**, **Blocked**, **Inconclusive**, **Not run**, or **Not applicable**.
Pass requires the stated assertion; omitted/blocked cases cannot yield an unqualified overall QA pass.
Report exact coverage, regression findings, cleanup results, retained artifacts and the next approval needed.
Preparing evidence is not permission to publish; continue to [tooling and release](tooling-and-release.md).

## Sources

[8] https://developers.make.com/custom-apps-documentation/app-review/prerequisites.md
[13] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps.md
[17] https://developers.make.com/custom-apps-documentation/best-practices/output-parameters/interface.md
[18] https://developers.make.com/custom-apps-documentation/best-practices/remote-procedure-calls.md
[19] https://developers.make.com/custom-apps-documentation/component-blocks/samples.md
[20] https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md
[23] https://developers.make.com/custom-apps-documentation/other/processing-of-empty-values.md
[25] https://developers.make.com/custom-apps-documentation/debug-your-app/debugging-of-pagination-in-list-search-modules.md
[27] https://developers.make.com/custom-apps-documentation/app-components/iml-functions.md
[28] https://developers.make.com/custom-apps-documentation/app-components/connections.md
[34] https://developers.make.com/custom-apps-documentation/best-practices/naming-conventions/modules/module-labels.md
[35] https://developers.make.com/custom-apps-documentation/best-practices/naming-conventions/input-parameters/parameter-hints.md
[36] https://developers.make.com/custom-apps-documentation/app-components/base/sanitization.md
[38] https://developers.make.com/api-documentation/api-reference/sdk-apps/connections.md
