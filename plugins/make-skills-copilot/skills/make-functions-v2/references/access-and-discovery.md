# Access and discovery

The Functions tools share the existing `make` MCP connection with scenarios and other curated features.
They belong to the **Build & Run** access area. If a call returns an authorization challenge, follow its
category-based guidance for reconnecting; do not broaden unrelated access or change accounts by assumption.
A tool being listed does not prove that the connection can invoke it.

Missing tools and a denied resource are different outcomes. Missing tools can mean the optional Functions
module is disabled, an individual tool is disabled, or the client has an older submitted/cached catalog.
A backend refusal can mean the team rollout is disabled or the caller cannot access that resource. Report
what was observed, not an invented cause. The skill never enables feature flags or backend access.

`environment_get` provides valid teams in the connected zone. `function_list` supports IDs, search and
Endpoint app filters; `function_run_list` supports version and time filters. Lists return at most 100 items
plus `hasMore`, without public offsets. Narrow when possible and explicitly report incomplete results.
For versions, use `function_version_get` for an exact known version; a capped version list is not the entire
history. Changing sort direction can expose the opposite end, but does not prove complete retrieval.

The Endpoint catalog is team-specific. Filter `function_endpoint_list` by exact `appName` or text `search`.
An empty available catalog means no matching entries; `catalogStatus: unavailable` means discovery could
not complete. Preserve `catalogId` for the subsequent type lookup. A missing/unavailable declaration does
not establish that execution is safe or supported. Do not substitute the standalone Endpoints SDK/CLI.

## Connect before discovery

A downloaded skill supplies instructions, not an authenticated MCP connection. If `make` is absent, follow
[Make Skills setup](https://github.com/integromat/make-skills#readme) for the user's client. For Codex CLI:

```bash
codex mcp add make --url https://mcp.make.com/openai
codex mcp login make
```

Reuse an existing configured connection rather than overwriting it. Let the user complete sign-in in the
browser; never request raw tokens. Refresh the client's tools after authentication, then call
`environment_get`. If a connection exists but Functions tools are absent, report that separately from a
missing connection. Reinstalling the skill cannot enable server features or grant permissions.

## Endpoint access and missing Connections

A Function without Endpoints can work even when Endpoint discovery is unavailable. An
“Endpoint availability is unavailable” error means discovery could not complete; it does not mean the
team has no Endpoints. Report the error and ask the user to contact their Make administrator or support
if it persists. Do not infer the cause or change the connection to work around it.

Discovery can also succeed while type definitions for a selected Endpoint are unavailable. Report the
returned status and pause authoring code that depends on that Endpoint until its definition is available.

If `credentialsRequired` is true but no compatible Connection is available, have the owner create or repair
one in Make. An available, authorized Credential Requests workflow is another option; load
`make-credential-requests` if installed and inspect the actual tools before using it. Do not assume that a
particular provisioning tool exists. The owner authorizes in Make; the agent receives a managed Connection
ID, never raw credentials. Repeat `function_endpoint_list` afterward to verify compatibility and intended
account. Do not choose an unrelated existing Connection just to make a test pass.
