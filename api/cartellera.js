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

    // Agrupa sessions per filmId
    const sessionsByFilm = {};
    for (const s of sessions) {
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
      if (s.date && !sessionsByFilm[s.filmId][key].dates.includes(s.date)) {
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
        times:  c.dates.sort(), // dates com a "temps" fins que tinguem hores
      }));
    }

    const withSessions = films.filter(f => f.sessions.length > 0);
    const comingSoon   = films.filter(f => f.sessions.length === 0);

    return res.status(200).json({
      ok:          true,
      updatedAt:   new Date().toISOString(),
      total:       films.length,
      films:       withSessions,
      comingSoon:  comingSoon.slice(0, 10),
    });

  } catch (error) {
    console.error('[filmcat] cartellera error:', error.message);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
