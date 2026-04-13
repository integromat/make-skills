---
name: connections
description: Authenticating Make modules with external services via connections.
---

# Connections

## What It Is

A connection is Make's way of authenticating with an external service. Before a module can interact with an app (e.g., Google Sheets, Slack, Stripe), it needs a connection that provides the credentials and permissions.

## When to Use It

- Most modules that interact with an external service require a connection (some public APIs like the Weather app do not).
- When setting up a new app in a scenario for the first time.
- When a scenario fails with authentication or authorization errors.

## How It Works in Make

### Connection Lifecycle

1. **Create a connection** — authenticate with the external service (OAuth flow, API key, or other method depending on the app).
2. **Assign to modules** — each module that uses the app references the connection.
3. **Reuse across modules** — multiple modules for the same app can share one connection.
4. **Reuse across scenarios** — connections are organization-level resources, shared across all scenarios in a team.

### Authentication Methods

| Method | Description | Common apps |
|---|---|---|
| **OAuth 2.0** | Redirects to the service for authorization. Tokens auto-refresh. | Google, Slack, HubSpot, Salesforce |
| **API Key** | Simple key-based auth. Entered directly. | OpenAI, Anthropic, many REST APIs |
| **Basic Auth** | Username/password pair. | Legacy APIs, some databases |
| **Custom/Token** | Service-specific token or configuration. | Webhooks, custom HTTP modules |

### Connection Per Module

When composing a scenario, note which apps are involved. Each distinct app needs at least one connection. Multiple modules from the same app typically share a connection.

## Flowchart Notation

Connections are not shown in flowcharts — they're implicit. When relevant, note which apps are involved:

```
Trigger: Google Sheets - Watch New Rows [connection: Google] → Slack - Send Message [connection: Slack]
```

## Example

A scenario using three different services (three connections needed):

```
Trigger: Stripe - Watch Events [connection: Stripe]
  → Google Sheets - Add Row [connection: Google]
  → Slack - Send Message [connection: Slack]
```

## Gotchas

- **Connections are created before module configuration.** A module can't be fully configured until its connection exists and is authorized.
- **OAuth token expiry.** OAuth connections auto-refresh tokens, but if the refresh token is revoked (e.g., password change, permission revocation), the connection breaks and needs reauthorization. Failed reauthorization can also result from browser pop-up blocking or temporary service outages.
- **One connection per auth context.** If you need to access different accounts of the same service (e.g., two different Google accounts), create separate connections.
- **Permission scopes.** Some apps require specific permission scopes. If a module fails with permission errors, the connection may need broader scopes — recreate it with the required permissions.
- **Editing replaces all data.** Editing a connection replaces the original data entirely — Make does not keep the original connection data. All credentials must be provided again, and all modules using that connection automatically receive updates.
- **Deletion dependencies.** Before deleting a connection, verify it is not active in scheduled scenarios. Webhooks using a connection must be deleted first.
- **accountName vs app name mismatch.** The `connections_list` `type` filter matches `accountName`, not the Make app name. Google Sheets, Google Calendar, and Google Drive all use `accountName: "google"`. **Gmail (`google-email`) uses `accountName: "google-email"` — it is a separate connection type from `"google"`.** Slack modules use `accountName: "slack2"`, Notion uses `accountName: "notion2"` or `"notion3"`. **Best practice:** List all connections without a type filter, then match by `accountName` field in the results. Filtering by app name (e.g., `type: "google-sheets"`) will return zero results.
- **Connection `userId` is the bot, not the human.** OAuth connection metadata includes a `userId` that identifies the authenticated bot or service account — not the human user. Never use it as a message recipient or target identity. Resolve actual user/channel/resource targets via the module's RPCs.

## Official Documentation

- [Connect an Application](https://help.make.com/connect-an-application)

See also: [Webhooks](./webhooks.md) for webhook-specific authentication, [Error Handling](./error-handling.md) for handling ConnectionError failures.
