// Gmail: selected App = Gmail, selected connection = a Gmail connection created or reauthorized for Connected Code 1.2.2.
// Do not use connection.email.search(); Gmail is a scoped HTTP API App.
const limit = Math.max(1, Math.min(Number(input.limit || 10), 100));
const response = await connection.fetch('/messages', {
  method: 'GET',
  query: {
    q: input.query || 'is:unread',
    maxResults: limit
  }
});
const text = await response.text();
if (!response.ok) throw new Error(`Gmail request failed ${response.status}: ${text.slice(0, 500)}`);
const data = JSON.parse(text);
return {
  messages: data.messages || [],
  nextPageToken: data.nextPageToken || null,
  resultSizeEstimate: data.resultSizeEstimate || 0
};
