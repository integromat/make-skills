---
name: make-endpoints
description: Use when calling a third-party app (Google Docs, Slack, Notion, GitHub, ...) through Make Endpoints from a shell with make-endpoints-cli, i.e. finding the team id, which endpoints the team can run, which connection id to pass, and calling an endpoint with flags or --input JSON. Not for building or running Make scenarios (use the Make MCP server) and not for authoring apps.
compatibility: Requires Node.js 20 or later, make-endpoints-cli (npm install -g @makehq/endpoints-sdk, or npx -p @makehq/endpoints-sdk make-endpoints-cli) and a Make API key, from make-cli login or MAKE_API_KEY plus MAKE_ZONE. Endpoints are in closed beta, so a 400 "not enabled" error means Make hasn't enabled them for the organization yet.
---

# Make Endpoints from the shell

`make-endpoints-cli` calls Make Endpoints, the single-call wrappers around app actions (`google-docs get-document`,
`slack send-message`, ...). Every call runs in a team and, for most endpoints, through one of that team's
connections. The flow is always the same: find the team, see what it can run, inspect the endpoint, pick a
connection, call.

**Ground rules.** Never guess a team id, connection id or field name; each one comes from a command below.
`--help` works on any command. Run `describe` before the first call; most endpoints require more than the obvious
field. Output is JSON by default, so pipe it to `jq`, but only once a call succeeds, because a pipe hides the
error text. Exit code 2 is a Make API error, with the message on stderr; exit code 1 is a usage or validation
error. Every call runs as the user of the API key, in exactly one team per call.

## Auth

Credentials resolve in this order: `--api-key` and `--zone` flags, then `MAKE_API_KEY` and `MAKE_ZONE`, then the
config saved by `make-cli login`. The key needs `organizations:read` for step 1, `apps:read` for step 2,
`connections:read` for step 4 and `endpoints:run` for step 5. `Error [401]: Required scope: ...` names the missing
scope, which only a new key can fix.

## 1. Who am I, which team: `whoami`

```sh
make-endpoints-cli whoami                  # name, email, zone
make-endpoints-cli whoami --environment    # plus organizations and their teams; private spaces count as teams
```

Take the team id from `organizations[].teams[].id`. When the task doesn't say which team, start with the user's
private space (`type: personal`) and move on to that organization's other teams only when step 4 finds no
connection there. Don't walk every team; after three, ask the user.

## 2. What can this team run: `list --team-id`

```sh
make-endpoints-cli list --team-id <id>            # apps the team can use now
make-endpoints-cli list <app> --team-id <id>      # its endpoints, each with the team's usable connections
make-endpoints-cli list                           # static fallback: every app this build bundles
make-endpoints-cli list <app>                     # static fallback: its endpoints and their connection types
```

This step finds what to call. When the user already named the app and endpoint, skip to step 3: `describe` and
the call itself don't need `apps:read`, and `Error [401]: Required scope: apps:read` here only means the live
listing is unavailable. Each row of `list <app> --team-id` carries `connections`, the connections that already
cover the endpoint's scopes, and `name` only when this build bundles the endpoint: then `<app> <name>` calls it,
otherwise use `endpoints execute`. `endpoints list-usable --team-id <id>` prints the raw API payload.
`Error [400]: Endpoints execution is not enabled` means the organization isn't in the beta: stop and tell the user.

## 3. Inspect an endpoint: `describe`

```sh
make-endpoints-cli describe <app> <endpoint>                   # latest version
make-endpoints-cli describe <app> v<N> <endpoint>              # one version
make-endpoints-cli describe <app> <endpoint> --output-schema   # only when the output shape matters; it's large
```

`inputSchema.properties.input` lists the fields and which are required. `accounts` lists the connection types the
endpoint accepts, each with the scopes it needs. `context` is guidance for you, so follow it.

## 4. Pick a connection: `connections list`

```sh
make-endpoints-cli connections list --team-id <id> --app <app> --endpoint <endpoint>
```

`usableFor` lists the endpoints that accept the connection's type, and `requiredScopes` what this endpoint needs on
that type. Pick in this order: a row with `"scoped": true`, then a row whose `name` carries the user's name from
step 1, then any other. `scoped` is Make's own scope check, and `false` or `null` means it couldn't confirm the
scopes, not that the call will fail. A connection belongs to the team you listed it in: pass that same `--team-id`
in step 5. Try at most two connections for one call; when both fail, stop and tell the user which ones you tried.
No row at all means the user has to create a connection in Make; the CLI can't do that yet.

## 5. Call: `<app> <endpoint>`

```sh
make-endpoints-cli <app> <endpoint> --team-id <id> --connection-id <id> --<field> <value>
make-endpoints-cli <app> <endpoint> --team-id <id> --connection-id <id> --input '{"field":"value"}'
make-endpoints-cli <app> v<N> <endpoint> --team-id <id> --connection-id <id> --<field> <value>
make-endpoints-cli endpoints execute --app-name app#my-app --app-version 1 --endpoint-name doThing --team-id <id> --input '{}'
```

Each input field is a flag (`documentId` becomes `--document-id`). `--input` takes the whole input as JSON, and
separate flags override its keys. A field whose flag would clash with a global one (`output`, `zone`, ...) can
only be passed through `--input`. `endpoints execute` reaches custom apps (`app#name`) and endpoints this build
doesn't bundle. Add `--confidential` when the data must not stay in Make's Endpoint execution log: the run is
still listed there, but without its input, output or error. Add `--idempotency-key <key>` (1-255 characters of
letters, digits, `_`, `.`, `:`, `-`) when a call may be repeated: use one unique key per intended call and the same
key on every retry after a timeout or an unclear error, and Make never runs the endpoint twice but returns the
first run's outcome. With a key the JSON is `{ "output": ..., "execution": { "id": ..., "replayed": true } }`
(`replayed` only on a replay, `confidential` only for a confidential run). Without one the output is the endpoint's
result, unwrapped. For example, the title of a Google Doc:

```sh
make-endpoints-cli connections list --team-id 7 --app google-docs --endpoint get-document | jq '.[] | {id, name, scoped}'
make-endpoints-cli google-docs get-document --team-id 7 --connection-id 42 --document-id doc-1 | jq .title
```

## Errors

| Symptom                                                         | Next step                                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `Error [401]: Required scope: apps:read` in step 2              | Only the live listing needs it. Go on with step 3.                               |
| `Error [401]: Required scope: ...` elsewhere                     | The key lacks that scope. Ask the user for a key that has it.                    |
| `Error [424]` mentioning `invalid_grant` or an expired token    | That connection's authorization expired. Try one other row from step 4, then ask. |
| `Error [400]: Endpoints execution is not enabled`               | Endpoints aren't enabled for this organization. Stop and tell the user.          |
| `Error [422]` or another `Error [424]` on a call                | Wrong team for the connection, connection type or input. Re-run step 4 and `describe`. |
| `Error [409]`, `[422]`, `[424]` or `[503]` with `--idempotency-key` | 409: the first run is still going, retry later with the same key. 422: the key was used for a different request or a confidential run, never retry with it. 424: the first run failed and its failure is replayed. 503: the key couldn't be checked and nothing ran, retry. |
| `Error: Missing required input fields: ...` (exit 1)            | Pass the fields as flags or inside `--input`.                                    |
| `required option '--team-id <value>' not specified` (exit 1)    | Every call needs `--team-id`; most need `--connection-id` too.                   |
| `Unknown app` or `Unknown endpoint`                             | Names are the CLI's kebab-case ones. Run `list <app>` to find the right one.     |

## Not covered here

- Building, running or debugging Make scenarios. Use the Make MCP server.
- Calling endpoints from TypeScript. See the `@makehq/endpoints-sdk` README.
- Creating or authorizing connections, and authoring apps. Both happen in Make.
