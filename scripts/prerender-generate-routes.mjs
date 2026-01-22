// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

// ✅ branch_id requerido por tu API
const BRANCH_ID = Number(process.env.PRERENDER_BRANCH_ID || 3);

// ✅ performance
const LIMIT = Number(process.env.PRERENDER_LIMIT || 100);
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 200);

// ------------------------------------------------------
// ✅ Resolver API base EXACTA (igual que tu frontend)
// - Preferimos VITE_API_BASE_URL (tu API real)
// - Si no existe, fallback same-origin (a veces sirve)
// ------------------------------------------------------
function normalizeApiBase(raw) {
  let base = String(raw || "").trim();
  if (!base) return "";

  // saca trailing slash
  base = base.replace(/\/+$/, "");

  // si ya termina en /api/v1, ok
  if (base.endsWith("/api/v1")) return base;

  // si termina en /api, no asumimos v1
  // si no termina en api/v1, lo dejamos como está (puede incluir /api/v1 ya en el medio)
  return base;
}

function buildCatalogUrl() {
  // 1) override explícito
  if (process.env.PRERENDER_CATALOG_URL) return String(process.env.PRERENDER_CATALOG_URL).trim();

  // 2) usar la misma env que Vite usa para el frontend
  const viteBase = normalizeApiBase(process.env.VITE_API_BASE_URL);

  // Si VITE_API_BASE_URL viene como "https://xxx/api/v1"
  if (viteBase) {
    // Si ya incluye /api/v1, agregamos /catalog
    if (viteBase.endsWith("/api/v1")) return `${viteBase}/catalog`;

    // Si no incluye /api/v1, probamos con /api/v1/catalog (caso común)
    // (si tu API ya trae otro path, ahí sí conviene setear PRERENDER_CATALOG_URL explícito)
    return `${viteBase}/api/v1/catalog`;
  }

  // 3) fallback same-origin (tu caso hoy da 404)
  return "https://sanjuantecnologia.com/api/v1/catalog";
}

const CATALOG_URL = buildCatalogUrl();

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
      url.searchParams.set("branch_id", String(BRANCH_ID));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(LIMIT));
      url.searchParams.set("in_stock", "1");

      const data = await fetchJson(url.toString());

      const items = Array.isArray(data?.items) ? data.items : [];
      if (!items.length) break;

      for (const it of items) {
        const id = toId(it);
        if (id) ids.push(id);
      }

      const pages = Number(data?.pages || 0);
      const total = Number(data?.total || 0);
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
