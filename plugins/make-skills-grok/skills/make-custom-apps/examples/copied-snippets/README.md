# Copied SDK teaching snippets

This library directly reuses selected technical examples from the user's Make SDK knowledgebase and internal SDK engineering guidance, with permission. It does **not** require those sources at runtime. Private paths, account identifiers and workflow dependencies are not published. [manifest.json](manifest.json) records each snippet's public-safe source title/section, precise section role, adaptations, dependencies, public SDK references, and limitations.

The files are **teaching templates or component fragments, not deployable provider apps**. Reserved `example.com` hosts, relative sample endpoints, field names, query keys and QA angle-bracket values are assumptions/placeholders, not promises about a live provider. Supply the real API contract, authentication, input/output schemas, connection bindings and credential tests before use. Nothing here registers hooks, sends requests or changes a provider.

## Copy policy and section mapping

- `copied`: the selected JSON value is unchanged; indentation may be normalized.
- `adapted`: only the listed format extraction, redaction or confirmed SDK correction was applied. Many are format-only recoveries of Markdown that escaped every quote. All exact source selections and before/after comparisons are retained in private review evidence.
- A **single parameter entry** must go inside a Parameters/expect array. A **fragment** must be merged into the named Communication/Base section. A **value of pagination** goes under `pagination`, not at Communication root. A **QA planning record is not SDK input**.
- The manifest is this repository's indexing convention, not an app import format. It is intentionally separate from the plain section JSON files.

The reviewed corrections include nested `validate.min/max/pattern`.[14][15] The array-of-collections example preserves its source `spec: {type: "collection", spec: [...]}` form; Make also documents an array-valued `spec`, so changing between these forms is optional normalization, not a required SDK fix.[35]

Boolean defaults retain `false`, and the copied `repeat` condition reads stored `temp` rather than an unavailable response-body context.[33][39]

RPC dependencies are named explicitly in the manifest. Create the named RPC and bind it to the same connection as its consuming module; a file or `rpc://` string alone does not establish the remote binding.[31] The linked template RPCs still need their placeholder URLs/fields replaced and authorized runtime/UI tests.

## Validation and safety boundaries

The repository's `node scripts/check-custom-app-examples.mjs` checks JSON, manifest/file coverage, local dependency links, a narrow set of known regression invariants, and the separate real custom-helper unit tests. It is **not** a general SDK validator or IML interpreter and does not certify provider contracts. No copied QA record is treated as an executed test result.

Before adapting templates:

- Replace URLs/response fields only from current provider documentation. Confirm safe read-only connection validation; never use event ingestion or a send operation as a credential test.
- Inspect secret-log masks against actual requests/responses. A list of example masks is not proof that all credentials are redacted.[41]
- Match bundle projections to Interface/Samples and preserve valid zero/false values. Check pagination empty/boundary/multi-page cases and limit ceilings in Make.[12]
- Keep the separately shipped [webhook lifecycle](../github-webhook/README.md) **blocked** until signature verification and replay handling are implemented and tested. No copied snippet changes that security gate.
- Use the internal QA records only to plan real assertions and prerequisites. Unknown data prerequisites mean inconclusive, not a passing provider test.

## Index

71 unique entries: base 7, connections 3, pagination 5, parameters 28, qa 4, requests 8, responses 10, rpcs 6.

| Snippet | Topic / role | Copy status | Source title |
| --- | --- | --- | --- |
| [base-bearer](base/base-bearer.imljson) | base — App Base | copied | 04-BASE-CONFIG.md |
| [base-basic](base/base-basic.imljson) | base — App Base | adapted | 04-BASE-CONFIG.md |
| [base-custom-auth](base/base-custom-auth.imljson) | base — App Base | adapted | 04-BASE-CONFIG.md |
| [base-global-query](base/base-global-query.imljson) | base — App Base | copied | 04-BASE-CONFIG.md |
| [base-two-environments](base/base-two-environments.imljson) | base — App Base | copied | 04-BASE-CONFIG.md |
| [json-headers](base/json-headers.imljson) | base — Base or Communication headers fragment | copied | 04-BASE-CONFIG.md |
| [sanitize-secrets](base/sanitize-secrets.imljson) | base — Base or Communication log fragment | copied | 04-BASE-CONFIG.md |
| [nested-error-message](responses/nested-error-message.imljson) | responses — Communication response fragment | copied | 04-BASE-CONFIG.md |
| [status-specific-errors](responses/status-specific-errors.imljson) | responses — Communication response fragment | copied | 04-BASE-CONFIG.md |
| [wrapped-output](responses/wrapped-output.imljson) | responses — Communication response fragment | copied | 00-LLM-DEVELOPMENT-RULES.md |
| [direct-output](responses/direct-output.imljson) | responses — Communication response fragment | copied | 00-LLM-DEVELOPMENT-RULES.md |
| [username](parameters/username.imljson) | parameters — One Connection parameter entry | copied | 06-CONNECTION-TYPES.md |
| [password](parameters/password.imljson) | parameters — One Connection parameter entry | copied | 06-CONNECTION-TYPES.md |
| [environment](parameters/environment.imljson) | parameters — One Connection parameter entry | copied | 06-CONNECTION-TYPES.md |
| [ssl-boolean](parameters/ssl-boolean.imljson) | parameters — One Connection parameter entry | copied | 06-CONNECTION-TYPES.md |
| [timeout-number](parameters/timeout-number.imljson) | parameters — One parameter entry | adapted | 06-CONNECTION-TYPES.md |
| [http-input-fields](parameters/http-input-fields.imljson) | parameters — Mappable parameters array | copied | parameters and user inputs.md |
| [action-post](requests/action-post.imljson) | requests — Module Communication | copied | sdk-conventions.md |
| [offset-pagination](pagination/offset-pagination.imljson) | pagination — Value of Communication pagination | adapted | modules actions triggers searches.md |
| [cursor-pagination](pagination/cursor-pagination.imljson) | pagination — Value of Communication pagination | adapted | modules actions triggers searches.md |
| [next-link-pagination](pagination/next-link-pagination.imljson) | pagination — Value of Communication pagination | adapted | api communication.md |
| [required-text](parameters/required-text.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [email](parameters/email.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [url](parameters/url.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [date](parameters/date.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [active-boolean](parameters/active-boolean.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [priority-select](parameters/priority-select.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [text-array](parameters/text-array.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [file-buffer](parameters/file-buffer.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [file-metadata](parameters/file-metadata.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [bounded-number](parameters/bounded-number.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [multiline-text](parameters/multiline-text.imljson) | parameters — One Static/Connection parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [collection-array](parameters/collection-array.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [nested-notification-select](parameters/nested-notification-select.imljson) | parameters — One Static parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [validated-inputs](parameters/validated-inputs.imljson) | parameters — Parameters/expect array | adapted | 08-PARAMETER-TYPES.md |
| [currency-select](parameters/currency-select.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [zero-quantity](parameters/zero-quantity.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [date-range](parameters/date-range.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [multi-status-select](parameters/multi-status-select.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [sort-field](parameters/sort-field.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [sort-direction](parameters/sort-direction.imljson) | parameters — One parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [optional-text-default](parameters/optional-text-default.imljson) | parameters — One parameter entry | adapted | 20-COMMON-PATTERNS.md |
| [address-collection](parameters/address-collection.imljson) | parameters — One parameter entry | adapted | 20-COMMON-PATTERNS.md |
| [projected-output](responses/projected-output.imljson) | responses — Communication response fragment | adapted | 20-COMMON-PATTERNS.md |
| [nested-output](responses/nested-output.imljson) | responses — Communication response fragment | adapted | 20-COMMON-PATTERNS.md |
| [iterated-tag-output](responses/iterated-tag-output.imljson) | responses — Communication response fragment | adapted | 20-COMMON-PATTERNS.md |
| [flat-interface](responses/flat-interface.imljson) | responses — Module Interface array | adapted | 20-COMMON-PATTERNS.md |
| [nested-interface](responses/nested-interface.imljson) | responses — Module Interface array | adapted | 20-COMMON-PATTERNS.md |
| [message-inputs](requests/message-inputs.imljson) | requests — Module Mappable parameters | adapted | modules actions triggers searches.md |
| [message-request](requests/message-request.imljson) | requests — Module Communication | adapted | modules actions triggers searches.md |
| [message-interface](requests/message-interface.imljson) | requests — Module Interface | adapted | modules actions triggers searches.md |
| [api-key-parameters](connections/api-key-parameters.imljson) | connections — Connection Parameters | adapted | 22-CONNECTION-UPLOAD-LEARNINGS.md |
| [api-key-validation](connections/api-key-validation.imljson) | connections — Basic connection Communication | adapted | 22-CONNECTION-UPLOAD-LEARNINGS.md |
| [rotating-refresh](connections/rotating-refresh.imljson) | connections — OAuth2 Communication refresh fragment | adapted | 06-CONNECTION-TYPES.md |
| [bounded-async-poll](requests/bounded-async-poll.imljson) | requests — Multiple-request Communication array | adapted | api communication.md |
| [get-item](requests/get-item.imljson) | requests — Module Communication | adapted | 20-COMMON-PATTERNS.md |
| [post-preserving-false](requests/post-preserving-false.imljson) | requests — Module Communication | adapted | 20-COMMON-PATTERNS.md |
| [delete-item](requests/delete-item.imljson) | requests — Module Communication | adapted | 20-COMMON-PATTERNS.md |
| [response-page-pagination](pagination/response-page-pagination.imljson) | pagination — Communication qs/pagination fragment | adapted | 20-COMMON-PATTERNS.md |
| [statuses-rpc](rpcs/statuses-rpc.imljson) | rpcs — RPC Communication | adapted | 20-COMMON-PATTERNS.md |
| [categories-rpc](rpcs/categories-rpc.imljson) | rpcs — RPC Communication | adapted | 20-COMMON-PATTERNS.md |
| [dynamic-category-select](rpcs/dynamic-category-select.imljson) | rpcs — One Mappable parameter entry | adapted | 08-PARAMETER-TYPES.md |
| [users-rpc](rpcs/users-rpc.imljson) | rpcs — RPC Communication | adapted | remote procedure calls rpcs.md |
| [bases-rpc](rpcs/bases-rpc.imljson) | rpcs — RPC Communication | adapted | remote procedure calls rpcs1.md |
| [base-select](rpcs/base-select.imljson) | rpcs — Module Mappable parameters | adapted | remote procedure calls rpcs1.md |
| [internal-search-response](responses/internal-search-response.imljson) | responses — Communication fragment | adapted | SDK App Conventions and Review Standards |
| [internal-cursor-pagination](pagination/internal-cursor-pagination.imljson) | pagination — Communication fragment | adapted | SDK App Conventions and Review Standards |
| [function-test-plan](qa/function-test-plan.json) | qa — Local QA planning record (NOT an SDK section) | copied | templates.md |
| [rpc-test-plan](qa/rpc-test-plan.json) | qa — Local QA planning record (NOT an SDK section) | copied | templates.md |
| [pagination-test-plan](qa/pagination-test-plan.json) | qa — Local QA planning record (NOT an SDK section) | copied | templates.md |
| [parameter-change-plan](qa/parameter-change-plan.json) | qa — Local QA planning record (NOT an SDK section) | copied | templates.md |

Use the matching manifest entry for exact adaptations, assumptions/placeholders and remaining tests. Review scope excludes unsafe licensing/logging recipes, private workflow records, unbound custom helpers, unexplained metadata, and malformed or unverified SDK constructs. This is a reviewed selection, not an assertion that every candidate in the source corpus was valid.

## Sources

[12] https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md
[14] https://developers.make.com/custom-apps-documentation/block-elements/parameters/text.md
[15] https://developers.make.com/custom-apps-documentation/block-elements/parameters/number.md
[31] https://developers.make.com/custom-apps-documentation/app-components/rpcs.md
[33] https://developers.make.com/custom-apps-documentation/block-elements/iml.md
[35] https://developers.make.com/custom-apps-documentation/block-elements/parameters/array.md
[39] https://developers.make.com/custom-apps-documentation/component-blocks/api/making-requests.md
[41] https://developers.make.com/custom-apps-documentation/app-components/base/sanitization.md
