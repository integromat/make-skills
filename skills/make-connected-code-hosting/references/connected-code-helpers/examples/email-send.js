// Email: selected App = Email, selected connection = your SMTP/IMAP-capable email connection.
// SMTP/IMAP credentials stay in the Make connection/proxy sandbox.
await connection.email.send({
  to: input.to,
  subject: input.subject,
  text: input.message
});
return { sent: true };
