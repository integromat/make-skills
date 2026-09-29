# Make Skills for AI Coding Agents

Give your AI coding agent deep Make expertise — for building, explaining, running and debugging Make scenarios through Make's scenario-management MCP server. Works with any agent that reads skill folders and speaks MCP — Claude Code, Codex, Cursor, GitHub Copilot, Windsurf, Cline, and others.

## Skills

| Skill                        | What it does                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **make-scenario-reference**  | The conventions every tool shares — scopes, the data/remark contract, structure vs configuration, the one-save write model, and what the surface refuses to author — for when a tool answers 403 or refuses something |
| **make-scenario-explore**    | Orienting in an account — organizations, teams, listing scenarios, explaining what one does, connection health, account-wide checks                                                                                   |
| **make-scenario-building**   | Creating and editing scenarios — app and module discovery, connections, resolving account-dependent values, flow control, error handling, subscenarios, AI agents; with references and complete examples              |
| **make-scenario-operations** | Running, activating and deactivating, reviewing and debugging executions, investigating a webhook                                                                                                                     |
| **make-api-shell**           | A reusable API-call or HTTP shell scenario used as a retrieval transport into a SaaS account (email, CRM, tickets)                                                                                                    |

## Prerequisites

- A [Make](https://www.make.com) account

## Installation

There are two pieces, and both are needed: the **skills** (the expertise) and the **MCP server** (the tools the skills drive).

Download the skills, then either upload them to your agent (Claude Cowork, Claude Chat, and similar) or unzip them into its skills directory:

| Skill                    | Download                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Bundle of all the skills | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-skills.zip)              |
| Scenario Reference       | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-reference.zip)  |
| Scenario Explore         | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-explore.zip)    |
| Scenario Building        | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-building.zip)   |
| Scenario Operations      | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-scenario-operations.zip) |
| API Shell                | [Download](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-api-shell.zip)           |

Skills directories, for agents that read skills from disk:

| Agent           | Skills directory    |
| --------------- | ------------------- |
| ChatGPT / Codex | `.codex/skills`     |
| Claude Code     | `.claude/skills/`   |
| Cursor          | `.cursor/skills/`   |
| Windsurf        | `.windsurf/skills/` |
| Cline           | `.cline/skills/`    |
| Generic         | `.agents/skills/`   |

### 2. Add the MCP server

The skills target Make's scenario-management MCP server at `https://mcp.make.com/v2`, over HTTP.

Or download the [complete bundle](https://raw.githubusercontent.com/integromat/make-skills/v2/dist/make-skills.zip) with all skills + MCP config.

### Codex

```bash
codex plugin marketplace add integromat/make-skills
```

Then open the plugin directory, select the **Make** marketplace, and install `make`.

If the MCP server is not registered automatically after install, add it manually:

```bash
codex mcp add make --url https://mcp.make.com/v2
codex mcp login make
```

**Claude Code**

```bash
claude mcp add --transport http make https://mcp.make.com/v2
```

**Any agent with a JSON MCP config**

Add the server to the agent's MCP configuration file:

| Platform     | MCP URL                       |
| ------------ | ----------------------------- |
| Claude Code  | `https://mcp.make.com/claude` |
| Cursor       | `https://mcp.make.com/cursor` |
| OpenAI Codex | `https://mcp.make.com/openai` |

The Claude plugin at `plugins/make-skills-claude/` ships `.mcp.json` with the Claude endpoint. Manual registration:

```bash
claude mcp add --transport http make https://mcp.make.com/claude
claude mcp list
```

On first use, authenticate through Make's OAuth consent screen. The server asks for one bundle of permissions and works only when every one of them is granted — if a tool answers with a permission error, reconnect and grant everything it asks for.

Codex manual setup:

```bash
codex mcp add make --url https://mcp.make.com/openai
codex mcp login make
```

## Troubleshooting

| Issue                              | Solution                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP server not connecting          | Check network connectivity to Make servers                                                                                                  |
| Permission denied / 403            | Reconnect the Make MCP server and grant every requested permission                                                                          |
| A tool refuses to create something | Read the refusal — the surface deliberately cannot author data stores, custom functions or data structures; create those in the Make editor |

## Contributing

Open pull requests against **`main`** — that's the trunk. Use squash merges and Conventional Commit PR titles (`feat:`, `fix:`, `docs:`, …), since release-please relies on them. A separate `latest` branch is fast-forwarded to each released tag. The Claude Code marketplace entry uses a local `./plugins/make-skills-claude` source, so installs track the branch the marketplace is added from. Codex and `npx skills add` still resolve `main` HEAD directly. For Cursor Team Marketplace, import this repo and track branch **`v2`** (branch is not set in `.cursor-plugin/marketplace.json`).

## License

MIT
