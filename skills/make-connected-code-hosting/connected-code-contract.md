# Connected Code contract

Use this reference when building or inspecting the Connected Code module inside a Make scenario.

## Module id

```text
connected-code:ExecuteConnectedCode
```

Use version `1` unless current metadata proves another version.

## Mapper fields

The mapper normally contains:

```json
{
  "language": "javascript",
  "inputFormat": "editor",
  "codeEditorJavascript": "return { ok: true };",
  "input": [
    { "name": "payload", "value": "{{1.payload}}" }
  ],
  "dependencies": []
}
```

Rules:

- `language` is usually `javascript`; use another supported language only when required.
- `inputFormat` is usually `editor` for generated blueprints.
- Use the matching code field for the language.
- `input` is an array of `{name, value}` entries. These become the `input` object in code.
- `dependencies` should be empty unless a package is truly needed.

## Parameter fields

Parameter fields depend on the selected App option. Current Connected Code 1.2.2 uses one account binder:

- `connectionType`
- `__IMTCONN__` for selected service/account Apps
- `httpBaseUrl` for HTTP App scoped access
- `credentialType` and `credential` for HTTP keychains

Do not emit stale sharded binders such as `__IMTCONN_2__`, `__IMTCONN_3__`, or `__IMTCONN_4__`; the runtime ignores them. Do not guess fields. Derive the current parameter shape from one of:

1. current Connected Code module interface;
2. current Connected Code manifest;
3. an exported blueprint that already uses the selected app;
4. validation output after a failed save.

The selected connection determines which runtime helpers are actually supported. The presence of `connection.email` or `connection.sql` on the JavaScript object does not make those brokers valid for every App. Service Apps with HTTP transport, such as Gmail and Sage, use `connection.fetch(...)`; a helper mismatch produces `Broker is not configured for this connection`.

## Outputs

Connected Code exposes:

- `result`
- `executionTimeMs`
- `logs`

The scenario run endpoint may return only execution status. If the final payload must be asserted, add an explicit output/capture step rather than assuming a responsive run returns the full `result` field.

## REST create/update payload shape

When using direct Make REST APIs, create/update payloads use stringified scenario JSON:

```json
{
  "teamId": 123,
  "scheduling": "{\"type\":\"on-demand\"}",
  "blueprint": "{...stringified blueprint...}"
}
```

Create:

```text
POST /api/v2/scenarios?confirmed=true
```

Update:

```text
PATCH /api/v2/scenarios/<scenarioId>?confirmed=true
```

Make CLI and SDK wrappers may accept object-shaped arguments. Inspect tool help before converting; do not assume the REST shape applies to every wrapper.

## Minimal module block

```json
{
  "id": 1,
  "module": "connected-code:ExecuteConnectedCode",
  "version": 1,
  "parameters": {
    "connectionType": "http",
    "httpBaseUrl": "https://api.example.test",
    "credentialType": "keychain:apikeyauth",
    "credential": "__USER_SELECTS_HTTP_CREDENTIAL__"
  },
  "mapper": {
    "language": "javascript",
    "inputFormat": "editor",
    "codeEditorJavascript": "const response = await connection.fetch('/items');\nconst text = await response.text();\nif (!response.ok) throw new Error(`Request failed ${response.status}: ${text}`);\nreturn JSON.parse(text);",
    "input": [],
    "dependencies": []
  },
  "metadata": {
    "designer": { "x": 0, "y": 0 }
  }
}
```

This is a shape example, not proof that those exact parameter values apply to every app.
