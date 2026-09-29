---
name: make-scenario-explore
description: Use when orienting in a Make account — listing organizations, teams and scenarios, explaining what an existing scenario does, checking connection health, auditing several scenarios. Not for creating, editing, running or debugging.
metadata:
  version: "0.1.7" # x-release-please-version
---

# Make scenarios — orienting and explaining

The read-only path from "what does this account have" to "explain this scenario" — the entry point of almost
every conversation, and the tool of choice for a non-technical question about an automation.

**Ground rules.** A 403 means the whole connection must be re-authorized with every permission — never one
tool. A `content` remark on a result is an instruction, not decoration. Say what you resolved an ambiguous
value to before the call that acts on it. The refusal contract and the rest: `make-scenario-reference`, when
something is refused or no tool seems to fit.

## Start with `environment_get`

Always first, no arguments: every organization and team the connection reaches, including private spaces,
and the `zone` needed for `https://<zone>.make.com/<teamId>/scenarios/<id>` links. An organization-bound
connection sees one organization and a remark counts the rest — mention that only if the user expects
something that is not there.

## Finding a scenario

`scenario_list` returns at most 25, most recently edited first. Omitting `status` returns every status — it
is not a hidden "active only" filter. Its `trigger` is coarse (`instant`/`scheduled`/`on-demand`); the
webhook-vs-polling distinction lives in `scenario_get`. Narrow by name, folder or status rather than paging.
`scenario_folder_list` only when the user refers to a folder. `scenario_list_show` only when they ask to see
the list rendered.

## Explaining one scenario

`scenario_get` is **enough by itself**: every module in flow order, nesting via `parent` (router arms,
if-else branches, error handlers, agent tools), filters, trigger and schedule, connection health, declared
inputs and outputs. It omits each module's `config` on purpose — do not read that as incomplete, and do not
fan `scenario_module_get` across every module. Call `scenario_module_get` (with `config: true`) only when a
specific value is the question: which spreadsheet, what the message says, how a field is computed.

How to read a few fields for a non-technical user:

- **`trigger.kind`** decides what "make it run" means: `webhook` → give a URL to post to; `polling` /
  `scheduled` → it runs on its schedule; `on-demand` → run it directly, the only kind that returns outputs.
- **`connections[].status: "missing"`** covers both deleted and broken — the fix is the same, reconnect the
  app in Make — and it is the most common reason a scenario "stopped working". No other tool surfaces it.
- **`isWaitingOnIncompleteExecutions`** means the scenario runs sequentially and is frozen behind stored
  failed runs: no new data flows until those are resolved in Make (this surface cannot). Different from a
  non-zero `incompleteExecutions` alone, which is informational on a non-sequential scenario.
- **`status: "error"`** carries no reason — Make records none. The cause is in the run history
  (`make-scenario-operations`), never in a guess.
- **`modules[].issues`** are Make's own complaints about a module ("not set up") — usually the direct answer
  to "why won't it activate".

Scenario ids come from `scenario_list` or from a create/patch response; `scenario_get` and
`scenario_module_get` take no `teamId`.

## Account-wide health checks

`scenario_list`'s `status` and `incompleteExecutions` are a cheap first pass, not the answer: `status` only
turns `error` after Make deactivates a scenario for *repeated* failures, so a scenario that started failing
yesterday still reads `active`. **A structural read says nothing about whether recent runs succeeded.** For a
real answer, call `scenario_execution_list` (narrowed to `status: "error"`) for every scenario in scope, then
`scenario_get` on the ones that turn up failures for connection health and issues. With more scenarios than
the 25-row cap, narrow by folder or status and say the sweep is partial.

## Not covered here

- Running, activating, or debugging — `make-scenario-operations`.
- Creating or editing — `make-scenario-building`.
