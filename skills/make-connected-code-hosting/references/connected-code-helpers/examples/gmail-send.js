// Gmail: selected App = Gmail, selected connection = a Gmail connection created or reauthorized for Connected Code 1.2.2.
// Do not use connection.email.send(); Gmail sends through its REST API.
function safeHeader(value, name) {
  const text = String(value || '').trim();
  if (!text || /[\r\n]/.test(text)) throw new Error(`Invalid ${name}`);
  return text;
}

const to = safeHeader(input.to, 'recipient');
const subject = safeHeader(input.subject, 'subject');
const rawMessage = [
  `To: ${to}`,
  `Subject: ${subject}`,
  'Content-Type: text/plain; charset="UTF-8"',
  'MIME-Version: 1.0',
  '',
  String(input.message || '')
].join('\r\n');

const response = await connection.fetch('/messages/send', {
  method: 'POST',
  json: { raw: Buffer.from(rawMessage, 'utf8').toString('base64url') }
});
const text = await response.text();
if (!response.ok) throw new Error(`Gmail send failed ${response.status}: ${text.slice(0, 500)}`);
return JSON.parse(text);
