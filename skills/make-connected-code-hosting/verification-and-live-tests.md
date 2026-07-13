# Verification and live tests

Use this reference after the execution-surface gate selected Connected Code and a blueprint or test scenario was created. If the gate selected Make API shell, use the verification contract from `make-api-shell-connection-workflow` instead.

## Safe smoke loop

1. Create the scenario with on-demand scheduling.
2. Activate it.
3. Run once with a narrow test payload.
4. Inspect the run result and execution log.
5. Deactivate the scenario unless the user explicitly wants it active.
6. Apply the real recurring schedule only after the smoke run succeeds.

Completion criterion: final report includes scenario id, execution id, status, module id, and whether the test scenario was deactivated.

Also record the routing proof: active zone/team, how `connected-code:ExecuteConnectedCode` was resolved, and the selected App/connection surface.

## Interpreting status

A successful run may return only:

```json
{
  "executionId": "...",
  "status": 1
}
```

Treat `status: 1` plus a matching scenario log as valid proof that the scenario executed. If the exact `result` body must be asserted, add a capture/output module or scenario output interface. Do not assume every run surface returns full module output.

## Network-enabled agent tests

Some coding-agent sandboxes block network calls by default. For live acceptance tests, use a network-enabled mode approved by the user. Pass credentials through the host environment or a restrictive local secret mechanism; never paste secrets into the prompt.

The pass criterion for live agent tests is:

- scenario was created;
- module id is `connected-code:ExecuteConnectedCode`;
- scenario was activated;
- scenario run returned `status: 1`;
- scenario was deactivated after test;
- final answer included scenario id, execution id, status, provider or connection surface, and module id;
- the required connection handoff sentence was used only before verification when editor-managed connection setup was still pending;
- no secrets were printed.

## Failure table

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Scenario remains active after test | Smoke loop skipped deactivation | Deactivate immediately, then apply real schedule only when requested. |
| Run succeeds but no payload appears | Run surface returned status only | Add capture/output module if payload assertion is required. |
| HTTP request fails out of scope | URL is outside `httpBaseUrl` | Use a relative path or correct the HTTP Base URL in the editor. |
| Postgres helper missing | Wrong app or connection surface selected | Recheck module parameters and selected connection. |
| `Broker is not configured for this connection` | HTTP-transport service App called through `connection.email.*` or `connection.sql.query(...)` | Match the helper to the App. Gmail/Sage use `connection.fetch(...)`; generic Email uses `connection.email.*`; PostgreSQL/MySQL use `connection.sql.query(...)`. |
| Connected Code app/module cannot be resolved for provider API transport after zone, auth, and team checks | App is unavailable in the active workspace | Stop generating Connected Code and continue with `make-api-shell-connection-workflow`. |
| Connected Code app/module cannot be resolved for a custom-code task | Connected Code is unavailable in the workspace | Discover and verify the normal Make Code module (`code:ExecuteCode`), then run the supported task through that module. |
| Webhook fields missing | Webhook payload interface was not controlled | Define/capture webhook structure and remap `input`. |
| Model-style API reports missing model | Model id was guessed | Run a read-only metadata probe through the selected connection and rerun with a returned id. |

## Final report shape

```text
routing: connected-code
availability evidence: connected-code:ExecuteConnectedCode resolved in active workspace
scenarioId: <id>
executionId: <id>
status: 1
module id: connected-code:ExecuteConnectedCode
connection surface: <HTTP | Supabase REST | Postgres | selected app>
deactivated after test: yes
connection handoff: completed before verification
```

If the smoke test cannot begin because the editor-managed connection is still missing, stop before this final report and use the required handoff sentence from `SKILL.md`.
