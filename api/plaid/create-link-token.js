// Vercel Serverless Function — Create Plaid Link Token
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, userEmail } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '6934322f139fbf00216faf36';
    const PLAID_SECRET = process.env.PLAID_SECRET || '37419eee2796c9eb7225c2fc7d02d6';
    const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
    const baseUrl = `https://${PLAID_ENV}.plaid.com`;

    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id: userId, email_address: userEmail },
        client_name: 'Hushh',
        products: ['auth', 'transactions', 'investments', 'assets'],
        country_codes: ['US'],
        language: 'en',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[create-link-token] Plaid error:', data);
      return res.status(response.status).json({
        error: data.error_message || 'Failed to create link token',
        details: data,
      });
    }

    return res.status(200).json({
      link_token: data.link_token,
      expiration: data.expiration,
    });
  } catch (err) {
    console.error('[create-link-token] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
