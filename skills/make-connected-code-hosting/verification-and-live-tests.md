# Verification and live tests

Use this reference after generating a Connected Code blueprint or creating a test scenario.

## Safe smoke loop

1. Create the scenario with on-demand scheduling.
2. Activate it.
3. Run once with a narrow test payload.
4. Inspect the run result and execution log.
5. Deactivate the scenario unless the user explicitly wants it active.
6. Apply the real recurring schedule only after the smoke run succeeds.

Completion criterion: final report includes scenario id, execution id, status, module id, and whether the test scenario was deactivated.

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
- final answer included scenario id, execution id, status, provider or connection surface, module id, and the required handoff sentence;
- no secrets were printed.

## Failure table

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Scenario remains active after test | Smoke loop skipped deactivation | Deactivate immediately, then apply real schedule only when requested. |
| Run succeeds but no payload appears | Run surface returned status only | Add capture/output module if payload assertion is required. |
| HTTP request fails out of scope | URL is outside `httpBaseUrl` | Use a relative path or correct the HTTP Base URL in the editor. |
| Postgres helper missing | Wrong app or connection surface selected | Recheck module parameters and selected connection. |
| Webhook fields missing | Webhook payload interface was not controlled | Define/capture webhook structure and remap `input`. |
| Model-style API reports missing model | Model id was guessed | Run a read-only metadata probe through the selected connection and rerun with a returned id. |

## Final report shape

```text
scenarioId: <id>
executionId: <id>
status: 1
module id: connected-code:ExecuteConnectedCode
connection surface: <HTTP | Supabase REST | Postgres | selected app>
deactivated after test: yes
Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.
```
