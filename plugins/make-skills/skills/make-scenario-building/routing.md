---
name: routing
description: Splitting scenario flow into multiple independent routes using the Router module.
---

# Routing

## What It Is

Routing splits a scenario flow into multiple independent routes using the Router module (`builtin:BasicRouter`). Each route is a separate sequence of modules that processes the same incoming bundle(s). Multiple routes can execute for the same bundle.

## When to Use It

- You need **multiple distinct execution paths** that can each process the same data independently.
- Different conditions require different processing, and more than one condition can be true at once.
- Example: "If status is 'New', send to Slack AND if priority is 'High', also send email alert" — both can fire for the same bundle.

## How It Works in Make

1. Place a **Router module** (`builtin:BasicRouter`) in the scenario flow.
2. After the Router, create separate routes — each is an independent sequence of modules.
3. Control which bundles take which route using **input filters** on the first module of each route — see [Filtering](./filtering.md).
4. Routes execute **sequentially, top to bottom**. Route 1 finishes entirely before Route 2 begins. They are **never** run in parallel.
5. Multiple routes can execute for the same bundle (unlike If-Else branching).

### Cross-Branch Data Isolation

Modules on separate routes **cannot reference each other's data directly**. A module on Route A cannot map `{{moduleOnRouteB.field}}`. If you need data from multiple routes to converge, use the **Merge module** instead — see [Merging](./merging.md) and [Branching](./branching.md) (Merge only works with If-Else, not Router).

**Important:** Routes created by Router **cannot be merged back**. Once the flow splits via Router, the routes remain independent for the rest of the scenario.

## Flowchart Notation

```
Trigger: Webhook → HTTP - Get Data → Router
  ├─ Route 1 (status = "new"): Slack - Send Message → Google Sheets - Add Row
  ├─ Route 2 (priority = "high"): Email - Send Alert
  └─ Route 3 (fallback): Logger - Log Entry
```

## Example

Processing incoming orders where high-value orders get special handling while all orders get logged:

```
Shopify - Watch Orders → Router
  ├─ Route 1 (amount > 1000): Slack - Notify Sales Team → CRM - Flag Account
  ├─ Route 2 (all orders): Google Sheets - Log Order
  └─ Route 3 (international): Email - Notify Shipping
```

An order worth $1500 from abroad would trigger Routes 1, 2, AND 3.

### Fallback Route

A fallback route is a special route that only executes when no other route's filter matched. It always runs last, regardless of its position. Use it for default/catch-all behavior (e.g., log unexpected data).

### Route Ordering

Routes execute in a defined order. Route order matters because all matching routes execute sequentially, and side effects from earlier routes happen first.

## Gotchas

- **Cannot merge back natively.** Router routes are permanent forks. If you need convergence, use If-Else + Merge instead — see [Branching](./branching.md).
- **Sequential execution.** Despite being "parallel" paths, routes run top-to-bottom sequentially. Route 1 completes before Route 2 starts.
- **Cross-branch isolation.** No direct data sharing between routes. Don't try to reference module output from another route.
- **Filter vs Router decision.** If you only need a simple yes/no gate on a single path (e.g., "only process if field X exists"), use a Filter instead — see [Filtering](./filtering.md). Router is for when you need multiple distinct paths.
- **Select whole branch.** You can select all modules in a route at once for copy/delete operations.

## Official Documentation

- [Router](https://help.make.com/router)

See also: [Branching](./branching.md) for If-Else (mutually exclusive branches), [Filtering](./filtering.md) for controlling bundle flow, [Merging](./merging.md) for converging branches.

# Blueprint Example

```json
{
	"name": "ROUTING",
	"flow": [
		{
			"id": 1,
			"module": "util:BasicTrigger",
			"version": 1,
			"parameters": {
				"values": [
					{
						"spec": [
							{
								"name": "a",
								"value": "b"
							}
						]
					}
				]
			},
			"mapper": {},
			"metadata": {
				"designer": {
					"x": 0,
					"y": 300
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
						"name": "a",
						"label": "a",
						"type": "text"
					}
				]
			}
		},
		{
			"id": 2,
			"module": "builtin:BasicRouter",
			"version": 1,
			"mapper": null,
			"metadata": {
				"designer": {
					"x": 300,
					"y": 300
				}
			},
			"routes": [
				{
					"flow": [
						{
							"id": 3,
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
					]
				},
				{
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
				},
				{
					"flow": [
						{
							"id": 7,
							"module": "util:FunctionIncrement",
							"version": 1,
							"parameters": {
								"reset": "scenario"
							},
							"mapper": {},
							"metadata": {
								"designer": {
									"x": 600,
									"y": 600
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