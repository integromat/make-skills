# Read one document with the typed SDK

Load when a complete, bounded read-only starter is needed. This is a Google Docs example, not a restriction
on the skill's supported apps. Select other app/version clients and inputs from their actual definitions.

The example uses `@makehq/endpoints-sdk@0.3.0` and `@makehq/sdk@1.6.20` on Node 24 or 26. Endpoints must be
enabled for the organization, and the selected Make connection must have access to the requested document.

## Setup

Use an approved project, then install the pinned example dependencies:

```bash
npm install --save-exact @makehq/endpoints-sdk@0.3.0 @makehq/sdk@1.6.20
```

Load these values from the project's existing environment or private, ignored `.env.local`:

| Variable | Meaning |
| --- | --- |
| `MAKE_API_KEY` | Make API key supplied through the approved secret mechanism. |
| `MAKE_ZONE` | Selected Make hostname; examples use `us1.make.com`. |
| `MAKE_TEAM_ID` | Authorized team ID. |
| `MAKE_CONNECTION_ID` | Verified compatible Google Docs connection ID. |
| `GOOGLE_DOC_ID` | Explicitly selected document ID. |

Do not copy credentials or identifiers from another project. An environment file does not override existing
process environment values; resolve conflicting settings before executing.

## Runnable example

Save as `read-document.mjs`:

```javascript
import { Make } from '@makehq/sdk';
import { SdkTransport } from '@makehq/endpoints-sdk';
import { GoogleDocsV1Sdk } from '@makehq/endpoints-sdk/apps/google-docs/v1';

/** @param {string} name */
function positiveId(name) {
  const value = process.env[name];
  if (!value || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`Set ${name} to a positive integer ID.`);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new Error(`${name} exceeds a safe integer.`);
  return id;
}

const apiKey = process.env.MAKE_API_KEY;
const zone = process.env.MAKE_ZONE;
const documentId = process.env.GOOGLE_DOC_ID;
if (!apiKey || !zone || !documentId) {
  throw new Error('Set MAKE_API_KEY, MAKE_ZONE, and GOOGLE_DOC_ID.');
}
if (!/^[a-z0-9][a-z0-9-]*\.make\.com$/.test(zone)) {
  throw new Error('MAKE_ZONE must be the approved Make hostname, without a URL path.');
}
const teamId = positiveId('MAKE_TEAM_ID');
const connectionId = positiveId('MAKE_CONNECTION_ID');
const make = new Make(apiKey, zone);
const docs = new GoogleDocsV1Sdk({ transport: new SdkTransport(make), teamId });

try {
  const document = await docs.endpoints.getDocument({
    connectionId,
    input: { documentId, filter: 'image' },
  });
  console.log(JSON.stringify(document, null, 2));
} catch {
  // Keep raw upstream errors and credential-bearing request details out of logs.
  console.error('Endpoint read failed. Check access, input, and service availability.');
  process.exitCode = 1;
}
```

Run with the approved environment configured, or with the existing project-local file:

```bash
node --env-file=.env.local read-document.mjs
```

The example prints private document data deliberately for local inspection. Choose an approved output
location, avoid public logs, and sanitize any fields used in terminal summaries. No message is sent and no
source record is marked processed.

## What to verify

- A returned result belongs to the expected document and connection/account context.
- The generated call returns the document directly; no additional `.output` unwrap is needed.
- `filter: 'image'` is included because the current generated input requires it, even though some abbreviated
  examples omit it. Validate against the installed schema when upgrading.
- A syntax/type check is not a live read. An unavailable beta, missing permission, or provider error remains a
  blocker; do not create a scenario shell or call the provider directly to make the example appear successful.

For a known target outside the generated clients, `execute(pointer, options)` is available, but its response
is `{ output }` and its generic input does not supply the missing endpoint-specific validation.
