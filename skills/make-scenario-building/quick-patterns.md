---
name: quick-patterns
description: Compressed MCP call chains for common one-shot Make scenarios — Slack message, Google Sheets fetch, Airtable record, email send.
---

# Quick Patterns

Minimum MCP call chains for common one-shot scenarios. Each pattern assumes the user has confirmed the use case and specific apps. Follow the full `make-module-configuring` skill for detailed configuration guidance.

## Send a Slack Message

Goal: Send a direct message to a specific user via Slack.

```
1. connections_list              → Find existing Slack connection (accountName: "slack2")
   - If missing: credential_requests_create → user completes OAuth → credential_requests_get
2. app-module_get                → slack:CreateMessage (outputFormat: "instructions")
3. rpc_execute                   → IMChannels RPC (resolve target user's DM channel ID)
   ⚠ Do NOT use the connection's userId — that's the bot, not the recipient
4. Construct blueprint JSON      → Build blueprint with configured module (see blueprint-construction.md)
5. validate_blueprint_schema     → Validate structure
6. scenarios_create              → Create scenario (blueprint must include metadata)
7. scenarios_activate            → Activate (required before running)
8. scenarios_run                 → Execute
```

## Fetch Google Sheets Data

Goal: Read rows from a Google Sheets spreadsheet.

```
1. connections_list              → Find existing Google connection (accountName: "google")
   - If missing: credential_requests_create with required scopes → user completes OAuth
2. app-module_get                → google-sheets:getRows or google-sheets:SearchRows (instructions format)
3. rpc_execute                   → Spreadsheets RPC (resolve spreadsheet ID by name)
4. rpc_execute                   → Sheets RPC (resolve sheet/tab within spreadsheet)
5. Construct blueprint JSON      → Build blueprint with configured module (see blueprint-construction.md)
6. validate_blueprint_schema → scenarios_create → scenarios_activate → scenarios_run
```

## Create an Airtable Record

Goal: Add a new record to an Airtable base.

```
1. connections_list              → Find existing Airtable connection (accountName: "airtable")
2. app-module_get                → airtable:ActionCreateRecord (instructions format)
3. rpc_execute                   → Bases RPC (resolve base ID)
4. rpc_execute                   → Tables RPC (resolve table ID within base)
5. Construct blueprint JSON      → Build blueprint with configured module + mapper fields (see blueprint-construction.md)
6. validate_blueprint_schema → scenarios_create → scenarios_activate → scenarios_run
```

## Send an Email via Gmail

Goal: Send an email to a specific recipient via Gmail.

```
1. connections_list              → Find existing Google connection (accountName: "google")
   - Verify scopes include Gmail send permission
2. app-module_get                → google-email:ActionSendEmail (instructions format)
3. Construct blueprint JSON      → Build blueprint with mapper (to, subject, body) (see blueprint-construction.md)
4. validate_blueprint_schema → scenarios_create → scenarios_activate → scenarios_run
```

## Google Sheets → Make AI Tools → Google Sheets (read + enrich + update)

Goal: Watch new rows, send a column value to AI, write the AI response back to the same row.

```
1. connections_list              → Find Google connection (accountName: "google")
   - If missing: credential_requests_create → user completes OAuth → credential_requests_get
2. connections_list              → Find AI Provider connection (accountName: "ai-provider" or similar)
   - If missing: credential_requests_create for ai-provider → user completes OAuth
3. app-module_get                → google-sheets:watchRows (outputFormat: "instructions")
4. rpc_execute                   → Spreadsheets RPC (resolve spreadsheet ID)
5. rpc_execute                   → Sheets RPC (resolve sheet tab ID)
6. app-module_get                → ai-tools:Ask (outputFormat: "instructions")
   ⚠ Do NOT call RpcGetModels — it fails via MCP. Use tier names: "low", "medium", "high"
7. app-module_get                → google-sheets:updateRow (outputFormat: "instructions")
8. Construct blueprint JSON      → Build blueprint with all three modules (see blueprint-construction.md):
   - watchRows                   → parameters: connection, spreadsheetId, sheetId, includesHeaders: true, limit, tableFirstRow
   - ai-tools:Ask                → parameters.model: "medium", mapper.input: "{{1.`0`}}" (column A, 0-based backtick index)
   - updateRow                   → mapper.rowNumber: "{{1.__ROW_NUMBER__}}", mapper.valueInputOption: "USER_ENTERED"
9. validate_blueprint_schema → scenarios_create → scenarios_activate
```

**Key configuration values:**

```javascript
// Module 1: google-sheets:watchRows
parameters: {
  __IMTCONN__: <google_connection_id>,
  mode: "fromAll",
  spreadsheetId: "<spreadsheet_id>",
  sheetId: "<sheet_name>",
  includesHeaders: true,
  tableFirstRow: "A1:Z1",
  limit: 2
}
mapper: {}

// Module 2: ai-tools:Ask
parameters: {
  makeConnectionId: <ai_provider_connection_id>,
  model: "medium"   // tier name — NOT a model ID like "gpt-4o-mini"
}
mapper: {
  input: "{{1.`0`}}"   // column A — 0-based backtick-quoted numeric index
}

// Module 3: google-sheets:updateRow
parameters: {
  __IMTCONN__: <google_connection_id>
}
mapper: {
  mode: "fromAll",
  spreadsheetId: "<spreadsheet_id>",
  sheetId: "<sheet_name>",
  rowNumber: "{{1.__ROW_NUMBER__}}",
  includesHeaders: true,
  useColumnHeaders: true,
  valueInputOption: "USER_ENTERED",   // required — omitting breaks date/number formatting
  values: {
    "undefined": "{{2.answer}}"        // column B (no header) — key is "undefined" when header is blank
  }
}
```

**Gotchas:**
- Column references use `{{1.\`0\`}}` — 0-based, backtick-quoted. NOT `{{1.1}}` or `{{1.jan}}`.
- `model: "medium"` for Make AI Provider — `RpcGetModels` fails via MCP; use tier names directly.
- `valueInputOption: "USER_ENTERED"` in updateRow mapper — mandatory for correct value formatting.
- Columns without headers get `"undefined"` as their key in the `values` object.

## Common Tail Sequence

Every pattern ends with the same deployment steps:

```
validate_blueprint_schema → scenarios_create → scenarios_activate → scenarios_run
```

- `scenarios_create` requires blueprint `metadata` — always include the metadata block (see blueprint-construction.md)
- `scenarios_activate` is mandatory before `scenarios_run` — newly created scenarios are inactive
- Always provide the scenario URL to the user after creation
