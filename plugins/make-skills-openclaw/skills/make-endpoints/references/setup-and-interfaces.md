# Setup and interface selection

Load for installation, imports, credential loading, or an authentication/version mismatch. Recheck the
published manifest and README when changing versions; a beta example is not a permanent API contract.

## Keep the packages distinct

| Package/interface | Purpose |
| --- | --- |
| `@makehq/sdk` / `make-cli` from `@makehq/cli` | Manage Make resources and custom-app definitions. |
| `@makehq/endpoints-sdk` / its `make-endpoints-cli` binary | Execute app Endpoints using Make connections. |
| `@makehq/endpoints-sdk/tools` | Harness-agnostic `EndpointTools` definitions and executors. |

The Endpoints SDK and CLI are one standalone package. Installing a skill does not install its runtime,
register an Endpoints MCP server, or enable the beta. Do not move calls into the platform CLI on the
assumption that interface centralisation has shipped.

The example baseline is Endpoints SDK `0.3.0` with Make SDK `1.6.20`; the former declares Node 24 or 26 and
Make SDK peer dependency `^1.6.17`. Check the current manifest before selecting another release. The
platform SDK's broader Node support is not evidence of Endpoints support.

Within an approved project, a pinned installation for that baseline is:

```bash
npm install --save-exact @makehq/endpoints-sdk@0.3.0 @makehq/sdk@1.6.20
```

A project-local CLI can be invoked with `npx make-endpoints-cli --help` after installation. To avoid a global
installation, the package's documented form is `npx --package=@makehq/endpoints-sdk make-endpoints-cli --help`;
this can still download a package into npm's cache. Pin the package selection for automation. Do not install
or upgrade globally merely to inspect a catalog.

## Load credentials without exposing them

Use the already selected secret source. Make API credentials authenticate to Make; `connectionId` selects
managed provider credentials. Neither belongs in business input or public artifacts. Endpoint execution
requires the Make `endpoints:run` scope; additional platform discovery reads need their own documented
scopes. These are separate from the OAuth scopes granted to the provider connection.

For an existing project-local `.env.local`, Node supports:

```bash
node --env-file=.env.local read-document.mjs
```

Keep that file ignored and private. Node's existing process environment takes precedence over its env file;
check for a conflicting zone/key/team configuration without printing values. Do not quietly mix contexts
or copy another project's credentials. Use `us1.make.com` in examples; actual calls use the explicitly
selected zone, with no URL scheme, path, or query in the hostname.

The CLI resolves flags, then environment variables, then the saved `make-cli login` configuration. Its saved
configuration fallback runs **only when neither key nor zone was supplied**. A zone-only environment override
does not retrieve the missing key from the saved login. For unattended execution, supply both `MAKE_API_KEY`
and `MAKE_ZONE` through the approved environment. Do not suggest an interactive login when valid file-based
configuration is already expected, or put `--api-key <secret>` in process arguments.

An SDK `new Make(apiKey, zone)` call does not automatically read the CLI login file. Configure the client
explicitly; do not imply that running `make-cli login` supplies an SDK script's environment variables.

## Current imports and response shape

- `Make` from `@makehq/sdk`.
- `EndpointsSdk` and `SdkTransport` from `@makehq/endpoints-sdk`.
- Scoped clients from `@makehq/endpoints-sdk/apps/<app>/v<N>`.
- Tool definitions from `@makehq/endpoints-sdk/tools`.

Do not copy legacy `@integromat/endpoints-sdk` or `/sdk-transport` import paths into a new published-package
example. An older pinned source checkout is a different provenance, not evidence of today's npm exports.

Generated Endpoint methods return the business output; low-level `execute` returns `{ output }`. Preserve
this difference instead of adding a second unwrap to typed calls.

Let `SdkTransport` own the execution route. Published versions may use the supported legacy
`/api/v2/endpoints/execute` alias; inspect the pinned transport before asserting which path ran. Do not edit
generated SDK code to change the route or substitute a scenario run/RPC/provider request.

## Diagnose the right layer

- Missing key or zone: check the selected credential source and CLI fallback rules first.
- 401/403: distinguish Make API authentication/scopes, team access, and the selected provider connection.
  Do not apply scenario MCP's full-OAuth-bundle rule automatically or broaden access without approval.
- 501/unavailable: stop for beta/runtime enablement; installation and catalog visibility cannot fix it.
- npm 404: verify the exact current package name and registry access before declaring the SDK nonexistent.
  Do not create a fake substitute. Any authorized official-source fallback must remain unmodified, pinned,
  and explicitly described as source rather than the published package.

## Authoritative sources

- [Endpoints package and README](https://github.com/integromat/make-endpoints-sdk)
- [Endpoints npm manifest](https://www.npmjs.com/package/@makehq/endpoints-sdk)
- [Platform SDK](https://github.com/integromat/make-typescript-sdk)
- [Make CLI](https://github.com/integromat/make-cli)
