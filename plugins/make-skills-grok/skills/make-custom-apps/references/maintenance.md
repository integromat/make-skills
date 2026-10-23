# Maintenance and API-change impact

Load for bug fixes, deprecations, provider API migrations, app upgrades, or compatibility-sensitive changes.
Start with the current read-only [research snapshot](research-and-inventory.md), not an old change summary.

## 1. Fix the maintenance target

Record exact app/version/origin, development versus released variant, affected components and acceptance criteria.
Make app version, Apps platform/manifest version, and provider API version are different facts.
Measure the provider version in base URLs, version headers, connections and component overrides.
Compare it with the provider's latest stable contract, announced changes and shutdown dates.
A newer API version does not by itself prove the existing implementation is broken.

For published-impact analysis, identify the version actually distributed to new users; a higher version
number alone does not establish publication. Report legacy-version findings separately.
For a bug in a legacy version, review that version rather than substituting the newest one.
For development, include private/new components and their consumers.
A public-only filter is a published-impact reporting choice, not a general maintenance exclusion.
Preserve unknown visibility; do not infer public status from labels, approval flags or missing fields.
Hiding a module does not disable existing scenarios that use it.[6]

## 2. Evaluate every relevant provider change

Collect and deduplicate the relevant official changelog, reference and migration URLs.
Track which sources were read, unavailable or outside the stated time window.
No new changelog entries alone cannot establish no impact: also compare the versions actually used.
Resolve contradictory code/version/origin evidence before recommending a migration.

For each change, retain this compact evidence record:

| Evidence | Required content |
| --- | --- |
| Provider change | Exact path/field/enum/auth behavior, source URL, effective date and old/new contract. |
| Code match | Actual component and section, request/response trace, dependent consumers. |
| Coverage | Covered / Partial / Missing / Broken; Needs verification when evidence is incomplete. |
| Compatibility | Breaking / Non-breaking / Needs verification, with a reason. |
| Action | Specific edit and regression checks, or an explicit no-code-change explanation. |

Use the coverage terms consistently:

- **Covered:** the inspected implementation already supports the required compatible behavior.
- **Partial:** the capability exists but a verified part is missing or incompatible.
- **Missing:** complete in-scope discovery establishes that the capability is not implemented.
- **Broken:** code and the provider contract demonstrate incompatibility; say whether observed now or
  expected after a documented future cutoff. Do not present a predicted failure as a live reproduction.

A failed read cannot support **Missing**; a failed test with wrong credentials cannot establish **Broken**.
A code grep is a lead. Trace the effective request and output, including helpers and overrides.
Evaluate SDK Endpoint definitions independently from modules when that surface is accessible.

## 3. Avoid false-positive maintenance

| Finding | Decision gate |
| --- | --- |
| Field/enum removal | Confirm it is still sent, selectable, transformed or exposed by the fetched implementation. |
| Already addressed | Confirm the current code implements the change; a resolved work item alone is insufficient. |
| Pass-through payload | Check both forwarding logic and declared output schema before concluding no code change. |
| User mapping may change | Separate downstream mapping guidance from a defect in the app definition. |
| Legacy-only mismatch | Identify that version explicitly; do not label the current release broken. |
| Private-only mismatch | Exclude only from a requested public-impact view; retain it for in-scope development. |
| Recommended replacement | Do not silently remap saved model names, enums, IDs or destinations. Obtain a product decision. |
| Incomplete provider docs | State the missing fact and next read/test; do not classify uncertainty as non-breaking. |

Describe affected configurations and behavior, not guessed user or scenario counts.
Verified component counts are useful; they are not usage analytics.
Separate maintenance required for compatibility from optional new provider capabilities.

## 4. Preserve existing contracts

The public breaking-change guide identifies risks in base configuration, OAuth refresh, communication,
required fields, validation, select options, dynamic RPCs, webhooks and custom functions.[32]
Review the whole effective contract, not only whether JSON parses.

- Keep stable module names and parameter/output keys. Cosmetic cleanup is not a reason to change identity.
- Prefer additive optional inputs with unchanged behavior when omitted.
- Check changed defaults, stricter validation, newly required inputs and removed enum values explicitly.
- Preserve output types, nested paths, IDs, date semantics, bundle cardinality and pagination behavior.
- Preserve polling cursor/epoch semantics and webhook registration, verification and detach behavior.
- Assess every consumer of a changed base, connection, RPC or function.
- Treat new provider scopes and refresh changes as authentication migrations, not incidental edits.
- Do not rewrite saved scenario values or switch user-selected destinations without explicit authorization.

For deprecations, use documented warnings/help and compatible alternatives where possible rather than
silently deleting an input. Announce removals before rollout through the approved communication process.[32]
Do not infer permission to contact users or post release announcements from a maintenance request.

## 5. Apply section updates without losing unrelated configuration

The public API exposes section setters, not an implied element-level merge.[38][39]
Inspect the exact chosen operation before writing. Treat a section setter as a full replacement unless
its current contract explicitly guarantees patch semantics.

1. Read and save the full current section and its target identity.
2. Modify only the intended content locally; retain all unrelated fields and ordering where meaningful.
3. Preserve existing `samples`, interface, scope and other sections; never replace samples with `{}`
   merely to satisfy an uploader. Samples represent an output bundle, not a request fixture.[19]
4. Diff the complete payload against the saved baseline and review dependency/compatibility effects.
5. Re-read before the approved write; stop on concurrent drift rather than overwriting another change.
6. Upload only approved sections and read each changed section back from the same app/version/origin.

Metadata updates and section setters can have different semantics. Do not extrapolate one to the other.
A saved response or upload acknowledgement is not proof of runtime behavior.

## 6. Choose a safe rollout

Private/public custom-app changes take effect immediately; they are not isolated draft deployments.[11][12]
Use an explicitly approved test copy when a live edit could affect existing scenarios.
For substantial incompatible API changes, the private/public maintenance guide recommends a new app;
do not assume a major-version clone is available to every account.[12]

For approved apps, development changes are not released to everyone automatically. Test the development
variant and request Make's approval through the documented review process.[10][13][33]
Compare old/new behavior with equivalent inputs and accounts; declare intentional differences separately.
Version parity must cover changed inputs, outputs, errors, pagination and authentication dependencies.
Do not duplicate side-effecting tests on existing records merely to obtain a comparison.

Record regression evidence, migration instructions, known limits, recovery options and release approval.
An approved-app rollback may require Make support; do not promise a local file restore reverses a release.[33]
After release, verify the exact released target and representative behavior before claiming rollout complete.

## 7. Close with evidence

Report scope/freshness, changes needed or no code change, affected components, deadline evidence and gaps.
Separate static review, upload/readback, live provider tests, and release/review status.
Include unresolved test preconditions, retained test objects and any blocked legacy-version verification.
For ongoing approved-app ownership, follow Make's maintenance obligations and API-checkup process.[14]

## Sources

[6] https://developers.make.com/custom-apps-documentation/create-your-first-app/app-visibility.md
[10] https://developers.make.com/custom-apps-documentation/app-review/approved-app.md
[11] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app.md
[12] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/private-public-apps.md
[13] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps.md
[14] https://developers.make.com/custom-apps-documentation/app-maintenance/terms-of-approved-app-maintenance.md
[19] https://developers.make.com/custom-apps-documentation/component-blocks/samples.md
[32] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps/managing-breaking-changes.md
[33] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps/approval-of-changes-in-approved-app.md
[38] https://developers.make.com/api-documentation/api-reference/sdk-apps/connections.md
[39] https://developers.make.com/api-documentation/api-reference/sdk-apps/modules.md
