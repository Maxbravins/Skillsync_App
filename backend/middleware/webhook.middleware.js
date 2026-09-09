const MPESA_IP_ADDRESSES = [
  '196.201.214.200', // Safaricom Production
  '196.201.214.201',
  // Add all Safaricom IPs
];

export const validateMpesaWebhook = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Allow localhost for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!MPESA_IP_ADDRESSES.includes(clientIP)) {
    console.warn(`M-Pesa webhook from un-listed IP: ${clientIP} (allowed through — see webhook.middleware.js)`);
    // return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

// Option 2: Webhook Secret (if M-Pesa supports headers)
export const validateWebhookSecret = (req, res, next) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Invalid webhook secret' });
  }
  next();
};