---
name: data-stores
description: Configuring data stores in Make modules — type-less components from Extract Blueprint Components, creation via MCP (requires data structure first), selecting in modules, and assigning to parameters.
---

# Data Stores

## What It Is

A data store is Make's built-in persistent key-value storage. It lets scenarios store, retrieve, update, and delete records across runs. Every data store is backed by a data structure (schema) that defines its fields. Data store IDs are stored in the module's **parameters** domain.

## When It's Needed

- A module performs data store operations (add, get, update, delete, search records)
- The scenario needs persistent state across runs (counters, deduplication, caching, lookup tables)
- The Extract Blueprint Components output indicates modules that need a data store

## Type-Less Components

Like data structures, **data stores are type-less** in Extract Blueprint Components. The tool simply reports that certain modules need a data store, without specifying which one. The agent must determine:
- What data the store should hold (based on the use case)
- Whether modules can share a data store or need separate ones
- Ask the user when the purpose isn't clear from context

## Provisioning Workflow

Data stores can be created directly via MCP — no credential requests needed. But a data structure must exist first.

### Step 1: Identify Required Data Stores

Call Extract Blueprint Components with the unconfigured blueprint. The output lists which modules need a data store.

### Step 2: Ensure Data Structure Exists

Every data store requires a data structure as its schema. Before creating a data store:
- Check if a suitable data structure already exists (`data-structures_list`)
- Or create a new one via `data-structures_create` (see [Data Structures](./data-structures.md))

### Step 3: Check Existing or Create New

- Use `data-stores_list` to see existing data stores in the team.
- Ask the user whether to reuse an existing store or create a new one.
- To create a new data store, call `data-stores_create` with:
  - A descriptive name
  - The data structure ID (from Step 2)
  - Storage size

### Step 4: Assign to Modules

Place the data store ID in the module's parameters under the field name specified by the module interface.

## Gotchas

- **Data structure must exist first.** Attempting to create a data store without a data structure ID will fail. Always create the structure before the store.
- **Type-less means agent decides.** Extract Blueprint Components won't tell the agent what the store should contain. Infer from the use case or ask the user.
- **Shared data stores.** Multiple modules in the same scenario (or across scenarios) may share a data store — e.g., one module writes records and another reads them. Use the same data store ID for both.
- **Data stores are team-level resources.** They're shared across all scenarios in a team.
- **Storage limits.** Data stores have a maximum size. Plan sizing based on expected record volume and data types.


## Official Documentation

- [Data Stores](https://help.make.com/data-stores)

See also: [Data Structures](./data-structures.md) for creating the required schema, [General Principles](./general-principles.md) for the overall workflow, [Connections](./connections.md) for the credential request pattern (data stores use direct creation instead).
