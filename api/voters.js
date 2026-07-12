/**
 * GET /api/voters?limit=N
 * Proxies the minecraft-mp voters API server-side so the API key
 * is never exposed in the browser bundle.
 */

const VOTERS_API_KEY = process.env.VOTERS_API_KEY;
const SERVER_ID = 'aeroblast.my.id:25543';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!VOTERS_API_KEY) {
    res.status(500).json({ error: 'Server misconfigured: VOTERS_API_KEY not set' });
    return;
  }

  const limit = Math.min(Math.max(parseInt(req.query?.limit || '10', 10), 1), 100);

  try {
    const url = `https://minecraft-mp.com/api/?object=servers&element=voters&key=${VOTERS_API_KEY}&month=current&limit=${limit}&format=json`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Upstream HTTP ${upstream.status}`);
    const data = await upstream.json();

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch voter data', detail: err.message });
  }
}
