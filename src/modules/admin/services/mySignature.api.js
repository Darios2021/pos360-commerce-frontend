// src/modules/admin/services/mySignature.api.js
//
// Firma personal del usuario logueado para el CRM email.
// Endpoints (montados bajo /api/v1/me):
//   GET    /me/signature           → { item: {...} | null }
//   PUT    /me/signature           → upsert de los campos de texto
//   POST   /me/signature/photo     → multipart file
//   DELETE /me/signature/photo

import http from "@/app/api/http";

export async function getMySignature() {
  const r = await http.get("/me/signature");
  return r.data?.item || null;
}

export async function updateMySignature(payload = {}) {
  const r = await http.put("/me/signature", payload);
  return r.data?.item || null;
}

export async function uploadMySignaturePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await http.post("/me/signature/photo", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data?.item || null;
}

export async function deleteMySignaturePhoto() {
  const r = await http.delete("/me/signature/photo");
  return r.data?.item || null;
}
