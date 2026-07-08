// Webhook payload normalization.
// Map webhook fields into input before this module.
function main(input) {
  const text = String(input.text || '').trim();
  if (!text) {
    throw new Error('Missing required webhook field: text');
  }
  return {
    ok: true,
    text,
    channel: String(input.channel || 'default').trim().toLowerCase(),
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    receivedAt: new Date().toISOString()
  };
}
