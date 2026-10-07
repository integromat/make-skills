---
name: error-handling
description: Error-handler arms and the five directives (Break, Resume, Ignore, Commit, Rollback), the throw modules, and the scenario settings that govern failures. Load only when the user asks for fault tolerance or the scenario is mission-critical.
---

# Error handling

**Default to none.** Make stops a run on the first error, records it, and deactivates the scenario after
repeated failures — that is the right behavior for most automations, and it keeps failures visible. Add
handlers when the user asks for retries, fallbacks or "never lose a record", or when a failed run has a real
cost (payments, data sync, customer-facing replies). Do not propose them for a notification scenario.

## Shape: an error handler is an arm

An error handler hangs off the module whose failure it handles: `parent: {moduleId: <that module>, kind:
"errorHandler"}` — a single flow, no `index`. Any modules can run in the arm (notify, log), and it **ends with
a directive** that decides what happens to the run:

```json
{ "id": 3, "module": "stripe:CreateCharge", "follows": 2, "config": { "…": "…" } },
{ "id": 10, "module": "slack:CreateMessage", "parent": { "moduleId": 3, "kind": "errorHandler" },
  "config": { "mapper": { "channel": "C0ALERTS", "text": "Charge failed for {{2.email}}" } } },
{ "id": 11, "module": "builtin:Ignore", "version": 1, "follows": 10, "config": {} }
```

Routers and directives themselves cannot carry a handler. `scenario_get` reports handlers as modules with
`parent.kind: "errorHandler"`; `module_spec` confirms every directive below.

| Directive | Effect on the failed item | `config` | Use when |
|---|---|---|---|
| `builtin:Ignore` | Drop it, keep processing the rest | none | Non-critical step; losing the item is acceptable |
| `builtin:Resume` | Continue after the failed module as if it produced substitute values | `mapper`: the substitute output, keyed by the failed module's output fields | A safe default exists |
| `builtin:Break` | Store the run as an incomplete execution and retry later | `mapper: {retry: true, count, interval}` (interval in minutes) | Transient failures — rate limits, outages |
| `builtin:Commit` | Stop the run, keep everything done so far | none | Partial progress is valid |
| `builtin:Rollback` | Stop and revert transactional (ACID) modules | none | All-or-nothing; only reverts modules that support it |

Match the directive to the failure kind: connection and rate-limit errors → `Break`; bad data → `Resume` or
`Ignore`; a misconfigured module → fix the config, no handler helps.

## Raising errors deliberately

`builtin:ThrowError` (`mapper: {message}`) fails the run with `status: error`; `builtin:ThrowWarning` records
a warning and continues. The common use is guarding a "successful but empty" result before the scenario's
output module: a router with one arm filtered on `result exists` leading to `scenario-service:ReturnData` (or
`gateway:WebhookRespond`), and another arm filtered on `notexist` leading to `ThrowError`. Without it a run
whose AI step returned nothing reports success.

## Scenario-level settings

`scenario_patch`'s `settings_set` writes the execution settings that interact with errors: `maxErrors`
(consecutive errors before Make deactivates the scenario), `dlq` (store incomplete executions), `sequential`
(process one run at a time — a stored failed run then blocks the queue until it is resolved), `autoCommit`,
`dataloss`, `confidential`. Change them only on request; the defaults are what most scenarios should keep.

## Things to say to the user

- `Break` and `dlq` create **incomplete executions** that someone has to retry or discard in Make — this
  surface cannot do that (`make-scenario-reference`, refusal contract). A sequential scenario with stored
  failures stops processing new data until they are handled (`isWaitingOnIncompleteExecutions` in
  `scenario_get`).
- A webhook-triggered scenario with `maxErrors` set deactivates on the first error, not after N.
- `Rollback` only reverts modules marked transactional; a non-transactional write earlier in the run stays.
