# Author, test, publish and run

This example doubles a number without external app effects. Team 7, Function 42, Run UUIDs and ETags below
are placeholders: replace each with the value actually returned. Execute only the steps within the user's
requested scope. Calls use the existing `make` connection and the current tool schemas.

1. Call `environment_get` with `{}` and select the intended team. For an app-dependent Function, discover
   its dependencies first:

```json
{"tool":"function_endpoint_list","arguments":{"teamId":7,"search":"contact"}}
```

Then call `function_endpoint_types` with `teamId`, the returned `catalogId` when present, and the selected
`{appName, appVersion, endpointName}` entries. Check availability before writing app calls. The arithmetic
example below needs no Endpoints or Connections.

2. Create the initial Function. It returns `function.id`, version 1 and an ETag, and stays inactive.

```json
{"tool":"function_create","arguments":{"teamId":7,"name":"Double a value","content":{"source":"export default async function main(input: { value: number }) { return input.value * 2; }","inputSchema":{"type":"object","properties":{"value":{"type":"number"}},"required":["value"],"additionalProperties":false},"outputSchema":{"type":"number"}}}}
```

3. Test a candidate that returns a named output. This executes real code but does not publish the candidate.

```json
{"tool":"function_run_create_inline","arguments":{"teamId":7,"functionId":42,"content":{"source":"export default async function main(input: { value: number }) { return { doubled: input.value * 2 }; }","inputSchema":{"type":"object","properties":{"value":{"type":"number"}},"required":["value"],"additionalProperties":false},"outputSchema":{"type":"object","properties":{"doubled":{"type":"number"}},"required":["doubled"],"additionalProperties":false}},"data":{"value":3}}}
```

4. Retrieve the returned `run.id` until terminal; success should contain `run.output: {"doubled":6}`.

```json
{"tool":"function_run_get","arguments":{"runId":"4b75e102-2c25-42de-8000-000000000001"}}
```

5. Read `function_get` with `{"functionId":42}` to check the latest version. Publish the exact tested content
   only if version 1 is still the expected base:

```json
{"tool":"function_version_publish","arguments":{"functionId":42,"expectedLatestVersion":1,"content":{"source":"export default async function main(input: { value: number }) { return { doubled: input.value * 2 }; }","inputSchema":{"type":"object","properties":{"value":{"type":"number"}},"required":["value"],"additionalProperties":false},"outputSchema":{"type":"object","properties":{"doubled":{"type":"number"}},"required":["doubled"],"additionalProperties":false}}}}
```

6. Read `function_get` again for the current ETag; publication may have changed it. If activation is requested:

```json
{"tool":"function_activate","arguments":{"functionId":42,"etag":"\"returned-etag\""}}
```

7. Execute the returned published version explicitly (2 in this example) and retrieve the new Run ID with
   `function_run_get`:

```json
{"tool":"function_run_create","arguments":{"functionId":42,"version":2,"data":{"value":3}}}
```

Check terminal success and the output; neither publication nor admission proves execution succeeded. If
cleanup was requested, read a fresh ETag for `function_deactivate`, then use the ETag it returns (or re-read)
for `function_delete`. Never reuse an ETag across mutations by assumption.
