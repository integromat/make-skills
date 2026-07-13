# Connected Code connection reference

This repository contains copy-pasteable helper guidance for Make Connected Code.
It is generated from the current Connected Code 1.2.2 catalog shape: 159 apps.

## Runtime helpers

| Helper | Use |
| --- | --- |
| `input` | Mapped business inputs only. Do not map secrets, tokens, passwords, hosts, or connection strings. |
| `connection.id` | Metadata id for the selected Make connection/keychain handle. |
| `connection.fetch(pathOrUrl, init?)` | HTTP/API request through the scoped proxy. Prefer relative paths such as `/v1/models`; the selected App/Connection supplies base URL and configured auth when available. |
| `connection.sql.query(sql, params?)` | SQL apps only. Runs through the native proxy broker; DB host, username, password, and TLS settings stay in the Make connection/proxy sandbox. |
| `connection.email.send/search/get(...)` | Generic **Email** App only. Runs through its native SMTP/IMAP broker. Gmail is an HTTP API App and must use `connection.fetch(...)`. |
| `connection.template(fieldName)` | Escape hatch for rare custom URL/header/body placement. It gives user code a template marker; the secret renders only inside the proxy request. Prefer configured auth or `connection.fetch` options first. |

## Rules for LLM-authored Connected Code

1. Use `input` only for business data.
2. Use `connection.fetch(...)` for HTTP/API apps; do not call global `fetch(...)` for authenticated app calls.
3. Prefer relative paths: `connection.fetch('/items')`. Connected Code joins the path to the selected App request base and validates it stays inside the allowed proxy scope.
4. Add query/body/headers through the second argument: `{ query, json, body, headers, method }`.
5. Do not read, log, or return raw connection secrets. User code receives a capability, not raw credential data.
6. For SQL apps, use `connection.sql.query(sql, params?)`.
7. Use `connection.email.*` only when the module's selected App is **Email** with an SMTP/IMAP connection. Gmail and other HTTP API Apps use `connection.fetch(...)`.
8. Always check `response.ok` before parsing HTTP responses.
9. Return JSON-serializable data.

### Standard HTTP/API pattern

```js
const response = await connection.fetch('/v1/items', {
  method: 'GET',
  query: { limit: 10 }
});
const text = await response.text();
if (!response.ok) throw new Error(`Request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
```

### POST JSON pattern

```js
const response = await connection.fetch('/v1/items', {
  method: 'POST',
  headers: { 'x-extra-header': 'value' },
  json: { name: input.name }
});
const text = await response.text();
if (!response.ok) throw new Error(`Request failed ${response.status}: ${text}`);
return JSON.parse(text);
```

### HTTP keychain with custom bearer placement

Use this only when the generic HTTP credential cannot express the API's required auth placement. The secret still renders only inside the proxy request.

```js
const response = await connection.fetch('/v1/models', {
  method: 'GET',
  headers: { Authorization: 'Bearer ' + connection.template('key') }
});
const text = await response.text();
if (!response.ok) throw new Error(`Request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
```

### SQL pattern

```js
const result = await connection.sql.query(
  'select $1::text as message, current_database() as database',
  ['hello from connected code']
);
return result.rows;
```

### Email send pattern

This broker example is for the generic **Email** App with an SMTP connection. It is not a Gmail example.

```js
await connection.email.send({
  to: input.to,
  subject: input.subject,
  text: input.message
});
return { sent: true };
```

## Make module setup: Gmail and Sage

The App selected in the Make Connected Code module determines both the connection binder and the supported helper surface. Saving a connection does not turn every helper into a supported operation.

| Selected App in the module | Connection | Correct helper |
| --- | --- | --- |
| Gmail | A newly authorized Gmail connection (`account:google-email`) | `connection.fetch(...)` |
| Sage Business Cloud Accounting | Sage Business Cloud Accounting connection (`account:sage-accounting`) | `connection.fetch(...)` |
| Sage Intacct | Sage Intacct OAuth 2.0 connection (`account:sage-intacct2`) | `connection.fetch(...)` |
| Email | SMTP/IMAP connection | `connection.email.*` |
| PostgreSQL / MySQL | Matching database connection | `connection.sql.query(...)` |

Do not map an access token into `input` and do not add an `Authorization` header. Connected Code injects the selected connection's OAuth token inside the scoped proxy.

### Gmail: list unread messages

Module setup:

1. Select **Gmail** as the App.
2. Create or select a **Gmail Connection**. For connections created before Connected Code 1.2.2, create a new connection or reauthorize it so the Gmail `modify`, `readonly`, and `send` scopes are granted.
3. Optional inputs: `query` and `limit`.
4. Use `connection.fetch(...)`; do not use `connection.email.search(...)`.

The Gmail request base is `https://gmail.googleapis.com/gmail/v1/users/me/`, so `/messages` resolves inside the authenticated user's mailbox.

```js
const limit = Math.max(1, Math.min(Number(input.limit || 10), 100));
const response = await connection.fetch('/messages', {
  method: 'GET',
  query: {
    q: input.query || 'is:unread',
    maxResults: limit
  }
});

const text = await response.text();
if (!response.ok) {
  throw new Error(`Gmail request failed ${response.status}: ${text.slice(0, 500)}`);
}

const data = JSON.parse(text);
return {
  messages: data.messages || [],
  nextPageToken: data.nextPageToken || null,
  resultSizeEstimate: data.resultSizeEstimate || 0
};
```

### Gmail: send an email

Use the Gmail REST API instead of `connection.email.send(...)`:

```js
function safeHeader(value, name) {
  const text = String(value || '').trim();
  if (!text || /[\r\n]/.test(text)) throw new Error(`Invalid ${name}`);
  return text;
}

const to = safeHeader(input.to, 'recipient');
const subject = safeHeader(input.subject, 'subject');
const rawMessage = [
  `To: ${to}`,
  `Subject: ${subject}`,
  'Content-Type: text/plain; charset="UTF-8"',
  'MIME-Version: 1.0',
  '',
  String(input.message || '')
].join('\r\n');

const response = await connection.fetch('/messages/send', {
  method: 'POST',
  json: { raw: Buffer.from(rawMessage, 'utf8').toString('base64url') }
});

const text = await response.text();
if (!response.ok) {
  throw new Error(`Gmail send failed ${response.status}: ${text.slice(0, 500)}`);
}
return JSON.parse(text);
```

### Sage Business Cloud Accounting: list businesses

Module setup:

1. Select **Sage Business Cloud Accounting** as the App.
2. Select its Sage connection.
3. Use the `/businesses` endpoint with `connection.fetch(...)`.

```js
const response = await connection.fetch('/businesses', {
  method: 'GET'
});

const text = await response.text();
if (!response.ok) {
  throw new Error(`Sage Accounting request failed ${response.status}: ${text.slice(0, 500)}`);
}

const data = JSON.parse(text);
return data.$items || data;
```

Most business-specific Sage Accounting endpoints also require the non-secret business id in `X-Business`. Map a `businessId` input and pass it explicitly:

```js
const response = await connection.fetch('/contacts', {
  method: 'GET',
  headers: { 'X-Business': String(input.businessId) },
  query: { items_per_page: 50 }
});
const text = await response.text();
if (!response.ok) throw new Error(`Sage contacts failed ${response.status}: ${text.slice(0, 500)}`);
const data = JSON.parse(text);
return data.$items || data;
```

### Sage Intacct: query affiliate entities

Sage Intacct is a separate App and connection from Sage Business Cloud Accounting. Its request base is `https://api.intacct.com/ia/api/v1/`.

```js
const response = await connection.fetch('/services/core/query', {
  method: 'POST',
  json: {
    object: 'company-config/affiliate-entity',
    fields: ['key', 'id', 'name'],
    size: 100,
    orderBy: [{ id: 'asc' }]
  }
});

const text = await response.text();
if (!response.ok) {
  throw new Error(`Sage Intacct request failed ${response.status}: ${text.slice(0, 500)}`);
}
return JSON.parse(text);
```

For an entity-specific Intacct request, map `entityId` and add `X-IA-API-Param-Entity`; Connected Code still injects the OAuth `Authorization` header itself.

## Troubleshooting: `Broker is not configured for this connection`

Example failure:

```text
Code execution failed: connection broker failed: 500
{"error":"Broker is not configured for this connection"}
```

This is a helper/App mismatch, not a request-body error and usually not a missing password:

- `connection.sql.query(...)` calls the native PostgreSQL/MySQL broker.
- `connection.email.*` calls the native SMTP/IMAP broker used by the generic **Email** App.
- Gmail, Sage Business Cloud Accounting, and Sage Intacct are scoped HTTP API Apps. They intentionally have no SQL or Email broker configuration.
- The helper properties can exist on the runtime `connection` object even when the selected App does not support that broker. Calling one then returns this 500.

Fix it in the Make module:

1. Confirm the module's **App** is Gmail, Sage Business Cloud Accounting, or Sage Intacct as intended.
2. Confirm the corresponding connection is selected and save the module.
3. Replace `connection.email.*` or `connection.sql.*` with the appropriate `connection.fetch('/relative/path', ...)` example above.
4. Do not add or map the OAuth token manually.
5. For Gmail, create or reauthorize the dedicated Gmail connection if the next response is `401` or `403`; older saved connections may not have the new Gmail scopes.
6. If you actually need SMTP/IMAP, select the generic **Email** App instead of Gmail and then use `connection.email.*`.

If `connection.fetch(...)` reports that the proxy is unavailable, reselect the App and Connection in the module and save it. That is a binding/setup problem; it is different from the broker-mismatch 500 above.

## Scope model

- Connected Code never exposes raw credentials to user code.
- The selected Make connection/keychain is available only in the proxy sandbox.
- Service Apps derive request bases and allowed scopes from the generated catalog and selected connection data.
- HTTP App is the only app that asks for an explicit `HTTP Base URL`.
- PostgreSQL, MySQL, and the generic Email App use native broker helpers instead of HTTP proxy scopes.
- Requests outside the selected App scope fail closed.

## Generic HTTP credential connection types

| Connection Type | Typical use |
| --- | --- |
| `account:oauth2` | OAuth 2 HTTP connection. Set HTTP Base URL in the module UI, then call relative paths. |
| `keychain:apikeyauth` | API key HTTP credential. Set HTTP Base URL in the module UI. |
| `keychain:basicauth` | Basic auth HTTP credential. |
| `keychain:clientcertauth` | Client certificate / mTLS HTTP credential. |

## App catalog

| App | Label | Connection types | Request base / scope source | Referenced connection fields | Helpers |
| --- | --- | --- | --- | --- | --- |
| google-sheets | Google Sheets | account:google | https://sheets.googleapis.com/v4/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| openai-gpt-3 | OpenAI (ChatGPT, Sora, Whisper) | account:openai-gpt-3 | https://{{temp.region}}api.openai.com/v1 | apiKey, apiOrg, region | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| http | HTTP | account:oauth2, keychain:apikeyauth, keychain:basicauth, keychain:clientcertauth | HTTP Base URL from module UI | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-email | Gmail | account:google-email | https://gmail.googleapis.com/gmail/v1/users/me/ | accessToken, refreshTokenExpires | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| telegram | Telegram Bot | account:telegram | https://api.telegram.org/bot{{connection.token}}/ | token | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-drive | Google Drive | account:google-custom, account:google-drive, account:google-restricted | https://www.googleapis.com/drive/v3/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| airtable | Airtable | account:airtable2, account:airtable3 | {{getBaseUrl(connection, 'api.airtable.com/v0')}} | accessToken, apiToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| email | Email | account:imap,google-restricted,microsoft-smtp-imap, account:smtp,google-restricted,microsoft-smtp-imap | Native Email broker | — | connection.email.send/search/get, connection.template(fieldName) |
| notion | Notion | account:notion2, account:notion3 | https://api.notion.com/v1/ | accessToken, apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-docs | Google Docs | account:google | https://docs.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| gemini-ai | Google Gemini AI | account:gemini-ai-q9zyjp | https://generativelanguage.googleapis.com/v1beta/ | key | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-calendar | Google Calendar | account:google | https://www.googleapis.com/calendar/v3/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| slack | Slack | account:slack | Native broker | accessToken | connection.template(fieldName) |
| instagram-business | Instagram for Business (Facebook login) | account:facebook | https://graph.facebook.com/<br>https://graph.facebook.com/v25.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| facebook-pages | Facebook Pages | account:facebook | https://graph.facebook.com/<br>https://graph.facebook.com/v25.0/ | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| pinterest | Pinterest | account:pinterest2 | https://api{{if(connection.sandbox, '-sandbox', '')}}.pinterest.com/v5 | accessToken, sandbox, sandboxToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-forms | Google Forms | account:google | https://forms.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| facebook-lead-ads | Facebook Lead Ads | account:facebook | https://graph.facebook.com/<br>https://graph.facebook.com/v25.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| linkedin | LinkedIn | account:linkedin-openid, account:linkedin2 | https://api.linkedin.com/rest/ | accessToken, developerApplication, id | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-email | Microsoft Email Outlook | account:azure | Native broker | accessToken, userId | connection.template(fieldName) |
| whatsapp-business-cloud | WhatsApp Business Cloud | account:whatsapp-business-cloud, account:whatsapp-business-cloud2 | https://graph.facebook.com/<br>https://graph.facebook.com/v25.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| wordpress | WordPress | account:wordpress4 | {{connection.restRouteBase}}wp/v2 | apiKey, password, restRouteBase, username | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| youtube | YouTube | account:youtube | https://www.googleapis.com/youtube/v3/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| tally | Tally | account:tally, account:tally2 | https://api.tally.so/ | accessToken, apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| apify | Apify | account:apify, account:apify2 | https://api.apify.com/v2/ | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| anthropic-claude | Anthropic Claude | account:anthropic-claude | https://api.anthropic.com/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| perplexity-ai | Perplexity AI | account:perplexity-ai | https://api.perplexity.ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| dropbox | Dropbox | account:dropbox | https://api.dropboxapi.com/2/ | accessToken, root_namespace_id | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| discord | Discord | account:discord | https://discord.com/api/v10/ | botToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| line | LINE | account:line, account:line2 | https://api.line.me/v2/bot/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| hubspotcrm | HubSpot CRM | account:hubspotcrm, account:hubspotcrm3 | https://api.hubapi.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| zendesk | Zendesk | account:zendesk, account:zendesk4 | https://{{ifempty(connection.subdomain, resolveDomain(connection.domain))}}.zendesk.com/ | accessToken, domain, subdomain | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| shopify | Shopify | account:shopify | Native broker | accessToken, domain | connection.template(fieldName) |
| microsoft-excel | Microsoft 365 Excel | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| clickup | ClickUp | account:clickup, account:clickup2 | https://api.clickup.com/api/v2/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| monday | monday.com | account:monday | https://api.monday.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| trello | Trello | account:trello | https://api.trello.com/1/ | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| twilio | Twilio | account:twilio | Native broker | authToken, region, sid | connection.template(fieldName) |
| stripe | Stripe | account:stripe, account:stripe2 | https://api.stripe.com/v1/ | accessToken, key, rk | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| onedrive | OneDrive | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| canva | Canva | account:canva | https://api.canva.com/rest/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| calendly | Calendly | account:calendly2 | https://api.calendly.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| woocommerce | WooCommerce | account:woocommerce2 | {{getDomain(connection.domain)}}wp-json/wc/v3/ | domain | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| sendinblue | Brevo | account:sendinblue, account:sendinblue2 | https://api.sendinblue.com/v3/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| highlevel | GoHighLevel | account:highlevel, account:highlevel2, account:highlevel3, account:highlevel4, account:highlevel5 | https://{{if(connection.accessToken, 'services.leadconnectorhq.com', 'rest.gohighlevel.com/v1')}} | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| webflow | Webflow | account:webflow2 | https://api.webflow.com/beta/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| typeform | Typeform | account:typeform, account:typeform2 | Native broker | accessToken, region | connection.template(fieldName) |
| pipedrive | Pipedrive | account:pipedrive | Native broker | accessToken, apiDomain, apiKey, customDomain | connection.template(fieldName) |
| manychat | Manychat | account:manychat | https://api.manychat.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| open-router | OpenRouter | account:open-router-4ur2vj, account:open-router3 | https://openrouter.ai/api/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| elevenlabs | ElevenLabs | account:elevenlabs | {{ifempty(connection.region, 'https://api.elevenlabs.io')}}/v1 | apiKey, region | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| browse-ai | Browse AI | account:browse-ai | https://api.browse.ai/v2/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| supabase | Supabase | account:supabase | https://{{connection.projectId}}.supabase.co | apiKey, projectId, schema | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-slides | Google Slides | account:google | https://slides.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| cloudconvert | CloudConvert | account:cloudconvert2, account:cloudconvert3 | https://api.cloudconvert.com/v2/ | accessToken, apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| asana | Asana | account:asana | https://app.asana.com/api/<br>https://app.asana.com/api/1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| groq | Groq | account:groq | https://api.groq.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| coda | Coda | account:coda | https://coda.io/apis/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| make | Make | account:make, account:make2 | {{connection.url}}/api/v2 | accessToken, apiKey, url | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| facebook-insights | Facebook Insights | account:facebook | https://graph.facebook.com/<br>https://graph.facebook.com/v25.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-contacts | Google Contacts | account:google | https://people.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| facebook-messenger | Facebook Messenger | account:facebook-messenger2 | https://graph.facebook.com/<br>https://graph.facebook.com/v25.0/ | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| todoist | Todoist | account:todoist3 | https://api.todoist.com/api/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-tasks | Google Tasks | account:google | https://www.googleapis.com/tasks/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| z-api | Z-API | account:z-api | https://api.z-api.io/instances/ | instanceId, token, tokenId | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| deepseek-ai | DeepSeek AI | account:deepseek-ai | https://api.deepseek.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| mailerlite2 | MailerLite | account:mailerlite2 | https://connect.mailerlite.com/api/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| firecrawl | Firecrawl | account:firecrawl | https://api.firecrawl.dev/v2/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| inoreader | Inoreader | account:inoreader | https://www.inoreader.com/reader/api/0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-calendar | Microsoft 365 Calendar | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| cloudinary | Cloudinary | account:cloudinary | https://api.cloudinary.com/v1_1/{{connection.cloudName}} | apiKey, apiSecret, cloudName | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| active-directory | Microsoft Entra ID | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-ads | Google Ads (Deprecated) | account:google-ads | https://googleads.googleapis.com/v8/ | accessToken, clientId, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-ads-campaign-management | Google Ads Campaign Management | account:google-ads2 | https://googleads.googleapis.com/{{ifempty(parameters._version, 'v22')}} | accessToken, clientId, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-ads-conversions | Google Ads Conversions | account:google-ads2 | https://googleads.googleapis.com/v22/ | accessToken, clientId, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-ads-customer-match | Google Ads Customer Match | account:google-ads2 | https://googleads.googleapis.com/v22/ | accessToken, clientId, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-ads-lead-forms | Google Ads Lead Forms | account:google-ads2 | https://googleads.googleapis.com/v22/ | accessToken, clientId, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-ads-reports | Google Ads Reports | account:google-ads2 | https://googleads.googleapis.com/v22/ | accessToken, clientId, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-analytics | Google Analytics (Deprecated) | account:google | https://analyticsreporting.googleapis.com/v4/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-analytics-4 | Google Analytics 4 | account:google-analytics-4 | https://analyticsdata.googleapis.com/v1beta/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-bigquery | BigQuery | account:google | https://bigquery.googleapis.com/bigquery/v2/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-chat | Google Chat | account:google-chat3 | https://chat.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-dialogflow | Google Cloud Dialogflow ES | account:google-custom | https://dialogflow.googleapis.com/v2/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-firestore | Google Cloud Firestore | account:google-custom | https://firestore.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-pubsub | Google Cloud Pub/Sub | account:google-custom | https://pubsub.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-speech | Google Cloud Speech | account:google-cloud-speech | https://speech.googleapis.com/v1p1beta1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-storage | Google Cloud Storage | account:google-custom | https://www.googleapis.com/storage/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-storage-transfer | Google Cloud Storage Transfer Service | account:google-cloud-storage-transfer2 | https://storagetransfer.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-cloud-tts | Google Cloud Text-to-Speech | account:google-custom | https://texttospeech.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-data-studio | Looker Studio | account:google-custom | https://datastudio.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-g-suite | Google Workspace Admin | account:google, account:google-custom | https://www.googleapis.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-groups | Google Groups | account:google | https://www.googleapis.com/admin/directory/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-keep | Google Keep | account:google-custom | https://keep.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-maps | Google Maps | account:google-maps | https://maps.googleapis.com/maps/api/ | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-meet | Google Meet | account:google | https://www.googleapis.com/calendar/v3/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-my-business | Google Business Profile | account:google-custom, account:google-my-business2 | https://mybusiness.googleapis.com/v4/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-natural-language | Google Natural Language | account:google-custom | https://language.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-photos | Google Photos | account:google-photos2 | https://photoslibrary.googleapis.com/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-search-console | Google Search Console | account:google-search-console | https://www.googleapis.com/webmasters/v3/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-shopping | Google Shopping | account:google | https://www.googleapis.com/content/<br>https://www.googleapis.com/content/v2.1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| google-translate | Google Translate | account:google-translate | Native broker | accessToken | connection.template(fieldName) |
| google-vertex-ai | Google Vertex AI (Gemini) | account:google-vertex-ai | https://{{parameters.serviceEndpointLocationId}}-aiplatform.googleapis.com/v1 | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| googlecloudvision | Google Cloud Vision | account:googlecloudvision | https://vision.googleapis.com/ | — | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| intunes | Microsoft Intune | account:intunes | https://graph.microsoft.com/{{connection.apiVersion}} | accessToken, apiVersion | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| linear | Linear | account:linear | https://api.linear.app/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-ad-campaign-mgmt | Microsoft Advertising Campaign Management | account:microsoft-ad-campaign-mgmt | https://campaign.api.bingads.microsoft.com/CampaignManagement/v13/ | accessToken, customerId, developerToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-d365-bc | Microsoft Dynamics 365 Business Central | account:microsoft-d365-bc, account:microsoft-d365-bc2 | https://{{connection.baseUrl}}/{{connection.tenant}}/{{connection.environment}}/{{connection.endPoint}} | accessToken, baseUrl, endPoint, environment, tenant | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-dynamics | Microsoft Dynamics 365 | account:microsoft-dynamics | {{connection.host}} | accessToken, host | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-dynamics-365-crm | Microsoft Dynamics 365 - CRM | account:microsoft-dynamics-365-crm | {{connection.host}}/api/data/<br>{{connection.host}}/api/data/v9.2 | accessToken, host | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-dynamics-365-fno | Microsoft Dynamics 365 Finance & Operations | account:microsoft-dynamics-365-fno | {{connection.host}} | accessToken, host | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-people | Microsoft 365 People | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-planner | Microsoft 365 Planner | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-power-bi | Microsoft Power BI | account:microsoft-power-bi | https://api.powerbi.com/<br>https://api.powerbi.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-sharepoint | Microsoft SharePoint Online | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-teams | Microsoft Teams | account:azure | https://graph.microsoft.com/<br>https://graph.microsoft.com/v1.0/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| microsoft-to-do | Microsoft To Do | account:azure | https://graph.microsoft.com/beta/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| resend | Resend | account:resend | https://api.resend.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| baserow | Baserow | account:baserow | {{connection.apiURL}} | apiToken, apiURL | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| cerebras-ai | Cerebras AI | account:cerebras-ai | https://api.cerebras.ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| edenaiv3 | Eden AI | account:edenaiv3 | https://api.edenai.run/v3/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| fal-ai | Fal.ai | account:fal-ai | https://queue.fal.run/fal-ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| quickbooks | QuickBooks | account:quickbooks | Native broker | accessToken, accessToken2, realmId, sandbox | connection.template(fieldName) |
| salesforce | Salesforce | account:salesforce | Native broker | accessToken, instanceUrl | connection.template(fieldName) |
| zohocrm | Zoho CRM | account:zohocrm | Native broker | accessToken | connection.template(fieldName) |
| mysql | MySQL | account:mysql | Native MySQL broker | — | connection.sql.query(sql, params?), connection.template(fieldName) |
| postgres | PostgreSQL | account:postgres | Native PostgreSQL broker | — | connection.sql.query(sql, params?), connection.template(fieldName) |
| box | Box | account:box | Native broker | accessToken | connection.template(fieldName) |
| toggl | Toggl | account:toggl | Native broker | apiToken | connection.template(fieldName) |
| reddit | Reddit | account:reddit | https://oauth.reddit.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| jira | Jira Cloud Platform | account:jira, account:jira-service-desk2 | {{if(connection.cloudId, 'https://api.atlassian.com/ex/jira/' + connection.cloudId + '/rest/api/3', connection.url + '/rest/api/3')}} | accessToken, cloudId, password, url, username | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| github | GitHub | account:github, account:github2 | https://api.github.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| mistral-ai | Mistral AI | account:mistral-ai | https://api.mistral.ai/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| fireflies-ai | Fireflies.ai | account:fireflies-ai | https://api.fireflies.ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| leonardo-ai | Leonardo.Ai | account:leonardo-ai | https://cloud.leonardo.ai/api/rest/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| assembly-ai | AssemblyAI | account:assembly-ai | https://{{connection.environment}}.assemblyai.com | apiKey, environment | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| retell-ai | Retell AI | account:retell-ai | https://api.retellai.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| huggingface | Hugging Face | account:huggingface | https://router.huggingface.co/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| pinecone | Pinecone | account:pinecone | https://{{connection.indexName}}.pinecone.io | apiKey, indexName | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| xai | xAI | account:xai | https://api.x.ai/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| stability-ai | Stability AI | account:stability-ai | https://api.stability.ai/ | Organization, apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| exa-ai | Exa | account:exa-ai | https://api.exa.ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| qdrant | Qdrant | account:qdrant2 | {{connection.qdrantUrl}} | apiKey, qdrantUrl | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| qwen-ai | Qwen AI | account:qwen-ai | https://dashscope-intl.aliyuncs.com/api/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| eleven-labs | ElevenLabs | account:eleven-labs | https://api.elevenlabs.io/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| jina-ai | Jina AI | account:jina-ai | https://r.jina.ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| dataforseo | DataForSEO | account:dataforseo | https://api.dataforseo.com/v3/ | password, username | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| confluence | Confluence | account:confluence | https://api.atlassian.com/ex/confluence/{{connection.cloudid}}/wiki/api/v2 | accessToken, cloudid | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| supadata | Supadata | account:supadata | https://api.supadata.ai/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| browser-act | BrowserAct | account:browser-act | https://api.browseract.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| brightdata | Bright Data | account:brightdata | https://api.brightdata.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| supabase-management | Supabase Management | account:supabase-management | https://api.supabase.com/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| together-ai | Together AI | account:together-ai | https://api.together.xyz/v1/ | apiKey | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| sap-s4hana | SAP S/4HANA | account:sap-s4hana | {{connection.host}}/sap/opu/odata{{switch(temp.odataVersion, '2', '', '4', '4', '')}}/sap | authHeader, cookie, csrfToken, host | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| xero | Xero | account:xero-event, account:xero3 | https://api.xero.com/api.xro/<br>https://api.xero.com/api.xro/2.0/ | accessToken, connections, tenantId | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| sage-accounting | Sage Business Cloud Accounting | account:sage-accounting | https://api.accounting.sage.com/v3.1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| sage-intacct | Sage Intacct | account:sage-intacct2 | https://api.intacct.com/ia/api/v1/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| bexio | Bexio | account:bexio | https://api.bexio.com/ | accessToken | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| boostspace | Boost.space | account:boostspace | https://{{connection.syskey}}.boost.space | syskey, token | connection.fetch(pathOrUrl, init?), connection.template(fieldName) |
| magento | Magento | account:magento | Native broker | — | connection.template(fieldName) |
