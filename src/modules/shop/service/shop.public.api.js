// src/modules/shop/service/shop.public.api.js
import axios from "axios";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Si tu API está en .../api, las imágenes suelen servirse en el host raíz.
 * Ej: https://dominio.com/api  -> imgs en https://dominio.com/uploads/...
 */
const assetBase = (() => {
  const b = String(base || "").replace(/\/+$/, "");
  // recorta /api o /api/v1 si existiera
  const cut = b.replace(/\/api(\/v\d+)?$/i, "");
  return (cut || b).replace(/\/+$/, "");
})();

const api = axios.create({
  baseURL: `${base}/public`,
  timeout: 15000,
});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function cleanParams(obj) {
  const p = { ...obj };
  Object.keys(p).forEach((k) => {
    const v = p[k];
    if (v === null || v === undefined || v === "") delete p[k];
  });
  return p;
}

function uniqUrls(list) {
  const out = [];
  const seen = new Set();
  for (const u of list) {
    const s = String(u || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function absUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  // relativo -> lo pegamos al assetBase
  if (!assetBase) return s;
  return `${assetBase}${s.startsWith("/") ? "" : "/"}${s}`;
}

/**
 * ✅ Tu backend exige branch_id
 * Para navegación “tipo ML” usamos un branch fijo interno.
 * La SUCURSAL REAL se elige solo en checkout.
 */
const CATALOG_BRANCH_ID = 3;

export function getCatalogBranchId() {
  return CATALOG_BRANCH_ID;
}

export async function getBranches() {
  const r = await api.get("/branches");
  return r.data?.items || [];
}

function dedupeCatalogItems(items) {
  const arr = Array.isArray(items) ? items : [];
  const map = new Map();

  for (const raw of arr) {
    const pid = toInt(raw?.product_id ?? raw?.id, 0);
    if (pid <= 0) continue;

    const imgRaw = raw?.image_url || raw?.image || raw?.url || raw?.src || null;
    const img = imgRaw ? absUrl(imgRaw) : null;

    if (!map.has(pid)) {
      const baseObj = { ...raw };

      const images = [];

      // si viene baseObj.images
      if (Array.isArray(baseObj.images)) {
        for (const it of baseObj.images) {
          const u =
            typeof it === "string"
              ? it
              : it?.url || it?.image_url || it?.src || it?.path;
          if (u) images.push(absUrl(u));
        }
      }

      if (img) images.unshift(img);

      baseObj.images = Array.from(new Set(images.filter(Boolean)));
      baseObj.image_url = baseObj.images[0] || absUrl(baseObj.image_url || "") || "";

      map.set(pid, baseObj);
      continue;
    }

    const cur = map.get(pid);
    const list = Array.isArray(cur.images) ? cur.images : [];
    if (img && !list.includes(img)) list.push(img);
    cur.images = list;

    if (!cur.image_url && list.length) cur.image_url = list[0];
  }

  return Array.from(map.values());
}

/**
 * ✅ CATÁLOGO
 */
export async function getCatalog(params = {}) {
  const branch_id = toInt(params.branch_id, getCatalogBranchId());

  const q = cleanParams({
    branch_id,
    search: params.search || "",
    category_id: params.category_id ?? null,
    subcategory_id: params.subcategory_id ?? null,
    include_children: params.include_children ?? null,
    in_stock: params.in_stock ?? 1,
    page: params.page ?? 1,
    limit: params.limit ?? 24,
  });

  const r = await api.get("/catalog", { params: q });
  const data = r.data || { items: [], total: 0, pages: 0, page: 1, limit: 24 };

  data.items = dedupeCatalogItems(data.items);

  // normaliza URLs
  data.items = (data.items || []).map((it) => {
    const imgs = uniqUrls([...(it.images || []).map(absUrl), absUrl(it.image_url)]);
    return { ...it, images: imgs, image_url: imgs[0] || absUrl(it.image_url) || "" };
  });

  return data;
}

/**
 * ✅ SUGERENCIAS (NUEVO ENDPOINT)
 */
export async function getSuggestions({ q = "", limit = 8, branch_id } = {}) {
  const bid = toInt(branch_id, getCatalogBranchId());
  const qq = String(q || "").trim();

  if (!qq) return [];

  const params = cleanParams({
    branch_id: bid,
    q: qq,
    limit: toInt(limit, 8),
  });

  const r = await api.get("/suggestions", { params });
  const items = Array.isArray(r.data?.items) ? r.data.items : [];

  // normaliza urls en suggestions
  return items.map((it) => {
    const imgs = uniqUrls([...(it.images || []).map(absUrl), absUrl(it.image_url)]);
    return { ...it, images: imgs, image_url: imgs[0] || absUrl(it.image_url) || "" };
  });
}

/**
 * ✅ PRODUCTO (detalle real)
 */
export async function getProduct(id) {
  const pid = toInt(id, 0);
  const r = await api.get(`/products/${pid}`, {
    params: { branch_id: getCatalogBranchId() },
  });

  const item = r.data?.item || null;

  if (item) {
    const img = item?.image_url ? absUrl(item.image_url) : "";
    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];

    // merge + abs
    const merged = uniqUrls([...(img ? [img] : []), ...images.map(absUrl)]);

    item.images = merged;
    item.image_url = merged[0] || img || "";

    // asegura campos de precio que suele usar el frontend
    if (item.price == null) item.price = item.price_list ?? item.price_discount ?? 0;
  }

  return item;
}

/**
 * ✅ SIMILARES (HIDRATADO)
 * 1) pide /catalog para conseguir IDs (rápido)
 * 2) hidrata cada ID con getProduct() (data homogénea con ProductCard)
 */
export async function getSimilarProducts({
  productId,
  category_id = null,
  subcategory_id = null,
  limit = 8,
  branch_id,
  in_stock = 1,
} = {}) {
  const bid = toInt(branch_id, getCatalogBranchId());
  const pid = toInt(productId, 0);
  const lim = Math.max(1, toInt(limit, 8));

  // 1) Traemos candidatos por catálogo
  const q = cleanParams({
    branch_id: bid,
    category_id: category_id ?? null,
    subcategory_id: subcategory_id ?? null,
    in_stock,
    page: 1,
    limit: lim * 3, // pedimos más para poder filtrar/excluir
  });

  let candidates = [];
  try {
    const r = await api.get("/catalog", { params: q });
    const data = r.data || {};
    candidates = dedupeCatalogItems(data.items || []);
  } catch {
    candidates = [];
  }

  // 2) IDs únicos, excluyendo el actual
  const ids = [];
  const seen = new Set();
  for (const it of candidates) {
    const id = toInt(it?.id ?? it?.product_id, 0);
    if (!id || id === pid) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= lim) break;
  }

  // 3) Hidrata con detalle real (name, price, images)
  //    (si alguno falla, lo saltea)
  const hydrated = await Promise.all(
    ids.map(async (id) => {
      try {
        return await getProduct(id);
      } catch {
        return null;
      }
    })
  );

  // 4) Filtra null y asegura urls
  return hydrated
    .filter(Boolean)
    .map((p) => {
      const imgs = uniqUrls([...(p.images || []).map(absUrl), absUrl(p.image_url)]);
      return {
        ...p,
        images: imgs,
        image_url: imgs[0] || absUrl(p.image_url) || "",
        // fallback precio para cards
        price:
          p.price ??
          (toNum(p.price_discount, 0) > 0 ? toNum(p.price_discount, 0) : toNum(p.price_list, 0)),
      };
    });
}
