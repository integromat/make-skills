# Base and connections

Load this reference when selecting authentication, implementing connection validation,
handling OAuth renewal, or diagnosing missing authorization in modules and RPCs.
Use [requests-and-responses.md](requests-and-responses.md) for transport and errors.

## Separate the contracts

- Determine the provider's actual authentication scheme before choosing a connection.
- Treat an API key, HTTP Basic credentials, OAuth tokens, and signing keys differently.
- Do not replace an unsupported signing or OAuth flow with an unsigned or bearer-token shell.
- Distinguish editor labels, SDK connection definitions, and management-tool enum values.
  Discover the selected tool's schema instead of translating an auth name into an enum.
- Treat filenames such as `base.imljson` and connection directories as editor or repository
  conventions, not a universal SDK layout or a reason to copy another app's metadata.

Sources: [Connections](https://developers.make.com/custom-apps-documentation/app-components/connections.md),
[Basic connection](https://developers.make.com/custom-apps-documentation/app-components/connections/basic-connection.md).

## Configure Base without assuming universal inheritance

Put the provider base URL, common authorization, default error handling, and log
sanitization in Base. Modules and RPCs inherit these settings; override only what
an endpoint requires. Keep service-specific request bodies out of unrelated modules.

**Connection communication does not inherit Base.** Supply a complete validation
URL, authentication, error handling, and sanitization in the connection itself.
Repeat any necessary custom CA configuration in the relevant connection requests.

Use documented regional or tenant host rules. Validate configurable hosts before
attaching credentials; do not let an arbitrary request URL redirect authentication
material to an unrelated service. Match version prefixes and path joining explicitly.

An expression replacing an entire `headers` collection replaces inherited headers.
Use the documented `"{{...}}"` collection merge when adding computed headers, and
check collision behavior rather than assuming authorization survives every override.

Sources: [Base](https://developers.make.com/custom-apps-documentation/app-components/base.md),
[Advanced inheritance](https://developers.make.com/custom-apps-documentation/app-components/base/advanced-inheritance.md),
[Connection inheritance and CA configuration](https://developers.make.com/custom-apps-documentation/other/https-custom-ca.md).

## Use the right variable context

| Context | Read or write |
| --- | --- |
| Submitted connection fields | Read `parameters.*` in the documented Basic validation and OAuth token examples. |
| Stored connection data during renewal | Read `data.*`, such as `data.refreshToken` and `data.expires`. |
| Persisted values from a connection response | Write `response.data`; modules subsequently access those values through `connection.*`. |
| Base, modules, and RPCs | Read the selected connection through `connection.*`. |
| OAuth `info` after token acquisition | Current SDK examples use `connection.accessToken`; do not blindly replace it with `parameters.accessToken`. |
| Shared application or connection settings | Read `common.*` from the appropriate component's Common data. |

Use connection Common data for application-level OAuth secrets needed only there.
Common data is encrypted in Make, but that does not make secrets safe to commit.
Never infer variable availability from a different component's example.

Sources: [Basic variables and persisted data](https://developers.make.com/custom-apps-documentation/app-components/connections/basic-connection.md),
[OAuth variables and flow](https://developers.make.com/custom-apps-documentation/app-components/connections/oauth2.md),
[Common data](https://developers.make.com/custom-apps-documentation/app-components/connections.md#common-data).

## API key and HTTP Basic validation

1. Collect secrets with `password` parameters and provider-specific labels.
2. Use the provider's documented header, query, or Basic authorization format.
3. Validate against a lightweight endpoint that actually requires the credential.
   Prefer account information or a bounded read; a public health check proves only reachability.
4. Include required scopes and tenant selection in the validation contract.
   A read-only operation may legitimately use POST; HTTP method alone does not prove safety.
5. Use `response.metadata` for a useful non-secret account label.
6. Set `response.uid` only from a real remote account identifier when needed, especially
   for shared webhooks. Never use an API key, password, token, or fabricated shared identifier.

For an API key submitted as `apiKey`, the validation header fragment is:

```json
{"headers": {"x-api-key": "{{parameters.apiKey}}"}}
```

The corresponding Base fragment reads the saved connection:

```json
{"headers": {"x-api-key": "{{connection.apiKey}}"}}
```

These are fragments, not complete validation requests. The current Basic connection
reference specifies one request and excludes pagination, iteration, and output.
Do not transplant multi-request action logic into a Basic connection without verifying
support for the selected connection surface. Legacy exports are not capability guarantees.

Sources: [Basic connection](https://developers.make.com/custom-apps-documentation/app-components/connections/basic-connection.md),
[Validation endpoints](https://developers.make.com/custom-apps-documentation/best-practices/connections.md).

## OAuth 2.0 lifecycle

- Register the provider client and exact callback before implementing the flow.
  Follow current guidance for `oauth.makeRedirectUri` or `oauth.localRedirectUri`;
  do not copy a legacy redirect variable without checking its registered callback.
- Define the required `authorize`, `token`, `info`, `refresh`, and optional
  `preauthorize` or `invalidate` requests from provider documentation.
- Match token encoding, client authentication, scopes, and PKCE requirements.
  Store tokens under `response.data`; capture the authorization code in temporary data.
- Store the access-token expiry in **`response.data.expires`** and use it in the
  renewal condition. **`response.expires`** instead marks expiry requiring manual
  reauthorization, such as refresh-token expiry. Do not interchange these fields.
- For authorization-code grants with refresh support, renew with `refresh`; do not
  replay a single-use code. If the provider supplies no refresh mechanism, omit that
  request and document token lifetime and reauthorization instead of inventing renewal.
- Preserve the existing refresh token when the provider documents omission of an
  unchanged token; persist a replacement when rotation returns one.
- For client credentials without `authorize`, define `token.condition` explicitly.
  The documented expiry-based condition supports initial acquisition and renewal.
  An unconditional `true` requests a new token on every use; prefer known expiry.
- Use `token.condition` only for a user-independent, single-request token block,
  not an array or an authorization-code exchange. A separate refresh block is not
  needed when that token request performs renewal itself.
- Validate expired, revoked, insufficient-scope, and reauthorized connections separately.

Source: [OAuth 2.0, expiry and token conditions](https://developers.make.com/custom-apps-documentation/app-components/connections/oauth2.md).

## OAuth 1.0, JWT, and request signing

Use OAuth 1.0 when required by the provider: implement `requestToken`, `authorize`,
`accessToken`, and `info`, with the documented `oauth` signing configuration.
Do not reduce a token plus token secret to a bearer token.

JWT is not a separate connection type in the SDK guide. Use the documented `jwt`
built-in with the provider's claims, algorithm, key format, and expiry requirements.
For other signatures, verify canonicalization, timestamps, nonces, body bytes, and
available signing primitives. A documented AWS request directive is not proof that
it is supported in a connection; the connection reference explicitly restricts it.

Route custom transforms to [iml-functions.md](iml-functions.md). Do not import Node
`crypto`, `require`, or network clients into the app function runtime. Mark an
unreproducible signing flow blocked instead of weakening authentication.

Sources: [OAuth 1.0](https://developers.make.com/custom-apps-documentation/app-components/connections/oauth1.md),
[JWT](https://developers.make.com/custom-apps-documentation/app-components/connections/jwt.md),
[Request signing](https://developers.make.com/custom-apps-documentation/component-blocks/api/making-requests.md#aws).

## Security and readiness gates

- Sanitize every actual secret-bearing request and response path, including query
  keys, authorization, cookies, authorization codes, client secrets, and refreshed tokens.
- Configure connection logs independently of Base. Check sanitized logs rather than
  assuming a generic path matches the provider's header or token field.
- Keep credentials out of metadata, UID, samples, error messages, and function fixtures.
- Verify Base inheritance in an action and an RPC; test new connection creation and
  renewal separately. A saved app definition does not prove either flow works.
- Report local validation, remote definition readback, and provider-authenticated
  execution as different evidence levels. Never imply live verification without a run.

Source: [Sanitization](https://developers.make.com/custom-apps-documentation/app-components/base/sanitization.md).
