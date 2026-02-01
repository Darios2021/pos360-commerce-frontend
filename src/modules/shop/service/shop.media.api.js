// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.media.api.js

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/**
 * FEED público global de videos (desde BD)
 * Backend esperado (mismo ORIGIN):
 *   GET /api/v1/public/videos/feed?limit=18
 *
 * Respuesta:
 * { ok: true, data: [...] }
 */
export async function getHomeShorts({ limit = 18 } = {}) {
  const safeLimit = clamp(limit, 1, 60);

  const url = `${window.location.origin}/api/v1/public/videos/feed?limit=${safeLimit}`;

  const r = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit", // público (no cookies)
  });

  if (!r.ok) {
    // para que tu UI muestre “404” como ahora
    const err = new Error(`${r.status}`);
    err.status = r.status;
    throw err;
  }

  const payload = await r.json();

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}
