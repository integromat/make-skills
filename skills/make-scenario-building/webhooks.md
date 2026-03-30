---
name: webhooks
description: Triggering scenarios via HTTP webhooks — instant triggers and custom webhook endpoints.
---

# Webhooks

## What It Is

Webhooks allow external systems to trigger Make scenarios by sending HTTP requests to a generated URL. They provide instant, event-driven execution — the scenario runs immediately when data arrives, rather than polling on a schedule.

## When to Use It

- An external system needs to push data into Make in real-time (e.g., form submissions, payment events, GitHub pushes).
- You need the scenario to start instantly when something happens, not on a schedule.
- You're building inter-scenario communication where one scenario triggers another.

## How It Works in Make

### Webhook Types

| Type | Description |
|---|---|
| **App-specific webhooks (Instant triggers)** | Built into specific apps. Labeled "INSTANT" in module lists. E.g., `Slack - Watch Events`, `Stripe - Watch Events`. Auto-configured with the app's API. |
| **Custom webhooks** | Generic HTTP endpoints via the Webhooks app. Accept any JSON/form data. You define the data structure. |

### Custom Webhook Setup

1. Add a **`Webhooks > Custom webhook`** module as the scenario trigger.
2. Make generates a unique URL.
3. Configure the external system to POST data to that URL.
4. The scenario executes once per request, with the request body available as the trigger bundle.

### Data Structure

Custom webhooks can auto-detect the data structure from the first request, or you can define it manually. The structure determines what fields are available for mapping in downstream modules.

## Flowchart Notation

```
Trigger: Webhooks - Custom webhook → Process Data → Slack - Send Message
```

App-specific:
```
Trigger: Stripe - Watch Events (INSTANT) → If-Else
  ├─ If (event = "payment_succeeded"): Update CRM
  └─ Else: Log Event
```

## Example

A scenario that receives form submissions and creates CRM contacts:

```
Trigger: Webhooks - Custom webhook → Router
  ├─ Route 1 (type = "contact"): HubSpot - Create Contact
  └─ Route 2 (type = "support"): Zendesk - Create Ticket
```

## Gotchas

- **Instant vs polling triggers.** If an app has instant triggers (webhooks), prefer them over polling triggers — they're faster and use fewer operations. Check `app_modules_list` for modules labeled as instant/webhook triggers.
- **URL is unique and secret.** The webhook URL acts as both address and authentication. Don't expose it publicly without additional validation.
- **One request = one execution.** Each HTTP request triggers one scenario run. Batch multiple items in a single request if you want to process them together (then use an Iterator to split).
- **Webhook queue.** If the scenario is busy, incoming webhook requests queue. They're processed in order when the scenario becomes available.
- **Rate limiting.** Make processes up to 300 incoming webhook requests per 10-second interval. Exceeding this returns a 429 "Too many requests" error.
- **Queue limits.** For every 10,000 credits licensed monthly, you can store up to 667 items per webhook queue (maximum 10,000 items). When full, Make rejects incoming data over the limit.
- **Webhook expiration.** Make automatically deactivates webhooks not connected to any scenario for more than 5 days (120 hours). Deactivated webhooks return a 410 Gone status code.
- **Parallel vs sequential processing.** By default, webhook scenarios process requests in parallel (concurrently). Enable sequential processing in scenario settings to force Make to wait for the previous execution to complete before starting the next one.
- **Error behavior.** Immediate (webhook) scenarios stop immediately on error. Scheduled scenarios stop after 3 unsuccessful attempts.


## Official Documentation

- [Webhooks](https://help.make.com/webhooks)

See also: [Subscenarios](./subscenarios.md) for scenario-to-scenario communication, [Filtering](./filtering.md) for controlling which webhook payloads get processed.
