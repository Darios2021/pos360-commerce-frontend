// Helpers de promociones del shop.
// Único lugar donde decidimos si la promo de un producto está vigente.

export function isPromoActive(p) {
  if (!p?.is_promo) return false;
  const now = new Date();
  const s = p?.promo_starts_at ? new Date(p.promo_starts_at) : null;
  const e = p?.promo_ends_at ? new Date(p.promo_ends_at) : null;
  if (s && Number.isFinite(s.getTime()) && now < s) return false;
  if (e && Number.isFinite(e.getTime()) && now > e) return false;
  return true;
}
