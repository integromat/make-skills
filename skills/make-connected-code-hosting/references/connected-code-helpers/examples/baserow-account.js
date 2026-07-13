// Baserow: selected App = Baserow, selected connection = your Baserow connection.
// Use relative API paths. The Baserow base URL and Token auth come from the Make connection.
const tableId = input.tableId;
const response = await connection.fetch(`/api/database/rows/table/${tableId}/`, {
  method: 'GET',
  query: { user_field_names: true, size: 10 }
});
const text = await response.text();
if (!response.ok) throw new Error(`Baserow request failed ${response.status}: ${text.slice(0, 300)}`);
return JSON.parse(text);
