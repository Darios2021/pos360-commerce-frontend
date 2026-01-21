// src/app/services/media.service.js
// ✅ COPY-PASTE FINAL COMPLETO
//
// Admin Media API
// - GET    /api/v1/admin/media/images
// - POST   /api/v1/admin/media/images                 (multipart file)
// - PUT    /api/v1/admin/media/images/:id             (multipart file overwrite by key/url/filename)
// - DELETE /api/v1/admin/media/images/:id
// - GET    /api/v1/admin/media/images/used-by/:filename

import http from "@/app/api/http";

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function noCacheConfig() {
  return {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  };
}

/**
 * listMediaImages filters:
 * - q (busca por filename y por info usada: producto/categoría/subcategoría si viene del backend)
 * - used: "all" | "used" | "free"
 * - product_id
 * - category_id
 * - subcategory_id
 */
export async function listMediaImages({
  page = 1,
  limit = 60,
  q = "",
  used = "all",
  product_id = "",
  category_id = "",
  subcategory_id = "",
} = {}) {
  const __ts = Date.now();
  const url = `/admin/media/images${toQuery({
    page,
    limit,
    q,
    used,
    product_id,
    category_id,
    subcategory_id,
    __ts,
  })}`;

  const { data } = await http.get(url, noCacheConfig());

  if (!data || data.ok !== true) {
    return { ok: false, page, limit, total: 0, items: [], message: "Respuesta vacía o inválida" };
  }

  return data;
}

export async function uploadMediaImage(file) {
  const fd = new FormData();
  fd.append("file", file);

  const { data } = await http.post("/admin/media/images", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  return data;
}

/**
 * ✅ OVERWRITE REAL:
 * - id puede ser: key (products/9/x.webp) o url o filename
 * - backend resuelve el key exacto y hace putObject sobre el MISMO key (sin generar nombre nuevo)
 *
 * PUT /api/v1/admin/media/images/:id
 */
export async function overwriteMediaImage(idOrKeyOrUrlOrFilename, file) {
  const safe = encodeURIComponent(String(idOrKeyOrUrlOrFilename));
  const fd = new FormData();
  fd.append("file", file);

  const { data } = await http.put(`/admin/media/images/${safe}${toQuery({ __ts: Date.now() })}`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  return data; // { ok, key, filename, url }
}

export async function deleteMediaImage(idOrFilenameOrUrl) {
  const safe = encodeURIComponent(String(idOrFilenameOrUrl));
  const url = `/admin/media/images/${safe}${toQuery({ __ts: Date.now() })}`;
  const { data } = await http.delete(url, noCacheConfig());
  return data;
}

export async function getMediaImageUsedBy(filename) {
  const safe = encodeURIComponent(String(filename));
  const url = `/admin/media/images/used-by/${safe}${toQuery({ __ts: Date.now() })}`;
  const { data } = await http.get(url, noCacheConfig());
  return data;
}
