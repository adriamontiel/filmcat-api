/**
 * GET /api/horaris  [Vercel Node.js Serverless]
 *
 * Retorna els horaris d'una pel·lícula per als cinemes indicats.
 * Llegeix primer dels fitxers data/cache/{domain}.json (actualitzats per
 * GitHub Actions cada hora), i fa live fetch com a fallback si no hi ha cache.
 *
 * Query params:
 *   film  (obligatori) — títol de la pel·lícula
 *   data  (opcional)   — data "YYYY-MM-DD", per defecte avui
 *   c     (repetible)  — nom de cinema (tal com apareix a filmcat)
 *
 * CORS i Cache-Control s'injecten via vercel.json (header rules).
 * Sempre retorna HTTP 200. Mai falla.
 */

import { getShowtimes } from '../lib/showtimes.js'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d)
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const film        = req.query.film
  const dataParam   = req.query.data
  const cinemaParam = req.query.c

  if (!film || String(film).trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'Paràmetre "film" obligatori' })
  }

  const cinemaNames = (Array.isArray(cinemaParam) ? cinemaParam : cinemaParam ? [cinemaParam] : [])
    .map(s => s.trim()).filter(Boolean)

  const date = dataParam && isValidDate(dataParam) ? dataParam : todayISO()

  if (cinemaNames.length === 0) {
    return res.json({ ok: true, film: film.trim(), data: date, cinemes: [] })
  }

  const cinemes = await getShowtimes(cinemaNames, film.trim(), date)

  return res.json({ ok: true, film: film.trim(), data: date, cinemes })
}
