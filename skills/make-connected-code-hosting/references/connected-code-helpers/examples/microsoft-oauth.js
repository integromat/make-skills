// Microsoft OAuth-style app: selected App = Microsoft 365 Email/Excel/Calendar/etc.
// Use a relative path under Microsoft Graph v1.0.
const response = await connection.fetch('/me', { method: 'GET' });
const text = await response.text();
if (!response.ok) throw new Error(`Microsoft Graph request failed ${response.status}: ${text}`);
return JSON.parse(text);
