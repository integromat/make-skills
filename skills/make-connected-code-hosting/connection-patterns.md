# Connection patterns

Use this reference to choose the safest code access pattern for a Connected Code scenario.

## Selection rule

Choose the narrowest capability that matches the task:

| Task shape | Use |
| --- | --- |
| Provider exists in the Connected Code App catalog | Select that service App and use `connection.fetch(...)` unless the catalog marks it as a native SQL/Email broker. |
| Generic HTTP API with a known base URL | HTTP App + `httpBaseUrl` + HTTP credential |
| Supabase REST | Supabase connection or HTTP App scoped to the project URL |
| PostgreSQL or MySQL database query | Matching database App + `connection.sql.query(...)` |
| SMTP/IMAP operation | Generic Email App + `connection.email.*` |
| Webhook payload transform with no external call | No connection; code reads `input` only |

The user creates or selects credentials in the Make editor. The agent never asks for raw secrets in chat.

The complete current catalog, request bases, connection types, and copyable examples are vendored from `MAKESEB/connected-code-helpers`:

- [159-app connection reference](./references/connected-code-helpers/docs/connection-reference.md)
- [provider, HTTP, SQL, and Email example index](./connection-examples-index.md)
- [source provenance and hashes](./references/connected-code-helpers/SOURCE.json)

## Selected service Apps

Prefer a selected service App over the generic HTTP App when it exists. The selected App supplies the allowed request base and authentication inside the proxy. User code should use relative paths and must not map OAuth tokens into `input` or construct raw authorization headers.

Examples:

- Gmail: `connection.fetch('/messages', ...)` or `connection.fetch('/messages/send', ...)`
- Sage Business Cloud Accounting: `connection.fetch('/businesses', ...)`
- Sage Intacct: `connection.fetch('/services/core/query', ...)`

Gmail is not the generic Email App. Sage is not a SQL broker. All three examples above are service Apps that use scoped HTTP transport; they are not the special generic HTTP App.

## HTTP App

HTTP App is the generic Connected Code fallback for APIs that have a stable base URL and standard auth. It is considered before leaving Connected Code for the Make API-shell provider-transport fallback. The module should include:

- `connectionType: "http"`
- `httpBaseUrl` set to the allowed prefix
- `credentialType` such as `keychain:apikeyauth`, `keychain:basicauth`, or `account:oauth2`
- `credential` or account binder selected by the user in the editor

Code should prefer relative paths:

```js
const response = await connection.fetch('/items', {
  method: 'GET',
  query: { limit: input.limit || 10 }
});
const text = await response.text();
if (!response.ok) throw new Error(`HTTP request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
```

`httpBaseUrl` is the security boundary. Requests outside it should fail.

## Supabase REST

Supabase REST can be called through a selected Supabase connection or through the HTTP App scoped to the project URL. The secret stays in Make.

```js
const table = String(input.table || 'items').trim();
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
  throw new Error('Invalid Supabase table name');
}
const response = await connection.fetch(`/rest/v1/${table}`, {
  method: 'GET',
  query: { select: '*', limit: input.limit || 10 }
});
const text = await response.text();
if (!response.ok) throw new Error(`Supabase request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
```

Do not put anon keys, service keys, project passwords, or Authorization headers in the scenario input or code.

## SQL broker

PostgreSQL and MySQL use a native helper. Code supplies only SQL and parameters; host, port, database, user, password, and TLS stay in the Make connection/proxy boundary.

```js
const result = await connection.sql.query(
  'select id, created_at from public.events order by created_at desc limit $1',
  [input.limit || 5]
);
return { rows: result.rows, rowCount: result.rowCount };
```

Use parameterized queries. Do not concatenate untrusted values into SQL.

## Generic Email broker

Use `connection.email.send/search/get(...)` only when the module's selected App is the generic Email App with a compatible SMTP/IMAP connection.

```js
await connection.email.send({
  to: input.to,
  subject: input.subject,
  text: input.message
});
return { sent: true };
```

Do not use this helper for Gmail. Gmail is a service App with scoped HTTP transport and uses `connection.fetch(...)`.

## Broker mismatch error

```text
Code execution failed: connection broker failed: 500
{"error":"Broker is not configured for this connection"}
```

This means the code called a native broker helper that the selected App does not support:

- `connection.sql.query(...)` requires PostgreSQL/MySQL.
- `connection.email.*` requires the generic Email App.
- Gmail, Sage Business Cloud Accounting, and Sage Intacct require `connection.fetch(...)`.

Fix the helper/App combination and rerun the module. Adding a Make automatic error-handler route or choosing “Ignore all errors” only masks the configuration defect; it does not configure a broker. If the corrected HTTP call returns `401` or `403`, recheck the selected connection and OAuth scopes instead.

## No external connection

For pure webhook or scheduled transformations, use no connection. Map webhook or schedule data into `input`, transform it in code, and return JSON.

See [examples/webhook-normalize.js](./examples/webhook-normalize.js).
