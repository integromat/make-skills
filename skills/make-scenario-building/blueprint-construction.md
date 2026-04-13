---
name: blueprint-construction
description: Reference for building scenario blueprints programmatically — JSON structure, module fields, filters, mapper expressions, and deployment checklist.
---

# Blueprint Construction

Guidelines for building scenario blueprints programmatically via MCP tools.

## Blueprint Structure

Every blueprint is a JSON object with top-level keys: `name`, `flow` (array of modules), and `metadata` (scenario settings).

See [examples/full-blueprint.json](./examples/full-blueprint.json) for a complete webhook → parse → Google Sheets blueprint.

The `flow` array contains modules executed in sequence. Each module can have nested flows via `routes` (for routers) or `onerror` (for error handlers).

## Module Structure

```json
{
  "id": 1,
  "module": "namespace:ModuleName",
  "version": 1,
  "parameters": {},
  "mapper": {},
  "filter": null,
  "metadata": {
    "designer": { "x": 0, "y": 0, "name": "Display Name" }
  }
}
```

### Required Fields

- **id** — Unique positive integer. Assign sequentially starting from 1.
- **module** — Full identifier: `namespace:ModuleName` (e.g., `google-sheets:watchRows`, `builtin:BasicRouter`, `json:ParseJSON`).
- **version** — Integer matching the app version from `app-modules_list`. Always verify via the MCP tool.

## Key Rules

- **Webhook hooks**: Do not pass a `hook` object with `type: "create"` inside `parameters` for `gateway:CustomWebHook`. Leave `parameters` empty — the webhook must be configured separately after scenario creation.
- **Module parameters**: Parameters and mapper SHOULD be fully populated during blueprint construction. Use `app-module_get` (instructions format) to discover required fields, `rpc_execute` to load dynamic options (spreadsheet lists, calendar lists, channel lists), and `connections_list` to get connection IDs. Only leave fields empty when the value genuinely cannot be determined at build time.
- **Module version**: Always specify the correct `version` matching the app version from `app-modules_list`.
- **Flow IDs**: Assign sequential integer IDs starting from 1. Each module in the flow needs a unique ID.
- **Designer metadata**: Include `metadata.designer` with `x` and `y` coordinates (increment x by 300 per module for horizontal layout).
- **Aggregator `feeder` parameter**: When using `builtin:BasicAggregator` or `util:TextAggregator`, the `feeder` property (which links the aggregator to its source iterator/feeder module) goes **inside `parameters`**, not as a top-level module property. The value is the `id` of the source module that feeds bundles into this aggregator. Example:
  ```json
  {
    "id": 3,
    "module": "builtin:BasicAggregator",
    "version": 1,
    "parameters": { "feeder": 2 },
    "mapper": {"properties": {}},
    "metadata": {"designer": {"x": 600, "y": 0}}
  }
  ```

### Parameters vs Mapper

- **parameters** — Fixed configuration values (connection settings, selected accounts, static options). Leave as `{}` for modules that require post-creation configuration.
- **mapper** — Dynamic field mappings using template expressions. Maps output from previous modules to current module inputs.

## Designer Coordinates

Include `metadata.designer` with `x` and `y` coordinates for visual layout in the Make designer.

**Convention:**
- **x** — Increment by 300 per module in the horizontal flow direction.
- **y** — 0 for the main flow. Offset by 150–300 per route branch for routers.

**Linear flow example:**
```
Module 1: x=0,   y=0
Module 2: x=300, y=0
Module 3: x=600, y=0
```

**Router with branches:**
```
Router:   x=600, y=450
Route 1:  x=900, y=0
Route 2:  x=900, y=300
Route 3:  x=900, y=600
Route 4:  x=900, y=900
```

## Filter Conditions

Filters control which bundles pass through to a module. A filter has a `name` and `conditions`.

### Condition Structure

Conditions use a nested array structure: outer array = OR groups, inner array = AND conditions within each group.

```json
{
  "filter": {
    "name": "Only active high-priority",
    "conditions": [
      [
        { "a": "{{1.status}}", "b": "ACTIVE", "o": "text:equal:ci" },
        { "a": "{{1.priority}}", "b": "high", "o": "text:equal" }
      ]
    ]
  }
}
```

Each condition object has:
- **a** — Left operand (typically a reference like `{{moduleId.fieldName}}`)
- **b** — Right operand (comparison value, optional for some operators)
- **o** — Operator string

### Common Operators

| Operator          | Description                          |
|-------------------|--------------------------------------|
| `text:equal`      | Exact text match                     |
| `text:equal:ci`   | Case-insensitive text match          |
| `text:contain`    | Text contains substring              |
| `text:notequal`   | Text does not equal                  |
| `text:startswith` | Text starts with                     |
| `text:endswith`   | Text ends with                       |
| `number:equal`    | Numeric equality                     |
| `number:greater`  | Greater than                         |
| `number:less`     | Less than                            |
| `boolean:equal`   | Boolean equality                     |
| `date:before`     | Date is before                       |
| `date:after`      | Date is after                        |
| `exist`           | Value exists (no `b` needed)         |
| `notexist`        | Value does not exist (no `b` needed) |

### Multiple OR Groups

To match bundles where status is ACTIVE **or** priority is urgent:

```json
{
  "conditions": [
    [ { "a": "{{1.status}}", "b": "ACTIVE", "o": "text:equal" } ],
    [ { "a": "{{1.priority}}", "b": "urgent", "o": "text:equal" } ]
  ]
}
```

## Mapper Expression Patterns

Mapper values use double-brace template expressions to reference data from previous modules.

### Reference Syntax

| Pattern                   | Description                 | Example                           |
|---------------------------|-----------------------------|-----------------------------------|
| `{{id.field}}`            | Module output field         | `{{1.email}}`                     |
| `{{id.\`col\`}}`          | Spreadsheet column by index | `{{1.\`0\`}}`                     |
| `{{id.field[].subfield}}` | Array iteration             | `{{1.choices[].message.content}}` |
| `{{id.__IMTLENGTH__}}`    | Bundle count from module    | `{{6.__IMTLENGTH__}}`             |
| `{{id.__ROW_NUMBER__}}`   | Row number (Sheets)         | `{{1.__ROW_NUMBER__}}`            |
| `{{function(args)}}`      | Built-in function call      | `{{split(1.\`1\`; space)}}`       |
| `{{now}}`                 | Current timestamp           | `{{now}}`                         |
| `{{random}}`              | Random number (0-1)         | `{{random}}`                      |

### Common Functions

- `split(value; delimiter)` — Split string into array
- `formatDate(date; format)` — Format date (e.g., `"YYYY-MM-DD"`)
- `floor(number)` — Round down
- `length(array)` — Array length
- `lower(text)` — Lowercase
- `upper(text)` — Uppercase
- `trim(text)` — Trim whitespace
- `toString(value)` — Convert to string

## Router Patterns

Routers distribute bundles across multiple routes. Each route has its own flow of modules.

See [examples/router-pattern.json](./examples/router-pattern.json) for a router with Facebook and Twitter routes filtered by platform tag.

Multiple routes can fire for the same bundle — routers are not mutually exclusive.

## If-Else Branching Pattern

If-Else branching uses two consecutive modules in the top-level `flow`: `builtin:BasicIfElse` immediately followed by `builtin:BasicMerge`. Branch subflows are nested inside the If-Else module's `branches` array — they do **not** appear in the top-level flow. See [Branching](./branching.md) for full details.

### Router vs If-Else Decision Guide

|                            | Router                    | If-Else                  |
|----------------------------|---------------------------|--------------------------|
| Multiple branches can fire | Yes                       | No — first match only    |
| Can merge back             | No                        | Yes (via Merge module)   |
| Use case                   | Parallel processing paths | Mutually exclusive logic |

**Choose If-Else + Merge when:**
- Branches are mutually exclusive (only one should run per bundle)
- Branches need to converge into shared downstream modules
- The logic follows "if A, do X; else if B, do Y; else do Z"

**Choose Router when:**
- Multiple routes can fire for the same bundle
- Routes are independent endpoints with no shared follow-up

See [examples/if-else-pattern.json](./examples/if-else-pattern.json) for the If-Else module paired with a Merge module (both `if_else_module` and `merge_module` keys).

Each branch requires:
- **`type`** — `"condition"` (with `conditions`) or `"else"` (fallback, no conditions)
- **`merge`** — `true` to converge back via the Merge module
- **`conditions`** — OR/AND condition arrays (same format as filters). Only on `"condition"` type branches.
- **`flow`** — Array of modules for this branch

The Merge module requires:
- **`filters`** — Array with one entry per branch (use `null` for no filter). Must match branch count.
- **`outputs`** — Array of output definitions (typically `[]`)

The If-Else evaluates conditions in order, runs the first matching branch's subflow, then continues with the Merge module. Modules after Merge execute regardless of which branch was taken.

## Iterator and Aggregator Pairs

For processing arrays item-by-item, use a Feeder → processing → Aggregator pattern.

```json
{ "id": 15, "module": "builtin:BasicFeeder", "version": 1,
  "mapper": { "array": "{{split(1.`1`; space)}}" } }
```

After processing, collect results with `feeder` inside `parameters` (see Key Rules above):

```json
{ "id": 16, "module": "builtin:BasicAggregator", "version": 1,
  "parameters": { "feeder": 15 },
  "mapper": { "properties": { "email": "{{15.value}}" } } }
```

The `feeder` value is the source module's ID. It must be inside `parameters` — placing it as a top-level module property is ignored by the runtime.

Text aggregation uses `util:TextAggregator` — same `feeder` pattern:

```json
{ "id": 10, "module": "util:TextAggregator", "version": 1,
  "parameters": { "feeder": 8, "rowSeparator": "\n" },
  "mapper": { "value": "{{8.description}}" } }
```

### Aggregator Metadata

Aggregators benefit from `metadata.restore.extra` which tells the Make UI which source module feeds them. Without it the aggregator works at runtime but the designer won't display the source module label correctly.

```json
{
  "metadata": {
    "expect": [{"name": "value", "type": "text", "label": "Text"}],
    "restore": {
      "extra": {
        "feeder": {
          "label": "<Module Name> - <Module Name> [<module ID>]"
        }
      },
      "parameters": {
        "rowSeparator": { "label": "New row" }
      }
    },
    "designer": { "x": 600, "y": 0, "name": "Text Aggregator" }
  }
}
```

- **`restore.extra.feeder.label`** — Human-readable label for the source module (displayed in the aggregator's "Source Module" dropdown in the designer). Format: `"<Module Name> - <Module Name> [<module ID>]"` — e.g., `"Search Events - Search Events [1]"`.
- **`restore.parameters`** — Labels for parameter values (e.g., row separator display name).
- **`expect`** — Declares the aggregator's input fields. For `util:TextAggregator`, this is typically `[{"name": "value", "type": "text", "label": "Text"}]`.

## Global Scenario Metadata

The top-level `metadata` object configures scenario execution settings. Set defaults when creating blueprints:

```json
{
  "metadata": {
    "instant": false,
    "version": 1,
    "scenario": {
      "roundtrips": 1,
      "maxErrors": 3,
      "autoCommit": true,
      "autoCommitTriggerLast": true,
      "sequential": false,
      "slots": null,
      "confidential": false,
      "dataloss": false,
      "dlq": false,
      "freshVariables": false
    },
    "designer": {
      "orphans": []
    },
    "zone": "eu2.make.com"
  }
}
```

Key fields:
- **instant** — `true` if using an instant trigger (webhooks)
- **roundtrips** — Number of execution cycles per run
- **maxErrors** — Error threshold before stopping.

## Scenario URLs

After creating a scenario, provide the user with a direct link to edit it in the Make designer:

```
https://{zone}/{teamId}/scenarios/{scenarioId}/edit
```

- **zone** — The Make.com datacenter zone (e.g., `eu2.make.com`), from the organization's `zone` field.
- **teamId** — The team ID (integer) where the scenario was created. **Not** the organization ID.
- **scenarioId** — The scenario ID returned by `scenarios_create`.

Example: `https://eu2.make.com/12345/scenarios/8879767/edit`

## Connection Parameters

Modules that connect to external services require a connection parameter with the connection ID. The most common field name is `__IMTCONN__`, but some modules use different names (e.g., `makeConnectionId` for `ai-tools:Ask`). Always verify the exact field name from `app-module_get` instructions output.

Look up existing connections via `connections_list` and place the ID in `parameters`:

```json
{
  "parameters": {
    "__IMTCONN__": 12345
  }
}
```

Without a valid connection parameter, the scenario will be marked `isinvalid: true` and cannot be activated.

The `metadata.parameters` arrays are set by Make.com and store UI state for the designer. Populate `metadata.restore` only for aggregators (see [Aggregator Metadata](#aggregator-metadata) above).

## Configuring Modules via RPC

Most modules have dynamic fields that require RPC calls to populate (e.g., selecting a spreadsheet, a calendar, a Slack channel). The pattern:

### RPC Discovery Pattern

1. **Read the module schema**: Call `app-module_get` with `outputFormat: "instructions"` to get the full input interface.
2. **Find RPC hints**: The instructions will indicate which fields load their options dynamically (e.g., "select a spreadsheet" with an RPC endpoint).
3. **Call `rpc_execute`**: Execute the RPC to get the list of options. Always include `__IMTCONN__` in the `data` parameter with the connection ID.
4. **Use the returned values**: Place the selected value in the correct domain (`parameters` for static selections, `mapper` for dynamic values).

### Chained RPCs

Some modules require a chain of RPC calls where each selection narrows the next:

```
List spreadsheets → Select one → List sheets within it → Select one → Get column headers
```

Each RPC in the chain requires the results of the previous one. Pass prior selections in the `data` parameter alongside `__IMTCONN__`.

### RPC Data Fields

The `data` parameter for `rpc_execute` must always include:
- **`__IMTCONN__`** — The connection ID (required for any RPC that talks to an external service)
- **Previous selections** — Any upstream RPC results that narrow the current query (e.g., `spreadsheetId` when listing sheets)

See `make-module-configuring/general-principles.md` for the full 5-phase configuration workflow including RPC resolution.

## Common Configuration Gotchas

### Google Sheets: Mode Selection
When using Google Sheets modules with `mode: "select"` and `from: "drive"`, the `spreadsheetId` must be prefixed with `/`:
- Correct: `"/1abc123def456"`
- Incorrect: `"1abc123def456"`

Parameters for `watchRows`/`updateRow`/`addRow` in select mode — all go in `parameters` (not `mapper`):
- `mode` — `"select"`
- `from` — `"drive"`
- `spreadsheetId` — `/`-prefixed drive file ID
- `sheetId` — Sheet tab identifier
- `includesHeaders` — Boolean
- `limit` — Row limit (for triggers)
- `tableFirstRow` — First data row

Only use `mode: "map"` as a fallback when RPC-based selection is unavailable.

### Google Calendar: `duration` Field
The `duration` field in Google Calendar modules can cause IML errors when used with expressions. Prefer using the `end` field with an IML function instead:
```
{{addHours(start; 1)}}
```

Always provide either `end` OR `duration`, never neither. If using `end`, compute it from `start` using IML date functions.

### IML Date Functions
- `addHours(date; N)` — Add N hours to a date
- `addMinutes(date; N)` — Add N minutes to a date
- `addDays(date; N)` — Add N days to a date
- `formatDate(date; "YYYY-MM-DD")` — Format a date string

## Common Module Reference

### Triggers
| Module                         | Description                    |
|--------------------------------|--------------------------------|
| `gateway:CustomWebHook`        | Receive webhook HTTP requests  |
| `google-sheets:watchRows`      | Watch for new spreadsheet rows |
| `google-email:TriggerNewEmail` | Watch for new emails           |

### Utility
| Module                    | Description                                         |
|---------------------------|-----------------------------------------------------|
| `builtin:BasicRouter`     | Route bundles to multiple paths (cannot merge back) |
| `builtin:BasicIfElse`     | Mutually exclusive branching (can merge back)       |
| `builtin:BasicMerge`      | Converge If-Else branches into single flow          |
| `builtin:BasicFeeder`     | Iterate over an array                               |
| `builtin:BasicAggregator` | Collect bundles into one                            |
| `json:ParseJSON`          | Parse a JSON string                                 |
| `util:TextAggregator`     | Concatenate text from bundles                       |
| `util:SetVariable`        | Set a scenario variable                             |
| `util:FunctionSleep`      | Pause execution                                     |
| `http:ActionSendData`     | Make HTTP requests                                  |

### AI / LLM
| Module             | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `ai-tools:Ask`     | Make AI Toolkit — Simple Text Prompt (connection field: `makeConnectionId`) |

> **Note:** `ai-tools:Ask` uses `makeConnectionId` instead of `__IMTCONN__` for its connection parameter. The connection type is `ai-provider` and model values are abstract sizes like `"large"`.

### Make AI Tools: Model Parameter

The `ai-tools:Ask` module (and other Make AI Toolkit modules) use abstract model **tier names**,
not provider-specific model IDs. The `model` parameter goes in `parameters` (static), not `mapper`.

**`model` is required — there is no default.** Omitting it causes a 400 error at runtime. Do not use provider-specific model IDs (e.g., `"gpt-4o-mini"`, `"claude-sonnet-4-5"`) with the Make AI Provider — only tier names are valid.

Known tier values for `"makeConnectionId"` with Make's AI Provider (`ai-provider`):
| Value | Label | Description |
|-------|-------|-------------|
| `"low"` | Small/Fast model | Lightweight, fast, cheap — simple classification tasks |
| `"medium"` | Medium model | Balanced — most text generation use cases (default choice) |
| `"high"` | Large/Powerful model | Complex reasoning, long outputs |

The `RpcGetModels` RPC that normally populates this list **fails via MCP** due to an org-context
limitation. Always use the tier names above directly — do not attempt to resolve the RPC.

```json
{
  "id": 2,
  "module": "ai-tools:Ask",
  "version": 2,
  "parameters": {
    "makeConnectionId": "<connection_id>",
    "model": "medium"
  },
  "mapper": {
    "input": "{{1.`0`}}"
  }
}
```

For custom AI provider connections (OpenAI, Anthropic), the model values are provider-specific
IDs (e.g., `"gpt-4o-mini"`, `"claude-3-haiku-20240307"`). Only the Make AI Provider uses tiers.

**Fallback when Make AI Provider is unavailable:** If the user has no `ai-provider` connection (or cannot create one due to plan limitations), check `connections_list` for alternative AI provider connections and use the corresponding app-specific module instead of `ai-tools:Ask`:

| Connection `accountName` | App module alternative | Model ID format |
|---|---|---|
| `openai-gpt-3` | `openai:CreateChatCompletion` | Provider-specific: `"gpt-4o"`, `"gpt-4o-mini"` |
| `anthropic-claude` | Anthropic app modules | Provider-specific: `"claude-sonnet-4-5"`, `"claude-haiku-4-5"` |
| `gemini-ai-*` | Gemini app modules | Provider-specific: `"gemini-2.0-flash"`, `"gemini-1.5-pro"` |

These modules use `__IMTCONN__` (not `makeConnectionId`) and accept provider-specific model IDs. Call `app_modules_list` for the specific app to discover available modules and `app-module_get` for configuration details.

### Google Sheets: `valueInputOption` for Write Modules

**`valueInputOption` (updateRow / addRow):** Always set `"valueInputOption": "USER_ENTERED"` in
the `mapper` for write modules. This tells Google Sheets to interpret values as if typed by a user
(numbers as numbers, dates as dates, formulas evaluated). Without it, values default to raw string
insertion which can break date/number formatting. `"RAW"` is only appropriate when you explicitly
want to prevent formula evaluation.

### Error Directives
| Module             | Description                   |
|--------------------|-------------------------------|
| `builtin:Resume`   | Resume with fallback output   |
| `builtin:Commit`   | Commit and stop               |
| `builtin:Rollback` | Rollback all operations       |
| `builtin:Ignore`   | Ignore error and continue     |
| `builtin:Break`    | Move to incomplete executions |

## Deployment Checklist

After constructing a blueprint, follow this sequence to deploy and run it:

1. **Validate the blueprint** — call `validate_blueprint_schema` to catch structural errors before submission. Note: this validator checks the static blueprint schema but may reject valid module-specific properties (e.g., aggregator `metadata.expect` or `metadata.restore` fields) that the runtime accepts. If validation fails on metadata or module-specific fields that you know are correct from working examples, proceed with `scenarios_create` — the runtime is the authoritative validator.

2. **Ensure `metadata` is present** — `scenarios_create` **requires** a top-level `metadata` object. Add the default metadata block (see [Global Scenario Metadata](#blueprint-structure) above for the full structure). At minimum include:
```json
{
   "metadata": {
     "version": 1,
     "scenario": {
       "roundtrips": 1,
       "maxErrors": 3,
       "autoCommit": true,
       "autoCommitTriggerLast": true,
       "sequential": false,
       "confidential": false,
       "dataloss": false,
       "dlq": false,
       "freshVariables": false
     },
     "designer": { "orphans": [] }
   }
}
```

3. **Validate module parameters** — for each module that has parameters, call `validate_module_configuration` with the module's app, version, and parameter values. This catches type mismatches (e.g., boolean `false` vs string `"false"`), missing required fields, and invalid enum values that `validate_blueprint_schema` does not check. See Phase 5 in make-module-configuring for the full validation workflow.

4. **Create the scenario** — call `scenarios_create` with the validated blueprint.

5. **Configure scheduling** — call `scenario_scheduling_update` with the appropriate scheduling object:
   - **Webhook / instant trigger** (first module is `gateway:CustomWebHook` or any module with `listener: true`): use `{"type": "immediately"}`. **Do not use `"indefinitely"`** — it causes activation to fail with "Invalid interval."
   - **Polling / scheduled trigger**: use `{"type": "indefinitely", "interval": <seconds>}` (minimum 900 for most accounts).
   - **One-time scheduled run**: use `{"type": "once", "date": "<ISO 8601 datetime>"}`. The `date` field requires **full ISO 8601 datetime** format — e.g., `"2026-04-11T09:00:00.000Z"`. A date-only string like `"2026-04-11"` fails with "should match format date-time".
   - **On-demand / manual**: omit scheduling or use `{"type": "on-demand"}`.

6. **Activate the scenario** — newly created scenarios are **inactive** by default. Call `scenarios_activate` before attempting to run. Running an inactive scenario will fail.

7. **Run and verify the scenario** — call `scenarios_run` to execute immediately. Then call `executions_list` followed by `executions_get` on the latest execution to confirm `status: 1` (success). If `status: 3` (error), diagnose via `error.message` and `error.causeModule`, fix the blueprint, and re-deploy using the deactivate → `scenarios_update` → activate → run cycle. See SKILL.md Phase 2 Step 6 for the full procedure.

8. **Provide the scenario URL** — format: `https://<zone>.make.com/<teamId>/scenarios/<scenarioId>` (uses team ID, not organization ID)

## Official Documentation

- [Scenario Settings](https://help.make.com/scenario-settings)
