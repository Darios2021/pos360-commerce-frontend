// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

// ✅ Dominio público (producción)
const SITE_ORIGIN = process.env.PRERENDER_SITE_ORIGIN || "https://sanjuantecnologia.com";

// ✅ Endpoint real del catálogo público
// Cambialo si tu API usa otro path.
// (lo más común en tu setup es /api/v1/shop/catalog o /api/v1/shop/products)
const CATALOG_URL =
  process.env.PRERENDER_CATALOG_URL || `${SITE_ORIGIN}/api/v1/shop/catalog`;

// ✅ Base del shop público
const SHOP_BASE = "/shop";

// ✅ Para no matar el server
const LIMIT = Number(process.env.PRERENDER_LIMIT || 100); // items por página
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 200); // tope seguridad

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return await res.json();
}

function pickId(it) {
  const v = it?.product_id ?? it?.id ?? it?.productId ?? null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

async function listAllProductIdsFromCatalog() {
  const ids = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    // Soporta tanto {items,total} como {rows,count} o arrays directos
    const url = new URL(CATALOG_URL);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(LIMIT));

    const data = await fetchJson(url.toString());

    const items =
      Array.isArray(data) ? data
      : Array.isArray(data?.items) ? data.items
      : Array.isArray(data?.rows) ? data.rows
      : Array.isArray(data?.results) ? data.results
      : [];

    if (!items.length) break;

    for (const it of items) {
      const id = pickId(it);
      if (id) ids.push(id);
    }

    // Si hay total, cortamos cuando ya alcanzamos
    const total =
      Number(data?.total ?? data?.count ?? data?.total_items ?? 0) || 0;

    if (total && ids.length >= total) break;
  }

  return uniq(ids);
}

(async () => {
  let productIds = [];
  try {
    productIds = await listAllProductIdsFromCatalog();
  } catch (e) {
    console.error("[prerender] ❌ no pude leer catálogo:", e?.message || e);
    productIds = [];
  }

  const routes = [
    `${SHOP_BASE}`,
    ...productIds.map((id) => `${SHOP_BASE}/product/${id}`),
  ];

  const finalRoutes = uniq(routes);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(finalRoutes, null, 2), "utf-8");

  console.log(`[prerender] routes: ${finalRoutes.length}`);
  console.log(`[prerender] wrote: ${OUT}`);
  console.log(`[prerender] catalog: ${CATALOG_URL}`);
})();
