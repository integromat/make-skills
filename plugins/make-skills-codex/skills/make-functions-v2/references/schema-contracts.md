# Source-defined input and output contracts

Define local types and annotate `main(input: Input): Promise<Output>`. The server derives
both schemas from those types. The frontend shows a generated preview with **Edit in code**;
the web Run values form and native Scenario module consume the same published contract.

```typescript
interface Input {
  /** Customer-facing name. */
  name: string;
  /** Omit to use the runtime fallback; null explicitly means no note. */
  note?: string | null;
  items: { label: string; quantity: number }[];
}
interface Output {
  /** Name and note returned to the caller. */
  customer: { name: string; note: string | null };
  items: { label: string; quantity: number }[];
}
export default async function main(input: Input): Promise<Output> {
  return { customer: { name: input.name, note: input.note ?? null }, items: input.items };
}
```

Use primitives, arrays, local interfaces/type aliases and supported unions. Nullable unions
retain `null`; `?` permits omission. `false`, zero, empty strings, omitted fields and null
are different values. Unresolvable, imported, `any` or `unknown` contract types are rejected.
A leading `/** ... */` comment above a property supplies its description, including nested
and inherited fields. Regular code comments and JSDoc tags do not define schema defaults.

Omit `inputSchema` and `outputSchema` on create, publish and inline-run requests. An older
cached tool may expose them as required: derive the exact generated schemas using a compatible
STS analyzer, or refresh the tool metadata. Never invent permissive `{}` schemas to satisfy the
cache. Supplied schemas are consistency assertions and cannot override the types or comments.

Put runtime defaults and extra business validation in code. Run values are invocation data;
they do not edit types or create defaults. Publishing changed types/comments creates a new
immutable contract. Historical versions and admitted Runs retain their original schemas.

## Generated schema limits

The host validates generated schemas against a bounded JSON Schema Draft 2020-12 subset.
The list below describes stored/generated schema capabilities; it is not an independent
schema-authoring interface. Use source validation for constraints types cannot express.

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
unsupported keyword, implement its validation in STS-compatible source and preserve the generated shape. Revalidate the source before a new execution attempt.
