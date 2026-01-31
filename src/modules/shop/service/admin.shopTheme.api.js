import http from "@/app/api/http";

export async function getShopThemeAdmin() {
  const { data } = await http.get("/admin/shop/theme");
  if (!data || data.ok !== true) return null;
  return data.theme || null;
}

export async function updateShopThemeAdmin(payload) {
  const { data } = await http.put("/admin/shop/theme", payload || {});
  if (!data || data.ok !== true) return null;
  return data.theme || null;
}
