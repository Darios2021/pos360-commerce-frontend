// src/app/services/productVideos.service.js
// ✅ COPY-PASTE FINAL COMPLETO
// Backoffice (APP) - Videos de producto (ADMIN, con token via http.js)
//
// Endpoints reales:
//  GET    /api/v1/admin/products/:id/videos
//  POST   /api/v1/admin/products/:id/videos/youtube
//  POST   /api/v1/admin/products/:id/videos/upload   (multipart file)
//  DELETE /api/v1/admin/products/:id/videos/:videoId

import http from "../api/http";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function normList(data) {
  // tu backend devuelve {ok:true,data:[...]}
  const arr = data?.data;
  return Array.isArray(arr) ? arr : [];
}

export async function getAdminProductVideos(productId) {
  const pid = toInt(productId, 0);
  if (!pid) return [];
  const r = await http.get(`/admin/products/${pid}/videos`);
  return normList(r.data);
}

export async function addAdminProductYoutubeVideo(productId, payload = {}) {
  const pid = toInt(productId, 0);
  if (!pid) throw new Error("Invalid productId");

  // payload esperado típico: { url, title? }
  const r = await http.post(`/admin/products/${pid}/videos/youtube`, payload);
  return r.data;
}

export async function uploadAdminProductVideoFile(productId, file, extra = {}) {
  const pid = toInt(productId, 0);
  if (!pid) throw new Error("Invalid productId");
  if (!file) throw new Error("Missing file");

  const fd = new FormData();
  fd.append("file", file);

  // opcionales: title, sort_order, etc
  Object.entries(extra || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    fd.append(k, String(v));
  });

  const r = await http.post(`/admin/products/${pid}/videos/upload`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return r.data;
}

export async function deleteAdminProductVideo(productId, videoId) {
  const pid = toInt(productId, 0);
  const vid = toInt(videoId, 0);
  if (!pid || !vid) throw new Error("Invalid ids");

  const r = await http.delete(`/admin/products/${pid}/videos/${vid}`);
  return r.data;
}
