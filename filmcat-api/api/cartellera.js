// api/cartellera.js
// Endpoint principal: retorna totes les pel·lícules en català amb sessions
// URL: https://el-teu-domini.vercel.app/api/cartellera

const { parseFilms } = require('../lib/parseXML');

// URLs dels XMLs de la Generalitat de Catalunya
const GENCAT_URLS = [
  'http://www.gencat.cat/llengua/cinema/provacin.xml',  // pel·lícules per província (principal)
  'http://gencat.cat/llengua/cinema/VDVOVOSEVOSC.xml',  // totes les versions
];

async function fetchXML(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FILMCAT/1.0 (filmcat.cat)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} per ${url}`);
  return res.text();
}

export default async function handler(req, res) {
  // Gestió de preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Intentem la URL principal, si falla provem la secundària
    let xml = null;
    let lastError = null;

    for (const url of GENCAT_URLS) {
      try {
        xml = await fetchXML(url);
        if (xml && xml.length > 100) break; // XML vàlid trobat
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    if (!xml) {
      throw lastError || new Error('No s\'ha pogut obtenir cap XML de Gencat');
    }

    // Parseja les pel·lícules
    const films = parseFilms(xml);

    // Filtra: només pel·lícules amb sessions
    // i agrupa per versió per facilitar el filtratge al frontend
    const withSessions = films.filter(f => f.sessions && f.sessions.length > 0);
    const upcoming = films.filter(f => !f.sessions || f.sessions.length === 0);

    return res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      total: films.length,
      inScreening: withSessions.length,
      upcoming: upcoming.length,
      films: withSessions,
      comingSoon: upcoming.slice(0, 10), // màxim 10 pròximes estrenes
    });

  } catch (error) {
    console.error('[filmcat] Error a /api/cartellera:', error.message);
    return res.status(500).json({
      ok: false,
      error: 'No s\'ha pogut obtenir la cartellera. Torna-ho a provar.',
      detail: error.message,
    });
  }
}
