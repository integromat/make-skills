---
name: make-scenario-building
description: This skill should be used when designing Make scenarios, choosing which modules to use, composing module flows, setting up routing/branching/filtering/iterations/aggregations, building blueprints, deploying scenarios, handling errors, configuring scheduling and triggers, or discussing scenario architecture. Covers WHICH modules to use and WHY — complementary to make-module-configuring which covers HOW to configure each module.
license: MIT
compatibility: Requires a Make.com account with permissions to create scenarios. Works either with shell access and the Make CLI installed/authenticated, or with any agent that supports MCP and has the Make MCP server connected (Claude Code, Cursor, GitHub Copilot, etc.).
metadata:
  author: Make
  version: "0.1.3"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Scenario Building

This skill guides building a scenario in Make. A scenario is an automated workflow composed of modules connected together. Before building anything, Phase 1 below MUST be completed.

## Interface: CLI or MCP

Before invoking any tool in this skill, determine which interface to use.

<!-- variant:cli-start -->
1. **CLI (preferred).** Run `command -v make-cli` (Bash). If found, run `make-cli whoami` to verify authentication. If both succeed, invoke tools via:
   `make-cli <category> <action> --flag=value --output=json`.
2. **MCP (fallback).** If no CLI, check whether the `make` MCP server is connected and call tools natively.
3. **Neither available.** Ask the user to install the Make CLI (`brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`, then `make-cli login`) or to configure the Make MCP server (`https://mcp.make.com`).

All tool names used below (`apps_recommend`, `app-module_get`, `rpc_execute`, `validate_module_configuration`, `extract_blueprint_components`, etc.) exist in both interfaces. See **make-interface-reference** for the full MCP↔CLI mapping and invocation syntax.
<!-- variant:cli-end -->

<!-- variant:mcp-only-start -->
This skill uses the Make MCP server. Tool names referenced below (`apps_recommend`, `app-module_get`, `rpc_execute`, `validate_module_configuration`, `extract_blueprint_components`, etc.) are MCP tools. See **make-interface-reference** for connection setup.
<!-- variant:mcp-only-end -->

## Phase 1: Understand the Business Need & Identify Modules

Phase 1 has three steps. Do not skip or rush any of them.

### Step 1: Clarify the Business Use Case

The first job is to understand exactly what the user wants to automate. Use an adaptive interview approach:

1. **Start conversational.** Ask 1-2 focused questions about what they want to achieve:
   - What task or process do they want to automate?
   - Which systems or services are involved?

2. **Drill deeper based on answers.** Once the basics are clear, clarify:
   - What triggers the automation? (time interval, webhook, manual execution)
   - What data moves between systems and in which direction?
   - Are there any conditions, branching logic, or error handling needs?

3. **If answers are vague, get structured.** Ask explicitly:
   - "What is the source system and what data are you pulling from it?"
   - "What is the destination system and what should happen there?"
   - "Should this run on a schedule, on-demand, or when an event occurs?"

**CRITICAL — Provider disambiguation (MUST follow):** When the user mentions a generic category OR describes a capability without naming a specific app, the agent MUST ask which provider/service they use BEFORE proceeding to Step 2. Never assume a provider.

Common ambiguous categories and their possible providers (non-exhaustive — apply the same logic to any category not listed):
- **Forms/surveys:** Google Forms, Typeform, JotForm, Tally, Microsoft Forms, SurveyMonkey, ...
- **AI/LLM:** OpenAI, Anthropic, Google AI, Make AI, Azure OpenAI, Cohere, ...
- **Email:** Gmail, Outlook, SendGrid, Mailchimp, SMTP, ...
- **Calendar:** Google Calendar, Outlook Calendar, Calendly, ...
- **Cloud storage:** Google Drive, Dropbox, OneDrive, Box, ...
- **CRM:** Salesforce, HubSpot, Pipedrive, Zoho CRM, ...
- **Databases:** Airtable, Google Sheets, PostgreSQL, MySQL, MongoDB, ...
- **Project management:** Jira, Asana, Monday.com, Trello, ClickUp, Linear, ...
- **Messaging/chat:** Slack, Discord, Microsoft Teams, Telegram, ...

This also applies when the user describes a **capability** rather than naming an app. Words like "summarize", "analyze sentiment", "feedback form", "send a notification", or "store data" describe what they want to do — not which service to use. Ask.

> **Bad:** User says "list responses from my feedback form and post a sentiment summary into Discord." Agent assumes Google Forms and OpenAI and proceeds.
> **Good:** Same request. Agent asks: "Which form tool holds your responses — Google Forms, Typeform, JotForm, or something else? And for sentiment analysis, do you want to use OpenAI, Anthropic, Make AI, or another AI service?"

Different providers have different modules, capabilities, and connection requirements — guessing wastes time and produces wrong blueprints.

Continue until the use case can be clearly articulated in one paragraph. Every app in the scenario must be explicitly identified by name — if any app is still a generic category or implied by a capability description, ask before proceeding. Do NOT proceed to Step 2 until the business need is fully understood.

### Step 2: Identify Make Modules

Once the use case is clear, map it to Make modules using the MCP tools available from the Make MCP server:

1. **Find relevant apps.** Use the `apps_recommend` tool (or a similarly named tool if unavailable) with a description of the user's need. This returns recommended Make apps for the involved systems.
   - **One app per call.** Never batch multiple apps in a single `apps_recommend` call. Call separately for each distinct app/service. These calls can run in parallel.

2. **List available modules.** For each relevant app, use the `app_modules_list` tool (or similarly named) to see what modules (triggers, actions, searches, transformers) are available. Pass the `appVersion` returned by `apps_recommend`.

3. **Get app documentation.** For each app, call `app_documentation_get` using the exact `appName` value returned by `apps_recommend` (do not abbreviate or modify it). This returns detailed capabilities and module descriptions. Call once per app, not per module.

4. **Select modules.** Pick the specific modules needed:
   - **Trigger module** — what starts the scenario (e.g., Watch New Rows, Webhook, Schedule)
   - **Action modules** — what the scenario does (e.g., Create Record, Send Message, Update Row)
   - **Utility modules** — if needed for data transformation, iteration, aggregation, routing, or error handling

If a tool is not found by exact name, search for similarly named tools on the Make MCP server. The key capability needed is: recommending apps and listing their modules.

**Module name verification:** Never guess module names. Always verify via `app_modules_list`. Case and spelling must match exactly.

**No scheduler module:** There is no scheduler module in Make. Scheduling is a scenario-level setting, not a module. The scenario always starts with the first module (trigger or action). Scheduling is configured separately via the `scenario_scheduling_update` tool.

**IMPORTANT:** As modules are identified, record the following details from the tool responses — they are needed in subsequent phases:
- **App name** (exact name as returned by the tool)
- **App version** (exact version as returned by the tool)
- **Module name** (exact technical name/slug of each module you plan to use)

### Step 3: Present the Module Composition & Get Confirmation

Present the proposed module sequence to the user using **flowchart notation**:

**Linear flow:**
```
Trigger: Google Sheets - Watch New Rows → Slack - Send Message → Google Drive - Upload File
```

**Branching flow (with If-Else + Merge) — mutually exclusive branches that converge:**
```
Trigger: Webhook → HTTP - Make a Request → If-Else
  ├─ If (status = "success"): Slack - Send Message
  └─ Else: Email - Send Error
→ Merge → Google Sheets - Log Result
```

**Branching flow (with Router) — multiple branches can fire, no convergence:**
```
Trigger: Webhook → HTTP - Make a Request → Router
  ├─ Route A (status = success): Slack - Send Message
  └─ Route B (priority = high): Email - Send Alert
```

**Flow with iteration:**
```
Trigger: Schedule → Google Sheets - Search Rows → Iterator → Slack - Send Message (for each row)
```

For each module in the sequence, briefly note:
- The app and module name
- What it does in this scenario (1 sentence)

Then ask the user: **"Does this module composition achieve what you need? Should I adjust any steps?"**

Do NOT proceed beyond Phase 1 until the user confirms the composition is correct. The literal scenario layout and module configuration will be handled in subsequent phases.

### Phase 1 Output

Once the user confirms, produce a **Scenario Plan** summary to carry into subsequent phases. This is the working reference — do not lose it.

```
## Scenario Plan

**Use case:** <one paragraph summary>
**Trigger type:** <schedule | webhook | manual | event-based>

### Modules

| # | App | App Version | Module (slug) | Module Label | Role in scenario |
|---|-----|-------------|---------------|--------------|------------------|
| 1 | ... | ...         | ...           | ...          | ...              |
| 2 | ... | ...         | ...           | ...          | ...              |

### Flow
<flowchart notation from Step 3>
```

This table is the source of truth for which apps and modules will be used. Subsequent phases will reference it directly.

**CRITICAL — Plan adherence:** Once the user confirms the Scenario Plan, treat it as a binding contract. If during Phase 2 a reason emerges to change the module composition, flow structure, or branching pattern (e.g., switching from If-Else + Merge to Router, adding or removing modules, changing the trigger type), STOP and present the proposed change to the user with a clear explanation of why, along with an updated plan summary highlighting what has changed. Do NOT silently deviate from the confirmed plan.

---

## Phase 2: Configure, Deploy & Verify

Once the user confirms the module composition from Phase 1, proceed through these steps:

### Step 1: Secure Connections (REQUIRED — never auto-select)

**CRITICAL — STOP and ask before proceeding.** This is an interactive checkpoint. For EVERY app that needs a connection — even if only one matching connection exists — list the options and ask the user which connection to use. Do NOT auto-select a connection. Do NOT call any module-specific RPCs (`rpc_execute` for spreadsheet lists, channel lists, folder lists, etc.) until the user has explicitly confirmed a connection for every app. This is a hard gate: no confirmation, no RPCs.

1. **Extract connection requirements.** Before checking connections, call `extract_blueprint_components` with the unconfigured blueprint (all modules placed, parameters empty). This returns the authoritative list of: which modules need connections, the connection type for each, and the required OAuth scopes. Use this output — not manual inspection of the Scenario Plan — as the definitive checklist. Builtin modules (`builtin:BasicRouter`, `builtin:BasicFeeder`, `json:ParseJSON`, etc.) do NOT need connections. AI agent modules (`ai-local-agent:RunLocalAIAgent`) are NOT builtin — they require an AI provider connection via `makeConnectionId`.

2. **Check existing connections (with scope verification).** Call `connections_list` with the target `teamId`. List all connections without a type filter first, then match by `accountName` in the results — the `type` filter matches `accountName`, NOT the Make app name (e.g., Google Sheets uses `"google"`, Gmail uses `"google-email"`, Slack uses `"slack2"` or `"slack3"`).

   **Scope verification (CRITICAL for OAuth connections):** For each matching connection, compare its scopes against the required scopes from `extract_blueprint_components`. A connection that authenticates successfully but lacks a required scope will cause 403/permission errors at runtime. If a matching connection exists but its scopes are insufficient, do NOT attempt to use it — either expand its scopes (see `make-module-configuring` skill, connections reference, Step 3a) or create a new connection with the correct scopes.

3. **Ask the user to pick.** For each app, present a numbered list and WAIT for the user's reply:
   - **If matching connections exist** (even just one), list ALL of them with name, ID, metadata (email, workspace), and **scope status** (sufficient / insufficient). Always include "Create a new connection" as the last option:
     ```
     I found these existing Google connections:
     1. "Google - Marketing" (ID: 12345, email: marketing@acme.com) — scopes: sufficient
     2. "Google - Personal" (ID: 12346, email: me@gmail.com) — scopes: insufficient (missing Google Drive file access)
     3. Create a new connection

     Which one should I use for Google Sheets?
     ```
     **Even if there is only one match, still ask.** Connections with insufficient scopes should be listed but flagged — offer scope expansion or new connection creation for those.
   - **If no matching connection exists**, inform the user and create a credential request via `credential_requests_create`, including the required scopes from `extract_blueprint_components`.

4. **Confirm all connections are ready.** Do NOT proceed to Step 2 until every required connection has a user-confirmed connection ID.

### Step 2: Configure Each Module

Configure modules **left to right** (upstream to downstream) following the `make-module-configuring` skill:
1. Read the module interface (`app-module_get` with instructions format)
2. Load dynamic field options via RPCs (now that connections are confirmed)
3. Fill parameters and mapper
4. Validate each module individually (`validate_module_configuration`)

### Step 3: Validate the Blueprint

Call `validate_blueprint_schema` on the complete blueprint JSON to catch structural issues before submission.

### Step 4: Create the Scenario

Call `scenarios_create` with the validated blueprint. The blueprint **must** include a top-level `metadata` object — see [Blueprint Construction — Deployment Checklist](./blueprint-construction.md) for the required structure.

> **Scheduling type for webhook/instant trigger scenarios:** When the first module is a webhook or instant trigger (`listener: true`), always use `{"type": "immediately"}` as the scheduling type when calling `scenario_scheduling_update`. Never use `"indefinitely"` for webhook scenarios — it causes scenario activation to fail with "Invalid interval." Scheduled (polling) scenarios should use `"indefinitely"` with an interval; webhook scenarios must use `"immediately"`.

### Step 5: Activate the Scenario

Newly created scenarios are **inactive** by default. Call `scenarios_activate` before attempting to run. Skipping this step causes `scenarios_run` to fail.

### Step 6: Run & Verify

Run the scenario and confirm it succeeds before handing off to the user.

1. **Execute.** Call `scenarios_run` to trigger an immediate run.

2. **Check the result.** Call `executions_list` for the scenario, then `executions_get` on the most recent execution. Inspect the `status` field:
   - `1` = success — proceed to Step 7.
   - `3` = error — continue to step 3.

3. **Diagnose the failure.** Read `error.message` and `error.causeModule` from the execution result. Common runtime issues that pass schema validation:
   - Mapped fields resolving to `undefined` or `null` at runtime (e.g., `{{2.mimeType}}` when the upstream module produced no output for that field)
   - Type conversion errors on optional parameters left at defaults
   - Missing or expired connection tokens

4. **Fix and retry.** To update the scenario after diagnosis:
   - Call `scenarios_deactivate` on the scenario
   - Call `scenarios_update` with the corrected blueprint
   - Call `scenarios_activate` to re-enable
   - Call `scenarios_run` again and repeat from step 2

Repeat the diagnose-fix-retry cycle until the execution succeeds or the issue requires user intervention (e.g., missing input data, external service unavailable). If user action is needed, explain the error and what to do before retrying.

### Step 7: Provide the Scenario URL

Always give the user the scenario URL after creation: `https://<zone>.make.com/<teamId>/scenarios/<scenarioId>` (uses team ID, not organization ID).

---

## Core Concepts Reference

When composing scenarios, consult these feature docs to understand how Make's building blocks work. Read the relevant files before using these features in a module composition.

### Foundational
- **[Bundles](./bundles.md)** — The unit of data flowing between modules. Understand bundle multiplicity before composing flows.
- **[Mapping](./mapping.md)** — Connecting data between modules. Field mapping, data types, collections, arrays, functions/formulas.
- **[Connections](./connections.md)** — Authenticating modules with external services. OAuth, API keys, connection reuse.

### Triggers & Scenario Composition
- **[Scheduling & Triggers](./scheduling-and-triggers.md)** — How scenarios start: instant triggers, polling triggers, schedules, manual/on-demand.
- **[Webhooks](./webhooks.md)** — Instant triggers via HTTP endpoints. Custom webhooks and app-specific webhooks.
- **[Subscenarios](./subscenarios.md)** — Parent/child scenario composition. Sync and async calls, inputs/outputs, reuse.

### Data Flow Patterns
- **[Iterations](./iterations.md)** — Processing arrays item-by-item. Implicit iterators, explicit Iterator, specialized iterators, Repeater.
- **[Aggregations](./aggregations.md)** — Collapsing multiple bundles into one. Array, Text, Numeric, and Table aggregators.
- **[Data Stores](./data-stores.md)** — Persistent key-value storage across scenario runs. Deduplication, state, cross-scenario data sharing.

### Flow Control
- **[Routing](./routing.md)** — Router module: multiple routes, multiple can fire, cannot merge back. Fallback routes.
- **[Branching](./branching.md)** — If-Else module: mutually exclusive branches, can merge back.
- **[Merging](./merging.md)** — Merge module: converges If-Else branches into single flow.
- **[Filtering](./filtering.md)** — Input filters: pass/block bundles on conditions. Includes filter-vs-router decision guide.

#### Router vs If-Else Decision Guide

Choose **If-Else + Merge** when:
- Branches are **mutually exclusive** (only one should run per bundle)
- Branches need to **converge** into shared downstream modules (e.g., update a record, send a confirmation)
- The logic follows an "if A, do X; else if B, do Y; else do Z" pattern

Choose **Router** when:
- **Multiple routes can fire** for the same bundle (e.g., log to Sheets AND alert on Slack)
- Routes are **independent endpoints** with no shared follow-up steps
- You need parallel processing paths that don't converge

### Advanced
- **[AI Agents](./ai-agents.md)** — Make AI Agents (New) with tool-calling. Module tools, scenario tools, MCP tools. Non-deterministic logic.
- **[Error Handling](./error-handling.md)** — Error handlers per module (Break, Commit, Ignore, Resume, Rollback). Throw module. **Only suggest when user explicitly asks.**
- **[Blueprint Construction](./blueprint-construction.md)** — Guidelines for building scenario blueprints programmatically via MCP.
- **[Quick Patterns](./quick-patterns.md)** — Compressed MCP call chains for common one-shot scenarios (Slack message, Google Sheets, Airtable, email).

## Common App Gotchas

High-frequency configuration mistakes that cause silent failures or hard-to-diagnose runtime errors. Check these before finalizing module configuration in Phase 2 Step 2.

### Google Sheets: `valueInputOption` Required for Write Modules

`addRow` and `updateRow` always require `"valueInputOption": "USER_ENTERED"` in the **mapper** (not parameters). Without it, the API returns `400: INVALID_ARGUMENT — 'valueInputOption' is required`. There is no default — the field must be present:

```json
"mapper": {
  "valueInputOption": "USER_ENTERED",
  "values": { "0": "{{1.name}}", "1": "{{1.email}}" }
}
```

`validate_module_configuration` will catch this if called — this is exactly why validation is mandatory per module.

### Google Sheets: Spreadsheet IDs from `listSpreadsheets` RPC

IDs returned by the `listSpreadsheets` RPC (e.g., `1abc123def456`) must be prefixed with `/` when placed in the `spreadsheetId` parameter for `mode: "select"` / `from: "drive"` modules:
- Correct: `"/1abc123def456"`
- Wrong: `"1abc123def456"`

Only applies to select-mode. Map-mode accepts the raw ID.

### Webhook Scenarios: Scheduling Type

When the first module is a webhook (`gateway:CustomWebHook` or any instant trigger), always use `{"type": "immediately"}` for scheduling. Using `"indefinitely"` causes scenario activation to fail with "Invalid interval." See Step 4 above.

### Gmail / Google Email: `accountName` Is `"google-email"`, Not `"google"`

The `google-email` app (Gmail) uses a **different** connection type than Google Sheets, Calendar, and Drive. When filtering `connections_list`:
- Google Sheets / Calendar / Drive: `accountName: "google"`
- Gmail (`google-email`): `accountName: "google-email"`

A generic `"google"` OAuth connection will NOT work for Gmail modules (`google-email:sendAnEmail`, `google-email:TriggerNewEmail`). It lacks the required Gmail scopes and uses a different connection type entirely. Always verify via `extract_blueprint_components` that you have the correct connection type — do not assume all Google apps share one connection.

### IML Date Boundaries: No `endOfDay()` / `startOfDay()` Functions

IML does not have `endOfDay()`, `startOfDay()`, `beginningOfDay()`, or similar boundary functions. Attempting to use them produces an "Unknown function" error. To construct day boundaries, use `formatDate` to extract the date portion and concatenate a literal time:

```
Start of day: {{formatDate(now; "YYYY-MM-DD")}}T00:00:00Z
End of day:   {{formatDate(now; "YYYY-MM-DD")}}T23:59:59Z
```

This is the one valid use of date + literal time concatenation. The general rule "never concatenate separate date and time strings" (see [IML Expressions](../make-module-configuring/iml-expressions.md)) applies to full ISO 8601 datetimes where both parts are dynamic — it does not prohibit combining a `formatDate` date-only result with a fixed literal time component.

### Make AI Tools (`ai-tools:Ask`): Model Is Required, No Default

The `model` parameter in `ai-tools:Ask` (and other Make AI Toolkit modules) is **required** — there is no default value. Omitting it causes a 400 error at runtime. When using Make's AI Provider (`ai-provider` connection), use tier names: `"low"`, `"medium"`, or `"high"`. Do not use provider-specific model IDs (e.g., `"gpt-4o-mini"`) with the Make AI Provider — they are not valid tier names and will fail.

**No Make AI Provider connection?** If the user has no `ai-provider` connection and cannot create one, check `connections_list` for alternative AI provider connections (`openai-gpt-3`, `anthropic-claude`, `gemini-ai-*`) and use the corresponding app-specific module instead of `ai-tools:Ask`. These modules accept provider-specific model IDs. See [Blueprint Construction — AI Tools](./blueprint-construction.md) for details.

## Official Documentation

- [Create Your First Scenario](https://help.make.com/create-your-first-scenario)

## Related Skills

- **make-module-configuring** — HOW to configure each module: parameters, connections, mapping, webhooks, data stores, IML expressions, validation
- **make-interface-reference** — MCP server configuration, scopes, access control, and troubleshooting
