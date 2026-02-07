<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="mlx" variant="flat" rounded="lg">
    <!-- MEDIA -->
    <button class="mlx-media" type="button" @click="openProduct" :title="p?.name || ''">
      <img v-if="img" :src="img" alt="" loading="lazy" />
      <div v-else class="mlx-media-empty">Sin imagen</div>
    </button>

    <div class="mlx-body">
      <!-- TÍTULO (2 líneas fijas) -->
      <div class="mlx-title" :title="p?.name || ''">
        {{ capFirst(p?.name || "—") }}
      </div>

      <!-- MARCA + MODELO (1 línea fija) -->
      <div class="mlx-subtitle" :title="brandModel || ''">
        {{ brandModel || " " }}
      </div>

      <!-- ✅ BLOQUE PRECIOS (ALTURA HOMOGÉNEA) -->
      <div class="mlx-price-block">
        <!-- old price (1 línea fija, invisible si no aplica) -->
        <div class="mlx-old" :class="{ 'is-empty': !showOldPrice }">
          {{ showOldPrice ? `$ ${fmtMoney(oldPrice)}` : " " }}
        </div>

        <!-- price + off (1 línea fija) -->
        <div class="mlx-price-row">
          <div class="mlx-price">$ {{ fmtMoney(displayPrice) }}</div>
          <div class="mlx-off" v-if="offPct">{{ offPct }}% OFF</div>
        </div>

        <!-- installments (1 línea fija, invisible si no aplica) -->
        <div class="mlx-installments" :class="{ 'is-empty': !show3Installments }">
          <template v-if="show3Installments">
            En 3 cuotas de <b>$ {{ fmtMoney(installment3) }}</b>
          </template>
          <template v-else> </template>
        </div>
      </div>

      <!-- ✅ shipping (1 línea fija para homogeneidad, pero sin aire extra) -->
      <div class="mlx-ship" :class="{ 'is-empty': !shipText }">
        <template v-if="shipText">
          <span class="mlx-ship-free">Envío gratis</span>
          <span class="mlx-ship-bolt" v-if="shipBolt">⚡</span>
          <span class="mlx-ship-full" v-if="shipFull">FULL</span>
        </template>
        <template v-else> </template>
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

/* helpers */
function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}
function capFirst(s) {
  const str = String(s ?? "").trim();
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* media */
const img = computed(() => String(props.p?.image_url || "").trim());

/* brand + model */
const brandModel = computed(() => {
  const brand = props.p?.brand || props.p?.brand_name || props.p?.marca || "";
  const model = props.p?.model || props.p?.model_name || props.p?.modelo || "";
  return [String(brand).trim(), String(model).trim()].filter(Boolean).join(" · ");
});

/* prices */
const priceList = computed(() => toNum(props.p?.price_list));
const priceDiscount = computed(() => toNum(props.p?.price_discount));
const priceBase = computed(() => toNum(props.p?.price));

const displayPrice = computed(() => {
  if (priceDiscount.value > 0) return priceDiscount.value;
  if (priceList.value > 0) return priceList.value;
  return priceBase.value;
});

const oldPrice = computed(() => (priceList.value > 0 ? priceList.value : priceBase.value));

const showOldPrice = computed(() => {
  const d = priceDiscount.value;
  const o = oldPrice.value;
  return d > 0 && o > d;
});

const offPct = computed(() => {
  if (!showOldPrice.value) return 0;
  const o = oldPrice.value;
  const d = priceDiscount.value;
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
});

/* installments */
const INSTALLMENTS_MIN = 150000;
const installmentsBase = computed(() => (priceList.value > 0 ? priceList.value : oldPrice.value));
const show3Installments = computed(() => installmentsBase.value >= INSTALLMENTS_MIN);
const installment3 = computed(() => installmentsBase.value / 3);

/* shipping */
const shipFull = computed(() => Boolean(props.p?.is_full || props.p?.full || props.p?.shipping_full));
const shipFree = computed(() => Boolean(props.p?.free_shipping || props.p?.shipping_free || props.p?.is_free_shipping));
const shipBolt = computed(() => Boolean(props.p?.shipping_fast || props.p?.bolt || shipFull.value));
const shipText = computed(() => (shipFree.value || shipFull.value ? "ok" : ""));

/* nav */
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
/* =========================
   ML CARD – homogeneous + compact
   ========================= */
.mlx {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0,0,0,.10);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
}

/* media */
.mlx-media {
  width: 100%;
  height: 230px;
  background: #f4f4f4;
  cursor: pointer;
  border: 0;
  padding: 0;
  display: block;
}
.mlx-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mlx-media-empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: .55;
}

/* body */
.mlx-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

/* title */
.mlx-title {
  font-size: 14px;
  line-height: 1.18;
  font-weight: 400;
  color: #111;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  min-height: calc(1.18em * 2);
}

/* subtitle */
.mlx-subtitle {
  font-size: 12px;
  line-height: 1.1;
  color: rgba(0,0,0,.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.1em;
}

/* price block */
.mlx-price-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* old price */
.mlx-old {
  font-size: 12px;
  color: rgba(0,0,0,.55);
  text-decoration: line-through;
  min-height: 1.1em;
}
.mlx-old.is-empty { opacity: 0; }

/* price row */
.mlx-price-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: 10px;
}

/* ✅ precio: 1px más chico para que nunca choque */
.mlx-price {
  font-size: clamp(18px, 1.55vw, 21px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #111;
  line-height: 1;
  white-space: nowrap;
  min-width: 0;
}

/* ✅ OFF: bajalo un toque más */
.mlx-off {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: #00a650;
  background: rgba(0,166,80,.10);
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;

  margin-top: 4px; /* 👈 antes 2px */
}

/* installments */
.mlx-installments {
  font-size: 13px;
  color: #00a650;
  line-height: 1.12;
  min-height: 1.12em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mlx-installments.is-empty { opacity: 0; }

/* shipping */
.mlx-ship {
  font-size: 13px;
  color: #00a650;
  line-height: 1.12;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-height: 1.12em;
}
.mlx-ship.is-empty { opacity: 0; }
.mlx-ship-free { font-weight: 700; }
.mlx-ship-bolt { font-weight: 800; }
.mlx-ship-full { font-weight: 900; letter-spacing: 0.02em; }

/* ✅ Si la card está angosta, OFF abajo */
@media (max-width: 420px) {
  .mlx-price-row { grid-template-columns: 1fr; row-gap: 4px; }
  .mlx-off { justify-self: start; margin-top: 0; }
}

/* responsive media */
@media (max-width: 1200px) { .mlx-media { height: 215px; } }
@media (max-width: 960px)  { .mlx-media { height: 205px; } }
@media (max-width: 600px)  {
  .mlx-media { height: 190px; }
  .mlx-installments { white-space: normal; }
}
</style>

