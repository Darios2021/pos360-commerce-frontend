import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "scripts", "prerender.routes.json");

const BRANCH_ID = Number(process.env.PRERENDER_BRANCH_ID || 3);
const LIMIT = Number(process.env.PRERENDER_LIMIT || 100);
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 50);

function writeFallback() {
  const routes = ["/shop"];
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(routes, null, 2), "utf-8");
  console.log(`[prerender] routes: ${routes.length}`);
  console.log(`[prerender] wrote: ${OUT}`);
}

function normBase(raw) {
  return String(raw || "").trim().replace(/\/+$/, "");
}

const API_BASE = normBase(process.env.VITE_API_BASE_URL || "");

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
  if (!API_BASE) {
    console.warn("[prerender] ⚠️ Falta VITE_API_BASE_URL en el build. Uso fallback /shop");
    writeFallback();
    console.log("[prerender] api_base: (empty)");
    return;
  }

  // ✅ Endpoint REAL del frontend (lo que vos estás usando en runtime)
  const catalogUrl = `${API_BASE.replace(/\/+$/, "")}/public/catalog`;

  const ids = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const u = new URL(catalogUrl);
      u.searchParams.set("branch_id", String(BRANCH_ID));
      u.searchParams.set("page", String(page));
      u.searchParams.set("limit", String(LIMIT));
      u.searchParams.set("in_stock", "1");

      const data = await fetchJson(u.toString());

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
      if (pages && page >= pages) break;
    }
  } catch (e) {
    console.warn("[prerender] ⚠️ No encontré endpoint catálogo. Uso fallback /shop (no frena build).");
    console.warn("[prerender] detail:", e?.message || e);
    writeFallback();
    console.log(`[prerender] api_base: ${API_BASE}`);
    console.log(`[prerender] catalog: ${catalogUrl}`);
    return;
  }

  const productIds = uniq(ids);
  const routes = uniq(["/shop", ...productIds.map((id) => `/shop/product/${id}`)]);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(routes, null, 2), "utf-8");

  console.log(`[prerender] routes: ${routes.length}`);
  console.log(`[prerender] wrote: ${OUT}`);
  console.log(`[prerender] api_base: ${API_BASE}`);
  console.log(`[prerender] catalog: ${catalogUrl}`);
  console.log(`[prerender] branch_id: ${BRANCH_ID}`);
  console.log(`[prerender] products: ${productIds.length}`);
})();
