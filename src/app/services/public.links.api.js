// ✅ COPY-PASTE FINAL COMPLETO
// src/app/services/public.links.api.js
// Público: links visibles en la tienda (NO requiere JWT)

import axios from "axios";

function normalizeBaseURL(raw) {
  let base = String(raw || "").trim();

  if (!base) base = "/api/v1";

  base = base.replace(/\/+$/, "");
  base = base.replace(/\/api\/v1\/api\/v1$/i, "/api/v1");

  const isAbsolute = /^https?:\/\//i.test(base);
  const endsWithV1 = /\/api\/v1$/i.test(base);

  if (isAbsolute && !endsWithV1) base = `${base}/api/v1`;
  if (!isAbsolute && !endsWithV1) base = `${base}/api/v1`;

  base = base.replace(/([^:]\/)\/+/g, "$1");
  return base;
}

const http = axios.create({
  baseURL: normalizeBaseURL(import.meta.env.VITE_API_BASE_URL || ""),
  timeout: 20000,
});

// GET /api/v1/public/links
export async function publicListLinks(params = {}) {
  const { data } = await http.get("/public/links", { params });
  return data;
}
