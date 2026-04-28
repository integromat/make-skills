---
name: connections
description: How to provision and assign connections to Make modules — credential request flow, Extract Blueprint Components, OAuth scope checking, reusing existing connections, and scope expansion.
---

# Connections

## What It Is

A connection is Make's way of authenticating a module with an external service. Before a module can interact with an app (e.g., Google Sheets, Slack, Stripe), it needs a connection that provides the credentials and permissions. Connection IDs are stored in the module's **parameters** domain (static, immutable at runtime).

## When It's Needed

- Every module that interacts with an external service requires a connection.
- The module interface (from `app-module_get` with instructions format) specifies which connection type(s) the module accepts.
- Some apps support multiple connection types (e.g., an email app may accept SMTP, Google, or Outlook connections). When multiple types are available, ask the user which one to use.

## The Connection Provisioning Workflow

Connections cannot be created directly by the agent — they involve OAuth authorization flows, API key entry, or other sensitive credential handling that the user must complete. The agent's role is to orchestrate the process.

### Step 1: Extract Blueprint Components

After laying out all modules in the scenario (unconfigured), call the **Extract Blueprint Components** tool with the blueprint. This returns:

- A list of all connections needed across the scenario
- The connection type for each (matching what the module interface specifies)
- Required **OAuth scopes** for each connection (critical for OAuth-based services)

This is the authoritative source for what connections the scenario needs and what scopes they require.

### Step 2: Check for Existing Connections

For each required connection, check whether a compatible connection already exists in the user's team:

- Use `connections_list` to find existing connections of the same type.
- **Scope verification (OAuth):** If the Extract Blueprint Components output specifies required scopes, verify that the existing connection has all of them. A connection with insufficient scopes will cause 403/permission errors at runtime.

**IMPORTANT — Always ask the user.** Even if only one matching connection exists, present all options and let the user choose. Do not auto-select. The user may have multiple accounts or prefer a fresh connection.

**Decision tree:**

| Situation | Action |
|-----------|--------|
| Existing connection(s) with sufficient scopes | List ALL matches with name, ID, and metadata (email/workspace). Include "Create a new connection" as the last option. Ask the user which to use. |
| Existing connection with insufficient scopes | Expand scopes (see Step 3a) or create new |
| No existing connection of the right type | Create new via credential request (see Step 3b) |
| Multiple connection types accepted by module | Ask user which type they want |

### Step 3a: Expand Connection Scopes

If an existing connection lacks required scopes, use the scope expansion tool to request the user to reauthorize with additional permissions. The user goes through the OAuth consent screen again and grants the missing scopes.

Alternatively, offer to create a brand new connection with all required scopes from the start.

### Step 3b: Create via Credential Request

For connections that don't exist yet:

1. **Create a credential request** via `credential_requests_create`. Provide:
   - The connection type (from Extract Blueprint Components)
   - Required scopes (for OAuth connections)
   - The user will receive a URL to complete the authorization flow

2. **Wait for user completion.** The user clicks through the OAuth flow, enters API keys, or completes whatever authentication the service requires. The agent does not handle connection inner fields (API keys, custom domains, tokens) — the credential request flow covers all of that.

3. **Retrieve the result.** Once the user confirms completion, call `credential_requests_get` to verify the credential request status and obtain the **connection ID** that was created.

4. **Store the connection ID.** This ID goes into the module's parameters when configuring the module.

### Step 4: Assign to Modules

When configuring each module, place the connection ID in the **parameters** domain under the field name specified by the module interface (commonly `__IMTCONN__`, but check the schema — some modules use different field names like `account`).

Multiple modules using the same app typically share one connection.

## Multiple Connection Types Per App

Some apps accept several connection types. Examples:
- **Email apps** — SMTP, Google (OAuth), Outlook (OAuth)
- **AI/LLM apps** — OpenAI, Anthropic, Azure OpenAI, and other provider connections
- **HTTP modules** — various auth methods (no auth, Basic, OAuth, API key header)

When the Extract Blueprint Components output shows multiple connection type options for a module, present them to the user and let them choose. Do not assume which type to use.

**Dynamic Connections (Enterprise only):** A variable that contains multiple connections, allowing users to choose which connection a module uses at runtime via scenario inputs. Useful for organizations where different team members hold separate credentials for the same service.

## Gotchas

- **Never create connections directly.** Always use credential requests. The agent should never ask the user for API keys, tokens, or passwords directly — the credential request flow handles credential entry securely.
- **Scope mismatches cause runtime failures.** A connection that authenticates successfully but lacks a required scope will fail with 403/permission errors when the module tries to perform a scoped operation. Always verify scopes match what Extract Blueprint Components specifies.
- **One connection per auth context.** If the user needs to access different accounts of the same service (e.g., two Google accounts), separate connections are needed.
- **Connection field names vary.** Don't assume the parameter name is always `__IMTCONN__`. Check the module interface for the exact field name.
- **Connections are team-level resources.** They're shared across all scenarios in a team, not scoped to a single scenario.
- **Connection type ≠ app name for filtering.** When calling `connections_list` with a `type` filter, use the `accountName` value (e.g., `"google"` for Google Sheets/Calendar/Drive, `"google-email"` for Gmail — not `"google-sheets"` or `"google"`-for-Gmail). Gmail (`google-email`) is a separate connection type from the generic Google connection. Check the `accountName` field in existing connection objects to determine the correct filter value.
- **OAuth 2.0 connections may need periodic reauthorization.** Official docs note that OAuth 2.0 services grant access for a limited time, requiring periodic reauthorization. Reauthorization failures can stem from browser blocks, expired tokens, or permission changes.
- **Editing replaces credentials entirely.** When editing a connection, all credentials must be re-provided as Make does not retain original connection data. If the account or auth method has changed, a new connection must be created instead.
- **Deleting a connection with webhooks requires deleting webhooks first.** If a webhook uses the connection, it must be deleted before the connection can be removed.
- **Some apps don't support credential requests.** Apps like `ai-tools` (Make AI Toolkit) have no module-level credential types — calling `credential_requests_create` will fail with "no modules with credentials". For these apps, the connection must be created by the user directly in the Make scenario designer. Inform the user and provide the scenario URL so they can configure it manually.
- **Connection `userId` is the bot, not the human.** OAuth connection metadata includes a `userId` field that identifies the authenticated bot or service account — never the human user. Do not use it as a message recipient, file owner, or target identity. Resolve actual user/channel/resource targets via the module's RPCs (see [General Principles — Gotchas](./general-principles.md)).

## Official Documentation

- [Connect an Application](https://help.make.com/connect-an-application)
- [Dynamic Connections](https://help.make.com/dynamic-connections)

See also: [Keys](./keys.md) for cryptographic key provisioning (same credential request flow), [General Principles](./general-principles.md) for the full module configuration workflow.
