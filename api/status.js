// api/status.js
const SOURCES = [
  { name: 'provacin.xml', url: 'http://www.gencat.cat/llengua/cinema/provacin.xml' },
  { name: 'cinemes.xml',  url: 'http://www.gencat.cat/llengua/cinema/cinemes.xml' },
];

export default async function handler(req, res) {
  const results = await Promise.allSettled(
    SOURCES.map(async src => {
      const start = Date.now();
      const r = await fetch(src.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      return { name: src.name, ok: r.ok, status: r.status, ms: Date.now() - start };
    })
  );
  const checks = results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { name: SOURCES[i].name, ok: false, error: r.reason?.message }
  );
  return res.status(checks.every(c => c.ok) ? 200 : 503).json({
    status: checks.every(c => c.ok) ? 'ok' : 'degraded',
    checkedAt: new Date().toISOString(),
    sources: checks,
  });
}
