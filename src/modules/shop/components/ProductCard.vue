<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="mlx" variant="flat" rounded="lg">
    <!-- MEDIA — link nativo: middle/right click abre nueva pestaña; left click usa SPA -->
    <router-link
      :to="productLocation"
      custom
      v-slot="{ href }"
    >
      <a
        :href="href"
        class="mlx-media"
        :title="p?.name || ''"
        @click="openProduct"
      >
        <img v-if="img" :src="img" alt="" loading="lazy" />
        <div v-else class="mlx-media-empty">Sin imagen</div>

        <!-- Badges flotantes esquina superior izquierda. -->
        <div class="mlx-badge-stack">
          <span v-if="isKit" class="mlx-kit-badge" :title="`Kit con ${kitItemsCount} productos`">
            <v-icon size="11">mdi-package-variant</v-icon>
            KIT<span v-if="kitItemsCount" class="mlx-kit-badge-count"> · {{ kitItemsCount }}</span>
          </span>
          <span v-if="promoActive" class="mlx-promo-badge">PROMO</span>
        </div>

        <span v-if="qtyPromoHint" class="mlx-qty-promo-overlay">
          <v-icon size="11">mdi-tag-multiple</v-icon>
          {{ qtyPromoHint }}
        </span>
      </a>
    </router-link>

    <!-- Favorito: button absoluto FUERA del link para que no sea un button anidado -->
    <button
      type="button"
      class="mlx-fav-btn"
      :class="{ 'is-fav': isFav }"
      :aria-label="isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'"
      :title="isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'"
      :disabled="favBusy"
      @click.stop.prevent="onToggleFavorite"
    >
      <v-icon size="18">
        {{ isFav ? 'mdi-heart' : 'mdi-heart-outline' }}
      </v-icon>
    </button>

    <!-- BODY — también es link nativo -->
    <router-link
      :to="productLocation"
      custom
      v-slot="{ href }"
    >
      <a :href="href" class="mlx-body" @click="openProduct">
      <!-- ✅ PRECIO ARRIBA (estilo seguridad electrónica) -->
      <div class="mlx-price-row">
        <div class="mlx-price" :class="{ 'is-promo': promoActive }">$ {{ fmtMoney(displayPrice) }}</div>
        <div class="mlx-off" v-if="offPct" :class="{ 'is-promo': promoActive }">{{ offPct }}% OFF</div>
      </div>

      <!-- old price tachado debajo -->
      <div class="mlx-old" :class="{ 'is-empty': !showOldPrice }">
        {{ showOldPrice ? `$ ${fmtMoney(oldPrice)}` : " " }}
      </div>

      <!-- TÍTULO en mayúsculas, fino -->
      <div class="mlx-title" :title="p?.name || ''">
        {{ (p?.name || "—").toUpperCase() }}
      </div>

      <!-- Categoría / subcategoría en líneas separadas -->
      <div v-if="categoryName" class="mlx-cat" :title="categoryName">{{ categoryName }}</div>
      <div v-if="subcategoryName" class="mlx-sub" :title="subcategoryName">{{ subcategoryName }}</div>

      <!-- Spacer empuja el footer hacia abajo si la card es alta -->
      <div class="mlx-spacer"></div>

      <!-- Footer info: cuotas o aviso genérico -->
      <div class="mlx-foot">
        <div v-if="show3Installments" class="mlx-installments">
          En 3 cuotas de <b>$ {{ fmtMoney(installment3) }}</b>
        </div>
        <div v-else-if="installmentsAny" class="mlx-installments mlx-installments--soft">
          Hasta {{ installmentsAny }} cuotas
        </div>
        <div v-if="shipText" class="mlx-ship">
          <span class="mlx-ship-free">Envío gratis</span>
          <span class="mlx-ship-bolt" v-if="shipBolt">⚡</span>
          <span class="mlx-ship-full" v-if="shipFull">FULL</span>
        </div>
      </div>
      </a>
    </router-link>
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

/* breadcrumb categoría · subcategoría (estilo Seguridad Electrónica) */
const categoryBreadcrumb = computed(() => {
  const cat = (props.p?.category?.name || props.p?.category_name || props.p?.rubro || "").toString().trim();
  const sub = (props.p?.subcategory?.name || props.p?.subcategory_name || "").toString().trim();
  const parts = [cat, sub].filter(Boolean);
  if (!parts.length) return brandModel.value;
  return parts.join(" · ").toUpperCase();
});

const categoryName = computed(() => {
  const cat = (props.p?.category?.name || props.p?.category_name || props.p?.rubro || "").toString().trim();
  return cat ? cat.toUpperCase() : "";
});
const subcategoryName = computed(() => {
  const sub = (props.p?.subcategory?.name || props.p?.subcategory_name || "").toString().trim();
  return sub ? sub.toUpperCase() : "";
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
/* Cuando NO calificamos para 3 cuotas pero sí para algún plan general */
const installmentsAny = computed(() => {
  const max = Number(props.p?.max_installments || props.p?.installments_max || 0);
  if (max >= 2 && max <= 24) return max;
  return 0;
});

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
import { buildProductLocation } from "@/modules/shop/utils/productSlug";

const productLocation = computed(
  () =>
    buildProductLocation(props.p, {
      branchId: route.query.branch_id || "3",
    }) || { name: "shopProduct", params: { id: "" } }
);

function openProduct(e) {
  // El click izquierdo va por el router (SPA). Middle-click y right-click
  // los maneja el navegador nativamente al ser un <a> con href real.
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
  saveCurrentScrollSnapshot();

  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";

  const loc = buildProductLocation(props.p, { branchId: branch_id });
  if (loc) router.push(loc);
}
</script>

<style scoped>
.mlx {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
  position: relative;
}
.mlx:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.10);
  border-color: rgba(0, 0, 0, 0.10);
  transform: translateY(-2px);
}

/* media — fondo blanco con padding interno (foto centrada estilo ML)
   Es un <a> link nativo: text-decoration none + color inherit. */
.mlx-media {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  max-height: 260px;
  background: #fff;
  cursor: pointer;
  border: 0;
  padding: 0;
  display: block;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}
.mlx-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #fff;
  display: block;
  padding: 0;
  transition: transform 0.4s ease;
}
.mlx:hover .mlx-media img {
  transform: scale(1.05);
}

/* badges apilados (esquina superior izquierda) */
.mlx-badge-stack {
  position: absolute;
  top: 8px; left: 8px;
  display: flex; flex-direction: column; gap: 5px;
  z-index: 1;
  align-items: flex-start;
}

/* badge KIT — violeta pill */
.mlx-kit-badge {
  display: inline-flex; align-items: center; gap: 3px;
  background: #7c3aed;
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 5px 11px;
  border-radius: 999px;
  text-transform: uppercase;
}
.mlx-kit-badge-count { opacity: 0.9; font-weight: 600; }

/* badge PROMO — naranja pill */
.mlx-promo-badge {
  background: #ff5722;
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.7px;
  padding: 5px 12px;
  border-radius: 999px;
  text-transform: uppercase;
}

/* badge DESCUENTO — verde pill estilo Seguridad Electrónica */
.mlx-discount-badge {
  background: #00a650;
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 5px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 166, 80, 0.25);
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

/* Favorito flotante esquina superior derecha — color brand del header.
   Desktop: aparece al hover de la card.
   Si ya es favorito o en mobile: siempre visible. */
.mlx-fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  /* Oculto por default en desktop — aparece al hover de la card */
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
.mlx-fav-btn:hover {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-color: rgb(var(--v-theme-primary));
}
/* Si ya es favorito, siempre visible y lleno con color brand */
.mlx-fav-btn.is-fav {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(20, 136, 209, 0.35);
}
.mlx-fav-btn.is-fav:hover {
  background: rgb(var(--v-theme-primary));
  filter: brightness(0.92);
}
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
.mlx-media-empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: .55;
}

/* body — orden: precio arriba, título abajo (estilo Seguridad Electrónica)
   Es un <a> link nativo: text-decoration none + color inherit. */
.mlx-body {
  padding: 12px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.mlx-body:hover { color: inherit; }

/* title — UPPERCASE FINO (peso 400) */
.mlx-title {
  margin-top: 10px;
  font-size: 12.5px;
  line-height: 1.3;
  font-weight: 400;
  color: #1a1a1a;
  letter-spacing: 0.015em;
  text-transform: uppercase;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  min-height: calc(1.3em * 2);
}

/* Categoría — primera línea */
.mlx-cat {
  font-size: 10px;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-top: 6px;
}

/* Subcategoría — segunda línea, más tenue */
.mlx-sub {
  font-size: 10px;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  letter-spacing: 0.05em;
  margin-top: 1px;
}

/* Spacer empuja el footer hacia abajo */
.mlx-spacer { flex: 1; min-height: 8px; }

/* Footer: cuotas + envío */
.mlx-foot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
}

/* price row — precio + % OFF en LA MISMA línea, sin wrap */
.mlx-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.mlx-price {
  font-size: clamp(15px, 1.3vw, 20px);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #1a1a1a;
  line-height: 1.05;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
}
.mlx-price.is-promo { color: #ff5722; }

/* % OFF — verde sin fondo, solo texto bold (estilo SE) */
.mlx-off {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: #00a650;
  white-space: nowrap;
  letter-spacing: 0;
  flex-shrink: 0;
}
.mlx-off.is-promo { color: #ff5722; }

/* old price — debajo del precio actual, tachado, gris */
.mlx-old {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.42);
  text-decoration: line-through;
  min-height: 1.1em;
  font-weight: 500;
  margin-top: 1px;
}
.mlx-old.is-empty { opacity: 0; min-height: 1.1em; }

/* installments — verde */
.mlx-installments {
  font-size: 12px;
  color: #00a650;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}
.mlx-installments b {
  font-weight: 700;
  color: #00a650;
}
/* Variante "soft": cuando no es el descuento real, sino "hasta X cuotas" */
.mlx-installments--soft {
  color: rgba(0, 0, 0, 0.5);
  font-weight: 400;
}

/* shipping — "Envío gratis" verde bold + FULL pill verde */
.mlx-ship {
  font-size: 12px;
  color: #00a650;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}
.mlx-ship-free {
  font-weight: 700;
  letter-spacing: -0.005em;
}
.mlx-ship-bolt {
  font-weight: 700;
  font-size: 14px;
  line-height: 1;
}
.mlx-ship-full {
  display: inline-flex;
  align-items: center;
  background: #00a650;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
}

@media (max-width: 420px) {
  .mlx-price-row { grid-template-columns: 1fr; row-gap: 4px; }
  .mlx-off { justify-self: start; margin-top: 0; }
}

/* mantenemos aspect-ratio cuadrado en todos los breakpoints (estilo ML) */
@media (max-width: 600px) {
  .mlx-installments { white-space: normal; }
}
</style>