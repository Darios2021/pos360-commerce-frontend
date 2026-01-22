// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

const BRANCH_ID = Number(process.env.PRERENDER_BRANCH_ID || 3);
const LIMIT = Number(process.env.PRERENDER_LIMIT || 100);
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 200);

function normBase(raw) {
  let b = String(raw || "").trim().replace(/\/+$/, "");
  return b;
}

const API_BASE = normBase(process.env.VITE_API_BASE_URL || "");
if (!API_BASE) {
  console.error("[prerender] ❌ Falta VITE_API_BASE_URL en el build");
}

const CANDIDATES = [
  // ✅ lo que creemos por tu frontend
  "/catalog",
  "/public/catalog",
  "/shop/catalog",
  "/public/shop/catalog",
  "/public/shop/catalogue",
  "/public/products/catalog",
  "/products/catalog",
  // fallback legacy
  "/shop/public/catalog",
];

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return await res.json();
}

async function tryEndpoint(base, pathPart) {
  const u = new URL(base + pathPart);
  u.searchParams.set("branch_id", String(BRANCH_ID));
  u.searchParams.set("page", "1");
  u.searchParams.set("limit", String(LIMIT));
  u.searchParams.set("in_stock", "1");
  const data = await fetchJson(u.toString());
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  if (!items.length) {
    // aunque venga vacío, si responde JSON sin 404, es válido
    return { ok: true, url: base + pathPart };
  }
  return { ok: true, url: base + pathPart };
}

async function resolveCatalogUrl() {
  // si el user forzó
  if (process.env.PRERENDER_CATALOG_URL) {
    return String(process.env.PRERENDER_CATALOG_URL).trim().replace(/\/+$/, "");
  }

  if (!API_BASE) return "";

  for (const p of CANDIDATES) {
    try {
      const r = await tryEndpoint(API_BASE, p);
      if (r.ok) return r.url;
    } catch (e) {
      // seguimos probando
    }
  }

  return "";
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
  const catalogBase = await resolveCatalogUrl();

  if (!catalogBase) {
    console.error("[prerender] ❌ No encontré ningún endpoint de catálogo válido en la API.");
    const routes = ["/shop"];
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(routes, null, 2), "utf-8");
    console.log(`[prerender] routes: ${routes.length}`);
    console.log(`[prerender] wrote: ${OUT}`);
    console.log(`[prerender] api_base: ${API_BASE}`);
    return;
  }

  const ids = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = new URL(catalogBase);
      url.searchParams.set("branch_id", String(BRANCH_ID));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(LIMIT));
      url.searchParams.set("in_stock", "1");

      const data = await fetchJson(url.toString());

      const items =
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.rows) ? data.rows :
        Array.isArray(data) ? data :
        [];

      if (!items.length) break;

      for (const it of items) {
        const id = toId(it);
        if (id) ids.push(id);
      }

      const pages = Number(data?.pages || 0);
      const total = Number(data?.total || data?.count || 0);
      if (pages && page >= pages) break;
      if (total && ids.length >= total) break;
    }
  } catch (e) {
    console.error("[prerender] ❌ error leyendo catálogo:", e?.message || e);
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
  console.log(`[prerender] api_base: ${API_BASE}`);
  console.log(`[prerender] catalog: ${catalogBase}`);
  console.log(`[prerender] branch_id: ${BRANCH_ID}`);
})();
