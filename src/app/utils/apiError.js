// src/app/utils/apiError.js
export function normalizeApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  // Si backend devolvió HTML (a veces express default), intentamos texto.
  const isHtmlString = typeof data === "string" && /<html|<!doctype/i.test(data);

  const message =
    (data && typeof data === "object" && (data.message || data.error)) ||
    (isHtmlString ? "Error interno (el servidor devolvió HTML). Revisá logs del backend." : null) ||
    err?.message ||
    "Error desconocido";

  const code = (data && typeof data === "object" && data.code) || "ERROR";
  const errors = (data && typeof data === "object" && Array.isArray(data.errors) && data.errors) || [];

  return {
    ok: false,
    status,
    code,
    message,
    errors, // [{field,message}]
    raw: data,
  };
}
