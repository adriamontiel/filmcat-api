// api/cron/refresh.js
// Cridat per Vercel Cron cada dijous a les 19:00 UTC (20:00h hora catalana)
// Força la renovació de la caché del CDN per als endpoints principals,
// just quan Gencat actualitza els XMLs amb la nova cartellera setmanal.

const BASE_URL = 'https://filmcat-api.vercel.app';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const started = Date.now();

  try {
    const [cartellera, cinemes] = await Promise.allSettled([
      fetch(`${BASE_URL}/api/cartellera`, {
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'FILMCAT-Cron/1.0',
        },
        signal: AbortSignal.timeout(20000),
      }),
      fetch(`${BASE_URL}/api/cinemes`, {
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'FILMCAT-Cron/1.0',
        },
        signal: AbortSignal.timeout(20000),
      }),
    ]);

    const elapsed = Date.now() - started;

    return res.status(200).json({
      ok: true,
      refreshedAt: new Date().toISOString(),
      elapsed_ms: elapsed,
      results: {
        cartellera: cartellera.status === 'fulfilled'
          ? { ok: true, status: cartellera.value.status }
          : { ok: false, error: cartellera.reason?.message },
        cinemes: cinemes.status === 'fulfilled'
          ? { ok: true, status: cinemes.value.status }
          : { ok: false, error: cinemes.reason?.message },
      },
    });

  } catch (err) {
    console.error('[cron/refresh] error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
