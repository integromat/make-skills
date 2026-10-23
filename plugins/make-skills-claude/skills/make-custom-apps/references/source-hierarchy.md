# Source hierarchy and evidence

Load when deriving an app from documentation or exports, reconciling conflicting examples, or deciding
whether a pattern is safe to reuse. This is a decision guide, not a requirement to collect every source
for a small change.

## Separate the contracts

Three contracts must agree: the **provider API** defines the service request/response and authorization;
the **Make custom-app runtime** defines configuration and IML semantics; the **selected authoring
interface** defines how those sections and metadata are created or updated. A field accepted by one is
not automatically valid in the others. An example in an old app is evidence of an implementation, not a
universal platform rule.

For each load-bearing decision, record a short claim, its exact source, the source version or retrieval
context, and a validation result. Keep internal or credential-bearing source material in an approved
private workspace; the public app/skill should cite public documentation and contain only safe examples.

## Resolve conflicting evidence

1. Read current provider documentation for exact URLs, methods, API versions, auth, scopes, body encoding,
   pagination, errors, and rate limits. Use a provider schema or implementation only within its proven
   version and capabilities. Product marketing and package names do not establish an HTTP contract.
2. Read the relevant current [Make custom-app documentation][5] for the component and its execution
   context. Follow through to the specific parameter, directive, or component rather than attributing a
   detail to the documentation homepage.
3. Inspect the actual deployed/exported app, component revision, and selected interface's current schema.
   Check a small relevant implementation and, when authorized, reproduce the behavior. Installed CLI help
   establishes local command availability, not published-package compatibility or remote authorization.
4. Use local guides, old PDFs, generated apps, and session notes as discovery aids. Validate their claims
   against the first three layers; do not concatenate contradictory instructions. Source freshness alone
   does not make a generated note correct.
5. If authoritative sources and observed behavior still disagree, preserve both findings and stop the
   affected unsupported change. Report the exact version, minimal reproduction, and missing decision.
   Unrelated supported local work can continue.

## Concrete traps to check

### Pagination is runtime state, not a manual counter

Make's `pagination.page` starts at 1 and is advanced automatically; the second request sees 2. A
one-based page API normally receives that value directly. Offset examples use
`(pagination.page - 1) * pageSize`. An unconditional `+ 1` can skip a page; an API with a different index
must be adapted explicitly and tested across multiple pages.[1]

Check cursor/next-URL sources and stop conditions separately. Pagination and response limits are not
proof that every server-side record can be retrieved within a single platform execution.[1]

### Make parameter schemas are not JSON Schema

Text parameters support nested `validate.pattern`, `validate.min`, and `validate.max`; number, integer,
and unsigned-integer parameters support `validate.min` and `validate.max`.[2][3][4]

Do not replace these documented keys with top-level `minimum`, `maximum`, or `pattern` merely because a
JSON Schema library accepts them. Conversely, permission for one parameter type does not authorize an
arbitrary validation key on every type. Test the actual editor and runtime boundary where required.

### Similar names can refer to different objects

- SDK connection definitions, provider authentication methods, and CLI credential-input enums are not
  interchangeable. Verify the selected surface instead of normalizing every `basic`, API-key, or OAuth
  label into a guessed platform type.
- App IML functions are app-owned transformations, not organization-level Custom Functions and not a
  Node.js process with arbitrary packages or network access.
- SDK Endpoint definitions are authoring objects. Calling an existing Endpoint through an SDK or CLI
  does not prove that surface can create or modify its definition.
- Root app version, provider API version, component revision, app visibility, module visibility, and
  catalog approval are distinct facts. A published-impact filter does not exclude private work in progress.

## Reusing app exports and examples

Inventory the observed export schema before extracting components. Some exports represent modules,
connections, RPCs, hooks, and functions as dictionaries; others use editor-specific files. Missing fields,
failed list calls, and explicit empty collections are different states. Check completeness and retain the
original source identity privately.

Do not copy raw exports into a public repository. Review code and metadata for credentials, invitation
values, personal/tenant identifiers, private service hosts, and publication rights. Token detection must
include authorization literals and credential assignments, not only familiar token prefixes. Verify a
suspected credential without printing or exercising it.

Prefer direct reuse of existing valid component snippets when reuse is authorized. Deduplicate equivalent
examples and change only what is needed for secret/identifier removal, verified semantic corrections, or
the selected file format. Preserve source provenance and explain adaptations; do not regenerate working
examples merely to make them look new. Link the relevant public contract so the resulting example is
usable without access to the original private workspace.

Declare whether each example is a component-section template, a static/unit-tested implementation, or a
live-tested app. Sample JSON is not an observed API response unless a real authorized call produced it;
fixture data must be labeled as such.

## Portability and evidence limits

A local naming convention, generator, editor, model, module-count preference, or upload wrapper is not a
Make runtime requirement. Keep useful local practices optional and preserve an existing repository's
format. Do not require a private repository or internal knowledge-base mirror for a public workflow.

Use a coverage matrix to select representative patterns, not a claim that reading a large corpus proves
correctness. Parsing files, static checks, helper-function tests, remote section readback, and real
provider execution establish different facts. Publish only the level actually observed.

## Sources

[1]: https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md
[2]: https://developers.make.com/custom-apps-documentation/block-elements/parameters/text.md
[3]: https://developers.make.com/custom-apps-documentation/block-elements/parameters/number.md
[4]: https://developers.make.com/custom-apps-documentation/block-elements/parameters/integer-uinteger.md
[5]: https://developers.make.com/custom-apps-documentation
