# Connection Requests

This file covers how to request authorization for the shell, inspect the result, and patch the selected connection into the scenario.

## Authentication format

Use a Make API token in the header:
```text
Authorization: Token YOUR_API_KEY
```

## Decision ladder

Prefer the most current supported path first, then fall back only when needed.

0. Before creating anything, list existing connections for the target app in the active team and reuse one if it already satisfies the workflow.
1. Try:
   - `POST /api/v2/credential-requests/requests/v2`
2. If that path is unavailable for the workspace or feature set, try:
   - `POST /api/v2/credential-requests/actions/create-by-credentials`
3. Use older legacy request paths only when the workspace clearly still depends on them.

Important branching rule:
- if the workspace returns a policy or permission denial such as `403 Permission denied` or a message indicating credential requests are not enabled for the target user/workspace, stop and report a workspace feature restriction
- do not keep retrying equivalent credential-request endpoints when the failure is clearly policy-based rather than endpoint-shape-based
- only fall back to another endpoint when the evidence suggests API-version mismatch, route availability, or request-shape incompatibility
- if authorization fails because an existing connection is expired, revoked, or otherwise invalid, do not try to re-auth that connection in place; use the credential-request path to create a fresh connection

## Preflight: reuse before create

Before opening a new credential request, verify all of the following:
- correct zone
- correct organization and team
- the provider has already been proven in the Make app catalog for this organization/team
- existing connections for the target app in that team
- whether one of those connections is already suitable for the requested account and scope

REST example:
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'user-agent: Mozilla/5.0' \
  "${BASE_URL}/api/v2/connections?teamId=${TEAM_ID}&type[]=azure"
```

For REST calls, prefer the `type` filter. Do not rely on `accountName=...` query parameters to filter the response.

Do not treat a type match alone as enough to reuse the connection. Also confirm:
- the connection family matches the discovered module's expected connection family
- the account identity matches the requested mailbox, tenant, workspace, or user
- the scope set is sufficient for the intended API path and method
- the connection is not known to be expired, revoked, or otherwise invalid

If Make MCP or another supported surface exposes connection detail, inspect it before reuse. Useful checks include the visible account label and scope count.

## Recipient and account-identity gate

Before creating a new credential request, resolve two separate questions:

1. Who should complete the authorization flow?
2. Which provider account should the resulting connection point at?

Do not assume the current Make token owner is automatically the right credential-request recipient if the task is for another human or shared account.

Do not assume the first matching connection is correct when multiple connections exist for the same app. Compare at least:
- connection type
- account metadata such as email, domain, tenant, or UID when available
- scenario usage if the shell is expected to reuse a known existing scenario
- scope fit for the requested operation

If the intended recipient or target account identity is unclear, stop and ask for that exact missing item before creating a new request.

## New-connection rule

If a new credential request results in a newly authorized connection, create a new shell for that new connection.

The same rule applies when an old connection exists but its authorization is expired or invalid.

Do not automatically patch a pre-existing shell to point at the newly created connection unless the user explicitly wants that exact shell replaced.

Reason:
- it keeps shell ownership and account identity clear
- it avoids silently repointing an existing reusable scenario from one account to another
- it generalizes across email, CRM, ticketing, and other SaaS providers

It also prevents a different class of mismatch: same vendor suite, wrong connection family. Example: a provider's mail app and calendar app may both authenticate through the same vendor, while the discovered Make modules still require different app bindings or different connection families.

## Recommended V2 request style

Why this is preferable:
- you specify the app and module context directly
- Make can derive required credential types more reliably
- the request is less dependent on hardcoded connection-type assumptions

Example body with placeholders:
```json
{
  "name": "Outlook API shell connection",
  "teamId": TEAM_ID,
  "description": "Authorize Outlook for the generic API shell scenario.",
  "credentials": [
    {
      "appName": "microsoft-email",
      "appModules": ["makeApiCall"],
      "appVersion": 2,
      "nameOverride": "outlook-api-shell"
    }
  ]
}
```

Use this path when the workspace can infer the needed connection family from the discovered app/module context and you do not need to force an explicit connection type.

## Fallback create-by-credentials style

Use this when the workspace requires an explicit connection type.

Example body with placeholders:
```json
{
  "name": "Gmail API shell connection",
  "description": "Authorize Gmail for the generic API shell scenario.",
  "teamId": TEAM_ID,
  "connections": [
    {
      "type": "google-email",
      "description": "Readonly Gmail connection for the API shell example.",
      "scope": ["https://www.googleapis.com/auth/gmail.readonly"],
      "nameOverride": "gmail-api-shell"
    }
  ]
}
```

This fallback is often the safer generic choice when you already know the exact connection family and scope requirement and want the request to encode them directly.

Practical rule:
- prefer the V2 request style first
- if the workspace does not infer the right connection family, or if the request needs an explicit scope declaration, fall back to `create-by-credentials`
- for Google-family apps in particular, verify whether the discovered module expects a Gmail-specific family such as `google-email` or a broader Google family such as `google`

## Inspect authorization state

After the user opens the public authorization URL and completes consent, inspect the request:
- `GET /api/v2/credential-requests/requests/{requestId}/detail`

Confirm:
- request status
- credential state
- resulting credential or connection identifier

Also confirm whether the resulting connection is usable in the target scenario or module family. Authorization success alone does not prove that retrieval execution is correctly configured.

## Patch the scenario after authorization

Once the chosen connection exists:
1. inspect the current blueprint
2. inject the confirmed connection value in the correct module field or restore structure
3. update the scenario
4. activate it if needed
5. run a verification execution

If a reusable shell scenario already exists, prefer patching that shell only when reusing an existing suitable connection. If the connection is newly created, create a new shell for that new connection.

## What to record before patching

Always record these values first:
- scenario ID
- target module ID in the blueprint
- exact connection field or restore path to update
- selected connection ID
- both connection type layers for the app

If the request was created for a different recipient than the current token owner, also record:
- intended recipient identity
- recipient Make user ID if known
- any workspace or feature limitations discovered during request creation

## Safe user-facing write prompt

Use a brief confirmation prompt before patching an existing scenario:

```text
You asked me to patch the Make shell with the authorized connection.
Risk: this can overwrite the current connection mapping and stop the scenario if the wrong connection is inserted.
Example: if the shell expects an Outlook connection and I patch a different credential, the API-call module can fail until corrected.
Reply with YES to proceed, or tell me what to change first.
```

## Public sharing rule

If this workflow is being published or contributed to a shared repository:
- replace real team IDs, organization IDs, user IDs, connection IDs, and workspace-specific names with placeholders
- use neutral labels such as `gmail-api-shell` instead of personal labels
- avoid phrases such as `verified live` or `worked in tenant X`
- describe fallbacks as compatibility options, not as tenant-specific facts
