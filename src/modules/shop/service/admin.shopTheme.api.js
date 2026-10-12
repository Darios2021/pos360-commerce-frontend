import http from "@/app/api/http";

export async function getShopThemeAdmin() {
  const { data } = await http.get("/admin/shop/theme");
  if (!data || data.ok !== true) return null;
  return data.theme || null;
}

// Tema con el detalle de fábrica: { theme, defaults, predeterminado }.
export async function getShopThemeAdminFull() {
  const { data } = await http.get("/admin/shop/theme");
  if (!data || data.ok !== true) return null;
  return data;
}

export async function updateShopThemeAdmin(payload) {
  const { data } = await http.put("/admin/shop/theme", payload || {});
  if (!data || data.ok !== true) return null;
  return data.theme || null;
}

export async function updateShopThemeAdminFull(payload) {
  const { data } = await http.put("/admin/shop/theme", payload || {});
  if (!data || data.ok !== true) return null;
  return data;
}
