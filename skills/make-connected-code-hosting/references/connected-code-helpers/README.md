# Connected Code helpers

Helper documentation and examples for Make Connected Code.

- [Connection reference](docs/connection-reference.md) explains the `connection` capability, relative `connection.fetch(...)`, supported connection types, request bases, and native SQL/Email helpers.
- [Examples](examples/) contains small JavaScript snippets for HTTP, OAuth, SQL, Email, Gmail, Sage, Baserow, and Cerebras patterns.

Current reference is synced to the Connected Code 1.2.2 catalog with 159 apps.

Connected Code keeps secrets in the Make connection/keychain and proxy sandbox. Prefer relative `connection.fetch('/path', { query, json, headers })`, `connection.sql.query(...)`, and `connection.email.*` over passing hostnames, tokens, passwords, or connection strings in user code. Use `connection.template(fieldName)` only for rare custom placement, such as an API that requires a bearer prefix in a header not already modeled by the selected credential.

Helper support is App-specific: Gmail and both Sage Apps use `connection.fetch(...)`; only the generic Email App uses the SMTP/IMAP `connection.email.*` broker. See the [broker mismatch troubleshooting section](docs/connection-reference.md#troubleshooting-broker-is-not-configured-for-this-connection) for the `Broker is not configured for this connection` error.
