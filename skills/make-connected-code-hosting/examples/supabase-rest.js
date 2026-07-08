// Supabase REST through a Make connection or HTTP App credential.
// Project URL and API key stay in Make; code uses a relative REST path.
async function main(input, connection) {
  const table = input.table || 'items';
  const response = await connection.fetch(`/rest/v1/${table}`, {
    method: 'GET',
    query: {
      select: '*',
      limit: input.limit || 10
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase request failed ${response.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}
