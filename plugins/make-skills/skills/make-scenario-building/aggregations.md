---
name: aggregations
description: Collapsing multiple bundles into a single bundle in Make scenarios.
---

# Aggregations

## What It Is

Aggregation is the inverse of iteration. It takes multiple bundles flowing through the scenario and collapses them into a single bundle. This is used when you need to collect processed results and combine them before continuing.

## When to Use It

- You need to send one email/message containing all processed results (not one per item).
- You need to create a bulk payload (array of items) for an API call.
- You need to compute a sum, average, or concatenated string from multiple bundles.
- After an iteration, you want to "close the loop" and continue with a single bundle.

## How It Works in Make

### Aggregation Boundary

Every aggregator must be configured with a **source module** — the module that defines where aggregation starts. This is the aggregation boundary. All bundles produced from that point forward (until the aggregator) are collected into a single output bundle.

### Aggregator Types

| Aggregator | App | Module slug | Output |
|---|---|---|---|
| **Array Aggregator** | built-in | `builtin:BasicAggregator` | Single bundle with an array property containing all collected items |
| **Text Aggregator** | Utils | `util:TextAggregator` | Single bundle with a string — all bundle contents concatenated |
| **Numeric Aggregator** | Utils | `util:NumericalAggregator` | Single bundle with a number — sum, average, etc. of a field across bundles |
| **Table Aggregator** | Utils | `util:TableAggregator` | Single bundle with structured table data |

### Key Configuration Fields

- **Source Module** — The module where aggregation starts. Defines the aggregation boundary.
- **Group By** — Splits the aggregator's output into multiple bundles, one per distinct value of a formula. Each output bundle contains a `Key` (the distinct value) and an `Array` (the aggregated data for that key). Useful for grouping results (e.g., aggregate invoices grouped by customer).
- **Target structure type** (Array Aggregator only) — Defines the shape of the output array. Defaults to "Custom" (you pick which fields to include). If downstream modules are connected, the dropdown also offers their array-typed fields as targets, enabling auto-mapping.
- **Stop processing after empty aggregation** — When enabled, the aggregator produces no output if zero bundles reach it (e.g., all filtered out). The flow stops. When disabled (default), it outputs an empty result bundle.

### Data Flow

```
Multiple bundles IN → [Aggregator] → Single bundle OUT (containing array/string/number)
```

## Flowchart Notation

```
Google Sheets - Search Rows (N bundles) → Transform Data (per row) → Array Aggregator → Slack - Send Message (single summary)
```

## Example

A scenario that lists all open invoices, transforms each, then sends a single summary email:

```
QuickBooks - List Invoices (N bundles) → Set Variable (extract fields) → Text Aggregator → Email - Send (one email with all invoice details)
```

## Gotchas

- **Forgetting the Aggregator after iteration.** If you iterate (or use an implicit iterator) and don't aggregate, ALL downstream modules execute N times. Always consider whether you need to "close the loop."
- **Aggregation boundary matters.** The source module setting determines which bundles get collected. Setting it wrong means the aggregator collects the wrong set of bundles.
- **Choose the right aggregator type.** Array Aggregator for structured data you'll process further. Text Aggregator for human-readable output. Numeric for calculations.
- **Upstream data not forwarded.** Bundles from the source module and intermediate modules are not passed forward by the aggregator. To preserve data from these bundles, explicitly include items in the aggregator's "Aggregated fields" configuration.

## Official Documentation

- [Aggregator](https://help.make.com/aggregator)

See also: [Iterations](./iterations.md) for the inverse operation, [Bundles](./bundles.md) for bundle flow basics.
