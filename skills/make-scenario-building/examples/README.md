# Examples — complete `scenario_create` arguments

Each file is the full argument object of one `scenario_create` call in the canonical shape: a flat `modules`
list with `root`/`follows`/`parent` placement and one `config` per module. They show the *shape* of a pattern
and are not ready to send:

1. **Account ids are placeholders** — `teamId`, every connection id (`__IMTCONN__`, `account`,
   `makeConnectionId`), spreadsheet and channel ids. Real ones come from `environment_get`, `module_spec`'s
   `connection.existing`, and `module_field_resolve`.
2. **Confirm module names, versions and field names with `module_spec(schemas: true)`** — its
   `configurationSchema` is authoritative; app versions move.
3. **`config.data` cursors are never hand-written** — the polling examples show what `module_field_resolve`
   returns at `/data`; copy the option `value` it gives you.
4. **Webhook payload fields** (`{{1.name}}` on a `gateway:CustomWebHook`) exist only after a real request —
   in practice that pattern is two calls (SKILL.md, "A webhook whose payload is unknown").

Files: `webhook-to-google-sheets`, `polling-sheets-ai-update-row`, `router-fanout`, `if-else-merge`,
`iterator-aggregator`, `error-handler`, `ai-agent-with-tool`, `on-demand-subscenario`.
