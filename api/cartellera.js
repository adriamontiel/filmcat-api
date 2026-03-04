// api/cartellera.js
import { parseFilms } from '../lib/parseXML.js';

const GENCAT_URLS = [
  'http://www.gencat.cat/llengua/cinema/provacin.xml',
  'http://gencat.cat/llengua/cinema/VDVOVOSEVOSC.xml',
];

async function fetchXML(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FILMCAT/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    let xml = null, lastError = null;
    for (const url of GENCAT_URLS) {
      try { xml = await fetchXML(url); if (xml && xml.length > 100) break; }
      catch (e) { lastError = e; }
    }
    if (!xml) throw lastError || new Error('No XML disponible');
    const films = parseFilms(xml);
    const withSessions = films.filter(f => f.sessions?.length > 0);
    const upcoming = films.filter(f => !f.sessions?.length);
    return res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      total: films.length,
      films: withSessions,
      comingSoon: upcoming.slice(0, 10),
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
