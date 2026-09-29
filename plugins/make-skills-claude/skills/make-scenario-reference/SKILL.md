---
name: make-scenario-reference
description: Load when a Make scenario tool answers 403, refuses a write for a reason you cannot explain, or no tool seems to cover the request — the shared conventions of environment_get, scenario_*, app_find, module_spec, module_field_resolve and connection_*.
metadata:
  version: "0.1.7" # x-release-please-version
---

# Make scenario-management tools — reference

This is Make's scenario-management tool surface. The tool descriptions say what each tool does; this skill
says what they all assume. The companion skills carry the four rules a routine task needs; come here when a
tool refuses something, answers 403, or a request seems to need a capability no tool covers — the answer is
often "this surface refuses that on purpose".

## Naming

Every tool is `{subject}_{action}`: `scenario_get`, `scenario_execution_inspect`, `module_spec`. Once you hold
a `scenarioId`, everything you can do with it starts with `scenario_`. A `_show` suffix is a UI twin that
returns byte-identical data and additionally renders a widget — use it only when the user asks to *see*
something, never during multi-step work. Names and schemas are permanent; a breaking change ships as a new
tool, which is why enums read slightly over-provisioned and output schemas are non-strict.

## Scopes: all-or-nothing

One bundle of OAuth scopes gates the whole surface. A connection missing any of them is rejected with 403 on
every request. A 403 therefore never means "this one tool needs more permission" — it means the user has to
reconnect the app and grant everything it asks for.

## Read `content`, not only the structured data

Data rides in `structuredContent`. `content` is empty or a short remark that the data cannot say on its own —
a truncation, an ingestion lag, why a list is empty, "the run is still executing". **Treat every remark as an
instruction.** A remark that explains an absence also says to mention it only if the user seems to be missing
something.

## Two layers, two read tools, one write tool

| layer | what it is | read | write |
|---|---|---|---|
| structure | modules, wiring, filters, trigger, schedule, declared inputs/outputs | `scenario_get` | `scenario_patch` structural operations |
| configuration | one module's `config` (`parameters`, `mapper`, `data`, `flags`, `restore`, …) | `scenario_module_get` | `scenario_patch` `module_config_set`; `scenario_create` items |

`scenario_get` is enough to explain what a scenario does. Call `scenario_module_get` only for the modules
whose values are the actual question — never for every module because the structural read omitted them. The
same restraint applies one level up: answer account-wide questions from `scenario_list`'s own fields and drill
into `scenario_get` for at most a few scenarios the user named or the list flagged.

## The write model: one call, one save

`scenario_create` and `scenario_patch` each make exactly one upstream write, after validating the whole
composed result. There is no draft to stage a multi-step edit in, so **everything one change needs goes in one
call**. A refusal (`errors` array) is a free dry run — nothing was written, every problem came back at once;
fix them all and resubmit. `scenario_patch` also refuses when the scenario changed since the `lastEdit` you
passed: re-read and retry, never guess at what changed.

## What the surface refuses to author, and how to say so

A scenario can *use* things this surface cannot *create*; reads describe them, writes refuse them by name and
point at the Make editor. Relay the refusal as a boundary, not a bug to route around:

- **Data stores and custom IML functions** — readable and debuggable, not creatable.
- **Data structures (UDTs)** — reads work; creating one is not available.
- **Incomplete-execution (DLQ) fix-and-retry** — Make's own UI is the path.
- **The blueprint version a past run executed** — compare `scenario_get`'s `lastEdit` with the execution's
  `startedAt` before blaming the current configuration for an old failure; nothing enforces this for you.
- **Drafts/publish and connection re-authorization** — point at the editor.

Do not extend the list by assumption: app-specific instant triggers, error handlers, agents and subscenarios
*are* supported. When unsure, `module_spec` the module — it reports what the module needs, including whether a
webhook can be created for it.

## State a guess before acting on it

A relative date, "the Sales channel", a scenario named descriptively — when a write or a run would accept
whatever you resolve it to, say what you resolved it to *before* that call, not in the closing summary. Where a
wrong guess is refused for free and the answer comes back (`module_field_resolve`, `scenario_run` naming the
declared interface), resolving first and disclosing after is fine.

## Lists are capped, never paged

`scenario_list`, `scenario_execution_list` and option lists cap at 25 rows and take narrowing filters, not
offsets. Ask a narrower question; do not try to page through hundreds of rows.

## Vocabulary

A team typed `"private"` is a **private space** — Make's term for a member's single-person workspace. "My
personal account/team" means that id; say "private space" back.

## Companion skills

- `make-scenario-explore` — orienting, listing, explaining an existing scenario, account-wide checks.
- `make-scenario-building` — finding modules, connections, creating and editing scenarios.
- `make-scenario-operations` — running, activating, and debugging runs and webhooks.
- `make-api-shell` — a reusable API-call or HTTP scenario used as a retrieval transport into a SaaS account.
