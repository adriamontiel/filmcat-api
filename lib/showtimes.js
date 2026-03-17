/**
 * showtimes.js
 * Orquestrador: per a cada cinema rebut, consulta el registre
 * i crida l'adaptador corresponent en paral·lel.
 *
 * Format de resposta per cinema:
 * {
 *   cinema:    string,         // nom exacte del sistema filmcat
 *   web:       string|null,    // URL del cinema per al fallback "consulta la web"
 *   status:    "ok" | "no_source" | "error",
 *   stale:     false,          // reservat per a futura cache persistent (Fase 2)
 *   sessions:  Session[]       // buit si status !== "ok"
 * }
 *
 * Session: { time, version, sala, seats_pct }
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fetchFilazeroSessions } from './adapters/filazero.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Carrega el registre una sola vegada (és estàtic)
const REGISTRY = JSON.parse(
  readFileSync(join(__dirname, '../data/cinemes-registry.json'), 'utf-8')
)

// Índex per accés O(1) per nom
const REGISTRY_INDEX = new Map(REGISTRY.map(e => [e.filmcat_name, e]))

/**
 * Per a una llista de cinemes i una pel·lícula, retorna els horaris
 * disponibles per a la data donada.
 *
 * @param {string[]} cinemaNames - Noms de cinemes (tal com apareixen a filmcat)
 * @param {string}   filmTitle   - Títol de la pel·lícula
 * @param {string}   date        - Data "YYYY-MM-DD"
 * @returns {Promise<Object[]>}  - Array d'objectes per cinema
 */
export async function getShowtimes(cinemaNames, filmTitle, date) {
  const tasks = cinemaNames.map(name => resolveShowtimes(name, filmTitle, date))
  return Promise.all(tasks)
}

async function resolveShowtimes(name, filmTitle, date) {
  const entry = REGISTRY_INDEX.get(name)

  // Cinema no trobat al registre → no_source sense web
  if (!entry) {
    return { cinema: name, web: null, status: 'no_source', stale: false, sessions: [] }
  }

  // Sistema "none" → no disposem d'horaris, però tenim la URL del cinema
  if (entry.system === 'none' || !entry.domain) {
    return { cinema: name, web: entry.web, status: 'no_source', stale: false, sessions: [] }
  }

  // Sistema "filazero"
  if (entry.system === 'filazero') {
    try {
      const sessions = await fetchFilazeroSessions(entry.domain, filmTitle, date)

      if (sessions === null) {
        // Fetch ha fallat (timeout, JSON malformat, CORS, etc.)
        return { cinema: name, web: entry.web, status: 'error', stale: false, sessions: [] }
      }

      return { cinema: name, web: entry.web, status: 'ok', stale: false, sessions }
    } catch {
      return { cinema: name, web: entry.web, status: 'error', stale: false, sessions: [] }
    }
  }

  // Sistema desconegut (futur: admit-one, etc.) → tractam com no_source
  return { cinema: name, web: entry.web, status: 'no_source', stale: false, sessions: [] }
}
