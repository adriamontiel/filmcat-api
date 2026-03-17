/**
 * adapters/filazero.js
 * Adaptador per al sistema filazero (cat.matic)
 *
 * Endpoint públic: https://{domain}/components/com_cines/json/ca_cartellera.json
 * Retorna un JSON amb clau "data" (array de pel·lícules) i,
 * dins de cada pel·lícula, "Planificacions" (array de sessions).
 */

import { titlesMatch } from '../title-normalizer.js'

const TIMEOUT_MS = 8000

// Cache en memòria per a la vida de la funció serverless (warm invocations)
// Clau: domain  Valor: { data, fetchedAt }
const memCache = new Map()
const MEM_CACHE_TTL = 30 * 60 * 1000 // 30 min

// Mapa de codis de versió filazero → format normalitzat filmcat
const VERSION_MAP = {
  CA:         'VCAT',
  CAT:        'VCAT',
  CATALÀ:     'VCAT',
  CATALA:     'VCAT',
  VO:         'VOS',
  VOS:        'VOS',
  VOSE:       'VOS',
  OV:         'VOS',
  ES:         'VE',
  CAST:       'VE',
  CASTELLANO: 'VE',
  ESPAÑOL:    'VE',
  ESPANYOL:   'VE',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extreu la versió (VCAT, VOS, VE) del títol d'una pel·lícula filazero.
 * Exemples: "Hoppers (VOS)" → "VOS", "ATMOS HOPPERS (CATALÀ)" → "VCAT"
 */
function extractVersionFromTitle(title) {
  // Busca entre parèntesis al final: "Hoppers (VOS)" o "Hoppers (CATALÀ)"
  const match = title.match(/\(([^)]+)\)\s*$/)
  if (match) {
    const key = match[1].toUpperCase().trim()
    if (VERSION_MAP[key]) return VERSION_MAP[key]
  }
  // Busca paraules de versió directament al títol (sense parèntesis)
  for (const [raw, normalized] of Object.entries(VERSION_MAP)) {
    const re = new RegExp(`\\b${raw}\\b`, 'i')
    if (re.test(title)) return normalized
  }
  return null
}

/**
 * Extreu la versió d'un camp plan_versio de la planificació (si existeix).
 */
function extractVersionFromPlanif(p) {
  if (!p.plan_versio) return null
  const key = String(p.plan_versio).toUpperCase().trim()
  return VERSION_MAP[key] || null
}

/**
 * Calcula el percentatge d'ocupació d'una sessió.
 * Retorna null si les dades no estan disponibles o no són vàlides.
 */
function calcOccupancy(p) {
  const occupied = parseInt(p.plan_ocupacio, 10)
  const total    = parseInt(p.plan_aforament, 10)
  if (isNaN(occupied) || isNaN(total) || total === 0) return null
  return Math.round((occupied / total) * 100)
}

/**
 * Normalitza el format de la data del JSON filazero a "YYYY-MM-DD".
 * Admet "YYYY-MM-DD" i "DD/MM/YYYY".
 */
function normalizeDate(d) {
  if (!d) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return d
}

/**
 * Normalitza l'hora a "HH:MM" (filazero pot retornar "HH:MM:SS").
 */
function normalizeTime(t) {
  if (!t) return null
  return String(t).substring(0, 5)
}

// ─── Fetch amb cache ──────────────────────────────────────────────────────────

async function fetchJSON(domain) {
  // 1. Cache en memòria (warm invocations)
  const cached = memCache.get(domain)
  if (cached && Date.now() - cached.fetchedAt < MEM_CACHE_TTL) {
    return cached.data
  }

  // 2. Fetch real
  const url = `https://${domain}/components/com_cines/json/ca_cartellera.json`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FILMCAT/1.0' },
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      return null // resposta HTML o JSON malformat
    }

    // Valida que l'estructura és la correcta
    if (!json || !Array.isArray(json.data) || json.data.length === 0) return null

    memCache.set(domain, { data: json, fetchedAt: Date.now() })
    return json
  } catch {
    clearTimeout(timer)
    return null
  }
}

// ─── Exportació principal ─────────────────────────────────────────────────────

/**
 * Obté les sessions d'una pel·lícula per a un dia concret des del JSON filazero.
 *
 * @param {string} domain    - Nom de domini (ex: "ocinegirona.es")
 * @param {string} filmTitle - Títol de la pel·lícula (del nostre sistema)
 * @param {string} date      - Data en format "YYYY-MM-DD"
 * @returns {Promise<Array|null>} Array de sessions ordenades per hora, o null si error
 */
export async function fetchFilazeroSessions(domain, filmTitle, date) {
  const data = await fetchJSON(domain)
  if (!data) return null

  const sessions = []

  for (const film of data.data) {
    if (!film.peli_titol) continue
    if (!titlesMatch(film.peli_titol, filmTitle)) continue

    // Versió extreta del títol de la pel·lícula (ex: "Hoppers (VOS)")
    const versionFromTitle = extractVersionFromTitle(film.peli_titol)

    const planificacions = Array.isArray(film.Planificacions) ? film.Planificacions : []

    for (const p of planificacions) {
      if (normalizeDate(p.plan_data) !== date) continue

      const time = normalizeTime(p.plan_horainici)
      if (!time) continue

      sessions.push({
        time,
        version: versionFromTitle || extractVersionFromPlanif(p) || null,
        sala:     p.plan_sala ? String(p.plan_sala) : null,
        seats_pct: calcOccupancy(p),
      })
    }
  }

  // Ordena per hora ascendent
  sessions.sort((a, b) => a.time.localeCompare(b.time))

  return sessions
}
