#!/usr/bin/env node
/**
 * scripts/cache-cinemas.js
 *
 * Fetcheja els JSONs de tots els cinemes filazero i els desa a data/cache/.
 * S'executa des de GitHub Actions (IPs d'Azure, no bloquejades per Ocine).
 *
 * Ús:  node scripts/cache-cinemas.js
 * Deps: cap (vanilla Node.js fetch, >= 18)
 */

import { REGISTRY } from '../lib/registry.js'
import { writeFileSync, mkdirSync } from 'fs'

const TIMEOUT_MS = 20000

async function fetchCinemaJSON(domain) {
  const url = `https://${domain}/components/com_cines/json/ca_cartellera.json`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FILMCAT/1.0; +https://filmcat.app)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ca,es;q=0.9',
        'Referer': `https://${domain}/`,
        'Cache-Control': 'no-cache',
      },
    })
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${domain}`)
      return null
    }
    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      console.error(`  JSON malformat from ${domain}`)
      return null
    }
    if (!json?.data?.length) {
      console.error(`  Empty/invalid data from ${domain}`)
      return null
    }
    return json
  } catch (e) {
    console.error(`  Fetch error for ${domain}: ${e.message}`)
    return null
  }
}

mkdirSync('data/cache', { recursive: true })

const entries = REGISTRY.filter(e => e.system === 'filazero' && e.domain)

let ok = 0
let fail = 0

for (const entry of entries) {
  process.stdout.write(`Fetching ${entry.domain} ... `)
  const json = await fetchCinemaJSON(entry.domain)
  if (json) {
    // Desa el JSON original + metadada de fetch
    const payload = { fetchedAt: new Date().toISOString(), data: json.data }
    writeFileSync(`data/cache/${entry.domain}.json`, JSON.stringify(payload))
    console.log(`✅  (${json.data.length} films)`)
    ok++
  } else {
    // NO sobreescriguem si el fitxer ja existeix (dades velles millor que res)
    console.log('❌')
    fail++
  }
}

console.log(`\nResultat: ${ok} ok, ${fail} fallits`)
if (fail > 0 && ok === 0) {
  console.error('Tots els fetches han fallat.')
  process.exit(1)
}
