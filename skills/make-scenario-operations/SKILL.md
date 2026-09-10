---
name: make-scenario-operations
description: Use when running a scenario on demand, switching one on or off, reviewing or debugging past executions, or investigating a webhook that does not seem to receive data. Covers scenario_run, scenario_activate, scenario_deactivate, scenario_execution_list(_show), scenario_execution_get(_show), scenario_execution_inspect, scenario_execution_module_get, scenario_trigger_learn, and scenario_trigger_inspect. Not for creating or editing (make-scenario-building) or explaining structure (make-scenario-explore). Read make-scenario-reference first.
metadata:
  version: "0.1.7" # x-release-please-version
---

# Make scenarios — running and debugging

Everything after a scenario exists: running it, switching it on or off, and the run → inspect → drill-down
chain for a failure. Know `trigger.kind` (from `scenario_get`) before calling `scenario_run` — its behavior
depends on it entirely.

## Running: `scenario_run`

- **on-demand** — runs with `inputs` keyed by the declared input names and returns the declared outputs.
- **polling / scheduled** — runs once now; `inputs` are rejected, nothing is returned, the run lands in
  history.
- **webhook** — **nothing runs**. The response hands back the webhook URL (or names the app event). Do not
  report the scenario as "run"; have the user send a real request and check `scenario_execution_list`.

An inactive scenario refuses with a pointer to `scenario_activate` — new scenarios start inactive. A
`"pending"` status means the run outlived the wait: check `scenario_execution_get` with the `executionId`, do
not assume failure. A rejected `inputs` key comes back naming the declared interface — read it rather than
guessing again. Inputs passed to a scenario with no interface are silently unused; a remark says so — relay it.

## Activating and deactivating

Two separate tools, and an already-satisfied request is success, not an error. An activation refusal almost
always means a module still has a configuration error — `scenario_get`'s per-module `issues` say which.

## History: `scenario_execution_list` → `scenario_execution_get`

The list carries `errorMessage` inline for failed runs — often enough for "did it work, why not" without a
second call. A run started moments ago can lag the list by a few seconds (a remark says so; not data loss).
`scenario_execution_get` is for one run's outcome, outputs and consumption (credits and bytes — usage units,
not money); it has no per-module breakdown, so it answers "did it finish", not "which module broke". The
`_show` twins only when the user wants a rendered timeline or card.

## Debugging a failed run: `scenario_execution_inspect` → `scenario_execution_module_get`

1. **`scenario_execution_inspect`** — overall status and error, plus every module that ran with invocation and
   error counts. Make records **one** error per run (the one that ended it); other failures show only as
   `errorCycles` counts. A **warning** run has no top-level `error` at all — `modules[].errors` is the only
   signal, so never report "no error found" as "nothing went wrong".
2. **`scenario_execution_module_get`** on the suspect module and the `cycle` `inspect` reported (usually 1) —
   the real input and output that module saw. Never pick a cycle independently; a wrong cycle returns
   unrelated data with no warning.
3. Cross-check the current `config` with `scenario_module_get` — but first compare `scenario_get`'s `lastEdit`
   to the run's `startedAt`. If the scenario was edited after the run, what you read is not necessarily what
   ran; say so before attributing the bug.

`…[truncated]` marks a cut payload — text, not JSON to parse. A module with no downstream consumer
(`ReturnData`, `WebhookRespond`, a throw) always reports an empty output here even when correct; the scenario's
own output lives in `scenario_execution_get`'s `outputs`.

## A webhook that "isn't receiving data"

- **`scenario_trigger_inspect`** first: it reports **`queued`** deliveries — requests stored and waiting because
  the scenario is inactive, paused, or rate-limited. A non-zero `queued.count` is the answer to "I sent data
  and nothing happened" far more often than a broken mapping. It also shows the detected structure and recent
  deliveries, and with a `deliveryId` one raw request.
- **`scenario_trigger_learn`** puts the webhook into learning mode: the next request is captured as the
  structure without running the scenario (safe on an active scenario). Give the user the URL and have them
  send one real request.

Withheld payloads (confidential or shared webhooks, bodies over 1 MB, binary) are replaced by a placeholder
and explained in a remark — not "nothing arrived".

## Not covered here

- Editing the scenario to fix what you found — `make-scenario-building`.
- Explaining the scenario without running it — `make-scenario-explore`.
