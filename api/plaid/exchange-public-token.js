// Vercel Serverless Function — Exchange Plaid public token
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const publicToken = req.body.publicToken || req.body.public_token;
    if (!publicToken) return res.status(400).json({ error: 'publicToken is required' });

    const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '6934322f139fbf00216faf36';
    const PLAID_SECRET = process.env.PLAID_SECRET || '37419eee2796c9eb7225c2fc7d02d6';
    const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: publicToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error_message, details: data });

    return res.status(200).json({ access_token: data.access_token, item_id: data.item_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
