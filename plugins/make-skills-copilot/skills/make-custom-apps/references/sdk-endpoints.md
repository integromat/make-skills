# SDK Endpoints: definition review and authoring gates

Load only when the task concerns custom-app **Endpoint definitions**, their coverage, or their QA.
A provider HTTP endpoint, a scenario module and a Make SDK Endpoint are different objects.
For calling an existing Endpoint from code/CLI, use [make-endpoints](../../make-endpoints/SKILL.md).

## 1. Separate authoring from consumption

The public `@makehq/endpoints-sdk` package generates typed runtime calls and includes
`make-endpoints-cli`; it does not author custom-app definitions. Its published README states that
execution access requires organization enablement even though anyone can install the package.[49]
A bundled catalog entry does not establish live availability, compatible credentials or permission.
Creating a scenario containing a similarly named module does not test an Endpoint definition.

There is a verified public **platform SDK** authoring surface: `@makehq/sdk@1.7.1` exposes
`make.sdk.endpoints` with list/get/create/update/delete, section reads/writes and visibility methods.[45][47]
Its published tool catalog includes an `sdk-endpoints` category; CLI availability still depends on the
resolved SDK and CLI contracts, not a claim that every installation has the same commands.[45][48]
These are not promises of ordinary scenario MCP tools or account-level authoring access.

## 2. Gate each unsupported or unverified capability

Proceed only at the evidence level actually available:

| Available evidence | Permitted conclusion/work |
| --- | --- |
| Public package declarations/source only | Explain the exposed contract; prepare a static checklist. No account/runtime success claim. |
| Authorized current definition export/read | Inspect named definitions and their actual metadata/sections; record completeness. |
| Verified write contract and target access | Prepare a full payload/diff; write only with explicit approval, then read back. |
| Enabled runtime, compatible connection and approved plan | Exercise selected actions through the verified runtime interface. |
| No verified public authoring operation or section contract | Stop that mutation; deliver review findings and exact missing contract/access requirements. |

Do not guess routes, section names, annotations, tool names or staging services from private workflows.
Do not broaden access or switch to a hidden interface when a public operation fails.
The published SDK types expose section data as strings, not a complete semantic validation schema.[47]
Presence of a setter therefore does not prove every module directive is valid in an Endpoint section.
Use current public semantics and an authorized definition as evidence; mark unsupported details unverified.

## 3. Snapshot definitions separately

Record app name/version/origin, source/package version, capture time and exact Endpoint names.
Keep list success/completeness separate from detail success. A failed list is not zero Endpoints.
If a successful complete list is empty, record no definitions and do not invent module-derived entries.
Include private/new definitions for development and review; public-only is a published-impact filter.
Keep unknown visibility, deprecation and archival flags unknown rather than inferring them from labels.

For the verified SDK baseline, inspect these layers independently:[47]

- Metadata: name, label, description, context, annotations, attached connection names and visibility flags.
- Sections: `api`, `scope`, `inputParameters`, and `outputParameters`.
- Runtime availability and selected managed connection: separate discovery, not inferred from metadata.

`context` is metadata in this baseline, not a fifth section accepted by `getSection`/`setSection`.[47]
Do not convert these section names into a guessed snake_case remote contract.
A metadata update of `attachedAccounts` replaces that list; preserve all intended entries explicitly.[47]
Keep credential values out of snapshots and reports; definition connection names are not credentials.

## 4. Review the definition contract

Use this checklist even when upload or runtime testing is blocked:

- **Purpose/context:** explain what the action does, prerequisites, ID discovery, limits, pagination,
  side effects and safe examples. Missing context is a usability finding, not proof the API is unusable.
- **Inputs:** verify required/optional fields, types, enums, nesting and constraints against the provider.
  Distinguish schema defaults from values actually serialized at execution time.
- **Mapping:** trace every input to path/query/header/body and every response field to the output schema.
  Flattened inputs are acceptable only when mapping and context explain the resulting provider structure.
- **Empty values:** test omitted/null/empty/`0`/`false` independently. Do not apply blanket stripping that
  drops valid provider values or accidentally clears fields during updates.
- **Outputs:** verify primitives, nested objects, arrays, conditional fields and provider errors;
  do not accept a stub schema merely because the request forwards the response.
- **Connections/scopes:** inspect attached definition names, provider scopes and target-resource ownership.
  No-auth behavior needs evidence; never insert scenario-only connection parameters by analogy.
- **Annotations:** check read-only, destructive, idempotent, open-world and arbitrary-call hints against
  actual effects. These are behavior hints, not authorization, retry or safety guarantees.[47]
- **Arbitrary calls:** when supported, verify method/path/query/body/header mapping and host boundaries.
  A successful GET without body/query does not validate those mappings. Test them only with approved data.
- **Special transports:** binary/multipart, chained requests, UI RPC directives and dynamic schemas require
  explicit support in the selected Endpoint contract; do not import module rules or claim universal bans.

Do not impose an internal pure-wrapper policy, forced 1:1 naming, or mandatory arbitrary-call Endpoint
without public support or explicit product requirements.
Record intentional transformation and test it rather than assuming all output must be pass-through.

## 5. Assess coverage and API changes

Map provider capabilities, modules and Endpoints as separate surfaces.
A capability can be covered by one definition, a documented combination, or not exposed intentionally.
A module that calls another provider does not automatically require an Endpoint in this app.
Never infer affected Endpoints from similar module labels or count a module as proof of Endpoint coverage.

For each in-scope capability, record **Covered**, **Partial**, **Missing**, or **Broken** with evidence;
use **Needs verification** for incomplete contracts, lists or runtime access.
Trace provider API changes through the Endpoint's own inputs, request and outputs.
Apply the [maintenance evidence gates](maintenance.md), including pass-through and already-addressed checks.

## 6. Execute only after the runtime gate

Follow the existing [Endpoint execution guidance](../../make-endpoints/references/reliable-execution.md)
for transport, scope, approvals, retries and external-state verification rather than duplicating it here.
Bind the plan to the exact zone, team, app/version, Endpoint, connection and allowed resources.
Re-read the actual schema/context and confirm current availability before execution.
An annotation or a self-addressed message does not make a mutation automatically safe.

Start with an approved read where appropriate. For writes, prefer a bounded create/read/update/delete
lifecycle on objects created by this test, with exact-ID readback and approved cleanup.
Do not update pre-existing objects with the same values as a fallback: that can still trigger side effects.
If safe setup or cleanup is unavailable, mark the case blocked/not run or obtain explicit retention approval.
Never delete existing/default records or issue bulk wipes. Payments, publication and message delivery
are outside a default QA plan; require explicit approval for their exact effects and destinations.
Do not mutate Endpoint definitions during a runtime-only test.

Distinguish Make access/enablement, provider auth/scopes, provider failures and definition defects.
Zero results or documented empty output can be correct; inspect the specified contract and test precondition.
After ambiguous writes, recover by safe reads rather than replaying the action.

## 7. Report the exact level verified

Report per Endpoint: context/schema review, definition readback, runtime availability, executed assertions,
cleanup, result and gaps. Keep static findings separate from observed runtime failures.
Not run/blocked cases cannot become a blanket pass. Never infer publication from successful execution.
Endpoint visibility is a separate write; app/module visibility and approved catalog release remain
subject to the explicit gates in [tooling and release](tooling-and-release.md).

## Sources

[45] https://registry.npmjs.org/@makehq/sdk/-/sdk-1.7.1.tgz
[47] https://unpkg.com/@makehq/sdk@1.7.1/dist/index.d.ts
[48] https://unpkg.com/@makehq/cli@1.4.0/dist/index.js
[49] https://unpkg.com/@makehq/endpoints-sdk@0.9.0/README.md
