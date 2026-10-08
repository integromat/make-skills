# Make plugin for Grok Build

Build Make automations and AI Agents from Grok. Turn recurring work you spot in Grok into Make automations and AI Agents that keep running in the cloud. Build, run, and manage them from Grok Build, connected to the apps and data they need, without switching tools. Everything stays visible in Make's visual landscape, so you can inspect and change it anytime.

## What it ships

- **Skills** — `make-scenario-reference`, `make-scenario-explore`, `make-scenario-building`, `make-scenario-operations`.
- **MCP server** — Make's hosted MCP server at `https://mcp.make.com/v2`. Sign in with your Make account on first connect (OAuth); no API key needed.

No hooks, scripts or local binaries.

## Source

Skills are generated from `plugins/make-skills-codex/skills` in [integromat/make-skills](https://github.com/integromat/make-skills) by `node scripts/sync-plugins.mjs`.

## License

MIT — see [LICENSE](https://github.com/integromat/make-skills/blob/main/LICENSE).
