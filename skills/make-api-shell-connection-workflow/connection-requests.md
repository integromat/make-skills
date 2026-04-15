# Connection Requests

This file covers how to request authorization for the shell, inspect the result, and patch the selected connection into the scenario.

## Authentication format

Use a Make API token in the header:
```text
Authorization: Token YOUR_API_KEY
```

## Decision ladder

Prefer the most current supported path first, then fall back only when needed.

1. Try:
   - `POST /api/v2/credential-requests/requests/v2`
2. If that path is unavailable for the workspace or feature set, try:
   - `POST /api/v2/credential-requests/actions/create-by-credentials`
3. Use older legacy request paths only when the workspace clearly still depends on them.

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

## Inspect authorization state

After the user opens the public authorization URL and completes consent, inspect the request:
- `GET /api/v2/credential-requests/requests/{requestId}/detail`

Confirm:
- request status
- credential state
- resulting credential or connection identifier

## Patch the scenario after authorization

Once the chosen connection exists:
1. inspect the current blueprint
2. inject the confirmed connection value in the correct module field or restore structure
3. update the scenario
4. activate it if needed
5. run a verification execution

## What to record before patching

Always record these values first:
- scenario ID
- target module ID in the blueprint
- exact connection field or restore path to update
- selected connection ID
- both connection type layers for the app

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
