---
name: mapping
description: How a module's mapper references upstream data — module-id references, the trigger-output rule for webhook and on-demand scenarios, whole-bundle and array syntax, and the gotchas that pass validation and fail at run time.
---

# Mapping

## The one reference form

A `config.mapper` value is an IML expression that references an upstream module's output **by that
module's `id`** — the id assigned in the flat module list:

- `{{1.email}}` — field `email` from module 1
- `{{3.items[1].name}}` — first item's `name` in module 3's `items` array (indexing is **1-based**)
- `{{1.\`Customer Name\`}}` — a field with spaces or special characters, in backticks
- `` {{`1`}} `` — module 1's **whole output bundle** (a bare `{{1}}` does not parse)

There is no `{{input.x}}`, `{{trigger.x}}`, or bare `{{x}}`. Those silently resolve to nothing rather than
erroring — the most common wrong guess on this surface.

## The trigger owns the run's input

Whatever module holds `root: "main"` receives the run's injected data as **its own output bundle**: a
webhook's parsed payload, or an on-demand scenario's declared `interface.input` values. Reference it by that
module's id like any other: if `scenario-service:StartSubscenario` is id 1 and the scenario declares an input
`city`, the reference is `{{1.city}}`. See [Subscenarios](./subscenarios.md) for why the root of an
on-demand scenario has to be a real starter module for this to work at all.

## Knowing what is available to map

`module_spec(schemas: true)` returns `outputSchema` — the fields one produced item carries, when known
statically. That covers most action and search modules.

Some modules' output depends on their own configuration (a Google Sheets trigger's columns depend on the
selected sheet; a webhook's fields on what was sent). For those `outputSchema` is absent and **no tool on this
surface pre-resolves output field names** — `module_field_resolve` resolves input paths only. Options:

- map the fields the app is known to produce (Sheets: `` {{1.`0`}} `` for column A — see
  [App gotchas](./app-gotchas.md)), then run once and confirm;
- for a webhook, learn the payload first (`scenario_trigger_learn` → `scenario_trigger_inspect`);
- build, run once, read the real bundle with `scenario_execution_module_get`, then fix the mapper.

## Mixing literals and references

```json
{
  "city": "{{1.city}}",
  "greeting": "Hello, {{1.name}}!",
  "status": "active",
  "processedAt": "{{formatDate(now; \"YYYY-MM-DD\")}}"
}
```

A fixed value usually belongs in `config.parameters` if `configurationSchema` lists it there; `mapper` is for
values that vary per item. Functions and operators are in [IML functions](./iml-functions.md).

## Gotchas that validation does not catch

- **Empty string is a write.** On update-style modules, omit a key you do not intend to touch — `""` writes an
  empty value downstream. `module_config_set` replaces the whole `mapper` domain you send, so rebuild it from
  `scenario_module_get`'s copy, not from memory.
- **Removing or moving a module strands its references.** Every `{{<id>.field}}` pointing at it stops
  resolving with no error. Fix them in the same `scenario_patch`.
- **Cross-arm references do not resolve.** A module on one router route cannot read a module on another route
  — only what ran upstream of it in the same path.
- **Array into a single-value field** — use `first()`, `last()`, or an index; a field that expects one value
  receiving an array is a run-time failure, not a validation error.
