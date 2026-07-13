// Google OAuth-style app: selected App = a Google app such as Google Drive.
// Use a relative path under the selected app's request base.
const response = await connection.fetch('/files', {
  method: 'GET',
  query: { pageSize: 10 }
});
const text = await response.text();
if (!response.ok) throw new Error(`Google request failed ${response.status}: ${text}`);
return JSON.parse(text);
