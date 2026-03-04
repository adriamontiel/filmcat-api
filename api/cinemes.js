// api/cinemes.js
import { parseCinemas } from '../lib/parseXML.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const r = await fetch('http://www.gencat.cat/llengua/cinema/cinemes.xml', {
      headers: { 'User-Agent': 'FILMCAT/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const xml = await r.text();
    const cinemas = parseCinemas(xml);
    return res.status(200).json({ ok: true, updatedAt: new Date().toISOString(), cinemas });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
