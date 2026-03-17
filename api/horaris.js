/**
 * GET /api/horaris  [Vercel Edge Runtime]
 *
 * Retorna els horaris d'una pel·lícula per als cinemes indicats.
 * Corre a Vercel Edge (IPs de Cloudflare), no a Lambda (IPs d'AWS),
 * per poder accedir als dominis filazero que bloquegen IPs de cloud.
 *
 * Query params:
 *   film  (obligatori) — títol de la pel·lícula
 *   data  (opcional)   — data "YYYY-MM-DD", per defecte avui
 *   c     (repetible)  — nom de cinema (tal com apareix a filmcat)
 *
 * Sempre retorna HTTP 200. Mai falla.
 */

import { getShowtimes } from '../lib/showtimes.js'

export const config = { runtime: 'edge' }

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { status: 405, headers: CORS_HEADERS }
    )
  }

  const url = new URL(req.url)
  const film = url.searchParams.get('film')
  const dataParam = url.searchParams.get('data')
  const cinemaParams = url.searchParams.getAll('c')

  if (!film || film.trim().length === 0) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Paràmetre "film" obligatori' }),
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const cinemaNames = cinemaParams.map(s => s.trim()).filter(Boolean)
  const date = dataParam && isValidDate(dataParam) ? dataParam : todayISO()

  if (cinemaNames.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, film: film.trim(), data: date, cinemes: [] }),
      { headers: CORS_HEADERS }
    )
  }

  const cinemes = await getShowtimes(cinemaNames, film.trim(), date)

  return new Response(
    JSON.stringify({ ok: true, film: film.trim(), data: date, cinemes }),
    { headers: CORS_HEADERS }
  )
}
