# Execution surface routing

Use this reference before building any scenario for a custom-code request.

## Decision rule

Connected Code is preferred only after availability is confirmed in the active Make workspace.

| Evidence | Route |
| --- | --- |
| `connected-code` and `connected-code:ExecuteConnectedCode` resolve in current workspace metadata | Continue with this skill and build Connected Code. |
| Connected Code resolves, but the target provider is not in the Connected Code catalog | Stay in Connected Code and evaluate the HTTP App with an explicit `httpBaseUrl` and Make credential. |
| Connected Code app/module is genuinely absent or unavailable for a provider API transport task | Stop the Connected Code branch and use `make-api-shell-connection-workflow`. |
| Connected Code app/module is genuinely absent or unavailable for a custom-code task | Discover and verify the normal Make Code module (`code:ExecuteCode`) and use it when its current interface supports the task. |
| Metadata lookup fails transiently or returns an unexplained authorization error | Diagnose access first. Do not label the app unavailable from one failed lookup. |
| User explicitly requests only normal Make modules | Use `make-scenario-building`; do not force either code surface. |
| User references the removed E2B skill | State that `make-e2b-code-execution` is deprecated and removed. Do not provide E2B setup or workaround instructions; select Connected Code or the normal Make Code module through the same availability gate. |

## Availability gate

1. Resolve the active Make zone, organization, and team.
2. Search current Make metadata for the `connected-code` app.
3. List its modules and confirm the exact `ExecuteConnectedCode` module id and version.
4. Read the current module interface before choosing parameters or connection binders.
5. Record the evidence in the response as one of:
   - `route: connected-code`
   - `route: make-code`
   - `route: make-api-shell`
   - `route: blocked — metadata/access unresolved`

With Make MCP, use current app discovery and module metadata tools such as `apps_recommend`, `app_modules_list`, and `app-module_get`. With REST, discover the app in the active organization/team and inspect its current version rather than assuming a globally visible catalog entry is usable in the workspace.

A `401`, `403`, timeout, or malformed metadata response is not by itself proof that Connected Code is absent. Resolve zone, authentication, scope, and team context first. Fall back only after the active workspace cannot expose the app/module or a workspace limitation is confirmed.

## Connected Code branch

When the gate passes:

1. Prefer a selected service App from the current Connected Code catalog.
2. If no service App matches, consider the Connected Code HTTP App before abandoning Connected Code.
3. Derive the current `connectionType`, binder, and mapper schema from metadata.
4. Author code with the correct helper:
   - HTTP/service Apps: `connection.fetch(...)`
   - PostgreSQL/MySQL Apps: `connection.sql.query(...)`
   - generic Email App: `connection.email.*`
5. Build on-demand first, complete the user-managed connection handoff, run a smoke test, and only then apply scheduling or webhook exposure.

The absence of a provider-specific Connected Code option is not the same as absence of Connected Code itself.

## E2B deprecation boundary

`make-e2b-code-execution` is deprecated and removed from this repository. Do not provide E2B setup, credential, runner, or workaround instructions here. Select Connected Code when available; otherwise inspect and use the normal Make Code module when it supports the requested custom-code task.

## Normal Make Code fallback branch

When Connected Code is unavailable for custom code:

1. Discover and verify the current `code:ExecuteCode` module and version; do not rely on stale mapper assumptions.
2. Read the current module interface and choose only a supported language, input shape, dependency shape, and output contract.
3. Keep secrets out of code and mapped inputs. Use normal Make modules or provider API shells around the Code module when connected work is required.
4. Build and run a narrow test, inspect the real output bundle, and report `route: make-code` with module/version evidence.

## Make API-shell fallback branch

When the Connected Code app/module is genuinely unavailable for a provider API transport task:

1. State the evidence and the route change.
2. Load and follow `make-api-shell-connection-workflow`.
3. Discover the provider's current Make app, exact API-call module, module connection type, and credential-request type.
4. Reuse or request the connection according to that skill.
5. Build its three-module shell contract:
   - `scenario-service:StartSubscenario`
   - one discovered app-specific API-call module
   - `scenario-service:ReturnData`
6. Return the response body from the actual middle API-call module. The standard example uses module id `3`, so its ExpectDataAny mapping is `data: {{3.body}}`; never replace it with `{{3}}` or a guessed `.data` field. If a UI export renumbers modules, use the real middle module id.
7. Explicitly set and verify the scenario interface before the first `/run` call.
8. Run a narrow request and inspect the real execution bundle before reporting success.

Do not copy raw provider credentials into code, switch to a direct SDK, or invent an API-call module. If the provider has no suitable Make API-call module, report that specific blocker rather than fabricating a shell.

## Handoff contract

A route change must be visible in the final response:

```text
routing: Connected Code unavailable in the active workspace
fallback: make-api-shell-connection-workflow
provider app/module: <discovered app and API-call module>
connection: <reused | credential request required>
verification: <scenario id, execution id, result>
```
