# Make Skills for AI Coding Agents

Give your AI coding agent deep Make expertise — for building, explaining, running and debugging Make scenarios through Make's scenario-management MCP server, calling app Endpoints through the standalone Endpoints SDK or CLI, and developing custom (SDK) apps through an authorized app-authoring interface. Works with agents that read skill folders and can use the relevant interface — Claude Code, Codex, Cursor, GitHub Copilot, Windsurf, Cline, and others.

## Skills

| Skill                        | What it does                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **make-scenario-reference**  | The conventions every tool shares — scopes, the data/remark contract, structure vs configuration, the one-save write model, and what the surface refuses to author — for when a tool answers 403 or refuses something |
| **make-scenario-explore**    | Orienting in an account — organizations, teams, listing scenarios, explaining what one does, connection health, account-wide checks                                                                                   |
| **make-scenario-building**   | Creating and editing scenarios — app and module discovery, connections, resolving account-dependent values, flow control, error handling, subscenarios, AI agents; with references and complete examples              |
| **make-scenario-operations** | Running, activating and deactivating, reviewing and debugging executions, investigating a webhook                                                                                                                     |
| **make-endpoints**           | Direct app actions through `@makehq/endpoints-sdk` or its CLI — discovery, managed connections, typed calls, complete retrieval, and approval-bound writes with readback. Endpoints are in closed beta.                 |
| **make-custom-apps**         | Developing and maintaining custom (SDK) apps — API research, connections, modules, RPCs, webhooks, app IML functions, review and QA; with source-grounded references and offline-tested component examples.             |

## Prerequisites

- A [Make](https://www.make.com) account
- For scenario skills: access to the Make scenario-management MCP server.
- For `make-endpoints`: an approved Node.js/terminal environment, the Endpoints package, and organization access to the Endpoints beta. See [setup and interfaces](skills/make-endpoints/references/setup-and-interfaces.md). Installing this skill does not install the SDK or enable the beta.
- For `make-custom-apps`: access to the relevant provider API documentation and an authorized Make Apps Editor, VS Code extension, or verified app-authoring CLI/API. See [tooling and release](skills/make-custom-apps/references/tooling-and-release.md). The skill does not install tools, grant authoring access, or assume the scenario MCP exposes custom-app administration. Local work can proceed without provider credentials; live tests cannot.

## Installation

Install the **skills** and configure the interface they use. Scenario skills use the **MCP server**; `make-endpoints` uses `@makehq/endpoints-sdk`, which includes both the SDK and `make-endpoints-cli`. `make-custom-apps` uses the selected app-authoring interface, not the scenario MCP by assumption. Endpoints-only or custom-app-only use does not require the scenario MCP server. The plugins below register that server for the scenario skills; standalone skill downloads can be used independently.

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
| Bundle of all the skills | [Download](dist/make-skills.zip?raw=true)                                                                   |
| Scenario Reference       | [Download](dist/make-scenario-reference.zip?raw=true)                                                       |
| Scenario Explore         | [Download](dist/make-scenario-explore.zip?raw=true)                                                         |
| Scenario Building        | [Download](dist/make-scenario-building.zip?raw=true)                                                        |
| Scenario Operations      | [Download](dist/make-scenario-operations.zip?raw=true)                                                      |
| Make Endpoints           | [Download](dist/make-endpoints.zip?raw=true)                                                                |
| Make Custom Apps         | [Download](dist/make-custom-apps.zip?raw=true)                                                              |

On GitHub, these download links follow the branch being viewed, including a pull-request branch; they do not depend on an unmerged file already existing on `main`.

Skills directories, for agents that read skills from disk:

| Agent           | Skills directory    |
| --------------- | ------------------- |
| ChatGPT / Codex | `.codex/skills`     |
| Claude Code     | `.claude/skills/`   |
| Cursor          | `.cursor/skills/`   |
| Windsurf        | `.windsurf/skills/` |
| Cline           | `.cline/skills/`    |
| Generic         | `.agents/skills/`   |

### Add the MCP server manually for scenario skills

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

On first use, authenticate through Make's OAuth consent screen. The server asks for one bundle of permissions and works only when every one of them is granted — if a tool answers with a permission error, reconnect and grant everything it asks for.

## Troubleshooting

| Issue                              | Solution                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP server not connecting          | Check network connectivity to Make servers                                                                                                  |
| MCP permission denied / 403        | Reconnect the Make MCP server and grant every requested permission                                                                          |
| An MCP tool refuses a write        | Read the refusal and the current tool contract; use the Make editor for capabilities the tool explicitly does not support                    |
| Endpoints SDK/CLI access failure    | Check the selected key/zone, Make scopes, team access and provider connection separately; the MCP full-scope-bundle rule does not apply       |
| Endpoints execution unavailable     | Confirm organization beta/runtime access; local catalog discovery and package installation do not enable execution                           |
| Custom-app authoring unavailable    | Check the selected app, version, origin, permissions and authoring interface; scenario MCP or Endpoint execution access is not authoring access |

## Contributing

For custom-app examples, run `npm run check:custom-apps`. This validates the indexed copied/adapted snippets and focused component examples, exercises checker regressions, and runs the actual JavaScript helper tests. These are offline static/unit checks, not Make or provider execution. Add source attribution, section mapping, adaptations and limitations when reusing an example. Edit canonical skills in `plugins/make-skills-codex/skills/`, then run `node scripts/sync-plugins.mjs` and `npm run check:skills`.

Open pull requests against **`main`** — that's the trunk. Use squash merges and Conventional Commit PR titles (`feat:`, `fix:`, `docs:`, …), since release-please relies on them. A separate `latest` branch is fast-forwarded to each released tag. The Claude Code marketplace entry uses a local `./plugins/make-skills-claude` source, so installs track the branch the marketplace is added from. Codex and `npx skills add` still resolve `main` HEAD directly. For Cursor Team Marketplace, import this repo and track branch **`main`** (branch is not set in `.cursor-plugin/marketplace.json`).

## License

MIT
