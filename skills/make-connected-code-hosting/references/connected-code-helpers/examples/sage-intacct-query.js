// Sage Intacct: select Sage Intacct (not Sage Business Cloud Accounting) and its OAuth 2.0 connection.
// OAuth is injected by Connected Code; do not map or add the access token.
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
