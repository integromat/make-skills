---
name: make-connected-code-hosting
description: This skill should be used when an AI coding agent is asked to host, schedule, webhook, or deploy custom automation logic on Make. It verifies that the native Connected Code app and ExecuteConnectedCode module are available, uses Connected Code when possible, falls back to the normal Make Code module for custom code when Connected Code is unavailable, and uses make-api-shell-connection-workflow only for provider API transport.
license: MIT
compatibility: Requires a Make account with scenario creation permissions. Uses Connected Code or the normal Make Code module for custom code; make-api-shell-connection-workflow is required only for provider API transport fallback.
metadata:
  author: Make
  version: "0.2.0"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Connected Code Hosting

Use this skill when a user asks an AI coding agent to turn custom automation logic into a Make scenario. Keep Make as the control plane, put custom business logic in Connected Code when the app is available, and use Make connections or keychains rather than raw secrets in code.

Connected Code is the preferred execution surface, not an assumption. Confirm that the active workspace exposes the `connected-code` app and `connected-code:ExecuteConnectedCode` module before generating a blueprint. If the app or module is unavailable, use the normal Make Code module (`code:ExecuteCode`) for custom code after verifying its current interface. Use `make-api-shell-connection-workflow` only for provider API transport.

## Quick routing

Read the file that matches the current task:

| Task | Reference |
| --- | --- |
| Decide between Connected Code, the normal Make Code module, and provider API-shell transport | [Execution surface routing](./execution-surface-routing.md) |
| Understand the module contract, mapper fields, outputs, and REST create/update payload shape | [Connected Code contract](./connected-code-contract.md) |
| Choose the correct connection helper and diagnose broker mismatches | [Connection patterns](./connection-patterns.md) |
| Browse the complete 159-app connection reference | [Connection reference](./references/connected-code-helpers/docs/connection-reference.md) |
| Copy provider, HTTP, SQL, and Email snippets | [Connected Code example index](./connection-examples-index.md) |
| Inspect the helper corpus overview and pinned source commit | [Helper overview](./references/connected-code-helpers/README.md) · [Source manifest](./references/connected-code-helpers/SOURCE.json) |
| Compose scheduled, webhook, and on-demand blueprints | [Trigger and blueprint patterns](./trigger-and-blueprint-patterns.md) |
| Run live smoke tests safely and interpret execution status | [Verification and live tests](./verification-and-live-tests.md) |
| Generic HTTP GET example | [examples/http-api-key-fetch.js](./examples/http-api-key-fetch.js) |
| Generic HTTP POST example | [examples/http-post-json.js](./examples/http-post-json.js) |
| PostgreSQL helper example | [examples/postgres-query.js](./examples/postgres-query.js) |
| Supabase REST example | [examples/supabase-rest.js](./examples/supabase-rest.js) |
| Webhook normalization example | [examples/webhook-normalize.js](./examples/webhook-normalize.js) |
| Minimal on-demand blueprint | [examples/blueprints/on-demand-connected-code.json](./examples/blueprints/on-demand-connected-code.json) |
| Scheduled PostgreSQL smoke blueprint | [examples/blueprints/scheduled-postgres-smoke.json](./examples/blueprints/scheduled-postgres-smoke.json) |
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
- "Connected Code is not available; call this provider API through Make instead"
- "replace a deprecated E2B skill workflow"

Do not use this skill for:

- pure no-code scenarios when the user explicitly asks for only normal Make modules
- Make custom app SDK work under `apps/<app>/` and `scripts/<app>/`
- native Connected Code product engineering inside the Make monorepo
- reusable transport wrapper scenarios outside Connected Code

## Hard boundaries

- No credential-request flow inside the Connected Code branch. The user creates or selects that connection in the Make scenario editor. After an API-shell fallback, `make-api-shell-connection-workflow` owns connection reuse and credential requests.
- `make-e2b-code-execution` is deprecated and removed. This repository does not document or provision an E2B workaround.
- When Connected Code is unavailable, use the normal Make Code module for supported custom-code tasks. The API-shell workflow remains a provider API transport fallback, not a general code module.
- No raw API keys, passwords, bearer tokens, or connection strings in chat, code, scenario inputs, logs, or generated files.
- No direct authenticated SDK calls when a Make connection or HTTP credential can represent the auth boundary.

When the Connected Code branch has a blueprint or scenario ready but its editor-managed connection still requires user action, the final response must include this exact sentence. Do not impose this sentence on the API-shell fallback; that skill owns its credential-request response contract.

```text
Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.
```

## Operating sequence

1. Frame the automation.
   - State the trigger shape: schedule, webhook, manual/on-demand, or polling.
   - State the work payload and final output.
   - Decide which pieces should stay visible as normal Make modules.
   - Completion criterion: one sentence names trigger, Connected Code action, connection surface, and output.

2. Verify the execution surface.
   - Resolve the active Make zone, organization, and team.
   - Discover the `connected-code` app and confirm that `connected-code:ExecuteConnectedCode` can be resolved in the active workspace.
   - Treat transient metadata or authorization failures as blockers to investigate, not proof that the app does not exist.
   - If Connected Code is unavailable for custom code, discover and verify the normal Make Code module (`code:ExecuteCode`) and its current interface before generating the blueprint.
   - If Connected Code is unavailable for provider API transport, invoke `make-api-shell-connection-workflow`.
   - For `route: make-code`, follow the Normal Make Code fallback branch in `execution-surface-routing.md` and do not continue into Connected Code-only steps 3–7.
   - For `route: make-api-shell`, hand off to `make-api-shell-connection-workflow` and do not continue into Connected Code-only steps 3–7.
   - Completion criterion: the route is explicitly `connected-code`, `make-code`, or `make-api-shell`, with discovery evidence.

3. Discover the Connected Code app and connection surface (`route: connected-code` only).
   - Use current module metadata, an exported blueprint, Make MCP, CLI, SDK, or REST metadata; do not guess.
   - Prefer a selected service App when it exists. Use the HTTP App when Connected Code is available but the provider is not in its catalog and a stable HTTP scope plus Make credential can represent access.
   - Find the exact `connectionType` and current binder fields. Connected Code 1.2.2 uses one hidden account binder, `__IMTCONN__`; stale sharded binders such as `__IMTCONN_2__` are not supported.
   - Completion criterion: the blueprint names the exact `connectionType`, required binder, and whether `httpBaseUrl` is needed.

4. Write the Connected Code snippet.
   - Use `input` for business data only.
   - Use `connection.fetch(...)` for HTTP/API calls.
   - Use `connection.sql.query(...)` only for PostgreSQL/MySQL Apps.
   - Use `connection.email.*` only for the generic Email App. Gmail and Sage are service Apps with HTTP transport and use `connection.fetch(...)`.
   - Check `response.ok` before parsing HTTP responses.
   - Return JSON-serializable data.
   - Completion criterion: no secrets, no direct authenticated SDK setup, and no hidden production schedule side effects.

5. Build the scenario blueprint.
   - Use `connected-code:ExecuteConnectedCode`.
   - Use normal Make modules only where they make the trigger/control/delivery contract clearer.
   - For REST calls, send stringified `blueprint` and stringified `scheduling` values unless the client wrapper documents object input.
   - Completion criterion: the scenario can be created or the blueprint can be handed to a user without missing mapper fields.

6. Hand off connection setup when needed.
   - Provide the scenario editor URL when known.
   - Name the selected app or HTTP credential type without asking for secrets in chat.
   - Include the exact handoff sentence.
   - Completion criterion: the user knows what to create/select in the Make editor.

7. Verify after the user confirms connection setup.
   - Activate the scenario.
   - Run a narrow on-demand smoke test.
   - Inspect `status` and logs.
   - Deactivate test artifacts unless the user wants the scenario left active.
   - Only apply recurring scheduling after the smoke run succeeds.
   - Completion criterion: final report includes scenario id, execution id, status, editor URL, and any remaining action.

## Response style

When using this skill, report phases explicitly:

- `routing`: Connected Code availability evidence and selected execution surface
- `design`: trigger, code role, selected connection surface
- `blueprint`: module list and connection placeholders
- `handoff`: what the user must select in the editor
- `verification`: scenario id, execution id, status, and schedule/webhook state

Named services in the vendored connection reference are concrete catalog examples, not universal defaults. Public examples must still avoid real accounts, tenant URLs, IDs, secrets, and claims based on one private workspace.

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

7. Calling `connection.email.*` or `connection.sql.query(...)` for an HTTP-transport service App.
   - Fix: `Broker is not configured for this connection` means the selected helper does not match the App. Gmail and Sage use `connection.fetch(...)`; the Make automatic error handler does not fix this configuration error.

8. Generating Connected Code when the app is unavailable.
   - Fix: verify the module first. Use the normal Make Code module for custom code, or `make-api-shell-connection-workflow` for provider API transport.

9. Routing hosted or reusable code to E2B.
   - Fix: `make-e2b-code-execution` is deprecated and removed. Do not provide E2B setup or workaround instructions in this repository; use Connected Code or the normal Make Code module according to current availability and interface support.

## Verification checklist

- [ ] Trigger shape is explicit: schedule, webhook, manual/on-demand, or polling.
- [ ] Connected Code app/module availability was checked in the active workspace.
- [ ] The selected route is explicit: Connected Code, normal Make Code, or Make API shell.
- [ ] Connected Code owns custom business logic by default.
- [ ] Normal Make modules are limited to trigger/control/delivery roles except for the verified `code:ExecuteCode` fallback.
- [ ] Connected Code routes use app search/current metadata before choosing `connectionType`; Make Code routes verify the current module interface.
- [ ] A Connected Code route uses `connected-code:ExecuteConnectedCode`; a Make Code route uses the verified `code:ExecuteCode` module/version.
- [ ] Connected Code uses `input` and Make connection helpers; Make Code follows its verified current interface and keeps secrets out of mapped inputs.
- [ ] HTTP App workflows set `httpBaseUrl` and a concrete credential type.
- [ ] Supabase REST workflows use the selected Make connection or HTTP credential; no key in code.
- [ ] PostgreSQL/MySQL workflows use `connection.sql.query`, not direct database passwords.
- [ ] Generic Email uses `connection.email.*`; Gmail and Sage service Apps use `connection.fetch(...)`.
- [ ] No blueprint uses stale sharded binders such as `__IMTCONN_2__`.
- [ ] If Connected Code is unavailable, custom code uses the verified normal Make Code module and provider API transport uses `make-api-shell-connection-workflow`.
- [ ] No workflow routes to `make-e2b-code-execution` or documents an E2B workaround.
- [ ] If Connected Code editor connection setup is still required, final response includes the exact handoff sentence.
- [ ] After user confirmation, a real run was executed and inspected.
- [ ] Test scenarios were deactivated unless the user asked to leave them active.
- [ ] Schedule/webhook interface and trigger inputs were verified when present.
