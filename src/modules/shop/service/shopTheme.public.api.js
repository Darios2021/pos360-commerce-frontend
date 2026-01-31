// src/modules/shop/service/shopTheme.public.api.js
// ✅ COPY-PASTE FINAL COMPLETO
// GET /api/v1/public/theme  => { ok:true, theme:{ primary, secondary } }

import httpPublic from "@/app/api/httpPublic";

export async function getShopThemePublic() {
  const { data } = await httpPublic.get("/public/theme");
  if (!data || data.ok !== true) return null;
  return data.theme || null;
}
