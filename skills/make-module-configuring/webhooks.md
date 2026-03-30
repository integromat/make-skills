---
name: webhooks
description: Configuring webhooks in Make modules — provisioning via Extract Blueprint Components, custom vs branded webhooks, data structure definition, and webhook creation via MCP.
---

# Webhooks

## What It Is

A webhook is an HTTP endpoint that triggers a Make scenario when it receives a request. Webhooks enable instant, event-driven execution — the scenario runs immediately when data arrives, rather than polling on a schedule. Webhook IDs are stored in the module's **parameters** domain.

## When It's Needed

- The scenario uses an instant trigger (webhook-based trigger module)
- An external system needs to push data into Make in real-time
- The module interface (from `app-module_get` with instructions format) specifies a hook component is required

## Two Types of Webhooks

### Branded Webhooks (App-Specific Instant Triggers)

These are built into specific apps and labeled "INSTANT" in module lists (e.g., `Slack - Watch Events`, `Stripe - Watch Events`). Their output structure is known — it's defined by the instant trigger module itself. The webhook is automatically configured with the app's API when the connection is established.

### Custom Webhooks (Gateway Package)

The generic `Webhooks > Custom webhook` module accepts any HTTP payload. Custom webhooks offer more flexibility:

- **With data structure:** Define a data structure upfront that describes the expected payload. This makes the output fields available for mapping in downstream modules.
- **Without data structure:** Send any data to the webhook endpoint. The structure can be learned from the first request — Make detects the fields automatically. This is useful when the payload format isn't known in advance.

## Provisioning Workflow

Webhooks are returned by **Extract Blueprint Components** alongside connections and keys. Unlike connections and keys, webhooks can be created directly via MCP tools.

### Step 1: Identify Required Webhooks

Call Extract Blueprint Components with the unconfigured blueprint. The output specifies which modules need webhooks and what type.

### Step 2: Create New Webhook

Always create a new webhook — do not reuse existing ones. Use `hooks_create` with the parameters specified by Extract Blueprint Components (webhook type, associated app).

#### Custom Webhook Creation — Required Parameters

When creating a custom webhook (`typeName: "gateway-webhook"`), the `data` object **must** include all three of these fields or the API returns a validation error for each missing one:

```json
{
  "name": "My Webhook",
  "teamId": <teamId>,
  "typeName": "gateway-webhook",
  "data": {
    "headers": true,
    "method": "any",
    "stringify": false
  }
}
```

| Field | Required | Values | Effect |
|-------|----------|--------|--------|
| `headers` | yes | `true` / `false` | Whether to include request headers in the output |
| `method` | yes | `"any"` / `"GET"` / `"POST"` / etc. | HTTP method(s) accepted by the webhook |
| `stringify` | yes | `true` / `false` | Whether to return the body as a raw string instead of parsed |

Omitting any of these three fields causes the `hooks_create` call to fail with a validation error listing all missing fields. Always include them explicitly.

### Step 3: Define Data Structure (Custom Webhooks)

For custom webhooks, optionally define a data structure for the expected payload:

1. Create the data structure via `data-structures_create` with the expected fields.
2. Associate it with the webhook during creation or update.

If skipping the data structure definition, the webhook will learn its output from the first incoming request.

### Step 4: Assign to Modules

Place the webhook (hook) ID in the module's parameters under the field name specified by the module interface (commonly `__IMTHOOK__`, but check the schema).

## Gotchas

- **Webhook URL is unique and acts as authentication.** Do not expose it publicly without additional validation logic in the scenario.
- **Custom webhook output depends on data structure.** Without a defined data structure and before any request has been received, the webhook's output fields are unknown — downstream modules cannot map from them until the structure is learned.
- **One webhook per trigger module.** Each webhook trigger module needs its own webhook instance.
- **Branded webhooks need connections first.** App-specific instant triggers require the app's connection to be set up before the webhook can be created, because the webhook registration happens through the app's API.
- **Hook field names vary.** Don't assume the parameter name is always `__IMTHOOK__`. Check the module interface for the exact field name.

## Official Documentation

- [Webhooks](https://help.make.com/webhooks)

See also: [Connections](./connections.md) for provisioning connections (needed before branded webhooks), [Data Structures](./data-structures.md) for defining payload schemas, [General Principles](./general-principles.md) for the overall workflow.
