# GitHub dedicated webhook lifecycle — deployment blocked

A **source-grounded lifecycle teaching template**, not a secure runnable webhook or complete app. Attach/detach/receive sections are included, but **do not deploy or enable them**: incoming signature validation and replay protection are intentionally not implemented. The shipped `condition: false` guards and inactive registration must stay in place until the security gate below is satisfied.

## Section mapping and component dependencies

The folder layout and logical names below are local teaching conventions, not an SDK manifest. Component creation/binding is a separate Make editor/API operation.

1. Create a basic token connection called `githubToken` with [Parameters](connection/parameters.imljson) and [Communication](connection/api.imljson). It validates the supplied token with documented `GET /user`, then stores `token` for the lifecycle requests. Successful validation proves identity, **not** permission to administer repository webhooks.[25][26]
2. Create a dedicated **attached** webhook called `repositoryIssues`, bind it to `githubToken`, and map [Parameters](webhook/parameters.imljson), [Attach](webhook/attach.imljson), [Detach](webhook/detach.imljson), and [Communication / receive](webhook/api.imljson).[9]
3. Create an instant-trigger module, select **that webhook**, and map [Communication](trigger/api.imljson), [Static parameters](trigger/parameters.imljson), [Interface](trigger/interface.imljson), and [Samples](trigger/samples.imljson). Its empty Communication intentionally performs no follow-up request; the webhook supplies the output. An instant trigger without the webhook binding is incomplete.[10][21]

Attach illustrates the real `POST /repos/{owner}/{repo}/hooks` endpoint, explicit `events: ["issues"]`, JSON delivery, TLS verification enabled, and a per-hook secret. It is disabled and also requests `active: false`. `response.data` persists `externalHookId`, owner, and repo; detach reads those **saved values** from `webhook.*` for the documented DELETE endpoint. This is the Make attach→detach data contract, not a fabricated provider API.[9][24]

## Assumptions and placeholders

Supply repository owner/name, a suitably authorized personal access token, and a unique high-entropy secret only in secure UI fields. No values are bundled. The token validator is intentionally for personal/user tokens, not installation tokens. Validate repository permissions separately before any approved lifecycle writes.

The receive projection illustrates `issues` payload fields; the sample is a fictional output bundle, not a captured or verified delivery. GitHub sends a `ping` event after registration, not a challenge code to echo. The disabled `verification` block is a **blocked slot**, not a working ping handler and not cryptographic authentication.[29][21]

## Mandatory security / live-test gate

Before enabling any lifecycle operation:

- Ground and implement access to the **original request bytes**, compute HMAC-SHA256 with the per-hook secret, and compare `X-Hub-Signature-256` using a constant-time primitive. Reject missing/malformed/invalid signatures **before output, side effects, or successful acknowledgement**. Do not hash reserialized JSON.[20]
- Prove the chosen Make receiver mechanism exposes those bytes and a suitable constant-time verification implementation, or design and validate an authenticated verification gateway. The public Make webhook page read for this example describes `body` and headers but does not establish that raw-byte/constant-time path. **Do not assume Node `crypto` or Web Crypto exists in app IML functions.**[21][11]
- Validate event/action, repository identity and schema; authenticate `ping` before acknowledging it; keep ping out of normal bundles. A public URL or challenge response is not sender authentication.[20][27][29]
- Persist deduplication/replay state using `X-GitHub-Delivery`; decide how authorized retries/redeliveries behave. Keep TLS checks enabled, secrets out of URLs/logs, and acknowledge verified accepted events within GitHub's deadline.[27]
- In an explicitly approved test repository, verify create/readback, binding, signed normal and Unicode payloads, tampering, missing signature, wrong secret, wrong repository, duplicate delivery, ping, deleted/disabled hooks, and detach/readback. Exercise partial setup failures, cleanup, repeated detach, and token revocation. Never treat every 404 as proof that cleanup succeeded without confirming the target and permissions.[24]

## Validation level

Offline checks parse sections, check dependencies/projections, preserve the disabled guards and saved detach identifiers, and check secret-log masks. They do **not** test signature verification, Make receiver behavior, or provider E2E. Even the exact response behavior of the disabled receive configuration is not runtime-certified. No webhook was registered, delivered to, or deleted.

## Sources

[9] https://developers.make.com/custom-apps-documentation/app-components/webhooks/dedicated/attached.md
[10] https://developers.make.com/custom-apps-documentation/app-components/modules/instant-trigger.md
[11] https://developers.make.com/custom-apps-documentation/app-components/iml-functions.md
[20] https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
[21] https://developers.make.com/custom-apps-documentation/app-components/webhooks.md
[24] https://docs.github.com/en/rest/repos/webhooks
[25] https://docs.github.com/en/rest/users/users
[26] https://developers.make.com/custom-apps-documentation/app-components/connections/basic-connection.md
[27] https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks
[29] https://docs.github.com/en/webhooks/webhook-events-and-payloads
