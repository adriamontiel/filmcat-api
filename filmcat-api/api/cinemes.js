// api/cinemes.js
// Endpoint: retorna tots els cinemes que projecten en català
// URL: https://el-teu-domini.vercel.app/api/cinemes

const { parseCinemas } = require('../lib/parseXML');

const GENCAT_CINEMES_URL = 'http://www.gencat.cat/llengua/cinema/cinemes.xml';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await fetch(GENCAT_CINEMES_URL, {
      headers: { 'User-Agent': 'FILMCAT/1.0 (filmcat.cat)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const cinemas = parseCinemas(xml);

    return res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      total: cinemas.length,
      cinemas,
    });

  } catch (error) {
    console.error('[filmcat] Error a /api/cinemes:', error.message);
    return res.status(500).json({
      ok: false,
      error: 'No s\'han pogut obtenir els cinemes.',
      detail: error.message,
    });
  }
}
