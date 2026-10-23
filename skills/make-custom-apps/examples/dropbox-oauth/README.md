# Dropbox OAuth2 with refresh

A **connection-section example** for a confidential, server-side OAuth2 authorization-code client. It is not a browser OAuth implementation, organization Custom Function, complete app, or ready-to-upload package. Dropbox explicitly supports offline access with refresh tokens.[18]

## Section mapping and dependencies

Create an OAuth 2.0 connection and map:

| File | Make section |
| --- | --- |
| [api.imljson](api.imljson) | Communication: authorize, token, refresh, info |
| [parameters.imljson](parameters.imljson) | Parameters (empty; end users authorize the app) |
| [scope.imljson](scope.imljson) | Default scope |
| [common.example.json](common.example.json) | **Illustration only** of Common data keys |

`common.clientId` / `common.clientSecret` belong to a registered Dropbox developer app. Replace the visibly named placeholders only in secure Make Common data, never in the repository. Register `https://www.make.com/oauth/cb/app` exactly in Dropbox, matching the same `oauth.makeRedirectUri` in authorize and token. Make documents managing OAuth `state` by default; do not replace it with a constant.[8][18]

## Assumptions and placeholders

- User-account authorization only, with `account_info.read`; no team scopes, impersonation, file permissions, or PKCE/public-client claims.[19]
- Authorize uses `https://www.dropbox.com/oauth2/authorize` with `token_access_type=offline`. Token and refresh use form-encoded `POST https://api.dropboxapi.com/oauth2/token` and client credentials.[18]
- `token.response.data` persists the access/refresh tokens and expiration. **`response.data.expires`** controls automatic refresh; top-level `response.expires` would instead request manual reauthorization. Do not add `token.condition` to retry a one-use authorization code.[8]
- Dropbox refresh does **not** return a new refresh token. The refresh block deliberately retains `data.refreshToken`, not `body.refresh_token`. No refresh-token expiry is invented; revocation still requires reauthorization.[18]
- `info` validates via the read-only `POST /2/users/get_current_account` with a JSON null argument. It uses connection-local `data.accessToken`, an absolute URL, and account ID metadata rather than credential material. The account ID is stable; email is not a stable identifier.[8][19]
- Token, authorization-code, client-secret, and authorization-header log fields are sanitized using the documented mechanism.[8]

## Validation level and remaining credential/live tests

Offline checks validate JSON and the illustrated scope/token/refresh dependency mappings, not OAuth or Make's serialization. There are no captured tokens or live responses.

Before use, register the developer app, install the sections into a private Make app, bind a test module to this connection, and verify actual authorization/state rejection, callback matching, denial/cancellation, initial token storage, account validation, refresh near expiry, retention of the same refresh token, revoked/expired credentials, and sanitized logs. Confirm that Make sends the intended JSON null argument for `info`. Re-check scope/redirect configuration for the target Make environment; this example assumes the public make.com callback, not a white-label instance. No credential or runtime test has been run.

## Sources

[8] https://developers.make.com/custom-apps-documentation/app-components/connections/oauth2.md
[18] https://docs.dropboxapi.com/dropbox-api/docs/get-started/authorization.md
[19] https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/users/get-current-account.md
