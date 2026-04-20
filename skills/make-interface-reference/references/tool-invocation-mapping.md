# Tool Invocation Mapping: MCP ↔ CLI

The Make CLI is built from the same `MakeMCPTools` SDK definition as the MCP server. Every MCP tool has a matching CLI subcommand. The table below covers the high-traffic tools used across the building skills.

For the authoritative, always-up-to-date command list, run `make-cli --help` and `make-cli <category> --help`.

## Core mapping

| Capability                          | MCP tool                            | CLI command                                                                     |
|-------------------------------------|-------------------------------------|---------------------------------------------------------------------------------|
| Recommend apps                      | `apps_recommend`                    | `make-cli apps recommend --query='…' --output=json`                             |
| List modules for an app             | `app_modules_list`                  | `make-cli app-modules list --app-name=X --app-version=1 --output=json`          |
| Get app documentation               | `app_documentation_get`             | `make-cli app-documentation get --app-name=X --output=json`                     |
| Get module interface                | `app-module_get`                    | `make-cli app-module get --app-name=X --module-name=Y --output-format=instructions --output=json` |
| Execute RPC                         | `rpc_execute`                       | `make-cli rpc execute … --output=json`                                          |
| Validate module configuration       | `validate_module_configuration`     | `make-cli validate module-configuration … --output=json`                        |
| Validate blueprint schema           | `validate_blueprint_schema`         | `make-cli validate blueprint-schema … --output=json`                            |
| Extract blueprint components        | `extract_blueprint_components`      | `make-cli extract blueprint-components … --output=json`                         |
| List connections                    | `connections_list`                  | `make-cli connections list --team-id=123 --output=json`                         |
| Create credential request           | `credential_requests_create`        | `make-cli credential-requests create … --output=json`                           |
| Poll credential request             | `credential_requests_get`           | `make-cli credential-requests get --credential-request-id=… --output=json`      |
| List / create webhooks              | `hooks_list` / `hooks_create`       | `make-cli hooks list …` / `make-cli hooks create …`                             |
| List / create data stores           | `data-stores_list` / `data-stores_create` | `make-cli data-stores list …` / `make-cli data-stores create …`           |
| List / create data structures       | `data-structures_list` / `data-structures_create` | `make-cli data-structures list …` / `make-cli data-structures create …` |
| Create / update / activate scenario | `scenarios_create` / `scenarios_update` / `scenarios_activate` | `make-cli scenarios create` / `update` / `activate`          |
| Deactivate scenario                 | `scenarios_deactivate`              | `make-cli scenarios deactivate --scenario-id=456`                               |
| Run scenario                        | `scenarios_run`                     | `make-cli scenarios run --scenario-id=456 --output=json`                        |
| List executions                     | `executions_list`                   | `make-cli executions list --scenario-id=456 --output=json`                      |
| Get execution                       | `executions_get`                    | `make-cli executions get --execution-id=… --output=json`                        |
| Update scheduling                   | `scenario_scheduling_update`        | `make-cli scenario-scheduling update … --output=json`                           |
| List keys                           | `keys_list`                         | `make-cli keys list --team-id=123 --output=json`                                |

## Notes

- **`--output=json`** — always pass when an agent needs to parse the response. `--output=table` is human-readable only.
- **Subcommand naming** — CLI subcommands follow the MCP tool name with underscores converted to kebab-case per the CLI's internal `camelToKebab` convention. When in doubt, run `make-cli <category> --help`.
- **Credentials** — after `make-cli login`, no credential flags needed per call. Override with `MAKE_API_KEY` / `MAKE_ZONE` env vars or `--api-key` / `--zone` flags.
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
