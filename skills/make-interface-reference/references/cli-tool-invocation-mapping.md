# Tool Invocation Mapping: MCP ↔ CLI

This file is only relevant when the agent is using the **Make CLI** (shell access). The default interface for the skills is the Make MCP server, where every tool is called natively by name — no mapping needed. For CLI-based agents, this file names the cheapest CLI-side equivalent for each MCP tool.

The CLI is built from the `MakeMCPTools` SDK definition, so every tool it *wraps* has a stable name. However, **not every MCP tool has a matching CLI subcommand today** — the CLI's tool catalogue is a subset of what the MCP server exposes. The mapping below reflects CLI 1.3.1 reality and names the fallbacks for the rest.

For the authoritative, always-up-to-date command list, run `make-cli --help` and `make-cli <category> --help`.

## Three tiers of CLI-side invocation

For each MCP tool, resolve it to the cheapest working CLI-side path:

1. **Tier 1 — direct CLI subcommand.** The CLI has a matching command. Use it; it handles auth, zone, and JSON output.
2. **Tier 2 — REST v2 fallback via curl.** The capability exists in Make's public REST v2 API but the CLI does not wrap it. The agent reads the API key from `~/.config/make-cli/config.json` (or `%APPDATA%\make-cli\config.json` on Windows) and issues a curl with `Authorization: Token <key>` against `https://<zone>/api/v2/...`.
3. **Tier 3 — no CLI-side path.** The capability is not in REST v2 at all (hits internal services or S3). If the agent needs these, switch to the MCP server (or ask the user). This is the only case where the CLI cannot cover MCP's capability.

## Tier 1: Direct CLI subcommand

These capabilities are wrapped by `make-cli` 1.3.1. Pass `--output=json` whenever the agent parses the result.

| Capability                          | MCP tool                            | CLI command                                                                     |
|-------------------------------------|-------------------------------------|---------------------------------------------------------------------------------|
| List connections                    | `connections_list`                  | `make-cli connections list --team-id=123 --output=json`                         |
| Get connection                      | `connections_get`                   | `make-cli connections get --connection-id=… --output=json`                      |
| Verify connection                   | `connections_verify`                | `make-cli connections verify --connection-id=… --output=json`                   |
| Create credential request           | `credential_requests_create`        | `make-cli credential-requests create --name=… --team-id=… --credentials='[…]' --output=json` |
| Poll credential request             | `credential_requests_get`           | `make-cli credential-requests get --request-id=… --output=json`                 |
| Extend connection scopes            | `credential_requests_extend_connection` | `make-cli credential-requests extend-connection --connection-id=… --scopes='[…]' --output=json` |
| List / create webhooks              | `hooks_list` / `hooks_create`       | `make-cli hooks list --team-id=…` / `make-cli hooks create --team-id=… --type-name=…` |
| List / create data stores           | `data-stores_list` / `data-stores_create` | `make-cli data-stores list --team-id=…` / `make-cli data-stores create --team-id=…` |
| List / create data structures       | `data-structures_list` / `data-structures_create` | `make-cli data-structures list --team-id=…` / `make-cli data-structures create --team-id=…` |
| List keys                           | `keys_list`                         | `make-cli keys list --team-id=123 --output=json`                                |
| Create scenario                     | `scenarios_create`                  | `make-cli scenarios create --team-id=… --scheduling='{…}' --blueprint='{…}'`    |
| Update scenario (blueprint/schedule)| `scenarios_update`                  | `make-cli scenarios update --scenario-id=… --blueprint='{…}' --scheduling='{…}'` |
| Activate / deactivate scenario      | `scenarios_activate` / `scenarios_deactivate` | `make-cli scenarios activate --scenario-id=…` / `make-cli scenarios deactivate …` |
| Run scenario                        | `scenarios_run`                     | `make-cli scenarios run --scenario-id=… --responsive --output=json`             |
| Get scenario (incl. full blueprint) | `scenarios_get`                     | `make-cli scenarios get --scenario-id=… --output=json`                          |
| List scenarios                      | `scenarios_list`                    | `make-cli scenarios list --team-id=… --output=json`                             |
| List / get executions               | `executions_list` / `executions_get`| `make-cli executions list --scenario-id=…` / `make-cli executions get --execution-id=… --scenario-id=…` |
| List organizations / teams / users  | `organizations_list` / `teams_list` / `users_list` | `make-cli organizations list` / `teams list --organization-id=…` / `users list` |

## Tier 2: CLI + REST v2 fallback via curl

CLI 1.3.1 does not wrap these, but they exist in Make's public REST v2 API. Use the API key the CLI already stored. Each endpoint is reachable at `https://<zone>/api/v2/<path>` with `Authorization: Token <key>`.

The agent must resolve `organizationId` first (it's required on the `imt/apps` endpoint):

```bash
ZONE=$(jq -r .zone ~/.config/make-cli/config.json)
TOKEN=$(jq -r .apiKey ~/.config/make-cli/config.json)
ORG=$(curl -sS -H "Authorization: Token $TOKEN" "https://$ZONE/api/v2/users/me" | jq -r '.authUser.currentOrganizationId // empty')
# Or fetch it from organizations list if currentOrganizationId is unset:
#   curl -sS -H "Authorization: Token $TOKEN" "https://$ZONE/api/v2/organizations" | jq '.organizations[] | {id,name,zone}'
```

| Capability                          | MCP tool                            | REST endpoint (curl)                                                            |
|-------------------------------------|-------------------------------------|---------------------------------------------------------------------------------|
| List modules for an app             | `app_modules_list`                  | `GET /api/v2/imt/apps/{appName}/{appVersion}?organizationId=<org>` — returns the full app manifest; enumerate `actions`, `searches`, `triggers` arrays to list modules. |
| List modules with required credentials (lightweight) | `app_modules_list` (narrower variant) | `GET /api/v2/imt/apps/{appName}/{appVersion}/modules-with-credentials` — returns `{appModules:[{id, name, label, type, scope, hook}, …]}`. Cheaper than the full manifest when the agent only needs to know which modules exist and what OAuth scopes / connection type each requires (e.g. when deciding which credential request to raise). No `organizationId` required. |
| Get module interface / schema       | `app-module_get`                    | Same endpoint as `app_modules_list` — each entry in `actions` / `searches` / `triggers` includes `parameters` (input schema), `interface` (output schema), `expect`, `scope`, and RPC references like `"options": "rpc://<app>@<ver>/<rpcName>"`. Filter the manifest to the module of interest. |
| Batch app metadata (label, theme, version) | no MCP equivalent            | `GET /api/v2/sdk/apps/themes?names=app1,app2,…` — returns `{apps:[{name, label, theme, isCompiled}, …]}` in a single round-trip. Use when enriching a list of app names (e.g. after `apps_recommend`) without fetching each app's full manifest. |
| Execute RPC (resolve dynamic fields)| `rpc_execute`                       | `POST /api/v2/rpcs/{appName}/{appVersion}/{rpcName}` with JSON body `{"data":{"__IMTCONN__":<connectionId>, …}}`. Response shape: `{"code":"OK","response":[{"label":"…","value":"…"}, …]}`. |
| Get blueprint JSON schema           | `validate_blueprint_schema` (partial) | `GET /api/v2/validation-schemas/blueprint` — returns a JSON Schema at `.blueprint`. Validate any blueprint client-side with `ajv` or the JSON-Schema tool of choice. |

### Shape-discovery shortcut: clone from an existing scenario

If any scenario in the user's team uses the module you want to configure, `make-cli scenarios get --scenario-id=<id>` returns the full blueprint — inspect `blueprint.flow[*]` to find the entry with the module name and copy its `mapper` / `parameters` shape verbatim. This is faster than parsing the imt/apps manifest and is often enough to build a working blueprint.

### Curl examples

```bash
# Get the Google Calendar app manifest (contains all module schemas)
curl -sS -H "Authorization: Token $TOKEN" \
  "https://$ZONE/api/v2/imt/apps/google-calendar/5?organizationId=$ORG" \
  | jq '.app.searches[] | select(.name=="searchEvents")'

# Lightweight: list modules + their required connection type and OAuth scopes
curl -sS -H "Authorization: Token $TOKEN" \
  "https://$ZONE/api/v2/imt/apps/amazon-rekognition/1/modules-with-credentials" \
  | jq '.appModules[] | {name, label, type, scope}'

# Batch fetch label/theme for many apps in one call
curl -sS -H "Authorization: Token $TOKEN" \
  "https://$ZONE/api/v2/sdk/apps/themes?names=amazon-rekognition,ai-agent,announcekit" \
  | jq '.apps'

# Execute the listCalendars RPC to resolve a calendar picker
curl -sS -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" \
  -X POST "https://$ZONE/api/v2/rpcs/google-calendar/5/listCalendars" \
  -d '{"data":{"__IMTCONN__":14097368}}' \
  | jq '.response[] | {label, value}'

# Fetch the blueprint JSON Schema once; cache it; validate client-side
curl -sS -H "Authorization: Token $TOKEN" \
  "https://$ZONE/api/v2/validation-schemas/blueprint" > /tmp/blueprint.schema.json
```

### Client-side substitutes for `validate_module_configuration` and `extract_blueprint_components`

Both of those MCP tools are orchestrators over the three REST endpoints above. An agent with shell access can reproduce them locally:

- **`validate_module_configuration`** → fetch the module schema from `/imt/apps/{app}/{version}`, then check the assembled `{parameters, mapper}` against it (required fields, type/enum constraints, parameters-vs-mapper placement). Resolve dynamic dropdown values by calling the referenced RPC via `/rpcs/...`.
- **`extract_blueprint_components`** → walk `blueprint.flow[*]`, look up each module in `/imt/apps/...`, and collect the required `connection`, `webhook`, `dataStructure`, `dataStore`, and `key` component types (plus required OAuth scopes from each module's `scope` array).

These are worth implementing only when an agent is doing heavy module work offline. For one-off scenarios, a live `scenarios run --responsive` after creation surfaces the same errors at a controlled moment.

## Tier 3: No CLI-side path

These tools do not hit Make's public REST API — the MCP server calls internal services or object storage. If a CLI-only agent strictly needs them, switch to the MCP server, ask the user, or fall back to heuristics / published docs.

| Capability                          | MCP tool                            | Why no REST path                                                                |
|-------------------------------------|-------------------------------------|---------------------------------------------------------------------------------|
| Recommend apps for a use case       | `apps_recommend`                    | Backed by the internal Wingman (RAG) service; not exposed on `/api/v2/`. Fall back to `https://www.make.com/en/integrations` or MCP. |
| Get app documentation (readme)      | `app_documentation_get`             | Served from S3 (`maia-assets/apps_documentation/{appName}.md`), not REST. Fall back to `https://www.make.com/en/integrations/<app>` or MCP. |

## Notes

- **`--output=json`** — always pass when an agent needs to parse the response. `--output=table` is human-readable only.
- **Subcommand naming** — CLI subcommands mirror the MCP tool name with underscores converted to kebab-case. When in doubt, `make-cli <category> --help` is authoritative.
- **Credentials** — after `make-cli login`, no credential flags needed per call. Override with `MAKE_API_KEY` / `MAKE_ZONE` env vars or `--api-key` / `--zone` flags. For Tier 2 curl calls, read the same key from `~/.config/make-cli/config.json`.
- **Flag format** — CLI flags accept either `--flag=value` or `--flag value`. This document uses `=` consistently for clarity.

## Parameter-passing patterns

For tools that accept complex JSON payloads (e.g., `scenarios_create` with a blueprint), pass the JSON inline as a quoted string:

```bash
make-cli scenarios create \
  --team-id=123 \
  --scheduling='{"type":"on-demand"}' \
  --blueprint='{"name":"My Scenario","flow":[],"metadata":{}}'
```

For large payloads, write to a file and use shell substitution:

```bash
make-cli scenarios create \
  --team-id=123 \
  --scheduling='{"type":"on-demand"}' \
  --blueprint="$(cat blueprint.json)"
```
