// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

// ✅ Producción (sitio)
const SITE_ORIGIN = process.env.PRERENDER_SITE_ORIGIN || "https://sanjuantecnologia.com";

// ✅ Endpoint real (según shop.public.api.js -> api.get("/catalog") con basePath /api/v1)
const CATALOG_URL =
  process.env.PRERENDER_CATALOG_URL || `${SITE_ORIGIN}/api/v1/catalog`;

// ✅ branch_id (porque tu API lo requiere)
const BRANCH_ID = Number(process.env.PRERENDER_BRANCH_ID || 3);

// ✅ performance / límites
const LIMIT = Number(process.env.PRERENDER_LIMIT || 100); // items por página
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 200);

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return await res.json();
}

function toId(it) {
  const v = it?.product_id ?? it?.id ?? it?.productId ?? null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

(async () => {
  const ids = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = new URL(CATALOG_URL);

      // ✅ params como tu frontend
      url.searchParams.set("branch_id", String(BRANCH_ID));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(LIMIT));
      url.searchParams.set("in_stock", "1"); // igual que tu default en frontend

      const data = await fetchJson(url.toString());

      const items = Array.isArray(data?.items) ? data.items : [];
      if (!items.length) break;

      for (const it of items) {
        const id = toId(it);
        if (id) ids.push(id);
      }

      const total = Number(data?.total || 0);
      const pages = Number(data?.pages || 0);

      // si viene pages/total, cortamos prolijo
      if (pages && page >= pages) break;
      if (total && ids.length >= total) break;
    }
  } catch (e) {
    console.error("[prerender] ❌ no pude leer catálogo:", e?.message || e);
  }

  const productIds = uniq(ids);

  const routes = uniq([
    "/shop",
    ...productIds.map((id) => `/shop/product/${id}`),
  ]);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(routes, null, 2), "utf-8");

  console.log(`[prerender] routes: ${routes.length}`);
  console.log(`[prerender] wrote: ${OUT}`);
  console.log(`[prerender] catalog: ${CATALOG_URL}`);
  console.log(`[prerender] branch_id: ${BRANCH_ID}`);
})();
