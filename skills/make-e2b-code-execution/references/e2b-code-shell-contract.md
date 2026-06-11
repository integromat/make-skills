# E2B Code Shell Scenario Contract

An E2B Code Shell is a Make on-demand scenario with this logical shape:

```text
StartSubscenario -> HTTP request to infrastructure-owned E2B runner -> ReturnData
```

## Inputs

The scenario interface must accept:

- `codePath`: path below the Hermes `Code/` folder
- `language`: runtime language such as `python`, `javascript`, or `typescript`
- `entrypoint`: optional entry file or command
- `input`: JSON-compatible input object
- `mode`: `preview` or `run`
- `timeoutMs`: execution timeout

## Output

Return a JSON-compatible object:

```json
{
  "ok": true,
  "stdout": "",
  "stderr": "",
  "resultJson": {},
  "artifacts": [],
  "scenarioId": 123,
  "sandboxRunId": "run_..."
}
```

## Security rules

- The scenario may call the E2B runner endpoint, but Hermes must not see E2B
  credentials.
- Hosted code must not receive raw Make, OAuth, OpenAI, or provider secrets.
- SaaS access from hosted code must go through Make API shell scenarios.
- Writes and destructive operations require explicit confirmation.
