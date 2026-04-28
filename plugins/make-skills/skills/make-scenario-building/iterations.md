---
name: iterations
description: Processing array data item-by-item in Make scenarios, via implicit or explicit iterators.
---

# Iterations

## What It Is

Iteration in Make is the process of handling arrays — when a service returns multiple objects and you need to process each one individually. It converts a single bundle containing an array into multiple bundles, one per array element.

## When to Use It

- A module returns a single bundle with an array field, and you need to process each array element independently.
- You need to "loop through" items from a list, split a batch, or fan-out processing.

## How It Works in Make

There are two types of iteration:

### Implicit Iterators

Some modules automatically return multiple bundles — one per result. These are typically search/list modules (e.g., "List Rows" from Google Sheets, "List Entries" from HubSpot, "List Items" from Monday). When you use these modules, you do NOT need an explicit Iterator — the module already splits results into individual bundles.

To check if a module is an implicit iterator, use the `app-module_get` MCP tool with `format: JSON`. The `_annotations` field in the response indicates whether the module returns multiple bundles.

### Explicit Iterator

The explicit Iterator module comes from the **built-in** app (`builtin:BasicFeeder`). Use it when:

- A module returns a single bundle containing an array field
- You need to map that array into the Iterator's input
- The Iterator then outputs one bundle per array element


## Flowchart Notation

**With implicit iterator (search module):**

```
Google Sheets - Search Rows (N bundles) → Slack - Send Message (per row)
```

**With explicit iterator:**

```
HTTP - Get Response → Iterator [items array] → Slack - Send Message (per item)
```

## Example

A scenario that gets an order (single bundle with line items array) and creates a Trello card for each line item:

```
Shopify - Get Order → Iterator [line_items] → Trello - Create Card (per item)
```

### Specialized Iterators

Many Make apps offer specialized iterator modules with simplified setup. For example, the Email app has an `Iterate attachments` module that splits email attachments into individual bundles without needing to manually specify the array
field. When available, prefer specialized iterators over the generic `builtin:BasicFeeder` — they're simpler to configure and produce richer output metadata.

Use `app_modules_list` to check if an app offers a specialized iterator before defaulting to the generic one.

### Repeater Module

The **Repeater** (`builtin:BasicRepeater`) is a related but distinct module. Unlike Iterator (which splits an existing array), Repeater generates N bundles from nothing — each containing an incrementing counter value `i`. Use it when you
need to repeat a task a fixed number of times (e.g., send 5 reminder emails with subjects "Reminder 1" through "Reminder 5").

## Gotchas

- **Don't add an Iterator after an implicit iterator.** If a module already returns multiple bundles (check `_annotations`), adding an Iterator is redundant and will cause errors or unexpected behavior.
- **Downstream execution multiplier.** Every module after an iteration point runs N times. Be aware of API rate limits and operation counts.
- **Pair with Aggregator if needed.** If you iterate and then need to collapse results back into a single bundle (e.g., send one summary email), you need an Aggregator — see [Aggregations](./aggregations.md).
- **Unmappable items after Iterator.** If the mapping panel after an Iterator only shows "Total number of bundles" and "Bundle order position" (no actual data fields), the upstream module hasn't been run yet. The user needs to run the
  scenario once (or "Run this module only" on the upstream module) so Make can learn the output structure.

## Official Documentation

- [Iterator](https://help.make.com/iterator)

See also: [Bundles](./bundles.md) for how bundle flow works, [Aggregations](./aggregations.md) for the inverse operation.

## Blueprint Example

```json
{
	"name": "ITERATION",
	"flow": [
		{
			"id": 3,
			"module": "util:SetVariable2",
			"version": 1,
			"parameters": {},
			"mapper": {
				"name": "array",
				"scope": "roundtrip",
				"value": "{{split(\"a,b,c,d\"; \",\")}}"
			},
			"metadata": {
				"designer": {
					"x": 0,
					"y": 0
				},
				"restore": {
					"expect": {
						"scope": {
							"label": "One cycle"
						}
					}
				},
				"expect": [
					{
						"name": "name",
						"type": "text",
						"label": "Variable name",
						"required": true
					},
					{
						"name": "scope",
						"type": "select",
						"label": "Variable lifetime",
						"required": true,
						"validate": {
							"enum": [
								"roundtrip",
								"execution"
							]
						}
					},
					{
						"name": "value",
						"type": "any",
						"label": "Variable value"
					}
				],
				"interface": [
					{
						"name": "array",
						"label": "array",
						"type": "any"
					}
				]
			}
		},
		{
			"id": 4,
			"module": "builtin:BasicFeeder",
			"version": 1,
			"parameters": {},
			"mapper": {
				"array": "{{3.array}}"
			},
			"metadata": {
				"designer": {
					"x": 300,
					"y": 0
				},
				"restore": {
					"expect": {
						"array": {
							"mode": "edit"
						}
					}
				},
				"expect": [
					{
						"name": "array",
						"type": "array",
						"label": "Array",
						"mode": "edit",
						"spec": []
					}
				]
			}
		},
		{
			"id": 5,
			"module": "util:FunctionIncrement",
			"version": 1,
			"parameters": {
				"reset": "scenario"
			},
			"mapper": {},
			"metadata": {
				"designer": {
					"x": 600,
					"y": 0
				},
				"restore": {
					"parameters": {
						"reset": {
							"label": "Never"
						}
					}
				},
				"parameters": [
					{
						"name": "reset",
						"type": "select",
						"label": "Reset a value",
						"required": true,
						"validate": {
							"enum": [
								"run",
								"execution",
								"scenario"
							]
						}
					}
				]
			}
		}
	],
	"metadata": {
		"instant": false,
		"version": 1,
		"scenario": {
			"roundtrips": 1,
			"maxErrors": 3,
			"autoCommit": true,
			"autoCommitTriggerLast": true,
			"sequential": false,
			"slots": null,
			"confidential": false,
			"dataloss": false,
			"dlq": false,
			"freshVariables": false
		},
		"designer": {
			"orphans": []
		},
		"zone": "eu1.make.com",
		"notes": []
	}
}
```