// Email: selected App = Email, selected connection = your SMTP/IMAP-capable email connection.
// Search inputs are business data. Credentials stay in the Make connection/proxy sandbox.
const messages = await connection.email.search({
  mailbox: input.mailbox ?? 'INBOX',
  query: input.query ?? 'UNSEEN',
  limit: input.limit ?? 10
});
return messages;
