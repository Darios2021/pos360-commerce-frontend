<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="ml-card" variant="flat" rounded="xl">
    <!-- Media (clickable) -->
    <button class="ml-media" type="button" @click="openProduct" :title="p?.name || ''">
      <img v-if="img" :src="img" alt="" loading="lazy" />
      <div v-else class="ml-media-empty">Sin imagen</div>
    </button>

    <div class="ml-body">
      <!-- Título -->
      <div class="ml-title" :title="p?.name || ''">
        {{ p?.name || "—" }}
      </div>

      <!-- Meta -->
      <div class="ml-meta" :title="metaText">
        {{ metaText }}
      </div>

      <!-- Precio + acción -->
      <div class="ml-foot">
        <div class="ml-price">$ {{ fmtMoney(priceValue(p)) }}</div>

        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="ml-btn"
          :disabled="disabledAdd"
          @click.stop="$emit('add', p)"
        >
          Agregar
        </v-btn>
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

defineEmits(["add"]);

const router = useRouter();
const route = useRoute();

const img = computed(() => String(props.p?.image_url || "").trim());

const metaText = computed(() => {
  const brand = String(props.p?.brand || "").trim();
  const model = String(props.p?.model || "").trim();
  const cat = String(props.p?.category_name || "").trim();
  const sub = String(props.p?.subcategory_name || "").trim();

  const parts = [];
  if (brand) parts.push(brand);
  if (model) parts.push(model);
  if (sub) parts.push(sub);
  else if (cat) parts.push(cat);

  return parts.length ? parts.join(" · ") : "—";
});

function priceValue(p) {
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

const disabledAdd = computed(() => {
  const p = props.p || {};
  return !!(p?.track_stock && Number(p?.stock_qty || 0) <= 0);
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
/* ================================
   ML style: compact + consistente
   ================================ */
.ml-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  overflow: hidden;
}

/* Hover solo desktop (no jode touch) */
@media (hover: hover) and (pointer: fine) {
  .ml-card:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.10);
  }
}

/* ====== Imagen (ML: alto fijo, NO cuadrado) ====== */
.ml-media {
  border: 0;
  padding: 10px;
  width: 100%;
  height: var(--media-h);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ml-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.ml-media-empty {
  font-size: 12px;
  opacity: 0.55;
}

/* ====== Body ====== */
.ml-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.ml-title {
  font-weight: 650;
  letter-spacing: -0.1px;
  line-height: 1.2;
  min-height: 2.4em; /* 2 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #111;
}

.ml-meta {
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ====== Footer ====== */
.ml-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ml-price {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.3px;
  color: #111;
  white-space: nowrap;
}

.ml-btn {
  border-radius: 12px;
  font-weight: 800;
  padding-inline: 12px;
  box-shadow: none !important;
  text-transform: none;
}

/* =========================
   Responsive heights (clave)
   ========================= */
.ml-card {
  --media-h: 190px; /* desktop */
}

@media (max-width: 1200px) {
  .ml-card { --media-h: 180px; }
  .ml-price { font-size: 19px; }
}

@media (max-width: 960px) {
  .ml-card { --media-h: 170px; }
  .ml-price { font-size: 18px; }
}

@media (max-width: 600px) {
  .ml-card { --media-h: 160px; }
  .ml-body { padding: 10px 10px 12px; gap: 6px; }
  .ml-price { font-size: 18px; }
}
</style>
