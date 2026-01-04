<!-- src/modules/shop/components/SimilarProductsRow.vue -->
<template>
  <section class="similar-wrap">
    <div class="head">
      <div class="text-subtitle-1 font-weight-bold">Productos similares</div>

      <v-btn
        v-if="normalized.length"
        to="/shop"
        variant="tonal"
        size="small"
        class="more-btn"
      >
        Ver más
        <v-icon end size="18">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-card variant="outlined" class="rounded-xl similar-card">
      <v-card-text class="py-4">
        <!-- Loading skeleton -->
        <div v-if="loading" class="row">
          <div v-for="i in 8" :key="i" class="skel">
            <div class="skel-img"></div>
            <div class="skel-line w70"></div>
            <div class="skel-line w45"></div>
            <div class="skel-foot">
              <div class="skel-pill"></div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!normalized.length" class="empty">
          No encontramos productos similares.
        </div>

        <!-- Horizontal row (ML style) -->
        <v-slide-group
          v-else
          show-arrows
          class="slide"
        >
          <v-slide-group-item
            v-for="p in normalized"
            :key="p.product_id"
          >
            <div class="item">
              <!-- ✅ FIX: ProductCard espera prop "p" -->
              <ProductCard :p="p" />
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>
  </section>
</template>

<script setup>
import { computed } from "vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
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
    if (!s) continue;
    if (seen.has(s)) continue;
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
    // ✅ adaptado a tu UI (ProductCard / Shop)
    product_id: id,
    id,
    name,
    description: raw?.description ?? "",
    brand: raw?.brand ?? "",
    model: raw?.model ?? "",

    category_id: raw?.category_id ?? null,
    subcategory_id: raw?.subcategory_id ?? null,

    image_url,
    images,

    price_discount,
    price_list,

    track_stock,
    stock_qty,

    is_new: !!raw?.is_new,
    is_promo: !!raw?.is_promo,
    is_active: raw?.is_active ?? true,
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

    // evita $0
    if (!p.price_list && !p.price_discount) continue;

    out.push(p);
  }

  return out.slice(0, 12);
});
</script>

<style scoped>
.similar-wrap {
  margin-top: 18px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 6px 2px 10px;
}

.more-btn {
  text-transform: none;
  border-radius: 12px;
}

.similar-card {
  overflow: hidden;
}

/* Slide row */
.slide :deep(.v-slide-group__content) {
  padding: 6px 2px 12px;
  scroll-snap-type: x mandatory; /* ✅ feel “ML” */
}

.slide :deep(.v-slide-group__content > *) {
  scroll-snap-align: start;
}

/* ✅ ancho responsive (desktop/tablet/mobile) */
.item {
  width: 260px;
  padding: 0 10px;
}

@media (max-width: 1200px) {
  .item { width: 240px; }
}
@media (max-width: 900px) {
  .item { width: 220px; }
}
@media (max-width: 520px) {
  .item { width: 190px; padding: 0 8px; }
}

.empty {
  padding: 14px 6px;
  color: rgba(0, 0, 0, 0.62);
}

/* Skeleton */
.row {
  display: flex;
  gap: 14px;
  overflow: hidden;
  padding: 6px 2px 12px;
}
.skel {
  width: 260px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
}
@media (max-width: 1200px) { .skel { width: 240px; } }
@media (max-width: 900px)  { .skel { width: 220px; } }
@media (max-width: 520px)  { .skel { width: 190px; } }

.skel-img {
  height: 150px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.08);
  animation: pulse 1.2s ease-in-out infinite;
}
.skel-line {
  height: 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  margin-top: 12px;
  animation: pulse 1.2s ease-in-out infinite;
}
.w70 { width: 70%; }
.w45 { width: 45%; }
.skel-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.skel-pill {
  width: 96px;
  height: 34px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0% { opacity: .55; }
  50% { opacity: .95; }
  100% { opacity: .55; }
}
</style>
