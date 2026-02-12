// src/app/services/media.service.js
// ✅ COPY-PASTE FINAL COMPLETO
//
// Admin Media API
// - GET    /api/v1/admin/media/images
// - POST   /api/v1/admin/media/images                 (multipart file)
// - PUT    /api/v1/admin/media/images/:id             (multipart file overwrite by key/url/filename/stem)
// - DELETE /api/v1/admin/media/images/:id
// - GET    /api/v1/admin/media/images/used-by/:filename
//
// ✅ Mantiene tu estilo (toQuery + noCacheConfig)
// ✅ FIXES:
// - encodeURIComponent con "id" grande (url/key/stem) pero SIN romper el path
// - normaliza strings (trim)
// - maneja id vacío con error claro
// - evita devolver {ok:false} silencioso en upload/overwrite/delete (deja que el caller vea el error si backend devuelve ok:false)

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

function toStr(v) {
  return String(v ?? "").trim();
}

function encodeId(id) {
  // encodeURIComponent alcanza y es seguro para key/url/stem
  // (axios NO vuelve a encodear si ya viene encoded)
  return encodeURIComponent(toStr(id));
}

function assertOk(data, fallbackMessage = "Respuesta inválida") {
  // si backend devuelve ok:false, devolvemos igual data (para mostrar message),
  // pero si viene vacío, generamos un objeto estándar.
  if (!data) return { ok: false, message: fallbackMessage };
  return data;
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
    q: toStr(q),
    used: toStr(used) || "all",
    product_id: toStr(product_id),
    category_id: toStr(category_id),
    subcategory_id: toStr(subcategory_id),
    __ts,
  })}`;

  const { data } = await http.get(url, noCacheConfig());

  // devolvemos algo consistente para la vista
  if (!data || data.ok !== true) {
    return {
      ok: false,
      page: Number(page) || 1,
      limit: Number(limit) || 60,
      total: 0,
      items: [],
      message: data?.message || "Respuesta vacía o inválida",
    };
  }

  return data;
}

export async function uploadMediaImage(file) {
  if (!file) throw new Error("FILE_REQUIRED");

  const fd = new FormData();
  // ✅ backend espera field "file"
  fd.append("file", file);

  const { data } = await http.post("/admin/media/images", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  return assertOk(data, "Respuesta inválida al subir imagen");
}

/**
 * ✅ OVERWRITE REAL:
 * - id puede ser: key (products/9/x.webp) o url o filename o stem
 * - backend resuelve el key exacto y hace putObject sobre el MISMO key (sin generar nombre nuevo)
 *
 * PUT /api/v1/admin/media/images/:id
 */
export async function overwriteMediaImage(idOrKeyOrUrlOrFilename, file) {
  const rawId = toStr(idOrKeyOrUrlOrFilename);
  if (!rawId) throw new Error("ID_REQUIRED");
  if (!file) throw new Error("FILE_REQUIRED");

  const safe = encodeId(rawId);

  const fd = new FormData();
  // ✅ backend espera field "file"
  fd.append("file", file);

  const { data } = await http.put(`/admin/media/images/${safe}${toQuery({ __ts: Date.now() })}`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  return assertOk(data, "Respuesta inválida al reemplazar imagen");
}

export async function deleteMediaImage(idOrFilenameOrUrl) {
  const rawId = toStr(idOrFilenameOrUrl);
  if (!rawId) throw new Error("ID_REQUIRED");

  const safe = encodeId(rawId);
  const url = `/admin/media/images/${safe}${toQuery({ __ts: Date.now() })}`;

  const { data } = await http.delete(url, noCacheConfig());
  return assertOk(data, "Respuesta inválida al eliminar imagen");
}

export async function getMediaImageUsedBy(filename) {
  const fn = toStr(filename);
  if (!fn) throw new Error("FILENAME_REQUIRED");

  const safe = encodeId(fn);
  const url = `/admin/media/images/used-by/${safe}${toQuery({ __ts: Date.now() })}`;

  const { data } = await http.get(url, noCacheConfig());
  return assertOk(data, "Respuesta inválida al consultar usos");
}
