---
name: make-scenario-building
description: Use when creating a new Make scenario or editing an existing one — finding apps and modules, resolving connections and account-dependent values, wiring the flow, and saving through scenario_create or scenario_patch. Not for explaining a scenario (make-scenario-explore), running or debugging one (make-scenario-operations), or building a reusable API-call shell (make-api-shell). Read make-scenario-reference first.
metadata:
  version: "0.1.7" # x-release-please-version
---

# Make scenarios — creating and editing

The tool descriptions carry each tool's own rules. This skill carries the order of operations and the
decisions the tools cannot make. The surface performs well on a straight-line scenario with no extra
guidance; the references below exist for the cases past that, and each one says when it is worth loading.

## Workflow: build a new scenario

1. **Pin the design in words first.** Name every app explicitly (ask when the user names a category —
   "email", "CRM", "a form", "AI" — instead of a product), what starts the scenario, what data moves where,
   and what should happen to items that do *not* match a condition. One paragraph the user agrees with.
2. `environment_get` — the `organizationId`/`teamId` every discovery tool needs; "my personal account" is the
   team typed `private`.
3. `app_find` with the user's own words, once per distinct goal. When an app offers both an instant trigger
   and a polling one, say which you picked and why (instant: no delay; polling: verifiable by running once,
   and it has a start point — see step 6).
4. `module_spec` for every planned module in one call. Once the plan is settled and you are about to author,
   call it again with `schemas: true` — that is what tells you each module's exact `config` shape and which
   paths are `dynamic`.
5. **Connections.** Reuse an id from `connection.existing`. Otherwise one `connection_create` covering every
   app that needs one, hand the user the link, and call `connection_get` only when they say they are done.
6. **Resolve every `dynamic` path** with `module_field_resolve`, in `dependsOn` order, copying `value` (never
   `label`) into `config`. A polling trigger's start point is the `/data` path — ask the user whether to
   process existing items or start from now *before* resolving it; the cursor is stamped at resolution time.
7. **Compose** the flat module list: ids you choose, one `root: "main"`, everything else `follows` or
   `parent`, one `config` per module, `filter` where a plain continue-or-stop gate is wanted. Before
   finalizing a Google Sheets, Gmail, Make AI Tools, or date-heavy config, read
   [App gotchas](./references/app-gotchas.md).
8. `scenario_create` with `autoActivate` off unless the user asked for it live. A populated `errors` array is
   a free dry run — fix everything listed and resubmit. Relay `warnings`; they did not block the save.
9. **Verify, then activate.** On-demand: `scenario_run` with `inputs`. Polling or scheduled: `scenario_activate`,
   `scenario_run`, then `scenario_execution_get`. Webhook: have the *user* send one real request to the
   returned URL and check `scenario_execution_list` — `scenario_run` does not exercise a webhook trigger.
10. Hand back `https://<zone>.make.com/<teamId>/scenarios/<scenarioId>` (`zone` from `environment_get`).

## Workflow: edit an existing scenario

1. `scenario_get` — the structure and `lastEdit`. Then `scenario_module_get` (`config: true`) for the
   modules you will change, and only those.
2. Adding modules: `app_find` and `module_spec(schemas: true)` as above; resolve `dynamic` paths against the
   module's *current* `config`, not from memory.
3. One `scenario_patch` with `expectedLastEdit` and every operation the change needs. Reconfiguring three
   modules is three `module_config_set` operations in one call. Send only the `config` domains you changed;
   the rest are preserved. Fix every `{{<id>.field}}` reference a removed or moved module leaves dangling in
   the same call.
4. A module added in a call gets its id from the server, so wiring onto it is a second call: `module_add`
   first, then a follow-up `scenario_patch` with the `lastEdit` the first one returned.
5. Verify from the response's `modules` echo; run again only if the user wants a live check.

## Workflow: a webhook whose payload is not known yet

When `module_spec` reports `payloadShape: "learned"` (or the trigger is a bare `gateway:CustomWebHook`):
create the scenario with the trigger alone → have the user send one real request (or `scenario_trigger_learn`
first) → `scenario_trigger_inspect` for the detected fields → `scenario_patch` the rest. Do not activate a
webhook scenario whose field names nobody has seen.

## Decisions the tools leave to you

- **Filter vs if-else vs router.** One condition, nothing to do with the non-matching items → `filter` on
  the module (the run skips them). Non-matching items need their own action → `builtin:BasicIfElse` with a
  `builtin:BasicMerge` when the arms rejoin. Several arms that may all fire → `builtin:BasicRouter`.
- **State a guess before it takes effect.** "The Sales channel", "next Monday", "the first sheet" — say what
  you resolved it to before the `scenario_create`/`scenario_patch`/`scenario_run` that acts on it.
- **Do not over-build.** No error handlers, aggregators, or variables unless the design needs them.

## References — load only when the trigger applies

- [Mapping](./references/mapping.md) — when a mapper references a trigger's or on-demand scenario's input,
  needs a whole bundle or an array element, or a mapped field came back empty at run time.
- [IML functions](./references/iml-functions.md) — only when a value must be transformed (dates, text,
  arrays, conditionals). Never use a function that is not listed there.
- [Flow control](./references/flow-control.md) — when the scenario is more than a straight line: routers,
  if-else and merge, filters with several conditions, iterating an array, aggregating items, repeating.
- [Subscenarios](./references/subscenarios.md) — when the scenario is on-demand (declares inputs/outputs), is
  called by another scenario or an AI agent, or calls one.
- [AI agents](./references/ai-agents.md) — when placing a Make AI Agent module and giving it tools.
- [Error handling](./references/error-handling.md) — only when the user asks for retries, fallbacks or
  fault tolerance, or the scenario is mission-critical (failure or data loss unacceptable). Most scenarios
  should not get error handlers.
- [App gotchas](./references/app-gotchas.md) — before finalizing a Google Sheets, Gmail, or Make AI Tools
  config, or a date expression.
- [Examples](./examples/README.md) — complete `scenario_create` calls for the common shapes: webhook to
  sheet, polling trigger with an AI step and a write-back, router, if-else with merge, iterator with
  aggregator, error handler, AI agent with a tool, on-demand subscenario.

## What this skill does not cover

- Explaining an existing scenario — `make-scenario-explore`.
- Running it, activating it, or debugging a run — `make-scenario-operations`.
- A reusable API-call or HTTP shell used as a retrieval transport — `make-api-shell`.
