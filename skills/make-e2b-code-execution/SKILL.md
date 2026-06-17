---
name: make-e2b-code-execution
description: Use this skill when an agent needs to write reusable code, store it under the configured Hermes Code folder, run it directly through local code execution, or host it behind a Make-managed E2B Code Shell scenario. Use for tool-building, generated business automation scripts, and nested flows where hosted code calls Make API shell scenarios for SaaS access without receiving raw OAuth, Make, or E2B secrets.
license: MIT
compatibility: Requires the make-api-shell-connection-workflow skill, a Make API token owned by the runtime provider, and an E2B runner endpoint owned by infrastructure when hosted execution is requested.
metadata:
  author: Make
  version: "0.2.1"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make E2B Code Execution

Use this skill when the user wants code to become a durable tool.

Known E2B module id: the E2B sandbox module is `"module": "e2b:RunE2BSandbox"` with `"version": 0`.

The architecture is:

```text
Hermes writes code -> Code folder -> local execution or Make E2B Code Shell -> E2B runtime
```

If that code needs SaaS data, it must call a Make API shell scenario from
`make-api-shell-connection-workflow`. Do not put OAuth secrets, Make API tokens,
E2B API keys, refresh tokens, provider passwords, or direct provider SDK auth in
generated code.

## Storage Rule

Store all durable code artifacts below the configured Hermes Code folder:

- local knowledge store: `knowledge/hermes/Code/...`
- Google Drive knowledge store: `/Hermes/Code/...`

Use the runtime helper, for example:

```python
import make_api_shell as make

make.write_code_artifact(
    "tools/calc.py",
    "print(17 * 23)\\n",
    language="python",
    confirm=True,
)
```

Do not write durable code files directly with shell redirection, `open(...)`, or
`Path.write_text(...)` unless the user explicitly asked for a temporary local
scratch file.

## Execution Modes

### Plain Code Execution

Use this for quick, non-hosted code:

1. Write the code artifact under `Code/`.
2. Run it with the local `code_execution` tool.
3. Write a short run note or output artifact only through the configured
   Knowledge helper.

### Hosted E2B Code Shell

Use this when the code should become a reusable hosted tool:

1. Write the code artifact under `Code/`.
2. Create or reuse a Make scenario that matches the E2B Code Shell contract.
3. Run the shell with `codePath`, `language`, `entrypoint`, `input`, `mode`, and
   `timeoutMs`.
4. Treat the E2B shell output as the tool result.

The Make scenario is the control-plane shell. E2B is only the runtime. The
agent never receives E2B credentials.

### Building the shell on the verified `e2b` Make app (verified live)

When no infrastructure runner URL is available, build the E2B Code Shell as an
app-action shell on the Make-verified app `e2b` ("e2b.dev", beta, major
version 0), module `e2b:RunE2BSandbox`:

- Module mapper fields: `execLanguage` (`python`/`javascript`), `inputFormat`
  (`string`/`base64`), `dependencies` (array), `timeoutSeconds` (number,
  required), `code` (text, required). Map inputs from the standard shell
  interface as `{{2.qs.<field>}}`.
- The connection comes from a credential request for `e2b` /
  `RunE2BSandbox`. **Bind it twice**: as legacy `__IMTCONN__` (required by the
  shell verifier) and as the module's declared parameter `account` —
  manifest-2/SDK modules ignore `__IMTCONN__` and otherwise run without
  credentials. In helper environments pass
  `connection_parameter="account"` to `create_app_action_shell_scenario`.
- Patch the scenario interface to the generic shell contract before the first
  run, then activate the scenario.
- The module's output field is **`logs`** with shape
  `{"stdout": ["..."], "stderr": []}` — map ReturnData as
  `{"data": "{{<moduleId>.logs}}"}` (`stdout`/`result`/`output` do not exist
  and silently return null). Use `return_field="logs"` in helper environments.
- Editing the scenario in the Make UI **renumbers module ids** and rewrites
  the module parameters (dropping `__IMTCONN__`). After any UI edit, re-read
  the blueprint, re-bind the connection both ways, and fix the ReturnData
  reference to the new module id — a stale reference returns `data: null`
  on otherwise successful runs.
- E2B error fingerprints from the module: `401: authorization header is
  missing` means the module sent no key (connection not bound);
  `401: authorization header is malformed` means the stored apiKey does not
  start with `e2b_` — common causes: a "Bearer " prefix, quotes, the
  `sk_e2b_...` Access Token pasted instead of the API Key, or a UI save that
  silently did not persist (fix via `POST /connections/{id}/set-data`). The
  e2b app sends `X-API-Key: <apiKey>` raw, so store the bare `e2b_...` key.

## Nested SaaS Access

For “inception” tools, generated code may call Make API shell scenarios:

```text
Hosted code -> Make Gmail API shell -> Gmail API
```

The hosted code should receive only scenario IDs, paths, request payloads, and
non-secret input data. It must never receive raw Make or provider credentials.

## References

- [Execution modes](./references/execution-modes.md)
- [E2B Code Shell scenario contract](./references/e2b-code-shell-contract.md)
