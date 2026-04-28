---
name: data-structures
description: Creating and assigning data structures (schemas) to Make modules — type-less components from Extract Blueprint Components, direct creation via MCP, field specifications, and sharing across modules.
---

# Data Structures

## What It Is

A data structure is a schema definition in Make — it describes the shape of data (field names, types, constraints) that a module, data store, or webhook expects. Data structures define what fields are available for mapping and validation.

## When It's Needed

- A module requires structured input or produces structured output (the module interface specifies this)
- Creating a data store (every data store is backed by a data structure)
- Defining the expected payload for a custom webhook
- The Extract Blueprint Components output indicates modules that need a data structure

## Type-Less Components

Unlike connections, keys, and webhooks — which have specific types (e.g., "Google OAuth connection", "SSH key", "Slack webhook") — **data structures are type-less**. Extract Blueprint Components simply reports that certain modules need a data structure, without specifying what kind.

This means the agent must determine:
- **What fields** the data structure should contain (based on the use case and what data flows through the module)
- **Whether modules can share** a data structure (if multiple modules need the same schema) or need separate ones
- When in doubt, **ask the user** to clarify the expected data shape

## Provisioning Workflow

Data structures can be created directly via MCP — no credential requests needed.

### Step 1: Identify Required Data Structures

Call Extract Blueprint Components with the unconfigured blueprint. The output lists which modules need a data structure.

### Step 2: Check Existing or Create New

- Use `data-structures_list` to see existing data structures in the team.
- Ask the user whether to reuse an existing structure or create a new one.
- To create a new data structure, call `data-structures_create` with the field specification. The tool's input schema describes the exact format for field definitions.

### Step 3: Design the Field Specification

When creating a new data structure, define the fields based on the data that will flow through the module. Each field has:
- **name** — field identifier
- **type** — the data type (check the `data-structures_create` tool's input schema for the full list of supported types)
- **label** — human-readable display name
- **required** — whether the field must have a value
- **default** — default value when not provided

**Design guidelines:**
- Keep field names short and descriptive
- Choose the most specific type available (e.g., `integer` over `number` for whole numbers, `email` over `text` for email addresses)
- Mark fields as required only when data integrity demands it
- Use `collection` type for nested objects and `array` for lists

### Step 4: Assign to Modules

Place the data structure ID in the module's parameters under the field name specified by the module interface.

## Priority in Component Creation

Data structures should be created **before** other components that depend on them:
- **Before data stores** — every data store requires a data structure as its schema
- **Before custom webhooks** — if the webhook needs a predefined payload structure

## Updating Data Structures

Updating a data structure affects all data stores, webhooks, and modules that use it:
- Adding new **optional** fields is safe
- Adding **required** fields without defaults breaks existing records
- Changing field types may cause data loss
- Removing fields hides data from the interface but doesn't delete it

## Gotchas

- **Type-less means agent decides.** Extract Blueprint Components won't tell the agent what fields the structure should have. The agent must infer from the use case or ask the user.
- **Shared vs separate.** Multiple modules may need a data structure, but that doesn't mean they should share one. A data store and a webhook in the same scenario likely need different structures.
- **Data structures are team-level resources.** They're shared across scenarios in a team, so naming should be descriptive enough to avoid confusion.
- **Schema changes propagate.** Modifying a data structure affects every component using it. Plan changes carefully.


## Official Documentation

- [Data Structures](https://help.make.com/data-structures)

See also: [Data Stores](./data-stores.md) for creating data stores (which require a data structure), [Webhooks](./webhooks.md) for custom webhook data structures, [General Principles](./general-principles.md) for the overall workflow.
