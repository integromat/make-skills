---
name: mapping
description: Connecting data between modules — how to map fields from source modules to target module inputs.
---

# Mapping

## What It Is

Mapping is how you tell Make which data from one module should be used in another module's input fields. It connects the output of upstream modules to the input parameters of downstream modules — the core mechanism for passing data through a scenario.

## When to Use It

- Every time a module needs data from a previous module's output (which is almost always).
- When transforming data between systems with different field names or formats.
- When constructing dynamic values using functions and formulas.

## How It Works in Make

### Source and Target

- **Source module**: Any upstream module whose output bundle contains the data you need.
- **Target module**: The downstream module whose input fields you're configuring.

You can map data from any module that executed before the current one in the flow (not just the immediately preceding module).

### Data Types in Bundles

| Type | Description | Example |
|---|---|---|
| **Text** | String values | `"John Doe"` |
| **Number** | Numeric values | `42`, `3.14` |
| **Boolean** | True/false | `true` |
| **Date** | Date/time values | `2026-03-17T10:00:00Z` |
| **Collection** | Object with named fields (mixed types) | `{ name: "John", age: 30 }` |
| **Array** | Ordered list of same-type items | `["a", "b", "c"]` or `[{...}, {...}]` |
| **Buffer** | Binary data (files) | File contents |

### Collections and Arrays

- A **collection** is like a record/object — it has named fields of potentially different types. Access fields with dot notation in mapping.
- An **array** is a list of items. Arrays containing collections (array of objects) are common — e.g., a list of line items, a list of attachments.
- To process array items individually, use an [Iterator](./iterations.md). To build an array from multiple bundles, use an [Aggregator](./aggregations.md).

### Functions and Formulas

Make provides built-in functions for transforming mapped values:

- **String functions**: `lower`, `upper`, `trim`, `replace`, `substring`, `split`, `join`, `length`
- **Numeric functions**: `ceil`, `floor`, `round`, `min`, `max`, `sum`, `average`
- **Date functions**: `formatDate`, `parseDate`, `addDays`, `addHours`, `dateDifference`
- **Array functions**: `map`, `get`, `first`, `last`, `length`, `contains`, `sort`, `slice`
- **General**: `if`, `ifempty`, `switch`, `toString`, `toNumber`

Functions can be nested: `{{upper(trim(1.field))}}`.

## Flowchart Notation

Mapping isn't shown explicitly in flowcharts — it's implicit in module connections. When relevant, note the mapped fields:

```
Google Sheets - Search Rows → Slack - Send Message [text: {{row.name}} has status {{row.status}}]
```

## Example

Mapping order data from Shopify to a Google Sheets row:

```
Shopify - Watch Orders
  → Google Sheets - Add Row [
      Column A: {{order.order_number}},
      Column B: {{order.customer.email}},
      Column C: {{order.total_price}},
      Column D: {{formatDate(order.created_at, "YYYY-MM-DD")}}
    ]
```

## Gotchas

- **Bundle structure discovery.** If a module's mapping panel doesn't show expected fields, the module hasn't been run yet. Run the scenario once (or "Run this module only" on the source module) so Make learns the output structure. For instant triggers, you must manually provide data (e.g., submit a real response) to generate a testable bundle. For polling triggers, use the "Choose where to start" option.
- **Array fields need iteration.** If you map an array field directly into a non-array input, you'll get the entire array as a single value. Use an Iterator to process items individually.
- **Type coercion.** Make auto-coerces types in some cases (number to string, etc.), but explicit conversion with `toString()` or `toNumber()` is safer.
- **Empty values.** Use `ifempty(value, fallback)` to provide defaults when a mapped field might be null/empty.
- **Source module identification.** In the Make UI, hovering over a mapped item causes the source module to pulse, making it easy to trace data origins.

## Official Documentation

- [Mapping](https://help.make.com/mapping)

See also: [Bundles](./bundles.md) for the data flow model, [Iterations](./iterations.md) for processing arrays, [Filtering](./filtering.md) for conditions that use mapped values.
