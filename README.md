# Make Skills for AI Coding Agents

Give your AI coding agent deep Make expertise — for building, explaining, running and debugging Make scenarios and authoring and operating Functions v2 through Make's MCP server, calling app Endpoints through the standalone Endpoints SDK or CLI, and securely requesting credentials for Endpoints and custom-app testing. Works with agents that read skill folders and can use the relevant interface — Claude Code, Codex, Cursor, GitHub Copilot, Windsurf, Cline, and others.
For Make app development, use [Make Apps Skill](https://github.com/integromat/make-apps-skill).

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
- For `make-endpoints`: an approved Node.js/terminal environment, the Endpoints package, and organization access to the Endpoints beta. See [setup and interfaces](skills/make-endpoints/references/setup-and-interfaces.md). Installing this skill does not install the SDK or enable the beta.
- For `make-credential-requests`: access to a chosen, authorized credential-request interface, with the required Make permissions and organization/team access. Verify that interface's current contract before making a request; installing a skill or plugin does not grant access. SDK/REST requests follow their own permission contracts, not the scenario MCP server's all-or-nothing OAuth bundle.

## Installation

Install the **skills** and configure the interface they use. Scenario skills and `make-functions-v2` use the same **MCP server**; `make-endpoints` uses `@makehq/endpoints-sdk`, which includes both the SDK and `make-endpoints-cli`. `make-credential-requests` uses the chosen authorized request interface to provision credentials, not execute app actions. Neither Endpoints execution nor credential provisioning requires building a scenario. Endpoints-only use does not require the scenario MCP server. The plugins below register that server for both scenario and Functions v2 skills; the standalone skill download can be used independently.

### Option A: Plugin (recommended)

**Claude Code**

```bash
/plugin marketplace add integromat/make-skills
/plugin install make-skills@make-marketplace
```

**Cursor** — Team Marketplace: import `integromat/make-skills` and install `make`. The plugin registers the MCP server (`/cursor`).

**Codex**

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make`. If the MCP server is not registered automatically, add it manually:

```bash
codex mcp add make --url https://mcp.make.com/openai
codex mcp login make
```

### Option B: Download the skills

Upload the zips to your agent (Claude Cowork, Claude Chat, and similar) or unzip them into its skills directory:

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

Skills directories, for agents that read skills from disk:

| Agent           | Skills directory    |
| --------------- | ------------------- |
| Codex (project) | `.agents/skills/`   |
| Codex (global)  | `~/.agents/skills/` |
| Claude Code     | `.claude/skills/`   |
| Cursor          | `.cursor/skills/`   |
| Windsurf        | `.windsurf/skills/` |
| Cline           | `.cline/skills/`    |
| Generic         | `.agents/skills/`   |

ChatGPT does not use a local skills directory. Install the Make plugin or use the skill-upload flow supported
by the selected ChatGPT experience; configure and authenticate its Make connection separately.
Unzip each downloaded skill so its folder directly contains `SKILL.md`, `references/` and `examples/`.

### Add the MCP server manually for scenario and Functions v2 skills

Skip this if a plugin registered it. Each platform has its own endpoint, over HTTP:

| Platform     | MCP URL                       |
| ------------ | ----------------------------- |
| Claude Code  | `https://mcp.make.com/claude` |
| Cursor       | `https://mcp.make.com/cursor` |
| OpenAI Codex | `https://mcp.make.com/openai` |

```bash
claude mcp add --transport http make https://mcp.make.com/claude
claude mcp list
```

For any other agent, add the matching URL to its JSON MCP config.

On first use, authenticate through Make's OAuth consent screen. Follow the tool's authorization challenge to grant its required access area. Functions v2 uses Build & Run; tool availability and team rollout access are separate from OAuth consent.

### Verify the skill and connection

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
an agent conversation. See [Functions access and discovery](skills/make-functions-v2/references/access-and-discovery.md).

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

Open pull requests against **`main`** — that's the trunk. Use squash merges and Conventional Commit PR titles (`feat:`, `fix:`, `docs:`, …), since release-please relies on them. A separate `latest` branch is fast-forwarded to each released tag. The Claude Code marketplace entry uses a local `./plugins/make-skills-claude` source, so installs track the branch the marketplace is added from. Codex and `npx skills add` still resolve `main` HEAD directly. For Cursor Team Marketplace, import this repo and track branch **`main`** (branch is not set in `.cursor-plugin/marketplace.json`).

## License

MIT
