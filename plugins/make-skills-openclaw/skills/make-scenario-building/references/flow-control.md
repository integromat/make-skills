---
name: flow-control
description: Designing anything past a straight line in the flat module grammar — filters, routers, if-else with merge, iterators, aggregators, the repeater, and variables — with the `parent`/`follows` placement and `config` each one takes.
---

# Flow control

Every shape below is expressed in the same flat module list `scenario_create` and `scenario_patch` take: a
module either `follows` another or starts an arm with `parent: {moduleId, kind, index}`. Nothing is ever
nested inside another module's JSON. `module_spec` confirms every module named here and its `config`.

## Bundles: why multiplicity matters

A module runs once per incoming item ("bundle"). Search and list modules return one bundle per result — they
are **implicit iterators**: everything after them already runs per item, so do not add an iterator. A module
that returns one bundle with an array inside needs an explicit iterator before per-item processing. Every
downstream module after an iteration point runs N times; an aggregator closes the loop back to one bundle.

## Filter — a gate on one module

```json
{ "id": 2, "module": "slack:CreateMessage", "follows": 1,
  "filter": { "name": "Paid orders only", "conditions": [[ { "a": "{{1.status}}", "o": "text:equal", "b": "paid" } ]] },
  "config": { "…": "…" } }
```

`conditions` is an array of arrays: outer entries OR-ed, inner AND-ed, each `{a, o, b}`. Operators are
typed by kind — `text:equal`, `text:notequal`, `text:contain`, `text:startwith`, `text:pattern`,
`number:equal`, `number:greater`, `number:less`, `number:greaterorequal`, `date:greater`, `date:less`,
`boolean:equal`, `array:contain`, `exist`, `notexist` (no `b` for the last two). A blocked item stops
there — every module downstream on that path skips it silently, with no error and no output.

Use a filter, not a router or if-else, when the only requirement is "proceed if…". Never put a filter on the
first module of an if-else branch: the engine deletes it. Put the condition on the branch instead.

## Router — every item goes down every arm

```json
{ "id": 2, "module": "builtin:BasicRouter", "version": 1, "follows": 1, "config": {} },
{ "id": 3, "module": "slack:CreateMessage", "parent": { "moduleId": 2, "kind": "route", "index": 0 },
  "filter": { "name": "High value", "conditions": [[ { "a": "{{1.amount}}", "o": "number:greater", "b": "1000" } ]] }, "config": { "…": "…" } },
{ "id": 4, "module": "google-sheets:addRow", "parent": { "moduleId": 2, "kind": "route", "index": 1 }, "config": { "…": "…" } },
{ "id": 5, "module": "google-drive:uploadAFile", "follows": 4, "config": { "…": "…" } }
```

- Arms are indexed from 0 with no gaps and run **sequentially in index order**; a filter on an arm's first
  module decides whether that arm runs for an item. Several arms can run for the same item.
- Routes never rejoin. A module on one route cannot reference a module on another.
- Use it for fan-out (log AND notify AND archive), not for a mutually exclusive choice — that is if-else.

## If-else and merge — the first matching arm runs, arms can rejoin

```json
{ "id": 2, "module": "builtin:BasicIfElse", "version": 1, "follows": 1, "config": {} },
{ "id": 3, "module": "slack:CreateMessage", "config": { "…": "…" },
  "parent": { "moduleId": 2, "kind": "branch", "index": 0, "label": "Urgent",
              "conditions": [[ { "a": "{{1.priority}}", "o": "text:equal", "b": "urgent" } ]], "mergesTo": 5 } },
{ "id": 4, "module": "google-sheets:addRow", "config": { "…": "…" },
  "parent": { "moduleId": 2, "kind": "branch", "index": 1, "label": "Everything else", "mergesTo": 5 } },
{ "id": 5, "module": "builtin:BasicMerge", "version": 1, "follows": 2, "config": {} },
{ "id": 6, "module": "zendesk:UpdateTicket", "follows": 5, "config": { "…": "…" } }
```

- Conditions are evaluated in index order; the first match wins. The last arm without `conditions` is the
  catch-all "else". Order arms from most to least specific.
- To continue as one flow after the branches, place `builtin:BasicMerge` directly after the if-else
  (`follows` the if-else id) and set `mergesTo` on every arm that rejoins. Modules after the merge reference
  the merge module's id. Leave `mergesTo` off and each arm simply ends.
- Merge's own `config.outputs`/`config.filters` (one entry per merging arm) normalize differing branch
  outputs; `{}`/`[]` passes the branch bundle through unchanged. Their length must match the number of
  merging arms — validation refuses a mismatch.
- A router or another if-else cannot follow an if-else inside the same branch scope.

## Iterator — one bundle per array item

```json
{ "id": 3, "module": "builtin:BasicFeeder", "version": 1, "follows": 2,
  "config": { "mapper": { "array": "{{2.attachments}}" } } }
```

Downstream modules reference the item's fields on the iterator's id (`{{3.fileName}}`). Many apps ship a
specialized iterator (e.g. an email app's "iterate attachments") — prefer it when `app_find` lists one.
`builtin:BasicRepeater` (`mapper: {start, repeats, step}`, output `i`) generates N bundles from nothing.

## Aggregators — many bundles back into one

The **feeder** is the module whose bundles start the loop (an iterator, or an implicit iterator such as a
search). It goes in `parameters.feeder`, as a module id. Bundles between the feeder and the aggregator are
not forwarded — anything needed downstream is collected explicitly in the aggregator's mapper.

| Need | Module | `config` | Output |
|---|---|---|---|
| Items into one array | `builtin:BasicAggregator` | `parameters.feeder`; `mapper` = the fields to keep per item (`{"email": "{{3.email}}"}`); `flags.groupBy` (IML, one output bundle per distinct value), `flags.stopIfEmpty` | `array` |
| Joined text | `util:TextAggregator` | `parameters.feeder`, `parameters.rowSeparator` (`"\n"`, `"\t"`, or `"other"` + `otherRowSeparator`); `mapper.value` | `text` |
| Sum / avg / count / min / max | `util:FunctionAggregator2` | `parameters.feeder`, `parameters.fn`; `mapper.value` | `result` |
| Rows into a table | `util:AggregateAggregator` | `parameters.feeder`; per `module_spec` | per `module_spec` |

Validation refuses a `feeder` that does not point at an upstream module. An iteration with no aggregator
means every module after it runs per item — deliberately fine for "notify per row", wrong for "send one
summary".

## Variables

`util:SetVariable2` (`mapper: {name, scope: "roundtrip" | "execution", value}`) stores a value the rest of the
run reads back as `{{<setVariableId>.<name>}}` or via `util:GetVariable2` (`mapper: {name}`). Rarely needed:
mapping straight from the upstream module is simpler and cheaper.

## Choosing

| Situation | Use |
|---|---|
| Skip items that do not match, nothing else to do | `filter` |
| Exactly one of several actions per item, then continue together | if-else + merge |
| Several independent actions, possibly all for one item | router |
| One bundle holding a list, act per element | iterator |
| Many bundles, one message / payload / total | aggregator |
| Repeat a fixed number of times | repeater |
