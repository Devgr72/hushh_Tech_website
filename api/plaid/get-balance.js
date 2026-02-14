// Vercel Serverless Function — Get Plaid account balances
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const accessToken = req.body.accessToken || req.body.access_token;
    if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

    const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '6934322f139fbf00216faf36';
    const PLAID_SECRET = process.env.PLAID_SECRET || '37419eee2796c9eb7225c2fc7d02d6';
    const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/balance/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error_message, error_code: data.error_code });

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
