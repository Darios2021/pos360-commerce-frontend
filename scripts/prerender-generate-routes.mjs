// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

const BRANCH_ID = Number(process.env.PRERENDER_BRANCH_ID || 3);
const LIMIT = Number(process.env.PRERENDER_LIMIT || 50);
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 10);
const MAX_PRODUCTS = Number(process.env.PRERENDER_MAX_PRODUCTS || 300);

function writeRoutes(routes) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(routes, null, 2), "utf-8");
  console.log(`[prerender] routes: ${routes.length}`);
  console.log(`[prerender] wrote: ${OUT}`);
}

function writeFallback() {
  writeRoutes(["/shop/"]);
}

function normBase(raw) {
  return String(raw || "").trim().replace(/\/+$/, "");
}

// ✅ API_BASE_URL tiene prioridad (ideal para build/prerender)
const API_BASE = normBase(process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "");

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return await res.json();
}

function toId(it) {
  const v = it?.product_id ?? it?.id ?? it?.productId ?? it?.product?.id ?? null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function extractItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

(async () => {
  if (!API_BASE) {
    console.warn("[prerender] ⚠️ Falta API_BASE_URL o VITE_API_BASE_URL. Uso fallback /shop/");
    writeFallback();
    return;
  }

  const catalogUrl = `${API_BASE}/public/catalog`;

  const ids = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const u = new URL(catalogUrl);
      u.searchParams.set("branch_id", String(BRANCH_ID));
      u.searchParams.set("page", String(page));
      u.searchParams.set("limit", String(LIMIT));
      u.searchParams.set("in_stock", "1");

      const data = await fetchJson(u.toString());
      const items = extractItems(data);

      if (!items.length) break;

      for (const it of items) {
        const id = toId(it);
        if (id) ids.push(id);
        if (ids.length >= MAX_PRODUCTS) break;
      }

      if (ids.length >= MAX_PRODUCTS) break;

      const pages = Number(data?.pages || 0);
      if (pages && page >= pages) break;
    }
  } catch (e) {
    console.warn("[prerender] ⚠️ No pude leer catálogo, uso fallback /shop/ (no frena build).");
    console.warn("[prerender] detail:", e?.message || e);
    console.log(`[prerender] api_base: ${API_BASE}`);
    console.log(`[prerender] catalog: ${catalogUrl}`);
    writeFallback();
    return;
  }

  const productIds = uniq(ids).slice(0, MAX_PRODUCTS);

  // ✅ SOLO una variante (SIN slash final) => evita overwrite warnings
  const productRoutes = productIds.map((id) => `/shop/product/${id}`);

  const routes = uniq(["/shop/", ...productRoutes]);

  writeRoutes(routes);

  console.log(`[prerender] api_base: ${API_BASE}`);
  console.log(`[prerender] catalog: ${catalogUrl}`);
  console.log(`[prerender] branch_id: ${BRANCH_ID}`);
  console.log(`[prerender] products: ${productIds.length}`);
})();
