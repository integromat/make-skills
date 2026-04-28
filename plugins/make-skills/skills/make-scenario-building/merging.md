---
name: merging
description: Converging If-Else branches back into a single flow using the Merge module.
---

# Merging

## What It Is

The Merge module converges branches created by the If-Else module back into a single flow. After the merge point, the scenario continues as a linear sequence regardless of which branch was taken.

## When to Use It

- You used If-Else branching and need the scenario to continue with common steps after the conditional logic.
- Example: Different processing per ticket type, but all tickets get a confirmation email afterward.

## How It Works in Make

1. Create an If-Else branching structure — see [Branching](./branching.md).
2. Place a **Merge module** after the branches.
3. All branches connect into the Merge module.
4. The output bundle from whichever branch executed flows through the Merge and into subsequent modules.

### Compatibility

- **Works with:** If-Else module branches only.
- **Does NOT work with:** Router routes. Router routes cannot be merged — they remain independent forks permanently.

## Blueprint Structure

In the blueprint JSON, `builtin:BasicMerge` sits in the top-level `flow` array immediately after `builtin:BasicIfElse`. It receives the output from whichever branch executed.

```json
{
  "id": 8,
  "module": "builtin:BasicMerge",
  "version": 1,
  "mapper": null,
  "metadata": { "designer": { "x": 900, "y": 150 } },
  "filters": [null, null],
  "outputs": []
}
```

Key fields:
- **`filters`** — Array with one entry per branch on the preceding If-Else module. Use `null` for no filter (pass-through). To conditionally filter a branch's output at merge time, replace `null` with a filter object.
- **`outputs`** — Output mappings array. Use `[]` for simple pass-through (the bundle from the branch flows through unchanged).
- **`mapper`** — Always `null` for BasicMerge.

The number of entries in `filters` must match the number of branches on the If-Else module. For example, an If-Else with 3 branches (two conditions + else) requires `"filters": [null, null, null]`.

## Flowchart Notation

```
If-Else
  ├─ If (condition A): Module X
  └─ Else: Module Y
→ Merge → Module Z (runs regardless of which branch was taken)
```

## Example

```
Webhook → If-Else
  ├─ If (source = "Shopify"): Transform Shopify Data
  └─ Else: Transform Generic Data
→ Merge → CRM - Create Contact → Email - Send Welcome
```

Both branches produce a normalized contact bundle; after Merge, the same CRM and Email modules process it.

## Gotchas

- **Router routes cannot merge.** This is the most common mistake. If you need convergence, use If-Else + Merge, not Router. For Router workarounds, see the Converger concept in [Routing](./routing.md).
- **Bundle continuity.** The bundle that exits Merge is the output of whichever branch executed. Ensure both branches produce compatible data for downstream modules.
- **Credits.** The Merge module uses operations but does not consume credits.

## Official Documentation

- [If-Else and Merge](https://help.make.com/if-else-and-merge)
- [Converger](https://help.make.com/converger)

See also: [Branching](./branching.md) for If-Else usage, [Routing](./routing.md) for non-mergeable parallel routes.
