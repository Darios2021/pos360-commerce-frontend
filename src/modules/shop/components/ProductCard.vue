<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="ml-card" variant="flat" rounded="xl">
    <!-- ✅ Media FULL-WIDTH (cover) -->
    <button class="ml-media" type="button" @click="openProduct" :title="p?.name || ''">
      <img v-if="img" :src="img" alt="" loading="lazy" />
      <div v-else class="ml-media-empty">Sin imagen</div>
    </button>

    <div class="ml-body">
      <!-- ✅ Precio row (como ML) -->
      <div class="ml-price-row">
        <div class="ml-price">$ {{ fmtMoney(finalPrice) }}</div>

        <div class="ml-off" v-if="offPct">
          {{ offPct }}% OFF
        </div>
      </div>

      <div v-if="showOldPrice" class="ml-old">
        $ {{ fmtMoney(oldPrice) }}
      </div>

      <!-- ✅ Título -->
      <div class="ml-title" :title="p?.name || ''">
        {{ p?.name || "—" }}
      </div>

      <!-- ✅ Meta (categoría/sub) -->
      <div class="ml-meta" :title="metaText">
        {{ metaText }}
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const props = defineProps({
  p: { type: Object, required: true },
});

const router = useRouter();
const route = useRoute();

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

const img = computed(() => String(props.p?.image_url || "").trim());

const metaText = computed(() => {
  const cat = String(props.p?.category_name || "").trim();
  const sub = String(props.p?.subcategory_name || "").trim();
  const parts = [];
  if (cat) parts.push(cat);
  if (sub) parts.push(sub);
  return parts.length ? parts.join(" · ") : "—";
});

/* ✅ precios como ML */
const finalPrice = computed(() => {
  const d = toNum(props.p?.price_discount);
  if (d > 0) return d;

  const l = toNum(props.p?.price_list);
  if (l > 0) return l;

  return toNum(props.p?.price);
});

const oldPrice = computed(() => {
  const l = toNum(props.p?.price_list);
  const base = l > 0 ? l : toNum(props.p?.price);
  return base;
});

const showOldPrice = computed(() => {
  const d = toNum(props.p?.price_discount);
  const o = oldPrice.value;
  return d > 0 && o > d;
});

const offPct = computed(() => {
  if (!showOldPrice.value) return 0;
  const o = oldPrice.value;
  const d = toNum(props.p?.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
});

function openProduct() {
  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";
  router.push({
    name: "shopProduct",
    params: { id: String(props.p?.product_id ?? props.p?.id ?? "") },
    query: { branch_id },
  });
}
</script>

<style scoped>
.ml-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  overflow: hidden;
}

@media (hover: hover) and (pointer: fine) {
  .ml-card:hover {
    transform: translateY(-2px);
    border-color: rgba(0,0,0,.12);
    box-shadow: 0 10px 22px rgba(0,0,0,.10);
  }
}

.ml-media {
  border: 0;
  padding: 0;
  width: 100%;
  height: var(--media-h);
  background: #f7f7f7;
  cursor: pointer;
  display: block;
  position: relative;
}

.ml-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ml-media-empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: .55;
}

.ml-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.ml-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ml-price {
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.2px;
  color: #111;
  white-space: nowrap;

  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-off {
  font-size: 11px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
  line-height: 1;
  flex: 0 0 auto;
}

.ml-old {
  margin-top: -2px;
  font-size: 12px;
  opacity: .6;
  text-decoration: line-through;
}

.ml-title {
  margin-top: 4px;
  font-weight: 950;
  font-size: 13px;
  letter-spacing: .2px;
  text-transform: uppercase;
  line-height: 1.15;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #111;
}

.ml-meta {
  font-size: 11px;
  opacity: .65;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* responsive media height */
.ml-card { --media-h: 180px; }

@media (max-width: 1200px) {
  .ml-card { --media-h: 170px; }
  .ml-price { font-size: 19px; }
}

@media (max-width: 960px) {
  .ml-card { --media-h: 160px; }
  .ml-price { font-size: 18px; }
  .ml-off { font-size: 11px; }
}

/* ✅ FIX MOBILE: precio en 1 línea completa, OFF abajo (no tapa nunca) */
@media (max-width: 600px) {
  .ml-card { --media-h: 150px; }
  .ml-body { padding: 12px 12px 14px; }

  .ml-price-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .ml-price {
    flex: 0 0 auto;
    min-width: auto;
    overflow: visible;
    text-overflow: clip;
  }

  .ml-off {
    font-size: 10px;
    line-height: 1;
  }
}
</style>
