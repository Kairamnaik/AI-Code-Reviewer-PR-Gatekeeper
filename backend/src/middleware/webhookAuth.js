import crypto from 'crypto';

export const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'mock_webhook_secret';

  // If in mock dev mode or secret matches a default placeholder without signature
  if (process.env.GITHUB_CLIENT_ID === 'mock_client_id' && (!signature || signature === 'mock_signature')) {
    return next();
  }

  if (!signature) {
    console.warn('[Webhook Auth] Missing x-hub-signature-256 header.');
    return res.status(401).json({ error: 'Signature header missing.' });
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const payload = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = `sha256=${hmac.update(payload).digest('hex')}`;

    // Secure timing comparison
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      console.warn('[Webhook Auth] Signature verification failed.');
      return res.status(401).json({ error: 'Signature verification failed.' });
    }

    next();
  } catch (err) {
    console.error('[Webhook Auth] Error validating signature:', err.message);
    return res.status(500).json({ error: 'Internal signature validation error.' });
  }
};
