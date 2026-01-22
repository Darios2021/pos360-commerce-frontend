// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

// ✅ Dominio del sitio (para build en server/CI)
const SITE_ORIGIN = process.env.PRERENDER_SITE_ORIGIN || "https://sanjuantecnologia.com";

// ✅ API base (si tu API vive en el mismo dominio, dejalo igual)
const API_ORIGIN = process.env.PRERENDER_API_ORIGIN || SITE_ORIGIN;

// ✅ Base del shop público
const SHOP_BASE = "/shop";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return await res.json();
}

async function getProductIds() {
  // 1) endpoint ideal: ids
  try {
    const ids = await fetchJson(`${API_ORIGIN}/api/v1/shop/products/ids`);
    if (Array.isArray(ids) && ids.length) return ids.map((x) => Number(x)).filter(Boolean);
  } catch (_) {}

  // 2) fallback: listado con fields=id
  try {
    const data = await fetchJson(`${API_ORIGIN}/api/v1/shop/products?limit=5000&fields=id`);
    const rows = Array.isArray(data) ? data : (data?.rows || data?.items || []);
    const ids = rows.map((r) => Number(r?.id)).filter(Boolean);
    if (ids.length) return ids;
  } catch (_) {}

  return [];
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

(async () => {
  const ids = await getProductIds();

  const routes = [
    `${SHOP_BASE}`,
    ...ids.map((id) => `${SHOP_BASE}/product/${id}`)
  ];

  const finalRoutes = uniq(routes);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(finalRoutes, null, 2), "utf-8");

  console.log(`[prerender] routes: ${finalRoutes.length}`);
  console.log(`[prerender] wrote: ${OUT}`);
})();
