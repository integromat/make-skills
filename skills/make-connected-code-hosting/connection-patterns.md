# Connection patterns

Use this reference to choose the safest code access pattern for a Connected Code scenario.

## Selection rule

Choose the narrowest capability that matches the task:

| Task shape | Use |
| --- | --- |
| Generic HTTP API with a known base URL | HTTP App + `httpBaseUrl` + HTTP credential |
| Supabase REST | Supabase connection or HTTP App scoped to the project URL |
| Postgres database query | Postgres app + `connection.sql.query(...)` |
| Webhook payload transform with no external call | No connection; code reads `input` only |

The user creates or selects credentials in the Make editor. The agent never asks for raw secrets in chat.

## HTTP App

HTTP App is the generic fallback for APIs that have a stable base URL and standard auth. The module should include:

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
const table = input.table || 'items';
const response = await connection.fetch(`/rest/v1/${table}`, {
  method: 'GET',
  query: { select: '*', limit: input.limit || 10 }
});
const text = await response.text();
if (!response.ok) throw new Error(`Supabase request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
```

Do not put anon keys, service keys, project passwords, or Authorization headers in the scenario input or code.

## Postgres helper

Postgres uses a native helper. Code supplies only SQL and parameters; host, port, database, user, password, and TLS stay in the Make connection/proxy boundary.

```js
const result = await connection.sql.query(
  'select id, created_at from public.events order by created_at desc limit $1',
  [input.limit || 5]
);
return { rows: result.rows, rowCount: result.rowCount };
```

Use parameterized queries. Do not concatenate untrusted values into SQL.

## No external connection

For pure webhook or scheduled transformations, use no connection. Map webhook or schedule data into `input`, transform it in code, and return JSON.

See [examples/webhook-normalize.js](./examples/webhook-normalize.js).
