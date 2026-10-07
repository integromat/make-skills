---
name: subscenarios
description: On-demand scenarios and parent/child composition — the required Start/Return modules, how declared inputs and outputs bind, calling a scenario from another one or from an AI agent, and the null-output failure mode.
---

# Subscenarios and on-demand scenarios

## The on-demand shape

A scenario meant to be run on request — from `scenario_run`, from another scenario, or as an AI agent's
tool — has `scheduling: {"type": "on-demand"}`, a top-level `interface: {input: [...], output: [...]}`, and
exactly this frame:

```
id 1  scenario-service:StartSubscenario   root: "main"        receives the declared inputs
id 2… whatever the scenario does           follows the previous module
id N  scenario-service:ReturnData          last                produces the declared outputs
```

- **`StartSubscenario` is not optional.** Its output bundle *is* the run's input: a declared input `city` is
  `{{1.city}}` downstream. `scenario_create` accepts a plain action module in the root position without
  complaint, but then nothing receives the inputs and every reference to them resolves to nothing.
- **`ReturnData`'s mapper is keyed by the declared output names.** Nothing checks that every `output[].name`
  has a matching key — a missing or misspelled key silently returns `null` for that output on a run that
  reports success. Check the mapper against `interface.output` before calling the build done.
- `interface` is a sibling of `modules`, not a field on either module. Required inputs are allowed only on
  an on-demand schedule.
- `app_find` under-serves this search — ask for "start scenario when called by another source, receive
  scenario inputs" rather than "on-demand trigger", or name the two modules directly to `module_spec`.

The example [on-demand-subscenario.json](../examples/on-demand-subscenario.json) shows the complete call.

## Calling one scenario from another

`scenario-service:CallSubscenario` in the parent: `config.parameters.scenario` is the child's id,
`parameters.shouldWaitForExecutionEnd` picks synchronous (`true` — the parent waits and gets the child's
declared outputs as this module's output) or fire-and-forget (`false` — no outputs come back). The mapper's
fields are the child's declared inputs; resolve them with `module_spec(schemas: true)` after the child exists.

- Same team only. The child must be active and on-demand to be callable.
- Split a scenario into subscenarios when it is too large to reason about, or when the same steps are needed
  from several parents. Calls through this module do not consume credits.
- `scenario-service:RunScenario` is the older replacement-pending module; prefer `CallSubscenario`.

## Where the outputs actually go

| Caller | Gets the outputs from |
|---|---|
| `scenario_run` on the on-demand scenario | its response `outputs` |
| a parent's `CallSubscenario` (sync) | that module's output bundle |
| an AI agent using the scenario as a tool | the tool result |
| an HTTP client posting to a **webhook** trigger | nothing — `ReturnData` does not reach a webhook caller. End that flow with `gateway:WebhookRespond` instead |

## Symptoms of getting it wrong

- Every output `null` on a "successful" run: wrong root module, or `ReturnData` keys do not match the declared
  output names.
- `scenario_run` rejects the `inputs`: the error names the declared interface — align the keys, do not guess
  again.
- Generic `BlueprintValidationError` with no field: usually a non-starter module in the root of an on-demand
  scenario.
