# Parameters and RPCs

Load this reference when defining module inputs, output interfaces, dropdowns,
search buttons, or dynamic fields. Use [modules-and-pagination.md](modules-and-pagination.md)
for emitted bundles and [iml-functions.md](iml-functions.md) for transformations.

## Route fields to the correct component

| Surface | Purpose |
| --- | --- |
| Connection parameters | Credentials and account configuration collected when creating a connection. |
| Static parameters | Trigger configuration; there is no preceding bundle to map. |
| Mappable parameters | Action/search inputs entered literally or mapped from earlier modules. |
| Interface | The schema of each emitted output bundle, not an input form. |
| Samples | A representative output object, not another field-definition array. |

Follow the dedicated Static parameters guide: use the static tab for triggers and
leave it empty for non-trigger inputs. Do not interpret a local `parameters` file
as a JavaScript preprocessing stage. File names and export keys depend on the editor.
Refresh the scenario after changing mappable fields or interfaces before diagnosing
an apparent stale schema as a failed deployment.

Sources: [Static parameters](https://developers.make.com/custom-apps-documentation/component-blocks/parameters.md),
[Mappable parameters](https://developers.make.com/custom-apps-documentation/component-blocks/mappable-parameters.md),
[Interface](https://developers.make.com/custom-apps-documentation/component-blocks/interface.md),
[Samples](https://developers.make.com/custom-apps-documentation/component-blocks/samples.md).

## Define types and validation deliberately

- Keep stable machine-readable `name` values separate from human-readable labels.
- Use Make types such as `text`, `number`, `integer`, `uinteger`, `boolean`, `date`,
  `collection`, `array`, and `buffer`; do not translate JSON Schema types mechanically.
- Keep opaque identifiers as text unless the provider requires a numeric value.
  A numeric-looking identifier can have leading zeros or exceed safe integer precision.
- Use `required`, defaults, and optional fields according to the provider operation.
  Creation and partial update rarely need identical required-field rules.
- Text supports **`validate.pattern`, `validate.min`, and `validate.max`**.
  Numeric, integer, and unsigned-integer fields support **`validate.min` and `validate.max`**.
- Put regex and range constraints inside `validate`, not JSON Schema-style top-level
  `pattern`, `minimum`, or `maximum`. Anchor a regex when validating the whole string.

Documented text-validation fragment:

```json
{
  "name": "validated",
  "type": "text",
  "label": "Validated string",
  "validate": {"pattern": "^[A-Z ]+$", "min": 10, "max": 32}
}
```

Numeric-validation fragment:

```json
{
  "name": "thinking",
  "type": "integer",
  "label": "Input a number from 1 to 10",
  "validate": {"min": 1, "max": 10}
}
```

These demonstrate SDK syntax, not constraints to impose on every provider field.

Sources: [Text](https://developers.make.com/custom-apps-documentation/block-elements/parameters/text.md),
[Number](https://developers.make.com/custom-apps-documentation/block-elements/parameters/number.md),
[Integer and Uinteger](https://developers.make.com/custom-apps-documentation/block-elements/parameters/integer-uinteger.md).

## Collections, arrays, and intentional empty values

Define a collection's `spec` as an array of named fields. For an array of primitive
values, use an object `spec`, such as `{"type":"text"}`. For collections, Make documents
both an array of named field definitions and `spec: {type: "collection", spec: [...]}`
(with an optional collection label). Preserve a valid existing form; match the payload nesting.
Array length constraints use `validate.minItems` and `validate.maxItems`.

Preserve `false` and `0`. Prefer direct parameter mapping over truthiness-based
omission. Distinguish absent values from explicit `null`, an empty string, or an
empty array: those may intentionally clear a field. Do not run a generic
"remove empty" transform over every update request.

For selects, keep `label` separate from the API's `value`; retain the identifier's
actual type. Use `spec` only for an intentional value conversion. A mapping toggle
and static option validation are different concerns; check `mode`, `dynamic`, and
`validate` behavior rather than assuming all typed or mapped values are equivalent.

Sources: [Collection](https://developers.make.com/custom-apps-documentation/block-elements/parameters/collection.md),
[Array](https://developers.make.com/custom-apps-documentation/block-elements/parameters/array.md),
[Select](https://developers.make.com/custom-apps-documentation/block-elements/parameters/select.md),
[Handling empty inputs](https://developers.make.com/custom-apps-documentation/best-practices/input-parameters/processing-of-input-parameters.md#handling-arrays-nulls-and-empty-strings).

## Dynamic options RPCs

RPCs execute during scenario configuration, not as substitutes for action execution.
Bind each RPC to the same connection or connection list as its calling module.
This requirement also applies to request-less RPCs; a static response does not
remove the component's connection-compatibility requirement.

Use a select's `"options": "rpc://getUsers"` for a bounded list. Return an array
of `{label, value}` objects through iteration and output. A standard response fragment is:

```json
{
  "response": {
    "limit": 500,
    "iterate": "{{body.users}}",
    "output": {"label": "{{item.name}}", "value": "{{item.id}}"}
  }
}
```

Choose the real array path and a useful bounded limit; do not fetch an entire
account merely to open a dropdown. Prefer a search button when provider-side
search exists and the available records cannot fit a practical options list.
Use `mode: "edit"` for identifier selectors in Get, Update, and Delete modules,
as recommended by the RPC guide, while retaining the option to select a value.

Sources: [RPC connection contract](https://developers.make.com/custom-apps-documentation/app-components/rpcs.md),
[Dynamic options](https://developers.make.com/custom-apps-documentation/app-components/rpcs/dynamic-options-rpc.md),
[RPC usability and limits](https://developers.make.com/custom-apps-documentation/best-practices/remote-procedure-calls.md).

## Dependent options, fields, and interfaces

- Use `options.store` together with `options.nested` for dependent selects.
  The selected parent field is available through `parameters.<name>` in the child RPC.
- Let module parameters flow to linked RPCs; use documented RPC query parameters
  for additional fixed context rather than interpolating arbitrary unsupported syntax.
- Filter on the provider when possible. The documented `iterate.container` plus
  `iterate.condition` form can filter returned options when server filtering is unavailable.
- For dynamic fields, return Make parameter definitions with `name`, `type`, and
  appropriate labels, not `{label, value}` options or raw provider schema objects.
- Reference a fields RPC in the mappable-parameter array, alone or alongside fixed
  fields. Translate provider `string` into Make `text` rather than forwarding it.
- For a dynamic **output** interface, intentionally reference the schema RPC from
  Interface. Do not add input dropdown options to ordinary output fields by accident.
- For an instant trigger's dynamic interface, use the documented `webhook.*`
  context for webhook data, rather than assuming incoming `payload` is present at edit time.
- Dynamic sample RPCs return one sample object; set `response.limit: 1` when iterating.

Sources: [Dynamic fields](https://developers.make.com/custom-apps-documentation/app-components/rpcs/dynamic-fields-rpc.md),
[Dynamic interface](https://developers.make.com/custom-apps-documentation/component-blocks/interface.md#dynamic-interface-using-rpc),
[Dynamic samples](https://developers.make.com/custom-apps-documentation/app-components/rpcs/dynamic-sample-rpc.md).

## Verification gate

- Resolve every `rpc://` reference and custom helper against a defined component.
- Verify empty, single, and large option sets, parent changes, expired credentials,
  duplicate labels, identifier types, and manual/mapped entry.
- Assert dynamic fields and interfaces use supported types and unique stable names.
- Check output schemas against real bundle shape, including dates, nested arrays,
  optional fields, and file semantics. A sample is not proof of all possible fields.
- Keep fixture data synthetic or sanitized. Report UI/RPC execution separately
  from static JSON checks; an upload alone does not prove the selector opens.
