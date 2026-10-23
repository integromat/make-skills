# Tooling, access and release

Load when selecting an editor/API/CLI, resolving access, uploading definitions, or changing distribution.
This reference separates saving code, live testing, app/module visibility, and approved catalog publication.

## 1. Select a verified public surface

| Surface | Appropriate use | Boundary |
| --- | --- | --- |
| Make web Custom Apps editor | Inspect and edit app configuration with SDK-aware validation. | Saving changes is a remote write, not a local draft.[4] |
| Make Apps Editor for VS Code | Download/edit app sections through the documented extension. | Opening downloads configuration; saving uploads it; temporary files are removed on close.[3] |
| Make TypeScript SDK / `@makehq/sdk@1.7.1` | Create, upload, update and read back custom-app definitions through `make.sdk`; manage other Make API resources separately. | This is the platform SDK used for app uploads. Verify each operation, scope, section and request shape in current docs/source.[37][47][50] |
| `make-cli` from `@makehq/cli` | CLI access to the published SDK tool catalog. | Commands depend on the resolved SDK version, not only the CLI version.[41][48] |
| Make Endpoints SDK / `@makehq/endpoints-sdk` | Execute available app Endpoints with managed connections. | Not an app uploader. Execution is distinct from `make.sdk.endpoints` definition authoring and requires runtime access; see [Endpoint gates](sdk-endpoints.md).[49] |

An ordinary scenario-management MCP connection does not establish access to custom-app authoring tools.
Inspect the actual advertised contracts; do not invent tool names from an internal workflow.
Use the web editor or a verified public API/SDK operation when appropriate, not undocumented routes.
A missing capability is a blocker or a manual step, not permission to switch accounts or private services.

## 2. Pin tools and inspect contracts

Record package versions, lockfile resolution or exact source commit, and the Node/runtime requirement.
Use official published packages or an explicitly authorized source checkout; identify which was inspected.
Do not install, upgrade globally, or clone a knowledge base merely to research an app.

The verified CLI package baseline is `@makehq/cli@1.4.0`; its dependency range permits different
`@makehq/sdk` resolutions. Its source constructs commands from `MakeTools` in `@makehq/sdk/tools`.[41][48]
Therefore a locally patched binary or `--help` output alone does not prove a command ships publicly.
Inspect both published package/source and the locally resolved dependency before documenting exact writes.

For an existing installation, these are read-only help/version checks:

```bash
make-cli --version
make-cli --help
make-cli sdk-apps --help
```

They prove neither authentication nor remote authorization. Do not run an install fallback without approval.
For any operation, verify argument names/types, required scopes, pagination, defaults, replacement versus
patch behavior, response envelopes and readback support before constructing a payload.
Connection-definition types, provider authentication schemes and create-operation selectors are distinct.
Do not normalize all exported types to `apikey`, `basic` or `oauth`; use the exact selected contract.[28][38]

### TypeScript SDK upload and readback

Use **`@makehq/sdk@1.7.1`** as the verified TypeScript authoring/upload baseline. Its npm package requires
Node.js 20 or later.[47][50] Pin it in the authorized project's dependency and lockfile rather than
installing a global CLI or assuming the Endpoints SDK can upload app definitions:

```bash
npm install --save-exact @makehq/sdk@1.7.1
```

Import `Make` from `@makehq/sdk` and construct `new Make(apiKey, zone)` only after resolving and validating
the approved server-side `MAKE_API_KEY` and exact `MAKE_ZONE` hostname, for example `us1.make.com`
without `https://` or `/api/v2`. Never put the key in source, browser code, prompts, or command arguments.
This version is a verified baseline, not a claim about the latest release or permission to upgrade tools.

1. Verify identity and scopes with `make.users.me()` and `make.users.currentAuthorization()`, then inspect
   existing apps with `make.sdk.apps.list(...)`. SDK-app operations do not acquire a team parameter merely
   because scenario or Endpoints execution requires one. Honor the exact app/version/origin and approvals.
2. Create an approved new private app with `make.sdk.apps.create(...)`, explicitly setting `private: true`,
   or update the already-identified target. Persist the returned app name/version immediately. Keep a
   durable creation intent and automatic write retries disabled; do not duplicate a create after an
   uncertain response or adopt an unrelated name-matched app.
3. Use `make.sdk.apps` for Base sections, documentation and icons; `make.sdk.connections`,
   `make.sdk.functions`, `make.sdk.rpcs`, `make.sdk.webhooks`, and `make.sdk.modules` for the corresponding
   definitions. Resolve dependencies before dependents. Preserve returned connection/webhook names for
   bindings; a local folder name or connection-create selector is not necessarily the stored identifier/type.
4. Pass complete section source strings to the supported `setSection` methods and use their matching
   `getSection` methods for exact readback. Check the installed declarations for each method's arguments:
   connection definitions are app-global, while modules/RPCs use the returned app version.[47]
5. Fetch full component details with `get(...)` before checking complete metadata, bindings and private
   visibility. Create acknowledgements and list results are partial projections: module creation can omit
   visibility flags, module lists can omit `webhook`, and RPC lists can contain only `name`/`label`.
   Missing fields are unknown, not `false` or `null`; reject explicit contradictions without weakening full
   GET checks. Verify every changed section plus complete component counts, not only a successful write.[47][51]
6. For a supported developer RPC test, use `make.sdk.rpcs.test(...)` with the verified input/schema contract.
   Validate the actual returned result: the observed test envelope can be `{ code: "OK", response: [...],
   debug: [...] }`. Check expected cardinality and typed output; do not search debug logs or accept an OK
   wrapper as provider proof. RPC testing is not an Endpoints execution call, publication, or permission
   for provider mutations. Report missing provider credentials or unexecuted cases separately.

For **Endpoint execution**, use **`@makehq/endpoints-sdk`** and the existing
[execution skill](../../make-endpoints/SKILL.md). Its `SdkTransport` can wrap the platform SDK's `Make`
client, but calling an Endpoint does not upload the app or validate its other components.[49] Install it
only when execution is in scope, and verify its own version, runtime requirement, organization enablement,
team and compatible connection. The platform SDK's `make.sdk.endpoints` authoring methods remain subject
to the separate [definition capability gate](sdk-endpoints.md).

## 3. Establish access without exposing credentials

Confirm the selected account, app name/version, origin zone, and intended test team before remote work.
The public app API exposes `origin` as selectable metadata; resolve mismatches before sending writes.[37]
Use an exact verified hostname, such as `us1.make.com`, not a scheme/path or an untrusted report-supplied host.
Never send a token to a different host to work around an error.

Keep Make API credentials separate from the provider connection used during runtime tests.
Use the approved secret store/environment; keep credentials out of source, arguments, logs and reports.
The documented Apps Editor setup requires `sdk-apps:read` and `sdk-apps:write`; inspect the chosen
read-only API operation's needs rather than broadening access for an inventory.[40]
The CLI can use `MAKE_API_KEY` and `MAKE_ZONE`; its saved-login fallback applies only when neither
credential component is supplied. A zone-only override does not fill a missing key from saved login.[48]
Never print the saved configuration to diagnose it, or copy credentials from another project.

Exclude secret common-data values and invite tokens from ordinary snapshots and public artifacts.
The API's common-data operations can return credentials, so broad metadata/export reads need care.[37]
Keep provider logs sanitized and use synthetic fixtures for shared review evidence.[8][36]
On 401/403, identify Make permissions, app ownership, selected zone and provider auth separately.
Stop for user/admin resolution; do not elevate privileges, change feature flags or guess credentials.

## 4. Approve and perform a definition write

Obtain approval for the exact app/version/origin, components/sections, payload diff and expected effect.
A request to inspect, draft, validate or upload does not authorize publication, messages or account changes.
Private/public custom-app edits take effect immediately; confirm exposure before the first save.[11]

1. Preserve a current read-only baseline and complete component inventory.
2. Run the [review/QA](review-and-qa.md) static gate and identify untested provider behavior.
3. Check every referenced component exists or is included in the approved change.
4. Read current remote state again; stop if identity or the approved baseline has changed.
5. Create/update dependencies and dependents in the order the verified interface requires.
6. Use returned remote identifiers for bindings; local directory names need not be remote object names.
7. Send complete intended sections for section-set operations; preserve unrelated fields and samples.
8. Read back every changed metadata/section target, plus bindings and component counts by kind.
9. Compare with the approved payload and list any skipped, failed or partially applied writes.

Readback must use the same origin and app/version. Do not guess a GET route from a working PUT route.
Do not declare the upload complete on an acknowledgement alone, or silently drop RPCs/webhooks/functions.
An interrupted multi-component upload is not assumed transactional. Recover by reading exact targets,
then obtain approval for repair or rollback; never blindly repeat creation or destructive operations.
Upload/readback proves persistence, not live provider execution or publication.

## 5. Keep distribution states distinct

| State | Meaning |
| --- | --- |
| Private app | Initially usable by its author; organization installation can extend access within that organization.[6] |
| Public/invite-link app | App publication generates an invite link for installation elsewhere; this is not catalog approval.[6] |
| Visible module | Module distribution is controlled separately from app visibility.[5][6] |
| Approved app | Make's review and release process makes the app available to all Make users.[7][10] |
| Approved-app development change | Author-side changes still need testing and Make approval before general release.[13][33] |

Neither upload success nor an audience/global metadata value proves public availability.
Verify the app's distribution state and every intended module's visibility separately.
Hiding an already-used module leaves existing scenarios working but removes it from new selection.[6]
The public documentation warns that a published app cannot be made private or deleted normally, and its
components cannot be deleted. Do not promise reversal just because a client exposes a private/delete method.[6]

## 6. Publication and review are separate approvals

Before public/invite-link publication, review the final component list and identify disposable test
components; remove only explicitly approved, safely removable objects before publication.[9]
Show the precise distribution change, its permanence and selected module visibility for approval.
Do not auto-publish all modules, share invite links, or submit a review as a side effect of uploading.
After an authorized visibility change, read back the exact app and each affected module.

For an approved public catalog release:

1. Check the current review prerequisites, including functionality, code and test-scenario requirements.[8]
2. Prepare recent test logs without personal/sensitive data and the provider API documentation link.[8][9]
3. Have the owner confirm support/contact details, compliance declarations and requested distribution;
   do not invent an identity or submit legal declarations on the owner's behalf.[9]
4. Obtain explicit approval before submitting the documented Review form.
5. Read back review status; distinguish submitted/pending from approved and actually released.

For approved-app updates, submit updated test evidence through the documented change-review process;
new components, code changes, themes and logos require approval too.[33]
Do not equate local QA approval with Make's publication approval.

## 7. Release report

Report exact target and tool provenance; changed/read-back components; live tests actually performed;
app and module visibility; review/release status; remaining blockers and retained test resources.
Say explicitly when no provider runtime test or publication was performed.

## Sources

[3] https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk.md
[4] https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/web-editor-features.md
[5] https://developers.make.com/custom-apps-documentation/create-your-first-app/test-your-app.md
[6] https://developers.make.com/custom-apps-documentation/create-your-first-app/app-visibility.md
[7] https://developers.make.com/custom-apps-documentation/app-review/overview.md
[8] https://developers.make.com/custom-apps-documentation/app-review/prerequisites.md
[9] https://developers.make.com/custom-apps-documentation/app-review/request-app-review.md
[10] https://developers.make.com/custom-apps-documentation/app-review/approved-app.md
[11] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app.md
[13] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps.md
[28] https://developers.make.com/custom-apps-documentation/app-components/connections.md
[33] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps/approval-of-changes-in-approved-app.md
[36] https://developers.make.com/custom-apps-documentation/app-components/base/sanitization.md
[37] https://developers.make.com/api-documentation/api-reference/sdk-apps.md
[38] https://developers.make.com/api-documentation/api-reference/sdk-apps/connections.md
[40] https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/generation-of-your-api-key.md
[41] https://registry.npmjs.org/@makehq%2fcli/1.4.0
[47] https://unpkg.com/@makehq/sdk@1.7.1/dist/index.d.ts
[48] https://unpkg.com/@makehq/cli@1.4.0/dist/index.js
[49] https://unpkg.com/@makehq/endpoints-sdk@0.9.0/README.md
[50] https://registry.npmjs.org/@makehq%2fsdk/1.7.1
[51] https://developers.make.com/api-documentation/api-reference/sdk-apps/modules.md
