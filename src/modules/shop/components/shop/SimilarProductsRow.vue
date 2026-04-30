<!--
  SimilarProductsRow — "Productos similares" en el detalle del producto.
  Wrapper sobre ShopProductBlock para compartir el estándar visual del home.
  Mantiene la API original (title, items, loading, categoryId, subcategoryId).
-->
<template>
  <div v-if="loading || normalized.length" class="similar-wrap">
    <!-- Skeleton mientras carga inicial -->
    <div v-if="loading && !normalized.length" class="similar-skel">
      <v-skeleton-loader type="image, article" />
    </div>

    <!-- Bloque estándar -->
    <ShopProductBlock
      v-else-if="normalized.length"
      :title="title"
      :view-all-to="moreLink"
      :items="normalized"
      :page-size="6"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import ShopProductBlock from "@/modules/shop/components/ShopProductBlock.vue";

const props = defineProps({
  title:         { type: String, default: "Productos similares" },
  categoryId:    { type: [Number, String], default: null },
  subcategoryId: { type: [Number, String], default: null },
  items:         { type: Array, default: () => [] },
  loading:       { type: Boolean, default: false },
});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function uniqUrls(list) {
  const out = [];
  const seen = new Set();
  for (const u of list) {
    const s = String(u || "").trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}
function normalizeImages(raw) {
  const acc = [];
  const main = raw?.image_url || raw?.image || raw?.url || raw?.src || raw?.path || null;
  if (main) acc.push(main);
  if (Array.isArray(raw?.images)) {
    for (const it of raw.images) {
      const u = typeof it === "string" ? it : it?.url || it?.image_url || it?.src || it?.path;
      if (u) acc.push(u);
    }
  }
  if (Array.isArray(raw?.image_urls)) {
    for (const u of raw.image_urls) if (u) acc.push(u);
  }
  return uniqUrls(acc);
}
function normalizeProduct(raw) {
  const id = toInt(raw?.product_id ?? raw?.id, 0);
  if (!id) return null;
  const images = normalizeImages(raw);
  const image_url = images[0] || String(raw?.image_url || "").trim() || "";
  const price_discount = toNum(raw?.price_discount ?? raw?.discount_price ?? raw?.promo_price, 0);
  const price_list = toNum(raw?.price_list ?? raw?.list_price ?? raw?.price, 0);
  const track_stock =
    raw?.track_stock === true ||
    raw?.track_stock === 1 ||
    String(raw?.track_stock).toLowerCase() === "true";
  const stock_qty = toNum(raw?.stock_qty ?? raw?.qty ?? raw?.stock ?? 0, 0);
  const name = String(raw?.name ?? raw?.title ?? "").trim();
  if (!name) return null;
  return {
    product_id: id,
    id,
    name,
    description: raw?.description ?? "",
    category: raw?.category ?? null,
    category_name: raw?.category_name ?? raw?.category?.name ?? null,
    subcategory: raw?.subcategory ?? null,
    subcategory_name: raw?.subcategory_name ?? raw?.subcategory?.name ?? null,
    category_id: raw?.category_id ?? null,
    subcategory_id: raw?.subcategory_id ?? null,
    image_url,
    images,
    price_discount,
    price_list,
    track_stock,
    stock_qty,
  };
}

const normalized = computed(() => {
  const arr = Array.isArray(props.items) ? props.items : [];
  const out = [];
  const seen = new Set();
  for (const raw of arr) {
    const p = normalizeProduct(raw);
    if (!p) continue;
    if (seen.has(p.product_id)) continue;
    seen.add(p.product_id);
    if (!p.price_list && !p.price_discount) continue;
    out.push(p);
  }
  return out.slice(0, 24);
});

const moreLink = computed(() => {
  const cid = Number(props.categoryId || 0);
  const sid = Number(props.subcategoryId || 0);
  if (!cid) return "/shop";
  if (sid) return `/shop/c/${cid}?sub=${sid}`;
  return `/shop/c/${cid}`;
});
</script>

<style scoped>
.similar-wrap {
  margin-top: 18px;
}
.similar-skel {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 320px;
}
</style>
