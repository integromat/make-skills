---
name: make-api-shell
description: Use when the user wants data out of (or an action in) a SaaS account through Make without a purpose-built automation — "get my unread emails", "list my Jira tickets" — via a small on-demand scenario wrapping the provider's Make an API Call module or a generic HTTP request.
metadata:
  version: "0.1.7" # x-release-please-version
---

# Make API shells — a reusable API endpoint inside Make

An **API shell** is a three-module on-demand scenario — `scenario-service:StartSubscenario` → the provider's
*Make an API Call* module → `scenario-service:ReturnData` — that takes `path`, `method`, `header`, `qs`,
`body` as inputs and returns the provider's response body. Built once per provider **and connection**, it
turns any Make-connected account into an authenticated HTTP endpoint the assistant can call with
`scenario_run`. It is a transport, not business logic: interpreting the response happens afterwards.

**Ground rules.** A 403 means the whole connection must be re-authorized with every permission — never one
tool. A `content` remark on a result is an instruction, not decoration. Say what you resolved an ambiguous
value to before the call that acts on it. The refusal contract and the rest: `make-scenario-reference`, when
something is refused or no tool seems to fit.

## Workflow

1. **Resolve the anchor before any tool call**: provider (Gmail vs Outlook, HubSpot vs Salesforce, Jira vs
   Linear), and the account or mailbox when several are plausible. Ask only for what is missing.
2. `environment_get` → `organizationId`/`teamId`.
3. **Find the API-call module.** `app_find` with "<provider> make an API call". The module's name is not
   standardized (`makeAnApiCall`, `makeApiCall`, `MakeAPICall`, `ActionMakeAnApiCall`, …) — take it from the
   result, never guess. No Make app for the provider (or only a community one) → build an HTTP shell instead:
   [HTTP fallback](./references/http-fallback.md).
4. `module_spec(schemas: true)` on `["scenario-service:StartSubscenario", "<app>:<apiCallModule>",
   "scenario-service:ReturnData"]`. Note the API-call module's connection requirement and its `mapper` field
   names (`url`, `method`, `headers`, `qs`, `body` — confirm; a few apps differ) and its output field that
   carries the response body (usually `body`).
5. **Connection.** Reuse an id from `connection.existing` when it is the right account; otherwise
   `connection_create` → the user authorizes → `connection_get`. A connection that authenticates but lacks the
   scope for the intended call fails at run time with a provider permission error — treat that as "no suitable
   connection" and request a new one; connections cannot be widened in place.
6. **Reuse an existing shell only for an existing connection.** `scenario_list` with `search` for the shell
   naming convention (`API shell: <app>`), then `scenario_get` to confirm the three modules and
   `scenario_module_get` to confirm which connection the middle module is bound to. A **new connection always
   gets a new shell** — never repoint an existing shell at a different account.
7. `scenario_create` from [api-shell.json](./examples/api-shell.json): `scheduling: {"type": "on-demand"}`,
   the `interface` with the five inputs and one `data` output, and `ReturnData` mapped to
   `{"data": "{{2.body}}"}` — the response body, not the whole bundle `` {{`2`}} `` and not a guessed
   nested field.
8. `scenario_activate`, then a **narrow validation run**: `scenario_run` with
   `inputs: {"path": "…", "method": "GET", "header": [], "qs": [{"name": "limit", "value": "5"}], "body": null}`.
   Read `outputs.data`. A 404 whose URL shows a doubled segment (`/calendar/calendar/v3/…`) means the module's
   base URL already carries that prefix — strip it from `path`.
9. **Then retrieve for real**: list or search with a narrow filter → collect ids → detail calls for the
   shortlist → normalize for the user. Every step goes through the shell; do not fall back to the app's native
   search modules for this workflow family.

Say which phase you are in (provisioning vs retrieval), whether the shell and the connection are reused or
new, and the exact API path you chose for the business question.

## Rules

- **Writes need confirmation.** `POST`/`PUT`/`PATCH`/`DELETE` through a shell mutate the live account: state
  the call and get an explicit yes before running it. Default retrieval is `GET`.
- **Query parameters go in `qs`**, as `[{name, value}]`, never concatenated into `path`. Split a
  `path?x=1` the caller hands you.
- **Empty body on GET.** Some provider modules serialize an empty `body` badly on `GET`/`DELETE`. If a read
  fails only when `body` is present-but-empty, drop the `body` mapping from the middle module (a read-only
  shell) and keep a separate write shell that maps it. `ReturnData` stays unchanged either way.
- **A shell is bound to one app module.** A Gmail shell is not a Google Calendar shell even though both are
  "Google" — different app, module, and connection family. Build one per provider app.
- **Interpret failures by phase.** Connection request problems are provisioning; an activation refusal is the
  shell; an empty or odd payload from a successful run is the API path or the normalization — first check that
  `ReturnData` still maps the middle module's `body`, then the path/method/qs, before touching the blueprint.
  A provider auth or scope error is never fixed by editing the shell — go back to step 5.
- Reading and running a shell needs the same scopes as any scenario; the *provider's* permissions are proven
  only by a successful run of the intended call.

## Not covered here

- Scenarios that run on their own trigger or schedule — `make-scenario-building`.
- Debugging a shell run beyond `scenario_run`'s response — `make-scenario-operations`
  (`scenario_execution_inspect`, `scenario_execution_module_get`).
