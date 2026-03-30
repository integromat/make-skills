---
name: mapping
description: The mapper domain in Make module configuration — discovering upstream module outputs, referencing fields via module IDs, static vs dynamic output schemas, and building mapper objects.
---

# Mapping

## What It Is

Mapping is how data flows between modules in a Make scenario. The **mapper** domain of a module's configuration holds dynamic values — IML expressions that reference upstream module outputs, apply transformations, and build the input data the module needs at runtime.

## The Mapper vs Parameters

- **Mapper**: dynamic values evaluated at runtime. References to upstream modules (`{{1.email}}`), IML functions, conditional logic.
- **Parameters**: static values baked in at design time. Connection IDs, dropdown selections, resource IDs.

Placing a value in the wrong domain causes validation errors. The module interface (from `app-module_get` with instructions format) specifies which fields belong in the mapper.

## Module ID References

Mapper values reference upstream modules by their **blueprint-assigned module ID** — a unique numeric identifier in the blueprint.

**Syntax:** `{{moduleId.fieldName}}`

- `{{1.email}}` — the `email` field from module with ID 1
- `{{3.items[1].name}}` — the first item's `name` in the `items` array from module 3
- `{{5.status}}` — the `status` field from module 5

**Module IDs are not sequential positions** — they are the `id` property assigned to each module in the blueprint. When generating a new blueprint, assign unique numeric IDs (no duplicates). When editing an existing blueprint, use the IDs already present.

### Full Bundle Reference

To reference the **entire output bundle** of a module (not a specific field), wrap the module ID in backticks: `{{\`1\`}}`.

A bare `{{1}}` without backticks **will not work** — IML cannot parse a bare numeric ID. The backtick rule applies because the module ID is a number. Use this when a field expects the complete module output as a single object (e.g., passing an entire bundle to JSON stringify, Set Variable, or an HTTP request body).

## Discovering Upstream Module Outputs

To know what fields are available for mapping, the agent must learn the output schema of every upstream module. This is done module by module, left to right, as part of the configuration process.

### Static Output Schemas

When `app-module_get` returns a static output schema (no RPCs), the available fields are directly readable. Use them as mapping targets in downstream modules.

### Dynamic Output Schemas (RPCs)

Some modules have outputs that depend on their configuration — for example:
- A Google Sheets module's output columns depend on which spreadsheet/sheet is selected
- A data store module's output fields depend on the data structure attached to the store
- A form retrieval module's output depends on which form is selected

In these cases, the output schema from `app-module_get` contains **RPC references** instead of static field definitions. To resolve them:

1. **Merge the module's parameters and mapper** into a single flat data object.
2. **Execute the output RPC** via `rpc_execute`, passing the merged data. The RPC uses the module's configured inputs (e.g., the selected spreadsheet ID) to determine what the output will be.
3. **The RPC returns the dynamic output schema** — the actual fields the module will produce at runtime.

**Important:** This is why modules must be configured left to right. The output schema of a module depends on its configuration, and downstream modules need that schema to set up their mapping.

### Memorize Module Outputs

Track every module's resolved output schema as configuration progresses. Downstream modules may reference any upstream module's output — not just the immediately preceding one.

## Building the Mapper Object

The mapper is a JSON object where keys are the target module's input field names and values are IML expressions:

```json
{
  "name": "{{1.firstName}} {{1.lastName}}",
  "email": "{{1.email}}",
  "status": "active",
  "created": "{{formatDate(now; \"YYYY-MM-DD\")}}"
}
```

- **Mapped values**: IML expressions referencing upstream outputs (`{{1.email}}`)
- **Static values**: Literal strings, numbers, booleans (valid in mapper when no upstream data is needed)
- **Transformed values**: IML functions applied to upstream data (`{{upper(1.name)}}`)
- **Nested structures**: Collections and arrays following the module's input schema

See [IML Expressions](./iml-expressions.md) for the full expression language.

## Gotchas

- **Module IDs must be unique.** When generating blueprints, never assign the same ID to two modules. When editing existing blueprints, preserve existing IDs.
- **Output RPCs need merged data.** When executing output schema RPCs, always pass the merged parameters + mapper as the data object. Without this, the RPC can't determine the dynamic output.
- **Static values in mapper are valid** but uncommon. If a field always has the same value and doesn't need upstream data, it can still go in the mapper — but check whether it belongs in parameters instead.
- **Array indexing is 1-based.** `{{1.items[1]}}` is the first item, not `{{1.items[0]}}`. Using index 0 will not work.
- **Backtick rule for special field names.** If a field name contains spaces or special characters, wrap it in backticks: `{{1.\`Customer Name\`}}`. See [IML Expressions](./iml-expressions.md) for details.


## Official Documentation

- [Mapping](https://help.make.com/mapping)
- [Mapping Arrays](https://help.make.com/mapping-arrays)

See also: [IML Expressions](./iml-expressions.md) for the formula language, [Filtering](./filtering.md) for conditions that use mapped values, [General Principles](./general-principles.md) for the full configuration workflow.
