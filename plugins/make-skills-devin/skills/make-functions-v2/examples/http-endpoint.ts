export default async function main(input: {}) {
  const response = await make.endpoints.http.v4.makeRequest({
    input: { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' },
    connection: 'publicApi'
  });
  if (response.statusCode !== 200) { // @label Reject unsuccessful response
    throw new Error('Expected HTTP 200');
  }
  const data = response.data;
  if (data === null) { // @label Reject null response
    throw new Error('Expected a JSON object');
  }
  if (typeof data !== 'object') { // @label Reject non-object response
    throw new Error('Expected a JSON object');
  }
  const isArray = Array.isArray(data);
  if (isArray) { // @label Reject array response
    throw new Error('Expected a JSON object');
  }
  const post = data as { title?: unknown };
  if (typeof post.title !== 'string') { // @label Reject missing title
    throw new Error('Expected a string title');
  }
  return { title: post.title };
}
