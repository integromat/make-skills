---
name: branching
description: Conditional branching using the If-Else module where only one branch executes per bundle.
---

# Branching

## What It Is

Branching uses the **If-Else module** to split the scenario flow into conditional branches where **only the first matching branch executes**. This works like a programming `if/else if/else` statement — conditions are evaluated in order, and the first match wins.

## When to Use It

- You need mutually exclusive logic: "If A, do X. Else if B, do Y. Otherwise, do Z."
- Only one path should execute per bundle.
- You want to converge the branches back into a single flow afterward — see [Merging](./merging.md).

## How It Works in Make

1. Place an **If-Else module** in the scenario flow.
2. Define conditions on each branch. Conditions are evaluated in order.
3. The **first branch whose condition matches** executes. All other branches are skipped.
4. Unlike Router, If-Else branches can be **merged back** using the Merge module, allowing the scenario to continue as a single flow after the conditional logic.

## Blueprint Structure

Internally, If-Else branching is represented as two consecutive modules in the top-level `flow` array: `builtin:BasicIfElse` immediately followed by `builtin:BasicMerge`.

The If-Else module contains a `branches` array. Each branch has a `label`, an optional `condition` (same format as filter conditions — the Else branch omits it), and a `flow` array holding the subflow of modules executed when that branch matches. These subflows are **nested inside the If-Else module**, not in the top-level flow.

**Execution:** the If-Else evaluates branch conditions in order, picks the first match, runs that branch's subflow, then returns to the top-level flow and continues with the Merge module.

```json
{
	"name": "BRANCHING",
	"flow": [
		{
			"id": 2,
			"module": "util:BasicTrigger",
			"version": 1,
			"metadata": {
				"designer": {
					"x": 0,
					"y": 150
				}
			}
		},
		{
			"id": 3,
			"module": "builtin:BasicIfElse",
			"version": 1,
			"mapper": null,
			"metadata": {
				"designer": {
					"x": 300,
					"y": 150
				}
			},
			"branches": [
				{
					"merge": true,
					"label": "Some Condition",
					"type": "condition",
					"flow": [
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
					"conditions": [
						[
							{
								"a": "a",
								"o": "text:equal",
								"b": "b"
							}
						]
					]
				},
				{
					"merge": true,
					"disabled": false,
					"label": "",
					"type": "else",
					"flow": [
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
									"x": 600,
									"y": 300
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
					]
				}
			]
		},
		{
			"id": 8,
			"module": "builtin:BasicMerge",
			"version": 1,
			"mapper": null,
			"metadata": {
				"designer": {
					"x": 900,
					"y": 150
				}
			},
			"outputs": [
				{
					"name": "a",
					"mappings": [
						"b",
						"c"
					]
				}
			],
			"filters": [
				null,
				null
			]
		},
		{
			"id": 9,
			"module": "util:GetVariable2",
			"version": 1,
			"parameters": {},
			"mapper": {
				"name": "x"
			},
			"metadata": {
				"designer": {
					"x": 1200,
					"y": 150
				},
				"restore": {},
				"expect": [
					{
						"name": "name",
						"type": "text",
						"label": "Variable name",
						"required": true
					}
				],
				"interface": [
					{
						"name": "x",
						"label": "x",
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

Key points:
- Branch subflows live inside `branches[].flow`, **not** in the top-level flow array.
- The Merge module sits in the top-level flow immediately after the If-Else module — modules after Merge run regardless of which branch was taken.
- The Else branch has no `condition` property.

### Key Difference from Routing

| | Router | If-Else |
|---|---|---|
| Multiple branches can fire | Yes | No — first match only |
| Can merge back | No | Yes (via Merge module) |
| Use case | Parallel processing paths | Mutually exclusive logic |
| Can nest inside each other | Yes | No — cannot place Router or another If-Else after an If-Else |

### Restrictions

- You **cannot** add a Router module or another If-Else module into the flow after an If-Else module (within the same If-Else scope).
- Each condition route has a label and a condition with one or more rules.
- The **Else** route has no condition — it runs when nothing else matches.

## Flowchart Notation

```
Trigger: Webhook → If-Else
  ├─ If (type = "order"): Process Order → Create Invoice
  ├─ Else If (type = "return"): Process Return → Issue Refund
  └─ Else: Log Unknown Type
→ Merge → Send Confirmation Email
```

## Example

Handling different support ticket priorities:

```
Zendesk - Watch Tickets → If-Else
  ├─ If (priority = "urgent"): Slack - Alert On-Call → PagerDuty - Create Incident
  ├─ Else If (priority = "high"): Slack - Post to #support-high
  └─ Else: Google Sheets - Add to Backlog
→ Merge → Zendesk - Update Ticket (mark as "triaged")
```

## Gotchas

- **Order matters.** The first matching condition wins. Place more specific conditions before general ones. The official docs emphasize: "Structure your conditions from most specific to least specific to ensure that the correct route runs."
- **Only one branch executes.** If you need multiple paths to fire for the same bundle, use Router instead — see [Routing](./routing.md).
- **Merge is optional.** You don't have to merge branches back. Without Merge, each branch simply ends independently (similar to Router behavior).
- **Do Nothing placeholder.** If a condition route lacks modules before connecting to Merge, Make displays a "Do Nothing" module as a placeholder; data still passes through.
- **Operations but no credits.** Both If-Else and Merge modules consume operations but do not consume credits.

## Official Documentation

- [If-Else and Merge](https://help.make.com/if-else-and-merge)

See also: [Routing](./routing.md) for multiple concurrent paths, [Merging](./merging.md) for converging branches, [Filtering](./filtering.md) for simple pass/block gates.
