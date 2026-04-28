---
name: filtering
description: Input filters that control which bundles are allowed to enter a module.
---

# Filtering

## What It Is

A filter is a condition placed on a module's input that decides whether each incoming bundle is allowed to proceed into the module or is blocked. Filters are the primary mechanism for controlling data flow in Make scenarios.

## When to Use It

- You need a simple yes/no gate: "Only process bundles where field X meets condition Y."
- You want to control which bundles take which route after a Router — see [Routing](./routing.md).
- You want to skip processing for certain data without splitting the flow.

## How It Works in Make

1. Every module (except If-Else, Merge, and error handlers) can have an **input filter**.
2. The filter sits on the module's input — before the module executes.
3. For each incoming bundle, the filter evaluates its conditions:
   - **Pass**: The bundle enters the module and gets processed.
   - **Block**: The bundle is stopped. The module does not execute for that bundle. All downstream modules in that path also skip.

### Available Operators

Filters support conditions using:
- **Numeric operators**: equal to, not equal to, greater than, greater than or equal to, less than, less than or equal to
- **Text operators**: equal to, not equal to, contains, does not contain, starts with, ends with, matches pattern (regex)
- **Date operators**: before, after, between
- **Existence operators**: exists, does not exist
- **Array operators**: contains

### Compound Conditions (AND/OR)

A single filter can combine multiple rules:
- **AND**: All rules must match for the bundle to pass. Add multiple rules within the same condition group.
- **OR**: Any rule matching is sufficient. Add a new condition group (each group is OR'd together, rules within a group are AND'd).

### Filters, Router Conditions, and If-Else Conditions

These all use the same condition mechanism (same operators, same AND/OR composition). The difference is where they're applied:
- **Filter**: on any module input — pass/block gate on a single path
- **Router condition**: on each route — determines which routes fire (multiple can match)
- **If-Else condition**: on each branch — determines which single branch executes (first match wins)

Filter configuration details are handled in later phases — during Phase 1, just note where filters will be needed.

## Filter vs Router Decision

**Use a Filter when:**
- Simple yes/no gate on a **single path**: "Only send Slack if priority = High"
- One execution path — bundles either proceed or stop
- Example: `Get Rows → Filter (status = 'New') → Send Slack Message`

**Use a Router when:**
- **Multiple distinct paths** with different actions per condition
- Different conditions require different module sequences
- Example: "If status = 'New', do A. If status = 'Done', do B. If status = 'Error', do C."

**Common mistake:** Using a Router for a simple yes/no check. If there's only one path and you just want to skip bundles that don't match, a Filter is simpler and correct.

## Flowchart Notation

```
Google Sheets - Search Rows → [filter: status = "active"] → Slack - Send Message
```

With Router:
```
Trigger → Router
  ├─ Route 1 [filter: status = "new"]: Slack - Send Message
  ├─ Route 2 [filter: status = "done"]: Archive Module
  └─ Route 3 [filter: status = "error"]: Email - Send Alert
```

## Example

Only process orders above $100:

```
Shopify - Watch Orders → [filter: amount > 100] → Slack - Notify Team → Google Sheets - Log Order
```

Orders at or below $100 are silently dropped at the filter — Slack and Google Sheets never execute for them.

## Gotchas

- **Downstream cascade.** If a filter blocks a bundle, ALL downstream modules in that path skip for that bundle — not just the module with the filter.
- **Not on If-Else/Merge.** These modules handle conditions differently (built-in to their logic). You don't add input filters to them.
- **Invisible failures.** Unlike errors, filtered bundles produce no output or notification. If your scenario seems to "do nothing," check if a filter is blocking all bundles.

## Official Documentation

- [Filtering](https://help.make.com/filtering)

See also: [Routing](./routing.md) for splitting into multiple conditional paths, [Branching](./branching.md) for mutually exclusive logic.
