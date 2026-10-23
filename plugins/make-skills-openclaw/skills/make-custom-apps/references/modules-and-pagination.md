# Modules and pagination

Load this reference when choosing module behavior, mapping a response to bundles,
or implementing list/search pagination. Use [webhooks-and-polling.md](webhooks-and-polling.md)
for trigger state and [parameters-and-rpcs.md](parameters-and-rpcs.md) for field schemas.

## Choose behavior before generating files

| Requirement | Component and behavior |
| --- | --- |
| Create, update, delete, retrieve one object, upload, or download | Action: one output bundle; one or several requests. |
| Find or list multiple records | Search: one bundle per selected result; bounded iteration and pagination. |
| Discover new or updated records on a schedule | Polling trigger: persisted progress, ordering, and an Epoch configuration. |
| Receive provider events | Instant trigger linked to a real webhook definition. |
| Expose authorized arbitrary API requests | Universal module with an explicit URL/auth contract. |
| Return processed data to an incoming webhook request | Responder, not an ordinary outgoing API action. |

Do not impose search semantics on actions merely because a response contains an
array. An action can return a single collection containing an array. Conversely,
a list endpoint intended to produce multiple bundles needs search behavior.
Select component kinds using the current editor/tool schema, not a copied `typeId` table.

Sources: [Action](https://developers.make.com/custom-apps-documentation/app-components/modules/action.md),
[Search](https://developers.make.com/custom-apps-documentation/app-components/modules/search.md),
[Responder](https://developers.make.com/custom-apps-documentation/app-components/modules/responder.md).

## Establish the output contract

1. Record the exact method, path, request fields, success shape, error shapes, and
   pagination fields from the provider contract or sanitized observed responses.
2. For a search, point `response.iterate` at the actual array, not its envelope.
3. Set `response.output` from the iterated `item`, not the whole page's `body`.
4. Add a user-facing Limit and wire it to `response.limit`.
5. Keep the interface and sample aligned with **one emitted bundle**, not the
   complete provider response or a guessed generic `data` field.
6. Preserve provider field names where practical; transform only for an intentional
   output contract, dates, binary data, or other documented conversion.

`iterate` also supports `{ "container": "{{body.items}}", "condition": "..." }`
for per-item filtering. Prefer provider-side filters where available. Do not
reject this documented object form because an older example only uses a string.

Without iteration, output defaults to `body`; with iteration, it defaults to
`item`. Make the intended shape explicit when it is otherwise ambiguous.
In request chains, only the final output is the module result; the last request's
`response.limit` governs the chain, including its unlimited default when omitted.

Sources: [Iterate](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/iterate.md),
[Output](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/output.md),
[Limit](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/limit.md).

## Keep page size separate from result limit

- Provider page size controls records requested in one HTTP call.
- `response.limit` controls the total records returned by a module execution and
  also participates in deciding whether another page is needed.
- Pagination stops on an empty iterated page or when `response.limit` is reached;
  add the provider's next-page condition rather than relying only on empty results.
- Choose a provider-supported page size; do not send the entire user limit as a
  page size when it exceeds the endpoint maximum.
- Verify small limits, limits spanning pages, and an empty first page.
- Do not promise an unbounded export: request counts, pagination counts, records,
  and execution time have platform limits, independent of the configured Limit.

Source: [Pagination specification and limits](https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md).

## Page-number pagination

**`pagination.page` starts at 1 and advances automatically. After the first request,
it is 2 for the second request. Do not add an unconditional `+ 1`.**
For a zero-based provider page number, adapt with `pagination.page - 1`.

The following fragment assumes a fixture API with `items`, `totalPages`, `page`,
and `per_page`; substitute only fields confirmed for the target provider:

```json
{
  "qs": {"page": 1, "per_page": 100},
  "response": {
    "iterate": "{{body.items}}",
    "output": "{{item}}",
    "limit": "{{parameters.limit}}"
  },
  "pagination": {
    "qs": {"page": "{{pagination.page}}"},
    "condition": "{{body.totalPages >= pagination.page}}"
  }
}
```

The condition uses the upcoming page index, as in the SDK total-pages example.
Validate it against the provider's meaning of total pages, not a similarly named
record count. The fragment omits the endpoint and is not an upload-ready module.

Source: [Total pages and indexing](https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md#total-pages).

## Offset, cursor, and next-link pagination

| Provider contract | Implementation decision |
| --- | --- |
| Offset and page size | Start at offset 0; compute `(pagination.page - 1) * pageSize`, using the same page size as the request. |
| Opaque next cursor | Copy the previous response's next cursor into the documented query or body field; stop when absent. |
| Full next-page URL | Use `pagination.url`; inspect query merging and allowed destination hosts before retaining credentials. |
| Boolean has-more flag | Use the flag as the stop condition and advance the provider's cursor or page separately. |
| Page-only API | Verify that exhaustion returns an empty array rather than repeating the last page forever. |

For a fixture page size of 100, the offset override is:

```json
{"pagination": {"qs": {"offset": "{{(pagination.page - 1) * 100}}"}}}
```

Do not fabricate a cursor from the last ID unless the provider defines that rule.
Keep opaque cursor bytes intact. Do not stop on a short page unless the provider
contract guarantees that it means exhaustion.

`pagination` belongs beside `url`, not inside `response`. Its default
`mergeWithParent: true` merges headers and query fields with the original request;
URL, method, and body overrides have their own replacement behavior. An alternate
pagination endpoint can require a different method or body; inspect it explicitly.

Source: [Pagination patterns and merging](https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md).

## Universal and multi-request boundaries

A universal module is a deliberate coverage fallback, not proof of endpoint-specific
product completeness. Choose its scope rather than treating a local generator's
mandatory-universal convention as a platform law.

Define allowed hosts, version handling, relative-path help, methods, query fields,
and raw-body encoding. Preserve connection authorization when merging custom headers.
The documented REST universal output intentionally wraps `body`, `headers`, and
`statusCode`; a blanket rule against output wrappers would break that contract.

For read-before-write updates or asynchronous jobs, use the actual multi-request
contract in [requests-and-responses.md](requests-and-responses.md). A request chain,
pagination, and repeat polling solve different problems and are not interchangeable.

Sources: [REST universal module](https://developers.make.com/custom-apps-documentation/app-components/modules/universal-module/rest.md),
[Multiple requests](https://developers.make.com/custom-apps-documentation/component-blocks/api/multiple-requests.md).

## Verification gate

- Exercise at least three pages; inspect the exact outgoing page or offset sequence.
- Assert no missing first/second page, duplicate boundary records, or repeated cursor.
- Check zero results, one result, a full final page, absent cursors, and user-limit truncation.
- Check stable provider sorting and behavior while records are inserted or removed.
- Compare every output bundle with the interface and sample; retain `false` and `0`.
- Distinguish fixture-based pagination checks from a real provider run. JSON parsing
  alone proves neither IML evaluation nor completeness against a changing dataset.
