---
name: app-gotchas
description: High-frequency configuration mistakes on Google Sheets, Gmail, Make AI Tools, and IML dates that pass `scenario_create`/`scenario_patch` validation and only fail at run time. Check before finalizing a `config` for one of those.
---

# Common app gotchas

Write-time validation is static: it checks shapes and known option lists, not what the app will do with the
value. Each item below saves cleanly and surfaces only on the first run.

## Google Sheets

- **`valueInputOption` is required on `addRow`/`updateRow`** and lives in `mapper`, not `parameters`. Always
  set `"valueInputOption": "USER_ENTERED"`; on `addRow` also `"insertDataOption": "INSERT_ROWS"`, or writes
  can land on the same fixed row every run.
- **Row values are keyed by zero-based column position** — `"values": {"0": "…", "1": "…"}` — never by
  column letter. Letters do not error; they write to the wrong place. (The app's *own* row-matching filters do
  use letters — a different field, do not cross-apply.)
- **Reading a row's columns** is `` {{1.`0`}} `` (column A), `` {{1.`1`}} `` (column B) — backticked
  zero-based indices. With `includesHeaders: true` header-named fields exist too, but they break when a
  header is renamed. Row metadata: `{{1.__ROW_NUMBER__}}`, `{{1.__SHEET__}}`, `{{1.__SPREADSHEET_ID__}}` —
  the natural way to write back to the row a trigger produced.
- **`spreadsheetId`/`sheetId` are account data.** Resolve them with `module_field_resolve` when `module_spec`
  lists them as `dynamic`; if a lookup is refused, do not guess an id or assume `Sheet1` — state the
  assumption or ask.

## Gmail vs the other Google apps

Gmail (`google-email:*`) authenticates with a **different connection type** than Sheets, Calendar and Drive.
`module_spec`'s `connection.existing` is already scoped per module — read it per module and never tell a user
"you're connected to Google, so Gmail is covered". Note that some Gmail modules name the connection parameter
`account` rather than `__IMTCONN__`; `configurationSchema` says which.

## Make AI Tools (`ai-tools:*`)

`model` is required and has no default. With a Make AI Provider connection use the tier slugs `"small"`,
`"medium"`, `"large"` — a provider model id such as `"gpt-4o-mini"` is rejected. Users without that connection
get the same result from the provider's own app (OpenAI, Anthropic, Gemini) via `connection_create`, which
does take provider model ids. When `module_spec` marks `model` dynamic, resolve it instead of assuming.

## Dates in IML

No `startOfDay()`/`endOfDay()` — build boundaries as `{{formatDate(now; "YYYY-MM-DD")}}T00:00:00Z` and
`…T23:59:59Z`. Everything else about dates is in [IML functions](./iml-functions.md).
