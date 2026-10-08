# Make plugin for Grok Build

Build, explain, run and debug [Make](https://www.make.com) automation scenarios from Grok Build.

## What it ships

- **Skills** — `make-scenario-reference`, `make-scenario-explore`, `make-scenario-building`, `make-scenario-operations`.
- **MCP server** — Make's hosted MCP server at `https://mcp.make.com/v2`. Sign in with your Make account on first connect (OAuth); no API key needed.

No hooks, scripts or local binaries.

## Source

Skills are generated from `plugins/make-skills-codex/skills` in [integromat/make-skills](https://github.com/integromat/make-skills) by `node scripts/sync-plugins.mjs`.

## License

MIT — see [LICENSE](https://github.com/integromat/make-skills/blob/main/LICENSE).
