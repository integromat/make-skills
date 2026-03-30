---
name: data-stores
description: Persistent key-value storage for data that persists across scenario runs.
---

# Data Stores

## What It Is

Data stores are Make's built-in persistent storage — a simple database that lets you store, retrieve, update, and delete records across scenario runs. They're useful for maintaining state, caching data, deduplication, and sharing data between scenarios.

## When to Use It

- You need to remember data between scenario runs (e.g., "last processed ID", counters, lookup tables).
- You need to share data between different scenarios.
- You need deduplication — check if a record was already processed.
- You need a simple key-value or tabular store without an external database.

## How It Works in Make

### Data Store Structure

A data store has a defined schema (columns/fields) and stores records identified by a unique key. Maximum storage is based on your plan's monthly credits (divide monthly credits by 1,000 to get MB). Minimum per store: 1 MB. Maximum: 1,000 data stores per organization.

### Key Modules

| Module | What it does |
|---|---|
| **Data store > Add/replace a record** | Upserts a record by key — creates if new, replaces if exists |
| **Data store > Update a record** | Updates specific fields of an existing record |
| **Data store > Get a record** | Retrieves a single record by key |
| **Data store > Check existence** | Returns true/false for whether a record exists by key |
| **Data store > Search records** | Returns multiple records matching a filter (implicit iterator — returns N bundles) |
| **Data store > Delete a record** | Removes a record by key |
| **Data store > Delete all records** | Clears the entire data store |
| **Data store > Count records** | Returns the total number of records |

### Creating a Data Store

Data stores are created at the organization level (not per scenario). Use the `scenario_datastore_create` MCP tool or create them in Make before referencing them in scenarios.

## Flowchart Notation

```
Trigger: Webhook → Data store - Get a record [key: email] → If-Else
  ├─ If (exists): Data store - Update a record
  └─ Else: Data store - Add/replace a record → Email - Send Welcome
```

## Example

Deduplication — only process new orders:

```
Shopify - Watch Orders → Data store - Get a record [key: order_id]
  → [filter: record does not exist] → Process Order → Data store - Add/replace a record [key: order_id, status: processed]
```

Cross-scenario state sharing:

```
Scenario A: API - Fetch Token → Data store - Add/replace a record [key: "api_token", value: token, expires: timestamp]
Scenario B: Data store - Get a record [key: "api_token"] → API - Make Request (using stored token)
```

## Gotchas

- **Storage limits.** Total data storage depends on your plan. Minimum data store size is 1 MB. Monitor usage to avoid "Out of space" errors.
- **Maximum record size.** Individual records are limited to 15 MB.
- **Search returns multiple bundles.** `Search records` is an implicit iterator — downstream modules execute once per matching record. Pair with an Aggregator if needed.
- **Not a database replacement.** Data stores are for simple key-value/tabular storage. For complex queries, relations, or large datasets, use an external database.
- **Key uniqueness.** Each record must have a unique key. `Add/replace` will overwrite existing records with the same key.
- **Field renaming risk.** Renaming a field in a data structure makes the original data inaccessible because Make uses a different column identifier. Workaround: create a new field, copy data, then empty the original.
- **Type change behavior.** When changing a field type, existing data retains its original type; only new data uses the new type. Use conversion functions like `parseDate` to migrate existing values.
- **Deleted records are unrecoverable.** The "Discard changes" function does not restore deletions.


## Official Documentation

- [Data Stores](https://help.make.com/data-stores)

See also: [Iterations](./iterations.md) for handling multi-bundle output from Search, [Aggregations](./aggregations.md) for collapsing search results.
