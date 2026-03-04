export default async function handler(req, res) {
  const url = req.query.url || 'http://www.gencat.cat/llengua/cinema/provacin.xml';
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'FILMCAT/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const xml = await r.text();
    return res.status(200).json({
      url,
      length: xml.length,
      preview: xml.slice(0, 4000),
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
