---
name: templates-lookup
description: How to find public Make templates that match a planned scenario, then study their blueprints as canonical references for module versions, mapper shapes, parameter conventions, and source-module bindings (especially aggregator feeders).
---

# Templates Lookup

> **Local shortcut:** the top-10-by-usage templates are checked into [examples/popular-templates/](./examples/popular-templates/) (each file is the full API response). For common asks — AI enrichment of Sheets rows, webhook → Sheets, chatbot reply, attachment iteration, multi-platform fanout — read those first and skip the `public-templates_list` / `public-templates_get-blueprint` round-trip. See [blueprint-construction.md](./blueprint-construction.md) for the pattern → file mapping.

## What It Does

Searches Make's public template library for scenarios similar to the one being designed, fetches the closest match's full blueprint, and uses it as a structural reference. Templates surface canonical module versions, mapper shapes, and aggregator/feeder bindings that aren't visible from `app-module_get` alone — and they save the agent from guessing parameter shapes that the live API will reject at runtime.

## When to Use

**Recommended whenever the planned flow includes:**

- An aggregator (`util:TextAggregator`, `builtin:BasicAggregator`, `util:FunctionAggregator2`, `util:AggregateAggregator`)
- A Make AI Tools module or any AI provider module
- An app the agent has not configured earlier in the session
- Multi-module composition (more than 2-3 modules, branching, iteration)

**Skip allowed for** single-module trigger → single-action flows with well-known apps and no aggregation/AI (e.g., webhook → Slack message, HTTP request → Google Sheets row).

## How to Look Up

Mirrors the chain format of `quick-patterns.md`:

```
1. public-templates_list      → Search by name + usedApps (apps from Phase 1 Step 2)
2. (pick best match)          → Highest `usage` with most `usedApps` overlap
3. public-templates_get-blueprint → Fetch the full blueprint
4. (parse the blueprint)      → Extract canonical patterns (see "What to extract")
```

**Step 1 — search:** Pass `name` (use-case keywords, not the literal user prompt) AND `usedApps` (slug list from Step 2). Example: `name: "summarize emails", usedApps: ["google-email", "slack"]` returned template 14916 ("Summarize emails with Gmail and Make AI Tools then send it on Slack").

If the first call returns empty, broaden — drop one app from `usedApps`, or try a synonym (`digest`, `daily summary`, `notify`). Don't filter `usedApps` too aggressively; templates often include builtins (`builtin`, `util`) that won't appear in your Phase 1 list.

**Step 4 — what to extract from the blueprint:**

| Pattern | Where to look |
|---|---|
| Per-module `version` (often differs from app version) | `flow[].version` |
| Required parameter shapes | `flow[].parameters` |
| Mapper field names + IML expression style | `flow[].mapper` |
| Aggregator source binding | `flow[].parameters.feeder: <id>` |
| Connection account types | `flow[].metadata.parameters[].type` (e.g. `account:google-restricted` vs `account:google-email`) |
| Slack channel-selection chain | `channelWType` → `channelType` → `idType` → `channel` (one resolves to the next) |
| Default/optional flags | `flow[].mapper.parse`, `mrkdwn`, `link_names`, etc. |

## Mapping Template Patterns to User Requirements

A template's pattern often differs from the user's exact ask. Common divergences:

- **Per-item loop vs aggregated digest** — most "summarize" templates iterate one-summary-per-item; users frequently want a single combined digest. Adapt by inserting a Text Aggregator between source and AI module.
- **Polling trigger vs scheduled action** — templates often start with `Watch X` polling triggers; users wanting daily fixed-time runs need a search action + scenario-level scheduling.
- **Per-message vs single-message Slack output** — templates loop and send N messages; users may want one consolidated message.

**Rule:** Use the template as a STRUCTURAL reference (module versions, parameter shapes, connection types), not as the literal blueprint to copy. Surface the diffs to the user during Phase 1 Step 3 confirmation so they can confirm the adaptation before deployment.

## Persisting Blueprints Across the Session

For long debug sessions, save the chosen blueprint to `/tmp` as JSON with key takeaways:

```
/tmp/make-template-<id>-reference.json
```

Include the original blueprint, plus a short `_keyTakeaways` array calling out the patterns to copy and the patterns to swap. Re-read this file later in the session instead of re-querying the MCP — `public-templates_get-blueprint` is rate-affecting and intermittently fails (see workarounds below).


## Official Documentation

- [Make Templates](https://www.make.com/en/templates)

See also: [SKILL.md](./SKILL.md) Phase 1 Step 2.5, [Quick Patterns](./quick-patterns.md), [make-module-configuring/aggregators](../make-module-configuring/aggregators.md) for `parameters.feeder` details.
