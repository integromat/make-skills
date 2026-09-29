---
name: make-scenario-building
description: Use when creating a new Make scenario or editing an existing one — finding modules, connections and account-dependent values, wiring the flow, saving through scenario_create or scenario_patch. Not for explaining, running or debugging a scenario, or for API-call shells.
metadata:
  version: "0.1.7" # x-release-please-version
---

# Make scenarios — creating and editing

The tool descriptions carry each tool's rules; this skill carries the order of operations and the decisions
the tools cannot make. A straight-line scenario needs nothing beyond the workflow below. Load a reference only
when its trigger applies.

**Ground rules.** A 403 means the whole connection must be re-authorized with every permission — never one
tool. A `content` remark on a result is an instruction, not decoration. `scenario_create`/`scenario_patch`
make one save each: put everything one change needs in one call, and read a refused write's `errors` as a
free dry run. Say what you resolved an ambiguous value to ("the Sales channel", "next Monday") *before* the
call that acts on it. Details and the refusal contract: `make-scenario-reference`, when something is refused.

## Build a new scenario

1. Pin the design in words the user agrees with: every app by name (ask when they name a category — "email",
   "a form", "AI"), what starts it, what moves where, what happens to non-matching items.
2. `environment_get` → `organizationId`/`teamId`.
3. `app_find` with the user's words, once per goal. Given an instant and a polling trigger for the same
   source, say which you chose and why.
4. `module_spec` for every planned module in one call, `schemas: true` — it gives each module's exact
   `config` shape and its `dynamic` paths.
5. Connections: reuse an id from `connection.existing`; otherwise one `connection_create` for every app,
   hand over the link, `connection_get` when the user says they are done.
6. `module_field_resolve` every `dynamic` path in `dependsOn` order, copying `value` into `config`. A polling
   trigger's start point is the `/data` path — ask "existing items or from now?" before resolving it.
7. Compose the flat list: your ids, one `root: "main"`, everything else `follows` or `parent`, one `config`
   per module, `filter` for a plain continue-or-stop gate. Google Sheets, Gmail, Make AI Tools or date math
   involved → [App gotchas](./references/app-gotchas.md) first.
8. `scenario_create`, `autoActivate` off unless asked. Fix everything in `errors` and resubmit; relay
   `warnings`.
9. Verify, then `scenario_activate`. On-demand: `scenario_run` with `inputs`. Polling/scheduled: activate,
   `scenario_run`, `scenario_execution_get`. Webhook: the *user* sends one real request — `scenario_run`
   does not exercise a webhook. Then give `https://<zone>.make.com/<teamId>/scenarios/<scenarioId>`.

## Edit an existing scenario

1. `scenario_get` for structure and `lastEdit`; `scenario_module_get` (`config: true`) only for the modules
   you will change.
2. Adding modules: `app_find` and `module_spec(schemas: true)` as above; resolve `dynamic` paths against the
   module's current `config`.
3. One `scenario_patch` with `expectedLastEdit` and every operation the change needs. Send only the `config`
   domains you changed. Fix every `{{<id>.field}}` reference a removed or moved module leaves dangling in the
   same call.
4. A module added in a call gets its id on save, so wiring onto it is a second call with the returned
   `lastEdit`. Verify from the response's `modules` echo.

## A webhook whose payload is unknown

`payloadShape: "learned"` in `module_spec`, or a bare `gateway:CustomWebHook`: create with the trigger alone →
the user sends one real request (or `scenario_trigger_learn` first) → `scenario_trigger_inspect` →
`scenario_patch` the rest. Do not activate a webhook scenario whose fields nobody has seen.

## Decisions the tools leave to you

- **Filter vs if-else vs router.** Skip non-matching items and nothing else → `filter`. Non-matching items
  need their own action → `builtin:BasicIfElse` (+ `builtin:BasicMerge` to rejoin). Several arms that may all
  fire → `builtin:BasicRouter`.
- **Do not over-build.** No error handlers, aggregators or variables unless the design needs them.

## References — load only on the trigger

| Trigger | Reference |
|---|---|
| Mapping a trigger's or on-demand input, a whole bundle or an array element; a mapped field came back empty | [Mapping](./references/mapping.md) |
| A value must be transformed (dates, text, arrays, conditionals) | [IML functions](./references/iml-functions.md) |
| More than a straight line: routers, if-else + merge, multi-condition filters, iterating, aggregating | [Flow control](./references/flow-control.md) |
| The scenario is on-demand, calls another scenario, or is called by one or by an agent | [Subscenarios](./references/subscenarios.md) |
| Placing a Make AI Agent module with tools | [AI agents](./references/ai-agents.md) |
| The user asks for retries or fallbacks, or failure/data loss is unacceptable — most scenarios need none | [Error handling](./references/error-handling.md) |
| Finalizing a Google Sheets, Gmail or Make AI Tools config, or a date expression | [App gotchas](./references/app-gotchas.md) |
| A complete `scenario_create` call to pattern from | [Examples](./examples/README.md) |
