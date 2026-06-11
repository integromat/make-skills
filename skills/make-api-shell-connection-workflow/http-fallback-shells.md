# HTTP Fallback Shells

Use this reference when the target provider has **no dedicated Make app** (or
no usable API-call module). Instead of giving up or asking for a custom app,
build a generic HTTP shell: the same three-module on-demand scenario family as
the API-call shells, but with `http:MakeRequest` (HTTP app, version 4) in the
middle. The shell takes `url`, `method`, `headers`, `qs`, and `body` as inputs
and returns `data`, `statusCode`, and `headers`.

All four authentication variants below were verified live against the Make
REST API (scenario creation, activation, and execution).

## Module anatomy

`http:MakeRequest` v4 selects authentication through the module `parameters`
(not the mapper):

| `authenticationType` | Extra required parameter | Credential storage | Verified |
|---|---|---|---|
| `noAuth` | none | none — pass auth headers/query through the shell inputs | end-to-end |
| `apiKey` | `apiKeyKeychain`: key id | Keys API, type `apikeyauth` | end-to-end (header injected) |
| `basicAuth` | `basicAuthKeychain`: key id | Keys API, type `basicauth` | end-to-end (`authenticated: true`) |
| `oAuth` | `oAuthAccount`: connection id | `oauth2` connection ("HTTP OAuth 2.0") | creation verified; attachment requires an authorized connection |

With `noAuth`, place the authentication wherever the target API expects it by
passing it through the shell inputs: an `Authorization` header (or any custom
header) in `headers`, a token in `qs`, or credentials inside the JSON `body`.
This keeps the shell generic, but the secret then transits the caller — prefer
an `apiKey`/`basicAuth` keychain whenever the value is an actual secret, so it
stays inside Make.

## Credential storage (Keys API)

Keychains live under the Keys API, not under connections:

- List key types: `GET /api/v2/keys/types` (relevant: `apikeyauth`, `basicauth`)
- Create API-key keychain:

```bash
curl -sS -X POST "${BASE_URL}/api/v2/keys" \
  -H "authorization: Token $API_KEY" -H 'content-type: application/json' \
  --data-binary '{
    "teamId": TEAM_ID,
    "name": "Acme API Key",
    "typeName": "apikeyauth",
    "parameters": {"key": "<secret>", "placement": "header", "name": "X-API-Key"}
  }'
```

`placement` is `header` or `qs`; `parameters.name` is the header/query
parameter name. For Basic auth use `"typeName": "basicauth"` with
`{"authUser": "...", "authPass": "..."}`. The response returns the key `id` —
that id goes into the module parameter (`apiKeyKeychain` /
`basicAuthKeychain`). Delete test keys with `DELETE /api/v2/keys/{id}?teamId=`.

## OAuth 2.0 connections

The `oAuth` variant references an `account:oauth2` connection ("HTTP OAuth
2.0"). It can be created via the API:

```bash
curl -sS -X POST "${BASE_URL}/api/v2/connections?teamId=${TEAM_ID}" \
  -H "authorization: Token $API_KEY" -H 'content-type: application/json' \
  --data-binary '{
    "teamId": TEAM_ID,
    "accountType": "oauth2",
    "accountName": "Acme OAuth2",
    "flowType": "authorizationCode",
    "scopeSeparator": " ",
    "tokenPlacement": "header",
    "tokenName": "access_token",
    "clientId": "...",
    "clientSecret": "...",
    "authorizeUri": "https://provider/oauth/authorize",
    "tokenUri": "https://provider/oauth/token",
    "scope": []
  }'
```

Constraints verified live:

- Valid `flowType` options are `authorizationCode` and `implicit` only. There
  is no client-credentials flow on this connection type.
- The connection is created **unauthorized** (`uid: null`). The OAuth consent
  itself is always interactive, but both completion paths below are fully
  drivable via the REST API.
- Creating a scenario that references an unauthorized oauth2 connection fails
  with `IM304` "Connection not found 'http:<id>'". Authorize the connection
  first, then create or patch the shell.
- `GET /connections/{id}/editable-data-schema` on an oauth2 connection lists
  `clientId`, `clientSecret`, `scope`, `scopeSeparator`, `tokenPlacement`,
  `tokenName`, `additionalAuthorizeParams`, and similar config fields for
  `POST /connections/{id}/set-data`. Tokens (`accessToken`/`refreshToken`)
  are **not** injectable — there is no way to skip the consent.

### Completion path A: Credential Request (preferred)

The credential-request system fronts every `http:MakeRequest` auth variant.
Discover the requestable module ids first:

```bash
curl -sS "${BASE_URL}/api/v2/credential-requests/apps/http/4/modules-with-credentials?teamId=${TEAM_ID}&organizationId=${ORG_ID}" \
  -H "authorization: Token $API_KEY"
```

Verified ids: `MakeRequest:authenticationType:apiKey` (`keychain:apikeyauth`),
`MakeRequest:authenticationType:basicAuth` (`keychain:basicauth`),
`MakeRequest:authenticationType:oAuth` (`account:oauth2`), plus mutual-TLS and
proxy keychain variants. This means API keys and Basic credentials can also be
collected through a credential request instead of asking the user to paste
secrets into chat.

Create the request (verified live; note `appModules` **must be an array** —
a plain string fails with `Expected array`):

```bash
curl -sS -X POST "${BASE_URL}/api/v2/credential-requests/requests/v2" \
  -H "authorization: Token $API_KEY" -H 'content-type: application/json' \
  --data-binary '{
    "teamId": TEAM_ID,
    "name": "Authorize Acme via HTTP OAuth 2.0",
    "credentials": [{"appName": "http", "appModules": ["MakeRequest:authenticationType:oAuth"]}],
    "provider": {"providerMakeUserId": USER_ID}
  }'
```

The response contains a `publicUri` (credential-request inbox link). The end
user opens it, enters the OAuth client configuration, and completes the
consent; the derived `oauth2` connection then appears authorized and its id
goes into `oAuthAccount`. Track progress with
`GET /credential-requests/requests/{requestId}/detail` (credential `state`
moves from `pending`).

### Completion path B: API-created connection + authorize link

For a connection created directly via `POST /connections` (as above), fetch
the authorization link:

```bash
curl -sS -o /dev/null -w "%{redirect_url}" \
  "${BASE_URL}/api/v2/oauth/auth/{connectionId}" \
  -H "authorization: Token $API_KEY"
```

Verified live: this returns `302` to a `https://www.make.com/oauth/init?...`
URL that wraps the provider authorize call. Hand that URL (or the
`/api/v2/oauth/auth/{connectionId}` link itself, opened while logged into
Make) to the user to complete the consent. An optional `scope` query
parameter adds scopes. The provider OAuth client must whitelist Make's
callback `https://www.integromat.com/oauth/cb/oauth2` as redirect URI.
Afterwards confirm with `POST /connections/{connectionId}/test`
(`verified: true`) before attaching the connection to the shell.

## Blueprint

See [examples/http-fallback-shell-blueprint.json](./examples/http-fallback-shell-blueprint.json)
for the full flow (StartSubscenario -> http:MakeRequest -> ReturnData). The
middle module for the keychain variants differs only in `parameters`, e.g.:

```json
{"tlsType": "", "proxyKeychain": "", "authenticationType": "apiKey", "apiKeyKeychain": 182303}
```

Creation rules that differ from app API-call shells:

- The blueprint JSON **must contain a top-level `name`** — without it,
  `POST /api/v2/scenarios?confirmed=true` fails with a 500
  (`code 23502`, database not-null violation), not a helpful validation error.
- Create with `"scheduling": "{\"type\":\"on-demand\"}"`, then PATCH the
  scenario interface (`/scenarios/{id}/interface`) with inputs
  `url`/`method`/`headers`/`qs`/`body` and outputs
  `data`/`statusCode`/`headers`.
- Activate before running: `POST /api/v2/scenarios/{id}/start`. Running a
  non-activated scenario fails with `IM325` "Scenario is not activated".

## Run contract

`POST /api/v2/scenarios/{id}/run` with `responsive: true`:

```json
{
  "data": {
    "url": "https://api.example.com/v1/items",
    "method": "GET",
    "headers": [{"name": "X-Trace", "value": "shell"}],
    "qs": [{"name": "limit", "value": "10"}],
    "body": "{}"
  },
  "responsive": true
}
```

- `headers` and `qs` are arrays of `{name, value}` collections — this matches
  the `http:MakeRequest` v4 `expect` spec exactly.
- `method` is lowercased by the mapper (`{{lower(2.method)}}`); valid values
  are `get`, `head`, `post`, `put`, `patch`, `delete`, `options`.
- The mapper sets `contentType` conditionally:
  `{{if(length(2.body) > 0; "json")}}`. Leave `body` empty for GET — CDNs
  such as CloudFront in front of provider APIs (verified with Daytona) reject
  GET requests that carry a body with an opaque edge `403`. With a static
  `contentType: json` the shell always sends a body, and an empty string then
  fails the run with `BundleValidationError` — the conditional avoids both
  failure modes. When a body is provided it must be valid JSON text.
- `stopOnHttpError: false` plus the returned `statusCode` lets the caller
  handle provider errors; `parseResponse: false` returns the raw body text in
  `data`.

The non-GET write-confirmation rule for API-call shells applies unchanged:
warn and get explicit user confirmation before `POST`/`PUT`/`PATCH`/`DELETE`
through an HTTP fallback shell.
