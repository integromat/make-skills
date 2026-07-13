// HTTP App with API Key Auth Connection.
// Set HTTP Base URL in the module UI, for example https://api.example.com/v1/.
// Then use relative paths; secrets stay in the HTTP keychain/proxy.
const response = await connection.fetch('/items', { method: 'GET' });
const text = await response.text();
if (!response.ok) throw new Error(`HTTP request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
