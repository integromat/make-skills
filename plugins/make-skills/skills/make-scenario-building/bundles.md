---
name: bundles
description: Bundles are the unit of information transferred between modules in a Make scenario.
---

# Bundles

## What It Is

A bundle is the fundamental unit of data that flows through a Make scenario. Every piece of information transferred between modules is wrapped in a bundle. When a scenario executes, modules receive bundles as input, process them, and output bundles for the next module in the sequence.

## Key Properties

- A module can return **zero to N bundles** on its output.
- A module that returns **1 bundle** (e.g., "Create Customer") produces a single unit of data representing the created entity.
- A module that returns **multiple bundles** (e.g., "Search Rows") produces one bundle per result row. These modules behave as **implicit iterators** — see [Iterations](./iterations.md).
- Every downstream module in the scenario executes **once per incoming bundle**. If a search module returns 10 bundles, every subsequent module runs 10 times.

## Why It Matters

Understanding bundle behavior is critical for scenario composition:

1. **Execution multiplier**: Placing a multi-bundle module early in the scenario means all downstream modules execute N times. This affects both performance and API call counts.
2. **Iterator/Aggregator decisions**: If a module already returns multiple bundles (implicit iterator), you do NOT need an explicit Iterator. If you need to collapse multiple bundles back into one, you need an Aggregator — see [Aggregations](./aggregations.md).
3. **Module metadata**: Use the `app-module_get` MCP tool with `format: JSON` to check the `_annotations` field. This tells you whether a module returns multiple bundles (implicit iterator behavior).


## Flowchart Notation

In flowchart notation, bundle flow is implicit. When a module returns multiple bundles, annotate it:

```
Google Sheets - Search Rows (N bundles) → Slack - Send Message (runs per bundle)
```

## Official Documentation

- [Scenario Execution Cycles and Phases](https://help.make.com/scenario-execution-cycles-and-phases)
