---
name: make-module-configuring
description: This skill should be used when configuring Make module parameters, assigning connections, mapping data between modules, setting up webhooks or data stores in modules, working with IML expressions, handling keys, or defining data structures for module inputs/outputs. Covers the practical HOW of module configuration — complementary to make-scenario-building which covers WHICH modules to use and WHY.
license: MIT
compatibility: Requires a Make.com account with permissions to create scenarios. Works either with shell access and the Make CLI installed/authenticated, or with any agent that supports MCP and has the Make MCP server connected (Claude Code, Cursor, GitHub Copilot, etc.).
metadata:
  author: Make
  version: "0.1.3"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Module Configuration

This skill covers configuring individual modules within a Make scenario. Once a scenario's module composition is decided (see **make-scenario-building**), each module must be configured: connections assigned, parameters filled, data mapped from upstream modules, and special components (webhooks, data stores, keys) wired up.

## Interface: MCP or CLI

Before invoking any tool in this skill, determine which interface to use.

The default path is the **Make MCP server** — check whether the `make` MCP server is connected and call tools natively. The tool names referenced below (`app-module_get`, `rpc_execute`, `validate_module_configuration`, `connections_list`, `credential_requests_create`, etc.) are MCP tools.

<!-- variant:cli-start -->
If the MCP server isn't connected and the agent has shell access, the **Make CLI** wraps the same tool set. Run `command -v make-cli` (Bash); if found, run `make-cli whoami` to verify authentication. Invoke tools via `make-cli <category> <action> --flag=value --output=json`. Every tool named below has a matching CLI subcommand.

If neither is available, ask the user to configure the Make MCP server (`https://mcp.make.com`) or install the Make CLI (`brew install integromat/tap/make-cli` or `npm install -g @makehq/cli`, then `make-cli login`).
<!-- variant:cli-end -->

See **make-interface-reference** for connection setup and the full MCP↔CLI mapping.

## Quick Routing

Read the reference file that matches the current task:

| Task | Reference |
|------|-----------|
| Configuring any module (start here) | [General Principles](./general-principles.md) — 5-phase workflow: read interface, resolve components, run RPCs, fill params/mapper, validate |
| Setting up or assigning a connection | [Connections](./connections.md) — credential request flow, scope checking, Extract Blueprint Components |
| Creating or assigning a webhook | [Webhooks](./webhooks.md) — custom vs branded, data structure definition |
| Creating or assigning a data store | [Data Stores](./data-stores.md) — requires data structure first |
| Defining a data structure (schema) | [Data Structures](./data-structures.md) — field types, nested structures |
| Provisioning keys or certificates | [Keys](./keys.md) — SSH, PEM/PFX via credential requests |
| Writing IML expressions | [IML Expressions](./iml-expressions.md) — functions, variables, operators, backtick rule |
| Mapping data between modules | [Mapping](./mapping.md) — module ID references, output schema discovery |
| Adding filter conditions | [Filtering](./filtering.md) — operators, AND/OR grouping, placement rules |
| Configuring an aggregator | [Aggregators](./aggregators.md) — feeder/target, variants, configuration order exception |
| Configuring an AI agent module | [AI Agents](./ai-agents.md) — tools array, AI-decided fields, restore metadata |

## Cardinal Rules

These apply to every module configuration. Violating any of them is the most common cause of broken scenarios.

1. **Read the interface first.** Call `app-module_get` with `outputFormat: "instructions"` before configuring any module. Never guess parameter names, types, or structures.

2. **Validate every module.** Call `validate_module_configuration` after assembling each module's config. Do not proceed if validation returns errors — no exceptions.

3. **Component creation order.** Data structures, then webhooks, then connections, then keys, then data stores (dependencies flow left to right). Connections and keys require credential requests (user completes auth); webhooks, data stores, and data structures can be created directly via MCP.

4. **Configure left to right.** Work upstream to downstream so output schemas are available for mapping. **Exception:** array aggregators need their target module configured first — see [Aggregators](./aggregators.md).

5. **Connection selection is interactive.** Always present all matching connections to the user and let them choose. Never auto-select, even if only one match exists. See [Connections](./connections.md).

## Official Documentation

- [Module Settings](https://help.make.com/module-settings)
- [Types of Modules](https://help.make.com/types-of-modules)

## Related Skills

- **make-scenario-building** — Which modules to use and how to compose them into flows (routing, branching, filtering, iterations, aggregations, error handling)
- **make-interface-reference** — CLI and MCP setup (install, auth, tokens, OAuth), tool/command mapping, and troubleshooting
