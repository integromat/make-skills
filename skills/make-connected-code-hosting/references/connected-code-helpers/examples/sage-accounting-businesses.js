// Sage Business Cloud Accounting: select that exact App and its matching connection.
// OAuth is injected by Connected Code; do not map or add the access token.
const response = await connection.fetch('/businesses', {
  method: 'GET'
});
const text = await response.text();
if (!response.ok) {
  throw new Error(`Sage Accounting request failed ${response.status}: ${text.slice(0, 500)}`);
}
const data = JSON.parse(text);
return data.$items || data;
