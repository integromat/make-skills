// HTTP App with API Key Auth Connection and one extra non-secret header.
// Prefer configuring API-key placement in the HTTP credential instead of reading secrets in code.
const response = await connection.fetch('/items', {
  method: 'GET',
  headers: { 'x-extra-header': 'value' }
});
return { status: response.status, body: await response.text() };
