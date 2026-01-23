// scripts/prerender-generate-routes.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

const BRANCH_ID = Number(process.env.PRERENDER_BRANCH_ID || 3);
const LIMIT = Number(process.env.PRERENDER_LIMIT || 100);
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 200);

function normBase(raw) {
  return String(raw || "").trim().replace(/\/+$/, "");
}

const API_BASE = normBase(process.env.VITE_API_BASE_URL || "");

// ⚠️ NO frenamos el build si falta, solo advertimos
if (!API_BASE) {
  console.error("[prerender] ⚠️ Falta VITE_API_BASE_URL en el build. Uso fallback /shop");
}

const CANDIDATES = [
  "/catalog",
  "/public/catalog",
  "/shop/catalog",
  "/public/shop/catalog",
  "/public/shop/catalogue",
  "/public/products/catalog",
  "/products/catalog",
  "/shop/public/catalog",
];

function safeWriteRoutes(routes) {
  try {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(routes, null, 2), "utf-8");
    console.log(`[prerender] routes: ${routes.length}`);
    console.log(`[prerender] wrote: ${OUT}`);
    console.log(`[prerender] api_base: ${API_BASE || "(empty)"}`);
  } catch (e) {
    console.error("[prerender] ❌ no pude escribir routes.json:", e?.message || e);
  }
}

function looksLikeHtml(text) {
  const t = String(text || "").trim().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html") || t.includes("<head") || t.includes("</html>");
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const text = await res.text();

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} - ${url}`);
    err.status = res.status;
    err.bodySample = text.slice(0, 200);
    throw err;
  }

  if (looksLikeHtml(text)) {
    const err = new Error(`NOT_JSON_HTML - ${url}`);
    err.status = res.status;
    err.bodySample = text.slice(0, 200);
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const err = new Error(`INVALID_JSON - ${url}`);
    err.status = res.status;
    err.bodySample = text.slice(0, 200);
    throw err;
  }
}

async function tryEndpoint(base, pathPart) {
  const u = new URL(base + pathPart);
  u.searchParams.set("branch_id", String(BRANCH_ID));
  u.searchParams.set("page", "1");
  u.searchParams.set("limit", String(LIMIT));
  u.searchParams.set("in_stock", "1");

  const data = await fetchJson(u.toString());

  // si respondió JSON, ya lo consideramos válido aunque venga vacío
  const items =
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data) ? data :
    [];

  return { ok: true, url: base + pathPart, sampleCount: items.length };
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
      console.log(`[prerender] ✅ endpoint ok: ${r.url} (sample items: ${r.sampleCount})`);
      return r.url;
    } catch (e) {
      const msg = e?.message || String(e);
      const status = e?.status ? ` status=${e.status}` : "";
      console.log(`[prerender] ❌ endpoint fail: ${API_BASE + p}${status} (${msg})`);
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
  return Array.from(new Set((arr || []).filter(Boolean)));
}

(async () => {
  // ✅ fallback seguro SIEMPRE
  const fallback = ["/shop"];

  try {
    const catalogBase = await resolveCatalogUrl();

    if (!catalogBase) {
      console.error("[prerender] ⚠️ No encontré endpoint catálogo. Uso fallback /shop (no frena build).");
      safeWriteRoutes(fallback);
      return;
    }

    const ids = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = new URL(catalogBase);
      url.searchParams.set("branch_id", String(BRANCH_ID));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(LIMIT));
      url.searchParams.set("in_stock", "1");

      let data;
      try {
        data = await fetchJson(url.toString());
      } catch (e) {
        console.error("[prerender] ❌ error leyendo catálogo:", e?.message || e);
        break; // cortamos paginado pero NO frenamos build
      }

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

    const productIds = uniq(ids);

    const routes = uniq([
      "/shop",
      ...productIds.slice(0, 3000).map((id) => `/shop/product/${id}`), // ✅ límite sano por si explota
    ]);

    safeWriteRoutes(routes);

    console.log(`[prerender] catalog: ${catalogBase}`);
    console.log(`[prerender] branch_id: ${BRANCH_ID}`);
    console.log(`[prerender] products: ${productIds.length}`);
  } catch (fatal) {
    // ✅ JAMÁS matar build por prerender
    console.error("[prerender] ❌ fatal inesperado (no frena build):", fatal?.message || fatal);
    safeWriteRoutes(fallback);
    process.exit(0);
  }
})();
