# Make Skills for AI Agents

Give your AI agent deep Make expertise — for building, explaining, running and debugging Make scenarios and authoring and operating Functions v2 through Make's MCP server, calling app Endpoints through the standalone Endpoints SDK or CLI, and securely requesting credentials for Endpoints and custom-app testing. Works with Claude, ChatGPT and Codex, Cursor, GitHub Copilot, OpenClaw, OpenCode, and any agent that reads skill folders.

[GitHub repository](https://github.com/integromat/make-skills) · [Install guide](https://skills.make.com/) · [npm package](https://www.npmjs.com/package/@makehq/make-skills)

This repository ships the skills as a plugin for each client, as zip downloads, and as the `@makehq/make-skills` npm package, which is also an OpenCode plugin. For Make app development, use [Make Apps Skill](https://github.com/integromat/make-apps-skill).

## Skills

| Skill                        | What it does                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **make-scenario-reference**  | The conventions every tool shares — scopes, the data/remark contract, structure vs configuration, the one-save write model, and what the surface refuses to author — for when a tool answers 403 or refuses something |
| **make-scenario-explore**    | Orienting in an account — organizations, teams, listing scenarios, explaining what one does, connection health, account-wide checks                                                                                   |
| **make-scenario-building**   | Creating and editing scenarios — app and module discovery, connections, resolving account-dependent values, flow control, error handling, subscenarios, AI agents; with references and complete examples              |
| **make-scenario-operations** | Running, activating and deactivating, reviewing and debugging executions, investigating a webhook                                                                                                                     |
| **make-endpoints**           | Direct app actions through `@makehq/endpoints-sdk` or its CLI — discovery, managed connections, typed calls, complete retrieval, and approval-bound writes with readback. Endpoints are in closed beta.                 |
| **make-functions-v2**        | Authoring, testing, publishing and operating TypeScript Functions through the existing Make MCP connection, including Endpoint discovery and execution recovery. Requires Functions v2 rollout access. |
| **make-credential-requests** | Credential provisioning for agents using Endpoints or testing custom apps — the owner receives an authorization link and supplies secrets in Make; the agent resumes with managed connection/key IDs, not raw credentials. No scenario required. |

Creating a connection in the scenario editor remains the standard manual path. Credential Requests are the recommended secure handoff for agents; they complement that editor workflow rather than replace it.

## Prerequisites

- A [Make](https://www.make.com) account
- For scenario skills and `make-functions-v2`: access to the Make MCP server. Functions v2 also requires the curated Functions tools and team rollout access; installing the skill does not enable either.
- For `make-endpoints`: an approved Node.js/terminal environment, the Endpoints package, and organization access to the Endpoints beta. See [setup and interfaces](https://github.com/integromat/make-skills/blob/main/skills/make-endpoints/references/setup-and-interfaces.md). Installing this skill does not install the SDK or enable the beta.
- For `make-credential-requests`: access to a chosen, authorized credential-request interface, with the required Make permissions and organization/team access. Verify that interface's current contract before making a request; installing a skill or plugin does not grant access. SDK/REST requests follow their own permission contracts, not the scenario MCP server's all-or-nothing OAuth bundle.

## Install

Scenario skills and `make-functions-v2` use Make's **MCP server**; every plugin below registers it and signs you in with your Make account on first use. `make-endpoints` uses `@makehq/endpoints-sdk` (SDK and `make-endpoints-cli`) instead, and `make-credential-requests` uses the chosen authorized request interface. Neither needs a scenario, and Endpoints-only use does not need the MCP server.

### Claude Code

```bash
claude plugin marketplace add integromat/make-skills
claude plugin install make-skills@make-marketplace
```

### Claude.ai and Claude Desktop

Requires a paid Claude plan; on the Free plan, follow [Other agents](#other-agents) and upload the zips.

1. Open **Customize** → **Plugins** (in Claude Cowork, open the Cowork tab first).
2. Select **Add** → **Add marketplace** and enter `integromat/make-skills`.
3. Open **Discover**, select **Make** and add it.
4. In the plugin's **Connectors** tab, connect Make and sign in with your Make account.

### ChatGPT and Codex

ChatGPT: request early access on [skills.make.com](https://skills.make.com/), then select **Install plugin** and sign in with your Make account.

Codex:

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make`. If the MCP server is not registered automatically, add it manually:

```bash
codex mcp add make --url https://mcp.make.com/openai
codex mcp login make
```

### Cursor

Install Make from the [Cursor Marketplace](https://cursor.com/marketplace/make). For a Team Marketplace, import `integromat/make-skills` and install `make`.

### GitHub Copilot CLI

```bash
copilot plugin install integromat/make-skills:plugins/make-skills-copilot
```

### OpenClaw

Install from [ClawHub](https://clawhub.ai/make/plugins/openclaw-make):

```bash
openclaw plugins install clawhub:@make/openclaw-make
```

### OpenCode

The [`@makehq/make-skills`](https://www.npmjs.com/package/@makehq/make-skills) npm package is an OpenCode plugin. Add it to `opencode.json`:

```json
{
  "plugins": ["@makehq/make-skills"]
}
```

or install it globally with `opencode plugin add @makehq/make-skills`. The plugin registers the `make` MCP server (`https://mcp.make.com/v2`; run `opencode mcp auth make` or sign in on first use) and every skill. An MCP server you already named `make` is kept as configured. It uses the OpenCode 2 plugin API.

The package can also be read from code. `@makehq/make-skills/skills.json` lists each skill with its `publish` and `mcp` flags, and each skill lives in `@makehq/make-skills/skills/<name>/` with its `SKILL.md`, `references/` and `examples/`:

```js
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const manifest = require.resolve('@makehq/make-skills/skills.json');
const { skills } = require(manifest);
const dirs = Object.keys(skills).map((name) => join(dirname(manifest), 'skills', name));
```

### Other agents

**1. Add the MCP server** (scenario and Functions v2 skills). It is a remote Streamable HTTP server; no API key, the agent opens Make's sign-in page on first connect:

```json
{
  "mcpServers": {
    "make": { "url": "https://mcp.make.com/v2" }
  }
}
```

Check your agent's MCP docs for the exact file and field names. The server is also listed in the [MCP Registry](https://registry.modelcontextprotocol.io/?q=com.make) as `com.make/mcp-server`. For Claude Code without the plugin:

```bash
claude mcp add --transport http make https://mcp.make.com/claude
```

On first use, authenticate through Make's OAuth consent screen and follow the tool's authorization challenge to grant its required access area. Tool availability and team rollout access are separate from OAuth consent.

**2. Add the skills.** For agents that read skills from a folder:

```bash
npx skills add integromat/make-skills
```

Or download the zips and upload them to your agent (Claude.ai, Claude Desktop and similar take one zip per skill), or unzip them into its skills directory so each skill folder directly contains `SKILL.md`, `references/` and `examples/`:

| Skill                    | Download                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Bundle of all the skills | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-skills.zip)              |
| Scenario Reference       | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-reference.zip)  |
| Scenario Explore         | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-explore.zip)    |
| Scenario Building        | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-building.zip)   |
| Scenario Operations      | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-scenario-operations.zip) |
| Make Endpoints           | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-endpoints.zip)           |
| Functions v2             | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-functions-v2.zip)         |
| Make Credential Requests | [Download](https://raw.githubusercontent.com/integromat/make-skills/main/dist/make-credential-requests.zip) |

| Agent           | Skills directory    |
| --------------- | ------------------- |
| Codex (project) | `.agents/skills/`   |
| Codex (global)  | `~/.agents/skills/` |
| Claude Code     | `.claude/skills/`   |
| Cursor          | `.cursor/skills/`   |
| Windsurf        | `.windsurf/skills/` |
| Cline           | `.cline/skills/`    |
| Generic         | `.agents/skills/`   |

ChatGPT does not use a local skills directory; install the Make plugin instead.

## Verify the skill and connection

After installation and sign-in, refresh the client's available skills and tools (restart the client if needed).
Use this read-only check before creating anything:

> Use the make-functions-v2 skill. Check the Make connection, call environment_get, and show the available
> organizations and teams so I can select the target. Confirm that function_list, function_endpoint_list and
> function_endpoint_types are available. Do not create or run a Function yet.

The skill being discoverable, MCP being authenticated, the required tools being present, and access to the
selected team are separate checks. For scenario work, use `make-scenario-explore` and check `scenario_list`
instead. Reuse the configured Make connection; adding a duplicate does not grant missing access.

Functions that call Endpoints also need organization access to Endpoint execution and available generated
Endpoint types. Discover the selected team's Endpoints, then retrieve their types before authoring calls.
If no compatible Connection exists, create one in Make or use an available, authorized Credential Requests
workflow. Complete authorization in Make, then repeat Endpoint discovery; never paste provider secrets into
an agent conversation. See [Functions access and discovery](https://github.com/integromat/make-skills/blob/main/skills/make-functions-v2/references/access-and-discovery.md).

## Troubleshooting

| Issue                              | Solution                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP server not connecting          | Confirm the server is configured, complete OAuth sign-in, then refresh tools; check network connectivity if connection still fails                                                                                                  |
| MCP permission denied / 403        | Follow the challenge for the required access area and confirm access to the target team/resource                                                                          |
| An MCP tool refuses a write        | Read the refusal and the current tool contract; use the Make editor for capabilities the tool explicitly does not support                    |
| Endpoints SDK/CLI access failure    | Check the selected key/zone, Make scopes, team access and provider connection separately; the MCP full-scope-bundle rule does not apply       |
| Functions tools missing | Confirm the client has refreshed its catalog and the account/team has Functions rollout access. Installing the skill does not enable tools. |
| Functions Endpoint availability unavailable | Ask the administrator to check organization Endpoint execution access and upstream availability. This is separate from Functions rollout and OAuth consent; do not assume the catalog is empty. |
| Endpoint types unavailable | Discovery may succeed while generated types are unavailable. Report the returned status and stop authoring the affected dependency. |
| Skill not found | Check the installation scope and folder layout, then refresh/restart the client. Updating the repository does not update a previously copied skill. |
| Endpoints execution unavailable     | Confirm organization beta/runtime access; local catalog discovery and package installation do not enable execution                           |

## Contributing

Open pull requests against `main`. See [CLAUDE.md](https://github.com/integromat/make-skills/blob/main/CLAUDE.md) for the repository layout, the skill-writing rules and the release steps.

## License

MIT
