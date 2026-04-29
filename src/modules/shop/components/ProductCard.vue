<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="mlx" variant="flat" rounded="lg">
    <!-- MEDIA -->
    <button class="mlx-media" type="button" @click="openProduct" :title="p?.name || ''">
      <img v-if="img" :src="img" alt="" loading="lazy" />
      <div v-else class="mlx-media-empty">Sin imagen</div>

      <!-- Badges (esquina superior izquierda apilados) -->
      <div class="mlx-badge-stack">
        <span v-if="isKit" class="mlx-kit-badge" :title="`Kit con ${kitItemsCount} productos`">
          <v-icon size="11">mdi-package-variant</v-icon>
          KIT<span v-if="kitItemsCount" class="mlx-kit-badge-count"> · {{ kitItemsCount }}</span>
        </span>
        <span v-if="promoActive" class="mlx-promo-badge">PROMO</span>
      </div>

      <!-- Hint promo por cantidad — overlay flotante sobre la imagen -->
      <span v-if="qtyPromoHint" class="mlx-qty-promo-overlay">
        <v-icon size="11">mdi-tag-multiple</v-icon>
        {{ qtyPromoHint }}
      </span>

      <!-- Favorito: corazón flotante esquina superior derecha.
           - Sin sesión → manda a login.
           - Sesión incompleta → el dialog bloqueante ya está encima.
           - Logueado y completo → toggle real contra la API. -->
      <button
        type="button"
        class="mlx-fav-btn"
        :class="{ 'is-fav': isFav }"
        :aria-label="isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        :title="isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        :disabled="favBusy"
        @click.stop="onToggleFavorite"
      >
        <v-icon size="18">
          {{ isFav ? 'mdi-heart' : 'mdi-heart-outline' }}
        </v-icon>
      </button>
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
        <!-- old price -->
        <div class="mlx-old" :class="{ 'is-empty': !showOldPrice }">
          {{ showOldPrice ? `$ ${fmtMoney(oldPrice)}` : " " }}
        </div>

        <!-- price + off -->
        <div class="mlx-price-row">
          <div class="mlx-price" :class="{ 'is-promo': promoActive }">$ {{ fmtMoney(displayPrice) }}</div>
          <div class="mlx-off" v-if="offPct" :class="{ 'is-promo': promoActive }">{{ offPct }}% OFF</div>
        </div>

        <!-- installments -->
        <div class="mlx-installments" :class="{ 'is-empty': !show3Installments }">
          <template v-if="show3Installments">
            En 3 cuotas de <b>$ {{ fmtMoney(installment3) }}</b>
          </template>
          <template v-else> </template>
        </div>
      </div>

      <!-- shipping -->
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
import { computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { isPromoActive } from "@/modules/shop/utils/promo";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";
import { useShopFavoritesStore } from "@/modules/shop/service/shopFavorites.store";

const props = defineProps({
  p: { type: Object, required: true },
});

const router = useRouter();
const route = useRoute();
const auth = useShopAuthStore();
const favs = useShopFavoritesStore();

const productId = computed(() => Number(props.p?.product_id ?? props.p?.id ?? 0));
const isFav = computed(() => productId.value > 0 && favs.isFavorite(productId.value));
const favBusy = ref(false);

onMounted(() => {
  // Si ya estamos logueados, asegurarnos de tener el set cacheado.
  if (auth.isLogged && !favs.booted && !favs.loading) {
    favs.fetch();
  }
});

async function onToggleFavorite() {
  if (favBusy.value) return;

  // Sin sesión → al login (devolvemos donde estábamos)
  if (!auth.isLogged) {
    router.push({
      name: "shopLogin",
      query: { redirect: route.fullPath },
    });
    return;
  }

  // Logueado pero perfil incompleto: el ShopCompleteProfileDialog
  // ya está montado y bloqueando — solo bailamos del click.
  if (!auth.isProfileComplete) return;

  if (!productId.value) return;
  favBusy.value = true;
  try {
    await favs.toggle(productId.value);
  } finally {
    favBusy.value = false;
  }
}

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
const promoPrice = computed(() => toNum(props.p?.promo_price));

const displayPrice = computed(() => {
  // 1) Promo por tiempo activa → manda
  if (promoActive.value && promoPrice.value > 0) return promoPrice.value;
  if (priceDiscount.value > 0) return priceDiscount.value;
  if (priceList.value > 0) return priceList.value;
  return priceBase.value;
});

const oldPrice = computed(() => (priceList.value > 0 ? priceList.value : priceBase.value));

const showOldPrice = computed(() => {
  // Si hay promo activa, comparar contra precio lista
  if (promoActive.value && promoPrice.value > 0) {
    return oldPrice.value > promoPrice.value;
  }
  const d = priceDiscount.value;
  const o = oldPrice.value;
  return d > 0 && o > d;
});

const offPct = computed(() => {
  if (!showOldPrice.value) return 0;
  const o = oldPrice.value;
  const d = displayPrice.value;
  if (o <= 0 || d <= 0 || o <= d) return 0;
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
});

/* hint promo por cantidad — texto compacto para chip flotante */
const qtyPromoHint = computed(() => {
  if (!promoActive.value) return "";
  const thr = Number(props.p?.promo_qty_threshold) || 0;
  const disc = toNum(props.p?.promo_qty_discount);
  const mode = String(props.p?.promo_qty_mode || "").toLowerCase();
  if (thr < 2 || disc <= 0) return "";
  if (mode === "percent") {
    return `${thr}+ unid · ${disc}% OFF`;
  }
  return `${thr}+ unid · -$${fmtMoney(disc)}`;
});

/* installments */
const INSTALLMENTS_MIN = 150000;
const installmentsBase = computed(() => (priceList.value > 0 ? priceList.value : oldPrice.value));
const show3Installments = computed(() => installmentsBase.value >= INSTALLMENTS_MIN);
const installment3 = computed(() => installmentsBase.value / 3);

/* promo activa (respeta ventana temporal si está definida) */
const promoActive = computed(() => isPromoActive(props.p));

/* kit / combo */
const isKit = computed(() => {
  const v = props.p?.is_kit;
  return v === true || Number(v) === 1;
});
const kitItemsCount = computed(() => {
  const arr = props.p?.kit_items || props.p?.kitItems;
  return Array.isArray(arr) ? arr.length : 0;
});

/* shipping */
const shipFull = computed(() => Boolean(props.p?.is_full || props.p?.full || props.p?.shipping_full));
const shipFree = computed(() => Boolean(props.p?.free_shipping || props.p?.shipping_free || props.p?.is_free_shipping));
const shipBolt = computed(() => Boolean(props.p?.shipping_fast || props.p?.bolt || shipFull.value));
const shipText = computed(() => (shipFree.value || shipFull.value ? "ok" : ""));

/* scroll snapshot manual antes de navegar */
const SCROLL_KEY = "scroll_positions_v2";

function saveCurrentScrollSnapshot() {
  try {
    const fullPath = route.fullPath || (window.location.pathname + window.location.search + window.location.hash);
    const raw = sessionStorage.getItem(SCROLL_KEY) || "{}";
    const map = JSON.parse(raw);

    map[fullPath] = {
      top: window.scrollY || 0,
      left: window.scrollX || 0,
    };

    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
  } catch {}
}

/* nav */
function openProduct() {
  saveCurrentScrollSnapshot();

  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";

  router.push({
    name: "shopProduct",
    params: { id: String(props.p?.product_id ?? props.p?.id ?? "") },
    query: { branch_id },
  });
}
</script>

<style scoped>
.mlx {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  position: relative;
}
.mlx:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.10);
  border-color: rgba(0, 0, 0, 0.14);
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
  position: relative;
  overflow: hidden;
}
.mlx-media img {
  transition: transform 0.4s ease;
}
.mlx:hover .mlx-media img {
  transform: scale(1.04);
}

/* badges apilados (esquina superior izquierda) */
.mlx-badge-stack {
  position: absolute;
  top: 8px; left: 8px;
  display: flex; flex-direction: column; gap: 5px;
  z-index: 1;
  align-items: flex-start;
}

/* badge KIT — violeta */
.mlx-kit-badge {
  display: inline-flex; align-items: center; gap: 3px;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  color: #fff;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.5px;
  padding: 4px 9px;
  border-radius: 4px;
  box-shadow: 0 3px 8px rgba(124, 58, 237, 0.45);
  text-transform: uppercase;
}
.mlx-kit-badge-count { opacity: 0.9; font-weight: 600; }

/* badge PROMO — bordó destacado */
.mlx-promo-badge {
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  color: #fff;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.7px;
  padding: 4px 10px;
  border-radius: 4px;
  box-shadow: 0 3px 8px rgba(255, 87, 34, 0.45);
  text-transform: uppercase;
}

/* hint promo por cantidad — chip flotante compacto sobre la imagen */
.mlx-qty-promo-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1px;
  color: #fff;
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  border-radius: 999px;
  padding: 3px 8px;
  line-height: 1.1;
  box-shadow: 0 3px 8px rgba(255, 87, 34, 0.40);
  z-index: 1;
  white-space: nowrap;
}
.mlx-qty-promo-overlay .v-icon { opacity: 0.9; }

/* Favorito flotante esquina superior derecha — visible solo en hover.
   Si el producto ya es favorito, se muestra siempre (para feedback). */
.mlx-fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  color: rgba(0, 0, 0, 0.55);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    color 0.15s ease,
    background 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  /* Oculto por default — aparece al hover de la card */
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
  pointer-events: none;
}
.mlx:hover .mlx-fav-btn,
.mlx-fav-btn:focus-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
/* Si ya es favorito, siempre visible */
.mlx-fav-btn.is-fav {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
  color: #e11d48;
  background: #fff;
}
.mlx-fav-btn:hover { color: #e11d48; }
.mlx-fav-btn.is-fav:hover { color: #be123c; }
.mlx-fav-btn:active { transform: scale(0.92); }
.mlx-fav-btn:disabled { opacity: 0.6 !important; cursor: wait; }

/* Mobile: en touch no hay hover, lo dejamos siempre visible */
@media (hover: none) {
  .mlx-fav-btn {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
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
  line-height: 1.22;
  font-weight: 500;
  color: #111;
  letter-spacing: -0.005em;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  min-height: calc(1.22em * 2);
}

/* subtitle: marca · modelo */
.mlx-subtitle {
  font-size: 11.5px;
  line-height: 1.1;
  color: rgba(0,0,0,.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.1em;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: uppercase;
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

.mlx-price {
  font-size: clamp(20px, 1.6vw, 23px);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #111;
  line-height: 1;
  white-space: nowrap;
  min-width: 0;
}
.mlx-price.is-promo { color: #ff5722; }

.mlx-off {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: #00a650;
  background: rgba(0,166,80,.12);
  border-radius: 4px;
  padding: 3px 7px;
  white-space: nowrap;
  margin-top: 4px;
  letter-spacing: 0.02em;
}
.mlx-off.is-promo {
  color: #fff;
  background: #ff5722;
  font-weight: 600;
  letter-spacing: 0.3px;
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
.mlx-ship-free { font-weight: 400; }
.mlx-ship-bolt { font-weight: 500; }
.mlx-ship-full { font-weight: 500; letter-spacing: 0.02em; }

@media (max-width: 420px) {
  .mlx-price-row { grid-template-columns: 1fr; row-gap: 4px; }
  .mlx-off { justify-self: start; margin-top: 0; }
}

@media (max-width: 1200px) { .mlx-media { height: 215px; } }
@media (max-width: 960px)  { .mlx-media { height: 205px; } }
@media (max-width: 600px)  {
  .mlx-media { height: 190px; }
  .mlx-installments { white-space: normal; }
}
</style>