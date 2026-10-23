# Requests and responses

Load this reference for HTTP communication, errors, files, request chains, or asynchronous
status checks. Use [modules-and-pagination.md](modules-and-pagination.md) for pagination.

## Match the provider's wire contract

- Define the exact `url`, `method`, headers, query, and body from provider evidence.
  Relative module/RPC paths use Base; connection requests need their own full configuration.
- Use `headers` and `qs` collections rather than concatenating unencoded values into URLs.
  Array query values produce repeated keys; do not assume a provider expects that encoding.
- Put the HTTP method in `method`, not `type`. Request `type` selects body encoding:
  `json`, `urlencoded`, `multipart/form-data`, `text`/`raw`/`string`, or `binary`.
- JSON, form-urlencoded, and multipart types set their appropriate Content-Type.
  Avoid a global JSON Content-Type that conflicts with a multipart or binary request.
- A GET request ignores `body` and request-body `type`; do not pretend a provider's
  required GET body will be transmitted or silently change the provider's method.
- Keep raw text distinct from JSON objects. Use `createJSON()` only when a provider
  explicitly expects a JSON string nested inside a JSON object.
- For unusual manually encoded query strings, follow the specific encoding guide.
  Do not mix such a URL query with `qs` or assume `encodeUrl: false` preserves it.

Sources: [Request directives](https://developers.make.com/custom-apps-documentation/component-blocks/api/making-requests.md),
[Special query encoding](https://developers.make.com/custom-apps-documentation/best-practices/input-parameters/processing-of-input-parameters.md#special-case-query-string-parameters-in-the-url).

## Parse before shaping output

`response.type` controls parsing, independently of request `type`. Automatic parsing
uses Content-Type; override it when the provider's success/error formats require it.
A response type object can use `*`, exact statuses, and inclusive status ranges;
exact statuses and narrower ranges take precedence over broader matches.

For a binary success response with JSON errors, a reusable parsing fragment is:

```json
{"response": {"type": {"*": "json", "200-299": "binary"}}}
```

Choose that contract only when the provider actually returns those formats.
Check empty responses such as 204, text errors, and malformed data independently.
Preserve large identifiers: JSON numbers may already lose precision during parsing.
Prefer a documented string representation or a carefully tested text-parsing strategy;
changing an output field to `text` cannot restore digits already rounded.

For XML, inspect parsed node arrays. Use `_value` for node text with attributes and
`_attributes` for attributes. Do not substitute untested tag regexes for the parser.

Source: [Response parsing, XML, and numeric precision](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/type.md).

## Validate and report errors without hiding them

Make treats HTTP 400–599 as errors. `response.valid` cannot turn these into success.
For providers returning errors with HTTP 200 or another success status, define
`response.valid` from the documented error flag, including GraphQL error arrays
when that is the provider contract. An `error.200` entry alone does not reject success.

Customize `response.error.message` for the provider's actual error shape: a nested
object, a text body, or an error array requires different extraction. Include the
HTTP status and useful non-secret provider details; do not dump arbitrary response
bodies into user-facing errors, especially token or login responses.

Preserve Make's default error types unless a specific override is justified:
HTTP 429 defaults to `RateLimitError`, and 5xx to `ConnectionError`.
A generic `response.error.type: "RuntimeError"` overrides those defaults.
Place a necessary type override under its specific status instead.

The `error` schema defines messages, types, and per-status overrides, not an
invented `response.error.429.retry` object. Expose documented retry information
without promising a particular immediate retry. Pagination delay and job polling
are not replacements for Make's rate-limit/error-handling behavior.

For invalid success responses, message/type resolution starts at `valid`, then
per-status `error`, then generic `error`, then the platform fallback.

Sources: [Valid responses](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/valid.md),
[Error schema, status defaults, and precedence](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/error.md),
[HTTP errors cannot be evaluated as success](https://developers.make.com/custom-apps-documentation/app-components/base/error-handling.md).

## Keep output, temporary state, and wrappers distinct

- `response.iterate` selects an array; `response.output` shapes each selected `item`.
  Without iteration, output operates once on the response `body`.
- Request-level `temp` runs before the request. `response.temp` stores values after
  receipt and before the other response directives; subsequent requests can read them.
- Temporary collections merge across a request chain and are lost after execution.
  They are not persistent connection data or a polling trigger's progress store.
- `response.wrapper` runs once at the end and its value becomes the final output.
  It can use `output` to wrap transformed results with metadata; no further output
  transformation follows it. Keep the interface aligned with the resulting shape.

Sources: [Output and wrapper](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/output.md),
[Response temp](https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/temp.md).

## Multiple requests and safe updates

Use an array of request specifications for a sequential chain. Persist only required
intermediate values in `temp` and define final output at the end. A later request
cannot recover an earlier HTTP error by treating that failed response as success.

For full-replacement updates, confirm actual provider behavior rather than assuming
PUT always replaces or PATCH always preserves. When replacement is required, fetch
the current object, merge explicitly supplied changes, then write it back. Preserve
unmodified fields, including `0` and `false`; honor explicit null/erase semantics.
Use provider concurrency controls where available to avoid overwriting intervening edits.
Do not blindly remove empty strings or arrays that intentionally clear a value.

Sources: [Sequential requests](https://developers.make.com/custom-apps-documentation/component-blocks/api/multiple-requests.md),
[Read/merge/write and erase](https://developers.make.com/custom-apps-documentation/best-practices/modules/batch-actions.md#put-vs-patch-behavior-in-update-modules).

## Bounded asynchronous polling with repeat

Start a job once, retain its ID, then repeat a read-only status request.
Copy the status into `response.temp`: **`repeat.condition` reads `temp`, not `body`**.
Set a numeric literal `repeat.delay` in milliseconds and a numeric literal
`repeat.limit`; these fields do not support IML expressions. Do not omit the limit.

```json
{
  "response": {"temp": {"status": "{{body.status}}"}},
  "repeat": {
    "condition": "{{temp.status === 'waiting' || temp.status === 'processing'}}",
    "delay": 1000,
    "limit": 10
  }
}
```

This fragment needs a real status endpoint and a final success/failure check.
Distinguish completed, failed, canceled, and exhausted polling outcomes. Do not
return success merely because repetition stopped. Budget delays and calls against
the target runtime's time limits; a larger app timeout is not unlimited execution.
Never blindly repeat a non-idempotent creation request to wait for its completion.

Source: [Repeat, delay, limit, and temporary state](https://developers.make.com/custom-apps-documentation/component-blocks/api/making-requests.md#repeat).

## Multipart, binary, and verification

For multipart uploads, accept a `buffer` field and a filename. The file part uses
`value` for bytes and `options.filename` for its name; let the encoder construct
the multipart boundary. Do not send base64 text unless the provider explicitly requires it.

```json
{
  "type": "multipart/form-data",
  "method": "POST",
  "body": {
    "file": {
      "value": "{{parameters.file_data}}",
      "options": {"filename": "{{parameters.file_name}}"}
    }
  }
}
```

For downloads, return actual bytes and declare a `buffer` output plus a filename.
Use `semantic: "file:data"` and `semantic: "file:name"` for file mapping support.
Test binary round-tripping, zero-byte files, non-ASCII filenames, and JSON/text errors.

Sanitize authentication and token fields in every applicable request/response log;
error messages and output bundles need their own disclosure review. Keep HTTPS
certificate validation intact; use the documented custom-CA configuration only for
the host that requires it, not a blanket insecure transport bypass.

Report fixture checks, SDK execution, and authenticated provider tests separately.
A syntactically valid request or uploaded definition is not evidence of successful I/O.

Sources: [Multipart uploads](https://developers.make.com/custom-apps-documentation/component-blocks/api/multipart-form-data.md),
[Buffer and file semantics](https://developers.make.com/custom-apps-documentation/component-blocks/api/buffer.md),
[Custom CA scope](https://developers.make.com/custom-apps-documentation/other/https-custom-ca.md).
