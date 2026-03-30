---
name: scheduling-and-triggers
description: How scenarios start executing — trigger types, scheduling, and execution modes.
---

# Scheduling & Triggers

## What It Is

Every scenario needs something to start it. Make supports multiple trigger mechanisms that determine when and how a scenario begins executing.

## When to Use It

- Every scenario needs a trigger — this is always relevant.
- Choose the right trigger type based on whether the use case is event-driven, time-based, or manual.

## How It Works in Make

### Trigger Types

| Trigger type | How it works | When to use |
|---|---|---|
| **Instant trigger (webhook)** | Scenario runs immediately when an external event fires. Modules labeled "INSTANT" or "Watch" with webhook support. | Real-time: form submissions, payment events, chat messages |
| **Polling trigger** | Scenario runs on a schedule and checks the source for new data since last run. Modules like "Watch New Rows", "Watch New Emails". | Near-real-time when webhooks aren't available. Frequency set by scheduling. |
| **Schedule (no trigger module)** | Scenario runs on a time interval. First module is an action, not a trigger. | Periodic batch jobs: daily reports, hourly syncs |
| **Manual / On-demand** | Scenario runs only when explicitly triggered (via API, another scenario, or the Run button). | Testing, one-time tasks, subscenario calls |

### Scheduling Configuration

Scheduling is a **scenario-level setting**, not a module. There is no "scheduler module" in Make. Configure it via the `scenario_scheduling_update` MCP tool.

Options include:
- **Interval**: Run every N minutes (minimum depends on plan).
- **Specific times**: Run at specific times of day/week.
- **Immediately**: Run as soon as the previous execution finishes (continuous processing).


### Instant vs Polling

- **Instant triggers** respond within seconds. They use webhook URLs. Preferred when available.
- **Polling triggers** check at the scheduled interval. There's a delay between the event and processing (up to the polling interval).

To check if an app supports instant triggers, use `app_modules_list` and look for modules with trigger type "instant" or "webhook".

## Flowchart Notation

```
Trigger: Stripe - Watch Events (INSTANT) → Process Payment
```

```
Trigger: Google Sheets - Watch New Rows (polling, every 15 min) → Process Row
```

```
Schedule: Every day at 9:00 AM → HTTP - Get Report → Email - Send Summary
```

## Example

Choosing trigger types for different use cases:

```
# Real-time: Slack message triggers immediate response
Trigger: Slack - Watch Messages (INSTANT) → AI Agent → Slack - Reply

# Periodic: Daily CRM sync
Schedule: Every day at 6:00 AM → Salesforce - Search Records → Google Sheets - Add Rows

# On-demand: Subscenario called by parent
Trigger: Scenarios - Start scenario → Process Data → Scenarios - Return outputs
```

## Gotchas

- **No scheduler module.** Scheduling is configured at the scenario level, not as a module. Don't search for a "scheduler" or "cron" module.
- **Polling interval affects freshness.** With polling triggers, data is only as fresh as the polling interval. For time-sensitive workflows, prefer instant triggers.
- **Instant triggers run concurrently by default.** Multiple webhook requests are processed in parallel. Enable sequential processing in scenario settings to force them to queue and execute one at a time.
- **First module matters.** The first module in a scenario determines the trigger type. You can't mix — it's either an instant trigger, a polling trigger, or a regular action module (scheduled/manual).

## Official Documentation

- [Schedule Your Scenario](https://help.make.com/step-10-schedule-your-scenario)

See also: [Webhooks](./webhooks.md) for custom webhook endpoints, [Subscenarios](./subscenarios.md) for on-demand scenario calls.
