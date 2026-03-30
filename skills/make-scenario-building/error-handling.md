---
name: error-handling
description: Attaching error handlers to modules for try/catch-style recovery in Make scenarios.
---

# Error Handling

## What It Is

Error handling in Make provides try/catch-style recovery for modules that fail during scenario execution. You can attach an error handler to any module (except Routers and error handlers themselves) to control what happens when that module encounters an error.

**IMPORTANT: This is an advanced feature. Do NOT proactively suggest error handlers unless the user explicitly asks for them.** Adding error handling to basic scenarios adds unnecessary complexity.

## When to Use It

- The user explicitly requests error handling, retry logic, or fault tolerance.
- A critical module in the scenario must not silently fail (e.g., payment processing, data sync).
- The user wants fallback behavior when a third-party API is unreliable.

## How It Works in Make

Every module (except Routers and error handlers) can have an error handler attached. When the module fails, the error handler determines what happens next.

### Error Handler Types

| Handler | What It Does | When to Use |
|---|---|---|
| **Break** | Stores incomplete execution, enables automatic or manual retry later | You want to pause and retry without losing progress |
| **Commit** | Stops execution but saves all changes made up to the failure point | You need to halt but preserve partial work |
| **Ignore** | Discards the error, continues processing subsequent bundles | The error is non-critical and shouldn't block other items |
| **Resume** | Substitutes a fallback value for the failed module's output, continues processing | You can provide a reasonable default when a module fails |
| **Rollback** | Stops execution and reverts all changes made by transactional modules | You need all-or-nothing consistency (undo everything on failure) |

### Attachment

Error handlers are attached to individual modules, not to the scenario as a whole. Each module can have its own error handler with its own type and configuration.

## Flowchart Notation

```
Trigger → Module A → Module B [error handler: Resume (fallback: empty string)] → Module C
```

Or for break/retry:
```
Trigger → Module A → Payment API [error handler: Break (retry after 15 min)] → Confirmation Email
```

## Example

A scenario where payment processing has retry logic but logging failures are ignored:

```
Webhook → Stripe - Charge Customer [error handler: Break] → Google Sheets - Log Transaction [error handler: Ignore] → Slack - Notify Team
```

### Error Types

Make categorizes errors into types. Understanding which type you're dealing with helps choose the right handler:

| Error Type | Description | Common Handler |
|---|---|---|
| **ConnectionError** | Cannot connect to the third-party service | Break (retry later) |
| **DataError** | Invalid data (wrong format, missing required fields) | Resume (fallback) or Ignore |
| **RuntimeError** | Unexpected failure during execution | Break or Rollback |
| **RateLimitError** | API rate limit exceeded | Break (with exponential backoff) |
| **InvalidConfigurationError** | Module misconfigured | Fix config — no handler helps |
| **MaxFileSizeExceededError** | File too large | Resume (skip) or Ignore |

### Throw Module

The **Throw** module intentionally raises an error in the scenario flow. Use it for validation — e.g., if data doesn't meet expected criteria, throw an error to trigger an upstream error handler or halt the scenario.

### Exponential Backoff

For transient failures (API rate limits, temporary outages), the **Break** handler supports automatic retries with exponential backoff — progressively increasing wait times between retry attempts.

### Break Handler Retry Mechanics

When Break triggers, the current execution is stored as an **incomplete execution**. These can be retried automatically (if configured) or manually. Break can store record IDs from the failed batch, enabling targeted retries on only the failed items.


## Gotchas

- **Don't over-use.** Most scenarios don't need error handlers. Only add them when the user has a specific failure mode in mind.
- **Handler scope.** Each handler is per-module. There's no global "catch all errors" handler for the entire scenario.
- **Break creates incomplete executions.** These consume storage and need to be resolved (retried or discarded) eventually.
- **Rollback requires ACID modules.** The Rollback handler only reverts changes for modules that support transactions (marked with the ACID tag). Non-ACID modules cannot rollback, creating potential data inconsistency if downstream errors occur.
- **Instant trigger error behavior.** If a scenario starts with an instant trigger and the "Number of consecutive errors" setting is active, the scenario deactivates immediately upon the first error (the consecutive error count is ignored).

## Official Documentation

- [Error Handling](https://help.make.com/error-handling)
- [Error Handlers](https://help.make.com/error-handlers)

See also: [Make documentation on error handlers](https://help.make.com/error-handlers) for detailed configuration.
