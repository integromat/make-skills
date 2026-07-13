// HTTP App with API Key Auth Connection for APIs that require a Bearer prefix.
// Prefer configured credential auth when possible. Use connection.template('key') only for custom placement.
const response = await connection.fetch('/v1/models', {
  method: 'GET',
  headers: { Authorization: `Bearer ${connection.template('key')}` }
});
const text = await response.text();
if (!response.ok) throw new Error(`HTTP request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
