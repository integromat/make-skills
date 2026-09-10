# HTTP fallback shells

Use this when the provider has **no Make app** with a usable API-call module (a community-only app counts as
none). The shell has the same three-module frame, with the generic `http:MakeRequest` (HTTP app, version 4) in
the middle; it takes `url`, `method`, `headers`, `qs`, `body` and returns `data`, `statusCode`, `headers`. The
complete `scenario_create` call is [http-shell.json](../examples/http-shell.json); confirm field names with
`module_spec(schemas: true)` on `http:MakeRequest` before sending it.

## Authentication is chosen in `parameters`

`config.parameters.authenticationType` selects the variant and names the credential it needs:

| `authenticationType` | Extra parameter | Credential |
|---|---|---|
| `noAuth` | — | none: pass the provider's token through the shell's `headers` (or `qs`/`body`) on every call |
| `apiKey` | `apiKeyKeychain`: key id | an API-key keychain (header or query placement) |
| `basicAuth` | `basicAuthKeychain`: key id | a username/password keychain |
| `oAuth` | `oAuthAccount`: connection id | an "HTTP OAuth 2.0" connection |

`module_spec`'s `connection` reports which of these the module can be given and any existing candidates.
`connection_create` requests it from the user the same way as any app credential — say the **exact paste
format** in the request (`Bearer <key>` in an `Authorization` header vs a raw key in `X-API-Key`), because
users cannot know provider-specific shapes. When a keychain cannot be provisioned that way, the user creates
it under Make → Keys and hands over its id; `noAuth` with the secret carried in `headers` always works but
means the secret transits the caller on every run — prefer a keychain for anything that is actually secret.

An OAuth connection referenced before the user has authorized it makes the save fail (`Connection not
found`): authorize first, then create or patch the shell.

## Middle-module mapping that is known to work

```json
{
  "url": "{{1.url}}",
  "method": "{{lower(1.method)}}",
  "headers": "{{1.headers}}",
  "queryParameters": "{{1.qs}}",
  "contentType": "{{if(length(1.body) > 0; \"json\")}}",
  "inputMethod": "jsonString",
  "jsonStringBodyContent": "{{1.body}}",
  "parseResponse": false,
  "stopOnHttpError": false,
  "allowRedirects": true,
  "shareCookies": false,
  "requestCompressedContent": true
}
```

- `method` values are lowercase (`get`, `post`, …) — the `lower()` handles a caller sending `GET`.
- `headers` and `qs` are arrays of `{name, value}` — this matches the module's own field spec exactly.
- The conditional `contentType` matters: with a fixed `json` the module always sends a body, an empty one
  fails validation, and a `GET` carrying a body is rejected by some CDN-fronted APIs with an opaque 403.
  Leave `body` empty on `GET`; when present it must be valid JSON text.
- `stopOnHttpError: false` plus the returned `statusCode` lets the caller handle provider errors instead of
  the run failing; `parseResponse: false` returns the raw body text in `data`.

## Running it

```json
{ "url": "https://api.example.com/v1/items", "method": "GET",
  "headers": [{ "name": "Authorization", "value": "Bearer …" }],
  "qs": [{ "name": "limit", "value": "10" }], "body": null }
```

Same rules as an app shell: activate before the first run, narrow first, confirm before any non-`GET`.
