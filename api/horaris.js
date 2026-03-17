/**
 * GET /api/horaris
 *
 * Retorna els horaris d'una pel·lícula per als cinemes indicats.
 *
 * Query params:
 *   film  (obligatori) — títol de la pel·lícula
 *   data  (opcional)   — data "YYYY-MM-DD", per defecte avui
 *   c     (repetible)  — nom de cinema (tal com apareix a filmcat)
 *                        Exemple: ?c=Ocine+Girona&c=JCA+Cinemes+Tarragona+-+Valls
 *
 * Resposta (sempre HTTP 200):
 * {
 *   ok:      true,
 *   film:    string,
 *   data:    string,           // "YYYY-MM-DD"
 *   cinemes: CinemaResult[]
 * }
 *
 * CinemaResult:
 * {
 *   cinema:   string,
 *   web:      string|null,     // URL per al fallback "consulta la web"
 *   status:   "ok" | "no_source" | "error",
 *   stale:    boolean,
 *   sessions: Session[]
 * }
 *
 * Session:
 * {
 *   time:      string,         // "HH:MM"
 *   version:   string|null,    // "VCAT" | "VOS" | "VE" | null
 *   sala:      string|null,
 *   seats_pct: number|null     // % d'aforament ocupat (0-100)
 * }
 */

import { getShowtimes } from '../lib/showtimes.js'

// Data d'avui en format "YYYY-MM-DD" (UTC)
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// Valida que una data té format "YYYY-MM-DD"
function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d)
}

export default async function handler(req, res) {
  // Suporta GET i OPTIONS (preflight CORS ja gestionat per vercel.json)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { film, data: dataParam } = req.query

  // Validació: film és obligatori
  if (!film || typeof film !== 'string' || film.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'Paràmetre "film" obligatori' })
  }

  // Llista de cinemes: ?c=Ocine+Girona&c=JCA+Cinemes+...
  const rawC = req.query.c
  const cinemaNames = rawC
    ? (Array.isArray(rawC) ? rawC : [rawC]).map(s => s.trim()).filter(Boolean)
    : []

  // Data: avui si no s'especifica
  const date = dataParam && isValidDate(dataParam) ? dataParam : todayISO()

  // Si no hi ha cinemes, retornem buit (resposta vàlida)
  if (cinemaNames.length === 0) {
    return res.status(200).json({ ok: true, film: film.trim(), data: date, cinemes: [] })
  }

  // Crida a l'orquestrador (sempre retorna, mai llança)
  const cinemes = await getShowtimes(cinemaNames, film.trim(), date)

  return res.status(200).json({
    ok: true,
    film: film.trim(),
    data: date,
    cinemes,
  })
}
