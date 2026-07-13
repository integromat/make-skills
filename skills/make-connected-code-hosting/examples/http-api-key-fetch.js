// HTTP App with API Key Auth.
// Set HTTP Base URL and select the API key credential in the Make editor.
// Use a relative path; the secret stays in the Make keychain/proxy.
const response = await connection.fetch('/items', {
  method: 'GET',
  query: { limit: input.limit || 10 }
});
const text = await response.text();
if (!response.ok) {
  throw new Error(`HTTP request failed ${response.status}: ${text.slice(0, 300)}`);
}
return JSON.parse(text);
