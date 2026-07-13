// Cerebras AI: selected App = Cerebras AI, selected connection = your Cerebras AI connection.
// Use a relative path. Connected Code derives https://api.cerebras.ai/ and auth from the connection.
const response = await connection.fetch('/v1/models', { method: 'GET' });
const text = await response.text();
if (!response.ok) throw new Error(`Cerebras request failed ${response.status}: ${text.slice(0, 300)}`);
const data = JSON.parse(text);
return { modelCount: data.data?.length ?? 0, firstModel: data.data?.[0]?.id ?? null };
