// Utilidades para construir URLs de producto SEO-friendly tipo:
//   /shop/product/iphone-13-pro-max-128gb-356
// El id numérico siempre va al final separado por guion, así el extractor
// recupera el id de forma simple y robusta.

const SLUG_MAX = 80;

/**
 * Convierte un texto a slug URL-safe (sin acentos, sólo a-z 0-9 y guiones).
 */
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos combinantes (NFD)
    .replace(/[ñ]/g, "n")        // ñ -> n
    .replace(/[^a-z0-9\s-]/g, " ")     // todo lo no alfanum -> espacio
    .trim()
    .replace(/\s+/g, "-")              // espacios a guion
    .replace(/-+/g, "-")               // colapsar guiones
    .replace(/^-+|-+$/g, "")           // recortar guiones bordes
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");              // por si el slice cortó en guion
}

/**
 * Devuelve el "param id" de la ruta: si hay nombre, "<slug>-<id>"; si no, "<id>".
 * @param {object} product
 */
export function buildProductPath(product) {
  if (!product) return "";
  const id = Number(product.product_id ?? product.id ?? 0);
  if (!id) return "";
  const slug = slugify(product.name || product.title || product.short_description || "");
  return slug ? `${slug}-${id}` : String(id);
}

/**
 * Construye un location object de Vue Router para shopProduct.
 * @param {object} product
 * @param {object} opts  { branchId?: number|string }
 */
export function buildProductLocation(product, opts = {}) {
  const id = Number(product?.product_id ?? product?.id ?? 0);
  if (!id) return null;
  const param = buildProductPath(product) || String(id);
  const query = {};
  if (opts.branchId !== null && opts.branchId !== undefined && String(opts.branchId).trim() !== "") {
    query.branch_id = String(opts.branchId);
  }
  return {
    name: "shopProduct",
    params: { id: param },
    query,
  };
}

/**
 * Recupera el id numérico desde el param de la ruta (sea slug+id o id puro).
 * @param {string} idOrSlug
 * @returns {number} id (0 si no se pudo extraer)
 */
export function extractProductId(idOrSlug) {
  const s = String(idOrSlug || "").trim();
  if (!s) return 0;
  // id puro (legacy)
  if (/^\d+$/.test(s)) return Number(s);
  // slug-con-id al final: capturar último número precedido por guion
  const m = s.match(/-(\d+)$/);
  return m ? Number(m[1]) : 0;
}

/**
 * Indica si el param actual ya incluye un slug (no es solo el id pelado).
 */
export function hasSlugInPath(idOrSlug) {
  const s = String(idOrSlug || "").trim();
  return !!s && !/^\d+$/.test(s);
}
