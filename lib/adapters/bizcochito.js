/**
 * adapters/bizcochito.js
 * Adaptador per al sistema Bizcochito (Admit One Spain)
 *
 * Endpoint públic: https://{domain}/api/get-events
 * Retorna un JSON-RPC 2.0 amb un array de pel·lícules al camp "result",
 * cadascuna amb un camp "performances" (array de sessions).
 *
 * No hi ha bloqueig d'IPs cloud (funciona des de Vercel sense GitHub Actions).
 */

import { titlesMatch } from '../title-normalizer.js'

const TIMEOUT_MS = 10000

// Cache en memòria per a warm invocations (30 min TTL)
const memCache = new Map()
const MEM_CACHE_TTL = 30 * 60 * 1000

// ─── Versió ───────────────────────────────────────────────────────────────────

/**
 * Normalitza la versió d'un event bizcochito al format filmcat.
 *
 * Camps rellevants:
 *  - ev.version           → "CATALÁN", "2D (CAT)", "VOSE", "DIGITAL", ""
 *  - ev.woriginalversio   → "Catalán", "Inglés", "Castellano", ""
 *  - ev.wlanguagesubtitles → "Sin subtítulos", "Subtítulos en español", "Subtítulos en catalán"
 *
 * Retorna: 'VCAT' | 'VOS' | 'VE' | null
 */
function normalizeVersion(ev) {
  const version = (ev.version || '').toUpperCase()
  const audio   = (ev.woriginalversio || '').toLowerCase()
  const subs    = (ev.wlanguagesubtitles || '').toLowerCase()

  // Versió catalana (àudio en català, original o doblada)
  if (audio === 'catalán' || audio === 'catala' || audio === 'català') return 'VCAT'
  if (version.includes('CAT') || version === 'CATALÁN' || version === 'CATALA') return 'VCAT'
  if (subs.includes('catalán') || subs.includes('catala') || subs.includes('català')) return 'VCAT'

  // Versió original subtitulada en espanyol (VOSE)
  if (version === 'VOSE' || version === 'VOS' || version === 'VO') return 'VOS'
  if (subs.includes('español') || subs.includes('espanol')) return 'VOS'

  // Versió en espanyol (doblatge o original castellà)
  if (audio === 'castellano' || audio === 'español' || audio === 'espanol') return 'VE'

  // No podem determinar la versió (la majoria de casos: doblatge estàndard sense etiquetar)
  return null
}

// ─── Temps ────────────────────────────────────────────────────────────────────

/**
 * Extreu la data en format "YYYYMMDD" del performance.
 * bizcochito pot usar:
 *  - schedule_date: "20260318"     (cinemessantcugat)
 *  - schedule_date: null, time embedded in time string (cinemescancastellet, mcbcinemas)
 */
function parseDate(p) {
  if (p.schedule_date) return String(p.schedule_date).slice(0, 8)
  if (p.time) return String(p.time).slice(0, 8)
  return null
}

/**
 * Extreu l'hora en format "HH:MM" del camp time.
 * bizcochito usa:
 *  - "20260318194000"  (14 dígits: YYYYMMDDHHMMSS) — cinemessantcugat
 *  - "202603181700"    (12 dígits: YYYYMMDDHHMM)   — cinemescancastellet, mcbcinemas
 * Els dígits 8-9 sempre són HH, 10-11 sempre MM.
 */
function parseTime(p) {
  const t = String(p.time || '')
  if (t.length < 12) return null
  return `${t.slice(8, 10)}:${t.slice(10, 12)}`
}

// ─── Fetch amb cache en memòria ───────────────────────────────────────────────

async function fetchJSON(domain) {
  const cached = memCache.get(domain)
  if (cached && Date.now() - cached.fetchedAt < MEM_CACHE_TTL) {
    return cached.data
  }

  const url = `https://${domain}/api/get-events`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':      'Mozilla/5.0 (compatible; FILMCAT/1.0; +https://filmcat.app)',
        'Accept':          'application/json, */*',
        'Accept-Language': 'ca,es;q=0.9',
        'Referer':         `https://${domain}/`,
        'Cache-Control':   'no-cache',
      },
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { return null }

    if (!json || !Array.isArray(json.result)) return null

    memCache.set(domain, { data: json.result, fetchedAt: Date.now() })
    return json.result
  } catch {
    clearTimeout(timer)
    return null
  }
}

// ─── Exportació principal ─────────────────────────────────────────────────────

/**
 * Obté les sessions d'una pel·lícula per a un dia concret des del JSON bizcochito.
 *
 * @param {string} domain    - Domini del cinema (ex: "www.cinemessantcugat.com")
 * @param {string} filmTitle - Títol de la pel·lícula (del nostre sistema, en català)
 * @param {string} date      - Data en format "YYYY-MM-DD"
 * @returns {Promise<Array|null>} Sessions ordenades per hora, o null si error
 */
export async function fetchBizcochitoSessions(domain, filmTitle, date) {
  const films = await fetchJSON(domain)
  if (!films) return null

  // Converteix "YYYY-MM-DD" → "YYYYMMDD" per comparar amb el camp time
  const dateCompact = date.replace(/-/g, '')

  const sessions = []

  for (const film of films) {
    // Prova els dos camps de títol que bizcochito usa
    const title = film.locale_title || film.title_name || ''
    if (!titlesMatch(title, filmTitle)) continue

    const version = normalizeVersion(film)
    const perfs   = Array.isArray(film.performances) ? film.performances : []

    for (const p of perfs) {
      if (parseDate(p) !== dateCompact) continue

      const time = parseTime(p)
      if (!time) continue

      sessions.push({
        time,
        version,
        sala:      p.hall_name || null,
        seats_pct: null,   // bizcochito no exposa ocupació
      })
    }
  }

  sessions.sort((a, b) => a.time.localeCompare(b.time))
  return sessions
}
