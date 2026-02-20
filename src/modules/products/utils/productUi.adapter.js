// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/productUi.adapter.js
// ✅ Adapter PRO con "compat layer" para que tus componentes NO queden vacíos.

function s(v) {
  const x = String(v ?? "").trim();
  return x ? x : "";
}
function n(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const num = Number(String(v).replace(",", "."));
  return Number.isFinite(num) ? num : d;
}
function pickStr(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = s(obj?.[k]);
    if (v) return v;
  }
  return fallback;
}
function pickNum(obj, keys, fallback = 0) {
  for (const k of keys) {
    const v = n(obj?.[k], NaN);
    if (Number.isFinite(v)) return v;
  }
  return fallback;
}

function normalizeImages(p) {
  const candidates =
    (Array.isArray(p?.images) && p.images) ||
    (Array.isArray(p?.media?.images) && p.media.images) ||
    (Array.isArray(p?.product_images) && p.product_images) ||
    (Array.isArray(p?.gallery) && p.gallery) ||
    (Array.isArray(p?.photos) && p.photos) ||
    [];

  const out = [];

  for (const it of candidates) {
    if (!it) continue;
    if (typeof it === "string") {
      const u = s(it);
      if (u) out.push({ url: u, title: "" });
      continue;
    }
    const u = s(it.url || it.image_url || it.public_url || it.publicUrl || it.src || it.path || it.location);
    if (u) out.push({ url: u, title: s(it.title || it.alt) });
  }

  const main = s(p?.image_url || p?.imageUrl || p?.thumbnail_url || p?.thumbnailUrl);
  if (main && !out.some((x) => x.url === main)) out.unshift({ url: main, title: "" });

  return out;
}

function normalizeStock(p) {
  const arr = Array.isArray(p?.stock_matrix)
    ? p.stock_matrix
    : Array.isArray(p?.stock)
      ? p.stock
      : Array.isArray(p?.branches_stock)
        ? p.branches_stock
        : [];

  const rows = arr
    .map((r) => ({
      branch_id: Number(r.branch_id || r.branchId || 0),
      branch_name: s(r.branch_name || r.branchName || r.branch) || `Sucursal #${r.branch_id || "—"}`,
      qty: n(r.qty ?? r.current_qty ?? r.currentQty ?? r.stock ?? 0, 0),
    }))
    .filter((x) => x.branch_id > 0);

  const total = rows.reduce((acc, x) => acc + (Number.isFinite(x.qty) ? x.qty : 0), 0);

  return { rows, total };
}

export function buildProductUI(raw, { productId } = {}) {
  const p = raw || {};
  const id = p?.id ?? p?.product_id ?? productId ?? null;

  // 🔹 Identidad
  const name = pickStr(p, ["name", "title"], "Producto");
  const sku = pickStr(p, ["sku"], "");
  const code = pickStr(p, ["code", "internal_code", "barcode"], "");
  const brand = pickStr(p, ["brand", "brand_name"], "");
  const model = pickStr(p, ["model"], "");
  const description = pickStr(p, ["description", "desc"], "");

  const category_name =
    pickStr(p, ["category_name"], "") ||
    pickStr(p?.category || {}, ["name"], "") ||
    s(p?.category_id);

  const subcategory_name =
    pickStr(p, ["subcategory_name"], "") ||
    pickStr(p?.subcategory || {}, ["name"], "") ||
    s(p?.subcategory_id);

  // 🔹 Precios (capturamos todos los posibles)
  const price_list = pickNum(p, ["price_list", "list_price", "price_regular", "price_base", "price"], 0);
  const price_discount = pickNum(p, ["price_discount", "sale_price", "price_sale", "discount_price", "final_price"], 0);
  const final_price = price_discount > 0 ? price_discount : price_list;

  // 🔹 Stock
  const stock = normalizeStock(p);

  // 🔹 Imágenes
  const images = normalizeImages(p);

  // 🔹 URL ecommerce
  const base = s(import.meta.env.VITE_SHOP_BASE_URL) || window.location.origin;
  const tpl = s(import.meta.env.VITE_SHOP_PRODUCT_PATH) || "/shop/product/{id}";
  const path = (tpl.includes("{id}") ? tpl : "/shop/product/{id}").replace("{id}", String(id || ""));
  const ecommerceUrl = base.replace(/\/$/, "") + path;

  const qrValue = `${window.location.origin}/shop/product/${id}`;

  /**
   * ✅ COMPAT LAYER
   * Acá está la magia: armamos un objeto que “parece” el que tus componentes esperan.
   * Si tus componentes leen price_list/price_discount -> ya están.
   * Si leen price/final_price -> también.
   * Si leen stock_total / branch_qty -> también.
   */
  const productCompat = {
    ...p,

    // ids
    id,
    product_id: id,

    // strings
    name,
    title: p?.title ?? name,
    sku,
    code,
    internal_code: p?.internal_code ?? code,

    brand,
    model,
    description,

    category_name,
    subcategory_name,

    // precios
    price_list,
    price_discount,
    final_price, // <- clave
    price: p?.price ?? final_price, // <- por si el componente lee product.price

    // stock
    stock_total: p?.stock_total ?? stock.total,
    branch_qty: p?.branch_qty ?? p?.qty_in_branch ?? null,
    stock_matrix: Array.isArray(p?.stock_matrix) ? p.stock_matrix : stock.rows,
    stock: Array.isArray(p?.stock) ? p.stock : stock.rows,

    // imágenes
    images: Array.isArray(p?.images) ? p.images : images.map((x) => x.url),
    image_url: p?.image_url ?? (images[0]?.url || ""),
    thumbnail_url: p?.thumbnail_url ?? (images[0]?.url || ""),

    // flags
    is_active: Boolean(p?.is_active ?? p?.active ?? true),
  };

  return {
    raw: p,
    product: productCompat,
    images, // para ProductPhotoGallery
    ecommerceUrl,
    qrValue,
    stockRows: stock.rows,
  };
}