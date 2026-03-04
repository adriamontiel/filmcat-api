// api/debug.js — temporal per veure l'estructura real del XML de Gencat
export default async function handler(req, res) {
  try {
    const r = await fetch('http://www.gencat.cat/llengua/cinema/provacin.xml', {
      headers: { 'User-Agent': 'FILMCAT/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const xml = await r.text();
    // Retorna els primers 3000 caràcters per veure l'estructura
    return res.status(200).json({
      length: xml.length,
      preview: xml.slice(0, 3000),
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
