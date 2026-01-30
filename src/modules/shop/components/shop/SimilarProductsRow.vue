<!-- ✅ COPY-PASTE FINAL COMPLETO (sin v-else roto + mobile ML) -->
<!-- src/modules/shop/components/SimilarProductsRow.vue -->
<template>
  <section class="similar-wrap">
    <div class="head">
      <div class="text-subtitle-1 font-weight-bold">{{ title }}</div>

      <v-btn
        v-if="normalized.length && categoryId"
        :to="moreLink"
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

        <div v-else-if="!normalized.length" class="empty">
          No encontramos productos similares.
        </div>

        <div v-else>
          <v-slide-group class="slide desktop-only" show-arrows="hover">
            <v-slide-group-item v-for="p in normalized" :key="p.product_id">
              <div class="item desktop-item">
                <ProductCard :p="p" />
              </div>
            </v-slide-group-item>
          </v-slide-group>

          <div class="mobile-only scroller" role="list">
            <div
              v-for="p in normalized"
              :key="'m' + p.product_id"
              class="item mobile-item"
              role="listitem"
            >
              <ProductCard :p="p" />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </section>
</template>

<script setup>
import { computed } from "vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";

const props = defineProps({
  title: { type: String, default: "Productos similares" },
  categoryId: { type: [Number, String], default: null },
  subcategoryId: { type: [Number, String], default: null },
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
    product_id: id,
    id,
    name,
    description: raw?.description ?? "",
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
  return out.slice(0, 12);
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
.similar-wrap { margin-top: 18px; }

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 6px 2px 10px;
}
.more-btn { text-transform: none; border-radius: 999px; font-weight: 900; }

.similar-card { overflow: hidden; border-color: rgba(0, 0, 0, 0.08); }

.slide :deep(.v-slide-group__content) {
  padding: 6px 2px 12px;
  scroll-snap-type: x mandatory;
}
.slide :deep(.v-slide-group__content > *) { scroll-snap-align: start; }

.item { width: 260px; padding: 0 10px; }
@media (max-width: 1200px) { .item { width: 240px; } }
@media (max-width: 900px) { .item { width: 220px; } }

.scroller {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 2px 12px;
  scroll-snap-type: x mandatory;
}
.scroller::-webkit-scrollbar { height: 0; }
.mobile-item { scroll-snap-align: start; }

@media (max-width: 520px) {
  .item { width: 178px; padding: 0; }
  .scroller { padding-left: 6px; padding-right: 6px; }
}

.desktop-only { display: block; }
.mobile-only { display: none; }
@media (max-width: 600px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
}

.empty { padding: 14px 6px; color: rgba(0, 0, 0, 0.62); }

/* Skeleton */
.row { display: flex; gap: 14px; overflow: hidden; padding: 6px 2px 12px; }
.skel {
  width: 260px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
}
@media (max-width: 1200px) { .skel { width: 240px; } }
@media (max-width: 900px) { .skel { width: 220px; } }
@media (max-width: 520px) { .skel { width: 178px; } }

.skel-img { height: 150px; border-radius: 14px; background: rgba(0, 0, 0, 0.08); animation: pulse 1.2s ease-in-out infinite; }
.skel-line { height: 12px; border-radius: 999px; background: rgba(0, 0, 0, 0.08); margin-top: 12px; animation: pulse 1.2s ease-in-out infinite; }
.w70 { width: 70%; }
.w45 { width: 45%; }
.skel-foot { display: flex; justify-content: flex-end; margin-top: 14px; }
.skel-pill { width: 96px; height: 34px; border-radius: 999px; background: rgba(0, 0, 0, 0.08); animation: pulse 1.2s ease-in-out infinite; }

@keyframes pulse {
  0% { opacity: 0.55; }
  50% { opacity: 0.95; }
  100% { opacity: 0.55; }
}
</style>
