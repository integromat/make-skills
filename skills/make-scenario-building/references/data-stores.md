---
name: data-stores
description: Persisting state across runs (dedup, counters, shared lookups) with a data store, and typing a payload with a data structure. Load only when the design needs memory between runs or a fixed record/payload schema.
---

# Data stores and data structures

A scenario forgets everything between runs. A **data store** is the memory: a small keyed table the built-in
Data store modules read and write. A **data structure** is a named field schema: it shapes a store's records,
or types a webhook's payload so later modules can map named fields.

**Default to none.** Need one only when a run must know what an earlier run did (seen this email already?
running total?) or several scenarios share a lookup table. A one-off transform needs neither.

## Order of operations

Dependencies run structure → store → scenario, so create in that order, and reuse before creating:

1. `data_structure_list` → `data_structure_get` on a plausible match. None fits → `data_structure_create`,
   preferably from a real `sample` payload rather than a hand-written `spec`. Skip entirely for a store whose
   records need no fixed shape.
2. `data_store_list`. None fits → `data_store_create` with the structure's id and a modest `maxSizeMB`.
3. `app_find` for the operation ("add a record to a data store", "check if a record exists") → take the
   Data store module names from the result, never guess them → `module_spec(schemas: true)`.
4. Put the store's id in the module's `datastore` parameter, in the same `scenario_create`/`scenario_patch`
   call as the rest of the design.

State the store and structure names you picked or created before the scenario write that uses them.

## Patterns

- **Dedup.** Key = the source item's stable id. Look the key up → `filter` on "does not exist" → process →
  add the record with that key. Add *after* processing succeeds, or a failed run marks the item as seen.
- **Counter / running total.** Get the record → compute the new value in the mapper → update the record.
  Not safe under parallel runs; set the scenario to sequential (`settings_set`) when the count must be exact.
- **Shared lookup.** One scenario maintains the store; others only read it. Say which scenario owns writes.
- **Typed webhook payload.** A structure from a real sample, assigned to the webhook trigger with
  `scenario_patch`, gives later modules stable field names and (with `strict`) rejects malformed requests.
  Still learn one real request first when nobody has seen the payload — see the webhook section of the skill.

## Changing or removing

- `data_structure_update` replaces the whole spec — include every field that must survive.
- `data_store_delete` / `data_structure_delete` first report which scenarios still use the target. Relay that
  list and get an explicit yes before calling again with `confirmed: true`; deleted records do not come back.
