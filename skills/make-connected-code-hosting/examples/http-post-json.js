// Generic HTTP POST with JSON body.
// Business values come from input; credentials stay in Make.
const response = await connection.fetch('/items', {
  method: 'POST',
  json: {
    name: input.name,
    metadata: input.metadata || {}
  }
});
const text = await response.text();
if (!response.ok) {
  throw new Error(`HTTP request failed ${response.status}: ${text.slice(0, 300)}`);
}
return JSON.parse(text);
