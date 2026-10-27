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
