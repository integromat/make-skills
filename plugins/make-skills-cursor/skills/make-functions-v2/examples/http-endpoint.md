# Read a public API through an Endpoint

This example reads one post from [JSONPlaceholder](https://jsonplaceholder.typicode.com/), a free public
API requiring no signup or API key. It issues only `GET /posts/1` and returns the post's title. It still
executes a real outbound request and consumes a Function Run.

## 1. Discover and bind

Call `environment_get` and select the intended team. Call `function_endpoint_list` with that team's ID and
`appName: "http"`, then `function_endpoint_types` for the returned `http`, version `4`, `makeRequest`
identity and catalog ID. Continue only when its definition is available and matches the call below.
Do not assume this Endpoint exists in every environment.

The HTTP v4 Endpoint requires a saved Make HTTP Connection even though this provider needs no credentials.
Select or create a compatible Connection configured **without authentication**, with the public host allowed
where the Connection requires host configuration. Do not send an unrelated provider's API key or OAuth
credentials to this host. Use the missing-Connection workflow in
[access and discovery](../references/access-and-discovery.md), then rediscover to verify compatibility.

The numeric team ID `7` and Connection ID `123` below are placeholders, never defaults. Replace them with
verified IDs. `publicApi` is a local literal binding: it must match the source's `connection`, the
`connections` map key and the Endpoint declaration's `connectionKey`. The `alias` is display metadata.

## 2. Validate and execute

The complete source is also available as [http-endpoint.ts](http-endpoint.ts). It checks HTTP status,
rejects null, non-object and array responses, and requires a string title before returning its bounded
output. Keep these checks: the Endpoint's generated output allows optional fields and arbitrary JSON.

After checking STS, host restrictions and schemas, submit the following when the read is authorized:

```json
{
  "tool": "function_run_create_inline",
  "arguments": {
    "teamId": 7,
    "content": {
      "source": "export default async function main(input: {}) {\n  const response = await make.endpoints.http.v4.makeRequest({\n    input: { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' },\n    connection: 'publicApi'\n  });\n  if (response.statusCode !== 200) { // @label Reject unsuccessful response\n    throw new Error('Expected HTTP 200');\n  }\n  const data = response.data;\n  if (data === null) { // @label Reject null response\n    throw new Error('Expected a JSON object');\n  }\n  if (typeof data !== 'object') { // @label Reject non-object response\n    throw new Error('Expected a JSON object');\n  }\n  const isArray = Array.isArray(data);\n  if (isArray) { // @label Reject array response\n    throw new Error('Expected a JSON object');\n  }\n  const post = data as { title?: unknown };\n  if (typeof post.title !== 'string') { // @label Reject missing title\n    throw new Error('Expected a string title');\n  }\n  return { title: post.title };\n}\n",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "additionalProperties": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          }
        },
        "required": [
          "title"
        ],
        "additionalProperties": false
      },
      "connections": {
        "publicApi": 123
      },
      "endpoints": [
        {
          "appName": "http",
          "appVersion": 4,
          "endpointName": "makeRequest",
          "alias": "Read public API",
          "connectionKey": "publicApi"
        }
      ]
    },
    "data": {},
    "timeoutSeconds": 30
  }
}
```

Keep the returned `run.id` and poll `function_run_get`. Require terminal `succeeded`, a string
`run.output.title`, and an Endpoint-call history consistent with the selected HTTP operation. Do not
interpret admission as success or start another Run while waiting. If the response is uncertain, follow
[execution recovery](../references/execution-and-recovery.md); do not resubmit automatically.

## 3. Save or publish only when requested

To save this as a new Function, pass the same `content` with the discovered team and a chosen name to
`function_create`; that creates inactive version 1. For an existing Function, read its latest version and
publish this tested content with `function_version_publish` and `expectedLatestVersion`. Follow the
[authoring workflow](authoring.md) for activation, an explicit selected-version Run, output retrieval and
requested cleanup. Inline execution alone creates no saved Function to delete.

The public example's source and schemas are checked with local validators. Live execution also requires a
compatible no-authentication Connection; do not claim it was tested merely because its types were discovered.
