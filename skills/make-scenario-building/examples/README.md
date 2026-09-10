# Examples — complete `scenario_create` arguments

Each file is the full argument object of one `scenario_create` call in the canonical shape: a flat `modules`
list with `root`/`follows`/`parent` placement and one `config` object per module. They show the *shape* of
each pattern; they are not ready to send.

Before adapting one:

1. **Ids that belong to an account are placeholders** — `teamId`, every connection id (`__IMTCONN__`,
   `account`, `makeConnectionId`), spreadsheet and channel ids. Take real ones from `environment_get`,
   `module_spec`'s `connection.existing`, and `module_field_resolve`.
2. **Confirm module names, versions, and field names with `module_spec(schemas: true)`** for the modules you
   actually use — app versions move, and a field name here may not match the current manifest. The
   `configurationSchema` it returns is authoritative; these files are illustrations.
3. **Epoch cursors (`config.data`) are never hand-written** — the one in the polling example is what
   `module_field_resolve` at path `/data` returns; copy the option `value` it gives you.
4. **Webhook payload fields** (`{{1.name}}` on a `gateway:CustomWebHook`) are only known after a real request
   has arrived. In practice that pattern is two calls — see the SKILL.md webhook workflow.

| File | Pattern |
|---|---|
| [webhook-to-google-sheets.json](./webhook-to-google-sheets.json) | Instant trigger → one action; `immediately` schedule; `restore` labels |
| [polling-sheets-ai-update-row.json](./polling-sheets-ai-update-row.json) | Polling trigger with a resolved `data` cursor → AI step → write back to the same row |
| [router-fanout.json](./router-fanout.json) | Router with two filtered arms; a chain inside an arm |
| [if-else-merge.json](./if-else-merge.json) | If-else with an else arm, both rejoining at a merge, then a shared step |
| [iterator-aggregator.json](./iterator-aggregator.json) | Iterate an array field, act per item, aggregate back to one bundle |
| [error-handler.json](./error-handler.json) | An error-handler arm that notifies and then `Break`s with retries |
| [ai-agent-with-tool.json](./ai-agent-with-tool.json) | Webhook → AI agent with one tool arm → webhook response |
| [on-demand-subscenario.json](./on-demand-subscenario.json) | `StartSubscenario` → step → `ReturnData` with a declared interface |
