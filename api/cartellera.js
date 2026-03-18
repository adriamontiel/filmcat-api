// api/cartellera.js
import { parseFilms, parseSessions } from '../lib/parseXML.js';

const FILMS_URL    = 'http://www.gencat.cat/llengua/cinema/provacin.xml';
const SESSIONS_URL = 'http://www.gencat.cat/llengua/cinema/film_sessions.xml';

async function fetchXML(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'FILMCAT/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} a ${url}`);
  return r.text();
}

// "Avui" a la zona horària d'Espanya (CET/CEST = Europe/Madrid).
// Locale 'sv' (suec) retorna format ISO "YYYY-MM-DD" directament.
function todayMadrid() {
  return new Intl.DateTimeFormat('sv', { timeZone: 'Europe/Madrid' }).format(new Date());
}

// Converteix la data del Gencat "DD/MM/YYYY" → "YYYY-MM-DD" per comparar-la.
function gencatToISO(d) {
  if (!d) return '';
  const parts = d.split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    // Fetch films i sessions en paral·lel
    const [filmsXml, sessionsXml] = await Promise.all([
      fetchXML(FILMS_URL),
      fetchXML(SESSIONS_URL),
    ]);

    const films    = parseFilms(filmsXml);
    const sessions = parseSessions(sessionsXml);

    // Data d'avui a Espanya — calculada una sola vegada per petició
    const today = todayMadrid(); // ex: "2026-03-18"

    // Agrupa sessions per filmId, descartant dates passades.
    const sessionsByFilm = {};
    for (const s of sessions) {
      if (!s.date || gencatToISO(s.date) < today) continue; // ← filtre dates passades

      if (!sessionsByFilm[s.filmId]) sessionsByFilm[s.filmId] = {};
      const key = `${s.cinemaId}|${s.city}`;
      if (!sessionsByFilm[s.filmId][key]) {
        sessionsByFilm[s.filmId][key] = {
          cinema:  s.cinema,
          city:    s.city,
          comarca: s.comarca,
          lang:    s.version || 'VD',
          dates:   [],
        };
      }
      if (!sessionsByFilm[s.filmId][key].dates.includes(s.date)) {
        sessionsByFilm[s.filmId][key].dates.push(s.date);
      }
    }

    // Afegeix sessions a cada film
    for (const film of films) {
      const cinemaMap = sessionsByFilm[film.id] || {};
      film.sessions = Object.values(cinemaMap).map(c => ({
        cinema: c.cinema,
        city:   c.city,
        lang:   c.lang,
        times:  c.dates.sort((a, b) => gencatToISO(a).localeCompare(gencatToISO(b))),
      })).sort((a, b) => gencatToISO(a.times[0]).localeCompare(gencatToISO(b.times[0])));
    }

    const withSessions = films.filter(f => f.sessions.length > 0);
    const comingSoon   = films.filter(f => f.sessions.length === 0);

    return res.status(200).json({
      ok:          true,
      updatedAt:   new Date().toISOString(),
      total:       films.length,
      films:       withSessions,
      comingSoon:  comingSoon,
    });

  } catch (error) {
    console.error('[filmcat] cartellera error:', error.message);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
