---
name: aggregators
description: Configuring aggregator modules in Make — feeder and target parameters, two aggregator variants (with target vs multiselect), flags (groupBy, stopIfEmpty), and aggregator types.
---

# Aggregators

## What It Is

An aggregator collapses multiple bundles into a single bundle. It collects items from a loop (iterator or multi-bundle source) and produces one combined output — an array, concatenated text, a sum, or a table. Aggregators require special
configuration beyond the standard parameters and mapper.

## When It's Needed

- Collecting iterated items back into a single array
- Joining text from multiple bundles
- Summing, averaging, or counting numeric values across bundles
- Building a table from multiple rows

## Aggregator Types

| Need                         | Module              | Package |
|------------------------------|---------------------|---------|
| Collect items into array     | BasicAggregator     | builtin |
| Join text with separator     | TextAggregator      | util    |
| Sum/avg/count numbers        | FunctionAggregator2 | util    |
| Build table (rows + columns) | AggregateAggregator | util    |

## Configuration Structure

Aggregators use three domains in the blueprint:

### Parameters

| Field    | Type    | Description                                                                                                                                                       |
|----------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `feeder` | integer | **Required.** Module ID of the data source that starts the loop (an Iterator, or any module that produces multiple bundles).                                      |
| `target` | string  | Optional. Points to a downstream module's data structure for structured mapping. Format: `moduleId.path` (e.g., `5.items`). Empty when using multiselect variant. |

### Mapper

What goes in the mapper depends on the variant (see below).

### Flags

| Flag          | Type     | Description                                                                                                                |
|---------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| `groupBy`     | text/IML | Expression for grouping items into separate aggregations. When set, produces one aggregated bundle per unique group value. |
| `stopIfEmpty` | boolean  | Whether to stop processing if the aggregation produces no items.                                                           |

## Two Variants

### Variant A: Without Target (Multiselect)

Used when the aggregator has no downstream target structure defined. The mapper contains direct field references from the feeder module:

```json
{
	"parameters": {
		"feeder": 2
	},
	"mapper": {
		"email": "{{2.email}}",
		"name": "{{2.name}}",
		"id": "{{2.id}}"
	},
	"flags": {
		"stopIfEmpty": false
	}
}
```

Each mapper entry selects a field from the feeder's output to include in the aggregated array. The keys become the field names in the resulting array items.

### Variant B: With Target (Structured Mapping)

Used when the aggregator maps into the data structure expected by a downstream module. The `target` parameter points to the downstream module and path:

```json
{
	"parameters": {
		"feeder": 1,
		"target": "5.headers"
	},
	"mapper": {
		"name": "{{1.headerName}}",
		"value": "{{1.headerValue}}"
	},
	"flags": {
		"stopIfEmpty": true,
		"groupBy": "{{1.category}}"
	}
}
```

The mapper structure matches the target module's expected input schema at the specified path. The aggregator produces output that fits directly into the downstream module's field.

## Configuration Order Exception

Aggregators are the exception to the "configure left to right" rule:

1. **First:** Configure the **target module** (after the aggregator) to the extent possible without aggregated data — so its input schema is known.
2. **Then:** Configure the **aggregator** — set the feeder, target (if applicable), and mapper fields.
3. **Finally:** Return to the target module to complete any mapping that depends on the aggregated output.

This back-and-forth is necessary because the aggregator's target variant needs to know the downstream module's expected structure.

## Gotchas

- **Feeder is required.** Every aggregator must specify which module feeds it. Without a feeder, the aggregator doesn't know which loop to collect from.
- **Don't confuse feeder with source module ID in mapper.** The `feeder` parameter identifies the loop source. The mapper references (e.g., `{{2.email}}`) use the module ID of the module whose output fields are being collected — these are
  often the same module, but not always.
- **Empty aggregations.** If the feeder produces zero bundles, the aggregator produces nothing by default. Use `stopIfEmpty: true` to halt the scenario, or handle the empty case downstream.
- **groupBy creates multiple outputs.** When `groupBy` is set, the aggregator produces one bundle per unique group value instead of one single bundle. Downstream modules execute once per group.
- **Target must exist first.** When using the target variant, the downstream module must be in the blueprint and its input schema must be resolvable before the aggregator can be configured.
- **Data accessibility after aggregation.** Bundles from the source module and any modules between the source and the aggregator are not outputted by the aggregator — their items are not accessible by downstream modules. To preserve intermediate data post-aggregation, explicitly include it in the aggregator's configuration fields (e.g., "Aggregated fields" in Array aggregator).
- **Archive aggregator.** `Archive > Create an archive` is also an aggregator — it collects files and outputs a ZIP file.

## Official Documentation

- [Aggregator](https://help.make.com/aggregator)

See also: [Mapping](./mapping.md) for how mapper references work, [IML Expressions](./iml-expressions.md) for expressions in groupBy and mapper values, [General Principles](./general-principles.md) for the overall configuration workflow.

## Blueprint Example

```json
{
	"name": "AGGREGATION",
	"flow": [
		{
			"id": 3,
			"module": "builtin:BasicRepeater",
			"version": 1,
			"parameters": {},
			"mapper": {
				"start": "1",
				"repeats": "10",
				"step": "1"
			},
			"metadata": {
				"designer": {
					"x": 0,
					"y": 0
				},
				"restore": {},
				"expect": [
					{
						"name": "start",
						"type": "number",
						"label": "Initial value",
						"required": true
					},
					{
						"name": "repeats",
						"type": "number",
						"label": "Repeats",
						"validate": {
							"min": 0,
							"max": 10000
						},
						"required": true
					},
					{
						"name": "step",
						"type": "number",
						"label": "Step",
						"required": true
					}
				]
			}
		},
		{
			"id": 6,
			"module": "util:FunctionIncrement",
			"version": 1,
			"parameters": {
				"reset": "scenario"
			},
			"mapper": {},
			"metadata": {
				"designer": {
					"x": 300,
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
		},
		{
			"id": 8,
			"module": "builtin:BasicAggregator",
			"version": 1,
			"parameters": {
				"feeder": 3
			},
			"mapper": {
				"i": "{{6.i}}"
			},
			"metadata": {
				"designer": {
					"x": 600,
					"y": 0
				},
				"restore": {
					"extra": {
						"feeder": {
							"label": "Repeater [3]"
						},
						"target": {
							"label": "Custom"
						}
					}
				}
			}
		},
		{
			"id": 9,
			"module": "util:SetVariable2",
			"version": 1,
			"parameters": {},
			"mapper": {
				"name": "array",
				"scope": "roundtrip",
				"value": "{{8.array}}"
			},
			"metadata": {
				"designer": {
					"x": 900,
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

```json
{
	"name": "TEXT AGGREGATION",
	"flow": [
		{
			"id": 2,
			"module": "util:BasicTrigger",
			"version": 1,
			"parameters": {
				"values": [
					{
						"spec": [
							{
								"name": "text",
								"value": "a"
							}
						]
					},
					{
						"spec": [
							{
								"name": "text",
								"value": "b"
							}
						]
					},
					{
						"spec": [
							{
								"name": "text",
								"value": "c"
							}
						]
					}
				]
			},
			"mapper": {},
			"metadata": {
				"designer": {
					"x": 0,
					"y": 0
				},
				"restore": {
					"parameters": {
						"values": {
							"items": [
								{
									"spec": {
										"mode": "chose",
										"items": [
											null
										]
									}
								},
								{
									"spec": {
										"mode": "chose",
										"items": [
											null
										]
									}
								},
								{
									"spec": {
										"mode": "chose",
										"items": [
											null
										]
									}
								}
							]
						}
					}
				},
				"parameters": [
					{
						"name": "values",
						"type": "array",
						"label": "Bundles",
						"required": true,
						"spec": [
							{
								"name": "spec",
								"label": "Items",
								"type": "array",
								"required": true,
								"spec": [
									{
										"name": "name",
										"label": "Name",
										"required": true,
										"type": "text"
									},
									{
										"name": "value",
										"label": "Value",
										"required": true,
										"type": "text"
									}
								]
							}
						]
					}
				],
				"interface": [
					{
						"name": "text",
						"label": "text",
						"type": "text"
					}
				]
			}
		},
		{
			"id": 4,
			"module": "util:TextAggregator",
			"version": 1,
			"parameters": {
				"rowSeparator": "",
				"feeder": 2
			},
			"mapper": {
				"value": "{{2.text}}"
			},
			"metadata": {
				"designer": {
					"x": 300,
					"y": 0
				},
				"restore": {
					"parameters": {
						"rowSeparator": {
							"label": "Empty"
						}
					},
					"extra": {
						"feeder": {
							"label": "Tools - Basic trigger [2]"
						}
					}
				},
				"parameters": [
					{
						"name": "rowSeparator",
						"type": "select",
						"label": "Row separator",
						"validate": {
							"enum": [
								"\n",
								"\t",
								"other"
							]
						}
					}
				],
				"expect": [
					{
						"name": "value",
						"type": "text",
						"label": "Text"
					}
				]
			}
		},
		{
			"id": 5,
			"module": "util:SetVariables",
			"version": 1,
			"parameters": {},
			"mapper": {
				"variables": [
					{
						"name": "sentence",
						"value": "{{4.text}}"
					}
				],
				"scope": "roundtrip"
			},
			"metadata": {
				"designer": {
					"x": 600,
					"y": 0
				},
				"restore": {
					"expect": {
						"variables": {
							"items": [
								null
							]
						},
						"scope": {
							"label": "One cycle"
						}
					}
				},
				"expect": [
					{
						"name": "variables",
						"type": "array",
						"label": "Variables",
						"spec": [
							{
								"name": "name",
								"label": "Variable name",
								"type": "text",
								"required": true
							},
							{
								"name": "value",
								"label": "Variable value",
								"type": "any"
							}
						]
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
					}
				],
				"interface": [
					{
						"name": "sentence",
						"label": "sentence",
						"type": "any"
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