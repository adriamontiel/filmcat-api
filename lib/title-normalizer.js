/**
 * title-normalizer.js
 * Normalitza títols de pel·lícules per comparar entre sistemes
 * (Gencat/TMDB vs filazero) on els títols poden diferir en
 * idioma, format de sala, indicadors de versió, etc.
 */

const REMOVE_WORDS = [
  'atmos', 'imax', '4dx', '3d', '4k',
  'vos', 'vose', 'vo', 'vcat', 've', 'ov',
  'original', 'doblada', 'subtitulada',
  'catala', 'catalan', 'espanyol', 'espanol', 'castellano',
  'versio', 'version', 'edicio', 'especial',
  'premiere', 'gala', 'digital', 'hd',
]

const REMOVE_PATTERN = new RegExp(`\\b(${REMOVE_WORDS.join('|')})\\b`, 'gi')

/**
 * Normalitza un títol: minúscules, sense accents, sense paraules
 * de format/versió, sense caràcters especials.
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  if (!title || typeof title !== 'string') return ''
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // treu accents
    .replace(/[()[\]:·•–—]/g, ' ')                       // substitueix puntuació per espai
    .replace(REMOVE_PATTERN, '')                          // treu paraules de format/versió
    .replace(/[^a-z0-9\s]/g, ' ')                        // treu símbols restants
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calcula la distància de Levenshtein entre dos strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  // Usa una sola fila per estalviar memòria
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
    }
    prev = curr
  }
  return prev[n]
}

/**
 * Retorna la similitud [0, 1] entre dos strings normalitzats.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function similarity(a, b) {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

/**
 * Comprova si dos títols de pel·lícula fan referència a la mateixa obra.
 * Estratègia en cascada:
 *   1. Match exacte post-normalització
 *   2. Un conté l'altre (per subtítols)
 *   3. Similitud de Levenshtein >= threshold
 *
 * @param {string} filazeroTitle - Títol del JSON filazero (pot ser en castellà)
 * @param {string} ourTitle      - Títol del nostre sistema (en català)
 * @param {number} threshold     - Similitud mínima [0,1], per defecte 0.82
 * @returns {boolean}
 */
export function titlesMatch(filazeroTitle, ourTitle, threshold = 0.82) {
  const n1 = normalizeTitle(filazeroTitle)
  const n2 = normalizeTitle(ourTitle)

  if (!n1 || !n2) return false

  // 1. Match exacte
  if (n1 === n2) return true

  // 2. Un conté l'altre (gestiona subtítols: "Avatar El foc" ⊃ "Avatar")
  //    Només si el títol més curt té almenys 4 caràcters (evita falsos positius)
  const shorter = n1.length <= n2.length ? n1 : n2
  const longer  = n1.length <= n2.length ? n2 : n1
  if (shorter.length >= 4 && longer.includes(shorter)) return true

  // 3. Levenshtein
  return similarity(n1, n2) >= threshold
}
