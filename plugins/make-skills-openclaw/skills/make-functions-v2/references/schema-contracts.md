# Functions schema contracts

Functions supports a bounded subset of JSON Schema Draft 2020-12. A valid general JSON Schema document
can still be rejected by this host. Use object schemas (including `{}`); boolean schemas are unsupported
except as the value of `additionalProperties`.

Supported keywords:

```text
$defs $ref $schema additionalProperties allOf anyOf const default description enum
exclusiveMaximum exclusiveMinimum items maxItems maxLength maxProperties maximum
minItems minLength minProperties minimum multipleOf oneOf properties required title type
```

- `pattern`, `format` and `patternProperties` are unsupported. Preserve those requirements in source with
  explicit validation; do not silently remove the requested behavior.
- `type`, when supplied, is one string: `array`, `boolean`, `integer`, `null`, `number`, `object` or `string`.
  Use `anyOf` for unions, for example `{"anyOf":[{"type":"string"},{"type":"null"}]}`.
- `$schema`, when supplied, is `https://json-schema.org/draft/2020-12/schema`.
- `$ref` must resolve into local root `$defs`; references must be acyclic. External references are unsupported.
- `items` contains one homogeneous object schema, not tuple schemas.
- `required` contains unique strings. `additionalProperties` accepts a boolean or an object schema.

## Size and complexity

Each contract is limited to 65,536 serialized bytes, schema depth 32, 1,000 schema nodes, 500 properties,
32 total union branches and 256 enum values. Literal values are bounded to depth 32 and 10,000 nodes;
the complete document is bounded to depth 128 and 20,000 nodes. Avoid copying large provider schemas
without reducing them to the actual input/output contract. These are contract limits, not Run payload limits.

Match contracts to actual behavior, including explicit nulls and error handling. If the server reports an
unsupported keyword, implement its validation in STS-compatible source and retain the expressible shape
and bounds in the schema. Revalidate both source and contracts before a new execution attempt.
