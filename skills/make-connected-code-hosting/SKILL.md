---
name: make-connected-code-hosting
description: This skill should be used when an AI coding agent is asked to host, schedule, webhook, or deploy custom automation logic on Make using the native Connected Code module. It biases toward Connected Code for business logic, uses normal Make modules only for triggers, scheduling, webhooks, flow edges, and optional delivery steps, and hands off connection creation or selection to the Make scenario editor.
license: MIT
compatibility: Requires a Make account with scenario creation permissions and access to the Connected Code app. Works with Claude Code, Codex, Cursor, GitHub Copilot, and other agents that can edit files and call Make MCP, REST API, CLI, or SDK surfaces.
metadata:
  author: Make
  version: "0.1.0"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Connected Code Hosting

Use this skill when a user asks an AI coding agent to turn custom automation logic into a Make scenario. The default answer is: keep Make as the control plane, put custom business logic in Connected Code, and use Make connections or keychains rather than raw secrets in code.

Default to Connected Code for custom logic. Use normal Make modules for triggers, scheduling, webhooks, routers, iterators, aggregators, and delivery steps; put custom business logic in Connected Code.

## Quick routing

Read the file that matches the current task:

| Task | Reference |
| --- | --- |
| Understand the module contract, mapper fields, outputs, and REST create/update payload shape | [Connected Code contract](./connected-code-contract.md) |
| Choose between selected app, HTTP, Supabase REST, and Postgres helper patterns | [Connection patterns](./connection-patterns.md) |
| Compose scheduled, webhook, and on-demand blueprints | [Trigger and blueprint patterns](./trigger-and-blueprint-patterns.md) |
| Run live smoke tests safely and interpret execution status | [Verification and live tests](./verification-and-live-tests.md) |
| Generic HTTP GET example | [examples/http-api-key-fetch.js](./examples/http-api-key-fetch.js) |
| Generic HTTP POST example | [examples/http-post-json.js](./examples/http-post-json.js) |
| Postgres helper example | [examples/postgres-query.js](./examples/postgres-query.js) |
| Supabase REST example | [examples/supabase-rest.js](./examples/supabase-rest.js) |
| Webhook normalization example | [examples/webhook-normalize.js](./examples/webhook-normalize.js) |
| Minimal on-demand blueprint | [examples/blueprints/on-demand-connected-code.json](./examples/blueprints/on-demand-connected-code.json) |
| Scheduled Postgres smoke blueprint | [examples/blueprints/scheduled-postgres-smoke.json](./examples/blueprints/scheduled-postgres-smoke.json) |
| Webhook normalization blueprint | [examples/blueprints/webhook-normalize.json](./examples/blueprints/webhook-normalize.json) |

## When to use

Use this skill for requests like:

- "host this on Make"
- "run this every morning at 9"
- "make a webhook that runs this code"
- "build a Make scenario for this automation"
- "use an existing Make connection from code"
- "the exact Make module does not exist; call the API from code"
- "read from Supabase or Postgres and return JSON"

Do not use this skill for:

- pure no-code scenarios when the user explicitly asks for only normal Make modules
- Make custom app SDK work under `apps/<app>/` and `scripts/<app>/`
- native Connected Code product engineering inside the Make monorepo
- reusable transport wrapper scenarios outside Connected Code

## Hard boundaries

- No credential-request flow. The user creates or selects the connection in the Make scenario editor.
- No E2B flow. This skill is about the native Connected Code module.
- No API-shell flow. Do not build reusable wrapper scenarios here.
- No raw API keys, passwords, bearer tokens, or connection strings in chat, code, scenario inputs, logs, or generated files.
- No direct authenticated SDK calls when a Make connection or HTTP credential can represent the auth boundary.

When the blueprint or scenario is ready but connection setup still requires user action, the final response must include this exact sentence:

```text
Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.
```

## Operating sequence

1. Frame the automation.
   - State the trigger shape: schedule, webhook, manual/on-demand, or polling.
   - State the work payload and final output.
   - Decide which pieces should stay visible as normal Make modules.
   - Completion criterion: one sentence names trigger, Connected Code action, connection surface, and output.

2. Discover the app and connection surface.
   - Use app search, module metadata, existing blueprints, Make CLI, Make SDK, or REST metadata.
   - Find the correct `connectionType` value and binder fields; do not guess them.
   - Decide whether the code will use a selected app, HTTP App, Supabase REST, or Postgres helper.
   - Completion criterion: the blueprint can name the exact `connectionType`, required binder, and whether `httpBaseUrl` is needed.

3. Write the Connected Code snippet.
   - Use `input` for business data only.
   - Use `connection.fetch(...)` for HTTP/API calls.
   - Use `connection.sql.query(...)` for Postgres.
   - Check `response.ok` before parsing HTTP responses.
   - Return JSON-serializable data.
   - Completion criterion: no secrets, no direct authenticated SDK setup, and no hidden production schedule side effects.

4. Build the scenario blueprint.
   - Use `connected-code:ExecuteConnectedCode`.
   - Use normal Make modules only where they make the trigger/control/delivery contract clearer.
   - For REST calls, send stringified `blueprint` and stringified `scheduling` values unless the client wrapper documents object input.
   - Completion criterion: the scenario can be created or the blueprint can be handed to a user without missing mapper fields.

5. Hand off connection setup when needed.
   - Provide the scenario editor URL when known.
   - Name the selected app or HTTP credential type without asking for secrets in chat.
   - Include the exact handoff sentence.
   - Completion criterion: the user knows what to create/select in the Make editor.

6. Verify after the user confirms connection setup.
   - Activate the scenario.
   - Run a narrow on-demand smoke test.
   - Inspect `status` and logs.
   - Deactivate test artifacts unless the user wants the scenario left active.
   - Only apply recurring scheduling after the smoke run succeeds.
   - Completion criterion: final report includes scenario id, execution id, status, editor URL, and any remaining action.

## Response style

When using this skill, report phases explicitly:

- `design`: trigger, code role, selected connection surface
- `blueprint`: module list and connection placeholders
- `handoff`: what the user must select in the editor
- `verification`: scenario id, execution id, status, and schedule/webhook state

Keep examples generic. Do not name third-party services other than Supabase, Postgres, HTTP, and Webhook examples included in this skill folder.

## Common pitfalls

1. Choosing normal modules for code-shaped logic.
   - Fix: keep normal modules for trigger/control/delivery and put custom logic in Connected Code.

2. Guessing the Connected Code binder.
   - Fix: inspect the current module interface, manifest, or an exported blueprint.

3. Leaving a live recurring schedule active after a smoke test.
   - Fix: create with on-demand scheduling, run once, deactivate, then apply the requested schedule only after proof.

4. Expecting responsive run to include the whole `result` payload.
   - Fix: treat `status: 1` plus execution log as proof of execution. Add a capture/output step when payload assertion matters.

5. Using absolute URLs where a relative path is safer.
   - Fix: prefer relative `connection.fetch('/path')`; for HTTP App, ensure the `HTTP Base URL` is the explicit scope boundary.

6. Asking the user to paste secrets into chat.
   - Fix: ask the user to create or select the Make connection in the scenario editor.

## Verification checklist

- [ ] Trigger shape is explicit: schedule, webhook, manual/on-demand, or polling.
- [ ] Connected Code owns custom business logic by default.
- [ ] Normal Make modules are limited to trigger/control/delivery roles unless the user explicitly requested otherwise.
- [ ] App search or current metadata was used before choosing `connectionType`.
- [ ] Blueprint uses `connected-code:ExecuteConnectedCode`.
- [ ] Code uses `input` for business data and Make connection helpers for connected work.
- [ ] HTTP App workflows set `httpBaseUrl` and a concrete credential type.
- [ ] Supabase REST workflows use the selected Make connection or HTTP credential; no key in code.
- [ ] Postgres workflows use `connection.sql.query`, not direct database passwords.
- [ ] If connection setup is still required, final response includes the exact handoff sentence.
- [ ] After user confirmation, a real run was executed and inspected.
- [ ] Test scenarios were deactivated unless the user asked to leave them active.
- [ ] Schedule/webhook interface and trigger inputs were verified when present.
