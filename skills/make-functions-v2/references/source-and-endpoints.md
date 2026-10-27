# Source and Endpoint contracts

A Function's metadata and its executable content have different update paths. `function_update` changes
name/description. `function_version_publish` creates immutable content from source, input/output schemas,
Connection references, Endpoint declarations and any runtime retry policy. Retrieve a version before editing
it and preserve declarations that the intended change still needs.

Source exports the Function entry point, for example:

```typescript
export default async function main(input: { value: number }) {
  return { doubled: input.value * 2 };
}
```

The input and output contracts are JSON Schema documents. Match the actual source behavior; permissive
contracts should be intentional. Runtime retry policy concerns backend attempts and does not make repeating
a Run-submission request safe.

For app calls, discover the exact app name, version and Endpoint name. Use the declaration returned by
`function_endpoint_types` to construct the input and interpret the output. Source calls use the runtime's
`make.endpoints.<app>.v<version>.<Endpoint>({ input, connection })` shape, with the declared connection label
when required. Endpoint names and app identifiers must come from discovery; bracket access can represent
identifiers that are not JavaScript property names.

The content's `connections` maps labels to discovered Connection IDs. Its Endpoint declarations identify
the permitted app/version/Endpoint and, when needed, its `connectionKey`. The declaration's `alias` is a
display label, not a callable source method. Do not embed provider tokens or infer a connection from the app's
label. Select no-auth Endpoints without inventing a Connection requirement.

Preserve the returned availability values (`available`, `definition_missing`, `catalog_unavailable`,
`not_authorized`) and generated `inputType`, `outputType` and `declarations`. If a required definition is
unavailable, stop that dependency's authoring and explain the limitation rather than making up types.
