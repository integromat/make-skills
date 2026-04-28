---
name: subscenarios
description: Composing scenarios using parent/child subscenario calls for modularity and reuse.
---

# Subscenarios

## What It Is

Subscenarios allow you to break complex automations into smaller, reusable scenarios. A parent scenario triggers one or more subscenarios via the `Scenarios > Call a scenario` module. Subscenarios can return data back to the parent or run independently.

## When to Use It

- A scenario is too large or complex — split it into focused subscenarios for maintainability.
- The same logic is needed in multiple scenarios — build it once as a subscenario and call it from all parents.
- You want to expose automation logic as a tool for AI agents or MCP clients.
- You want to reduce credit usage — the Scenarios app doesn't consume credits for calling subscenarios.

## How It Works in Make

### Calling Modes

| Mode | Behavior |
|---|---|
| **Synchronous** | Parent calls subscenario, pauses, waits for outputs, then resumes. Use when the parent needs results. |
| **Asynchronous** | Parent calls subscenario and continues immediately without waiting. Use for fire-and-forget tasks. |

### Key Modules

- **`Scenarios > Call a scenario`** — In the parent scenario. Passes inputs and (in sync mode) receives outputs.
- **`Scenarios > Start scenario`** — The trigger module in the subscenario. Receives inputs from the parent.
- **`Scenarios > Return outputs`** — In the subscenario. Sends results back to the parent (sync mode only).

### Inputs and Outputs

You define a structured set of **scenario inputs** (data the parent passes in) and **scenario outputs** (data the subscenario returns). This gives a clear contract between parent and child.

## Flowchart Notation

```
Trigger: Webhook → Process Order → Scenarios - Call a scenario [Check Inventory] (sync) → If-Else
  ├─ If (in_stock = true): Fulfill Order
  └─ Else: Notify Backorder
```

Async:
```
Trigger: Webhook → Process Order → Scenarios - Call a scenario [Send Notifications] (async) → Continue Processing
```

## Example

A parent scenario that handles incoming orders and delegates inventory checking to a subscenario:

```
Shopify - Watch Orders → Scenarios - Call a scenario [Inventory Check] (sync)
  → If-Else
    ├─ If (available = true): Shopify - Create Fulfillment
    └─ Else: Slack - Notify #backorders
```

The "Inventory Check" subscenario:
```
Scenarios - Start scenario [inputs: product_id, quantity] → Database - Query Stock → Scenarios - Return outputs [available: true/false, stock_count]
```

## Gotchas

- **Same team only.** You can only call scenarios within your team. For cross-team or cross-organization calls, use `Make > Run a scenario` or `Webhooks > Custom webhook` instead.
- **Nesting depth.** A subscenario can itself call other subscenarios (acting as a parent). Be mindful of execution depth and timeouts.
- **Async has no outputs.** In async mode, the parent doesn't receive any data back. If you need results, use sync mode.
- **Credits.** Scenarios called via the Scenarios app don't consume credits. This is cheaper than the Webhooks-based approach.
- **Subscenario must be active and on-demand.** The subscenario must be active and scheduled "on demand" to be callable. If it shows an "Inactive" label, it must be previewed and activated before calling.
- **Accurate input/output structure.** The official docs emphasize that you must "define the structure of scenario inputs or outputs accurately to ensure data passes without errors."

## Official Documentation

- [Subscenarios](https://help.make.com/subscenarios)

See also: [Routing](./routing.md) for splitting flow within a scenario, [AI Agents](./ai-agents.md) for using subscenarios as agent tools.
