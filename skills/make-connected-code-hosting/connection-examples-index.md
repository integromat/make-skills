# Connected Code example index

These snippets are vendored unchanged from `MAKESEB/connected-code-helpers`. Copy the file body directly into the Connected Code editor. They use top-level `await`/`return` because Connected Code supplies the async wrapper.

## Selected service Apps

| App/pattern | Example |
| --- | --- |
| Baserow account-scoped request | [baserow-account.js](./references/connected-code-helpers/examples/baserow-account.js) |
| Cerebras model discovery | [cerebras-models.js](./references/connected-code-helpers/examples/cerebras-models.js) |
| Gmail list unread | [gmail-list-unread.js](./references/connected-code-helpers/examples/gmail-list-unread.js) |
| Gmail send | [gmail-send.js](./references/connected-code-helpers/examples/gmail-send.js) |
| Google OAuth-style request | [google-oauth.js](./references/connected-code-helpers/examples/google-oauth.js) |
| Microsoft OAuth-style request | [microsoft-oauth.js](./references/connected-code-helpers/examples/microsoft-oauth.js) |
| Sage Business Cloud Accounting businesses | [sage-accounting-businesses.js](./references/connected-code-helpers/examples/sage-accounting-businesses.js) |
| Sage Intacct query | [sage-intacct-query.js](./references/connected-code-helpers/examples/sage-intacct-query.js) |

## Native brokers

| Broker | Example |
| --- | --- |
| Generic Email search | [email-search.js](./references/connected-code-helpers/examples/email-search.js) |
| Generic Email send | [email-send.js](./references/connected-code-helpers/examples/email-send.js) |
| MySQL parameterized query | [mysql-query.js](./references/connected-code-helpers/examples/mysql-query.js) |
| PostgreSQL parameterized query | [postgres-query.js](./references/connected-code-helpers/examples/postgres-query.js) |

Gmail does not use the generic Email broker. Sage does not use the SQL broker. Use the selected service App and `connection.fetch(...)` for those examples.

## Generic HTTP App credentials

| Credential pattern | Example |
| --- | --- |
| API key configured in the HTTP credential | [http-api-key.js](./references/connected-code-helpers/examples/http-api-key.js) |
| Extra non-secret request header | [http-api-key-manual-header.js](./references/connected-code-helpers/examples/http-api-key-manual-header.js) |
| Custom bearer placement with `connection.template(...)` | [http-api-key-bearer-template.js](./references/connected-code-helpers/examples/http-api-key-bearer-template.js) |

Prefer auth placement configured by the Make credential. Use `connection.template(fieldName)` only when the API requires custom placement that the credential cannot express.
