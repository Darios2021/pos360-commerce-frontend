<!-- ✅ COPY-PASTE FINAL COMPLETO (SIDEBAR ML, 1 COLUMNA, SOLO INFO REAL + precio ML + cuotas segun regla 150/300 y base LISTA) -->
<!-- src/modules/shop/components/shop/ProductPurchasePanel.vue -->
<template>
  <v-card class="ml-side info" variant="flat">
    <v-card-text class="ml-pad">
      <!-- Link "Ver más productos de la marca" (si hay marca) -->
      <a
        v-if="brandName"
        href="javascript:void(0)"
        class="ml-brandlink"
        @click.prevent="goBrandSearch"
      >
        Ver más productos marca {{ brandName }}
      </a>

      <!-- Condición + vendidos -->
      <div class="ml-muted mb-2">
        {{ conditionLabel }}
        <span v-if="soldCountLabel"> | {{ soldCountLabel }}</span>
      </div>

      <!-- Título -->
      <div class="ml-title">
        {{ product?.name || "—" }}
      </div>

      <!-- Marca + Modelo -->
      <div v-if="brandModelLine" class="ml-brandmodel">
        {{ brandModelLine }}
      </div>

      <!-- ✅ Descripción (UNA SOLA: arriba) -->
      <div v-if="shortDesc" class="ml-shortdesc">
        {{ shortDesc }}
      </div>

      <!-- Rating (si viene) -->
      <div v-if="showRating" class="ml-rating">
        <v-rating
          :model-value="ratingValue"
          density="compact"
          size="16"
          readonly
          half-increments
          color="amber"
        />
        <span class="ml-rating-num">{{ ratingValue.toFixed(1) }}</span>
        <span class="ml-rating-count">({{ ratingCount }})</span>
      </div>

      <!-- 🏷️ Banner de PROMOCIÓN (sólo si is_promo + ventana vigente) -->
      <div v-if="promoOn" class="ml-promo-banner">
        <div class="ml-promo-banner-left">
          <v-icon size="18" color="white">mdi-tag-heart</v-icon>
          <span class="ml-promo-banner-title">PROMOCIÓN</span>
        </div>
        <div v-if="promoVigencia" class="ml-promo-banner-vig">
          {{ promoVigencia }}
        </div>
      </div>

      <!-- 📦 Hint promo por cantidad (si está configurado) -->
      <div v-if="promoOn && qtyPromoHint" class="ml-promo-qty-hint">
        <v-icon size="16">mdi-package-variant-closed</v-icon>
        <span>{{ qtyPromoHint }}</span>
      </div>

      <!-- ✅ Precio (estilo varía si es promo o cash discount) -->
      <div class="ml-price-block" :class="{ 'is-promo': promoOn }">
        <!-- Precio lista + OFF -->
        <div v-if="hasDiscount" class="ml-price-top">
          <span class="ml-price-list">$ {{ fmtMoney(priceList) }}</span>
          <span class="ml-discount-badge" :class="{ 'is-promo': promoOn }">
            {{ discountPct }}% OFF
          </span>
        </div>

        <!-- Precio final -->
        <div class="ml-price-wrap" :class="{ 'is-promo': promoOn }">
          <span class="ml-currency">$</span>
          <span class="ml-price-int">{{ priceInt }}</span>
          <span v-if="priceDec" class="ml-price-dec">{{ priceDec }}</span>
        </div>

        <!-- Ahorro destacado solo en promo -->
        <div v-if="promoOn && savingsAmount > 0" class="ml-promo-savings">
          Ahorrás <b>$ {{ fmtMoney(savingsAmount) }}</b>
        </div>

        <!-- ✅ Cuotas (siempre verde, no es promo) -->
        <div v-if="installmentHint" class="ml-installment-hint">
          {{ installmentHint }}
        </div>

        <!-- Link "Ver los medios de pago" -->
        <a
          href="javascript:void(0)"
          class="ml-payment-link"
          @click.prevent="emit('go-payments')"
        >
          Ver los medios de pago
        </a>
      </div>

      <!-- 📦 KIT: ¿Qué incluye? + ahorro -->
      <div v-if="isKit" class="ml-kit-block">
        <div class="ml-kit-head">
          <v-icon size="16" color="#7c3aed">mdi-package-variant</v-icon>
          <span class="ml-kit-title">¿Qué incluye este kit?</span>
          <span class="ml-kit-count">{{ kitItemsList.length }} {{ kitItemsList.length === 1 ? 'producto' : 'productos' }}</span>
        </div>

        <div v-if="kitItemsList.length" class="ml-kit-list">
          <div
            v-for="it in kitItemsList"
            :key="it.component_id"
            class="ml-kit-row"
            @click="onKitItemClick(it)"
          >
            <div class="ml-kit-thumb">
              <img v-if="it.image_url" :src="it.image_url" :alt="it.name" />
              <v-icon v-else size="20">mdi-package-variant-closed</v-icon>
            </div>
            <div class="ml-kit-info">
              <div class="ml-kit-name">{{ it.name }}</div>
              <div class="ml-kit-meta" v-if="it.price_list">
                <span>$ {{ fmtMoney(it.price_list) }} c/u</span>
              </div>
            </div>
            <span class="ml-kit-qty">×{{ it.qty }}</span>
          </div>
        </div>

        <div v-if="kitSavings && kitSavings.savings > 0" class="ml-kit-savings">
          <div class="ml-kit-savings-row">
            <span class="ml-muted">Comprándolo suelto:</span>
            <b class="ml-kit-savings-old">$ {{ fmtMoney(kitSavings.componentsTotal) }}</b>
          </div>
          <div class="ml-kit-savings-final">
            <v-icon size="14" color="success">mdi-trending-down</v-icon>
            <span>Ahorrás <b>$ {{ fmtMoney(kitSavings.savings) }}</b> ({{ kitSavings.savingsPct }}%)</span>
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Stock -->
      <div class="ml-stock">
        <div class="ml-stock-row">
          <div>
            <div class="ml-stock-title">Stock disponible</div>
            <div class="ml-muted">
              <span v-if="!trackStock">Disponible</span>
              <span v-else-if="totalStock <= 0" class="ml-stock-zero">Sin stock</span>
              <span v-else>
                <b>{{ totalStock }}</b> {{ totalStock === 1 ? 'unidad' : 'unidades' }} disponibles
              </span>
            </div>
          </div>
          <span
            v-if="trackStock && totalStock > 0"
            class="ml-stock-pill ml-stock-pill--ok"
          >
            En stock
          </span>
          <span
            v-else-if="trackStock && totalStock <= 0"
            class="ml-stock-pill ml-stock-pill--out"
          >
            Sin stock
          </span>
        </div>
      </div>

      <!-- Cantidad -->
      <div class="ml-qty">
        <div class="ml-qty-row">
          <span class="ml-strong">Cantidad:</span>
          <span class="ml-muted ml-qty-hint">{{ qtyHint }}</span>
        </div>

        <v-select
          v-model="qty"
          :items="qtyItems"
          density="compact"
          variant="outlined"
          hide-details
          class="ml-qty-select"
          :disabled="disabledAdd || qtyItems.length <= 1"
        />
      </div>

      <!-- Acciones -->
      <div class="ml-actions">
        <v-btn
          class="ml-btn"
          color="primary"
          size="large"
          block
          :disabled="disabledAdd"
          @click="onBuyNow"
        >
          Comprar ahora
        </v-btn>

        <v-btn
          class="ml-btn"
          variant="tonal"
          size="large"
          block
          :disabled="disabledAdd"
          @click="onAddToCart"
        >
          <v-icon start>mdi-cart-outline</v-icon>
          Agregar al carrito
        </v-btn>
      </div>

      <!-- ✅ Acciones secundarias: favorito + compartir -->
      <div class="ml-secondary-actions">
        <button
          type="button"
          class="ml-action-chip"
          :class="{ 'is-on': isFavorite, 'is-busy': favBusy }"
          :disabled="favBusy"
          :aria-label="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          @click="onToggleFavorite"
        >
          <v-icon size="18">{{ isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
          <span>{{ isFavorite ? 'En favoritos' : 'Agregar a favoritos' }}</span>
        </button>

        <button
          type="button"
          class="ml-action-chip"
          aria-label="Compartir producto"
          @click="onShare"
        >
          <v-icon size="18">{{ shareJustCopied ? 'mdi-check' : 'mdi-share-variant-outline' }}</v-icon>
          <span>{{ shareJustCopied ? 'Link copiado' : 'Compartir' }}</span>
        </button>
      </div>

      <!-- ✅ Garantías estilo ML: devolución + compra protegida -->
      <div class="ml-trust">
        <div class="ml-trust__row">
          <v-icon size="20" class="ml-trust__icon">mdi-keyboard-return</v-icon>
          <div class="ml-trust__body">
            <a href="javascript:void(0)" class="ml-trust__link">Devolución gratis</a>
            <span class="ml-trust__text">
              Tenés 30 días desde que lo recibís.
            </span>
          </div>
        </div>
        <div class="ml-trust__row">
          <v-icon size="20" class="ml-trust__icon">mdi-shield-check-outline</v-icon>
          <div class="ml-trust__body">
            <a href="javascript:void(0)" class="ml-trust__link">Compra Protegida</a>
            <span class="ml-trust__text">
              Recibí el producto que esperabas o te devolvemos tu dinero.
            </span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { isPromoActive } from "@/modules/shop/utils/promo";
import { useShopFavoritesStore } from "@/modules/shop/service/shopFavorites.store";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const router = useRouter();

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["add", "buy", "go-payments"]);

/* ============ Favoritos ============ */
const favs = useShopFavoritesStore();
const auth = useShopAuthStore();
const favBusy = ref(false);

const productId = computed(() => Number(props.product?.product_id ?? props.product?.id ?? 0));
const isFavorite = computed(() => productId.value > 0 && favs.isFavorite(productId.value));

onMounted(() => {
  if (auth.isLogged) {
    favs.fetch().catch(() => {});
  }
});

async function onToggleFavorite() {
  if (!productId.value) return;
  if (!auth.isLogged) {
    router.push({ path: "/shop/login", query: { redirect: location.pathname + location.search } });
    return;
  }
  favBusy.value = true;
  try {
    await favs.toggle(productId.value);
  } catch (e) {
    console.warn("[fav] toggle falló:", e?.message);
  } finally {
    favBusy.value = false;
  }
}

/* ============ Compartir ============ */
const shareJustCopied = ref(false);

async function onShare() {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = `${props.product?.name || "Producto"} | San Juan Tecnología`;
  const text = props.product?.short_description || props.product?.description || props.product?.name || "";

  // Web Share API nativa (mobile + algunos browsers)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch {
      // si el usuario cancela, caemos al clipboard
    }
  }
  // Fallback: copiar URL al clipboard
  try {
    await navigator.clipboard.writeText(url);
    shareJustCopied.value = true;
    setTimeout(() => { shareJustCopied.value = false; }, 1800);
  } catch {
    // último recurso: prompt
    try { window.prompt("Copiá el enlace:", url); } catch {}
  }
}

/* ================= utils ================= */
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function asText(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}
function cleanOneLine(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

/* ================= precios =================
   - priceList: lista (tachado)
   - priceFinal: con descuento o promo (grande)
   - promoOn: si is_promo y ventana vigente, manda promo_price (si existe)
*/
const promoOn = computed(() => isPromoActive(props.product || {}));

/* ================= KIT / COMBO ================= */
const isKit = computed(() => {
  const v = props.product?.is_kit;
  return v === true || Number(v) === 1;
});
const kitItemsList = computed(() => {
  const arr = props.product?.kit_items || props.product?.kitItems;
  if (!Array.isArray(arr)) return [];
  return arr.map((ki) => {
    const c = ki?.component || ki?.product || ki;
    const cid = Number(ki?.component_id ?? c?.id ?? ki?.id ?? 0);
    const firstImg = Array.isArray(c?.images)
      ? (c.images[0]?.url || c.images[0]?.image_url || null)
      : (c?.image_url || ki?.image_url || null);
    return {
      component_id: cid,
      name: String(c?.name || ki?.name || "—"),
      sku: String(c?.sku || ki?.sku || ""),
      qty: Number(ki?.qty || 1),
      price_list: Number(c?.price_list || c?.price || ki?.price_list || 0),
      image_url: firstImg,
    };
  }).filter((x) => x.component_id > 0);
});
const kitSavings = computed(() => {
  if (!isKit.value) return null;
  const items = kitItemsList.value;
  if (!items.length) return null;
  const componentsTotal = items.reduce((acc, it) => acc + Number(it.price_list || 0) * Number(it.qty || 1), 0);
  const kitPrice = priceFinal.value;
  if (!componentsTotal && !kitPrice) return null;
  const savings = componentsTotal - kitPrice;
  const savingsPct = componentsTotal > 0 ? Math.round((savings / componentsTotal) * 100) : 0;
  return { componentsTotal, kitPrice, savings, savingsPct };
});
function onKitItemClick(it) {
  if (!it?.component_id) return;
  // Navegamos al producto componente dentro del shop. El consumidor ve
  // la PDP del componente individual.
  if (typeof window !== "undefined") {
    window.location.href = `/shop/product/${it.component_id}`;
  }
}

const priceList = computed(() =>
  Math.max(toNum(props.product?.price_list, 0), toNum(props.product?.price, 0))
);

const priceFinal = computed(() => {
  // 1) Si hay promo activa con promo_price, manda
  if (promoOn.value) {
    const pp = toNum(props.product?.promo_price, 0);
    if (pp > 0) return pp;
  }
  const d = toNum(props.product?.price_discount, 0);
  if (d > 0) return d;
  const l = toNum(props.product?.price_list, 0);
  if (l > 0) return l;
  return toNum(props.product?.price, 0);
});

const hasDiscount = computed(() => priceList.value > 0 && priceFinal.value < priceList.value);

const discountPct = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.round(((priceList.value - priceFinal.value) / priceList.value) * 100);
});

const savingsAmount = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.max(0, priceList.value - priceFinal.value);
});

const promoVigencia = computed(() => {
  if (!promoOn.value) return "";
  const e = props.product?.promo_ends_at;
  if (!e) return ""; // sin ventana → no decir "por tiempo limitado", puede ser solo qty
  const d = new Date(e);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `Vigente hasta ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});

// Hint para promo POR CANTIDAD (si está configurada)
const qtyPromoHint = computed(() => {
  const p = props.product || {};
  if (!promoOn.value) return "";
  const thr = Number(p.promo_qty_threshold) || 0;
  const disc = toNum(p.promo_qty_discount, 0);
  const mode = String(p.promo_qty_mode || "").toLowerCase();
  if (thr < 2 || disc <= 0) return "";
  if (mode === "percent") {
    return `Llevando ${thr} o más, obtenés ${disc}% OFF en cada unidad`;
  }
  return `Llevando ${thr} o más, ahorrás $ ${fmtMoney(disc)} por unidad`;
});

const priceInt = computed(() => {
  const [i] = priceFinal.value.toFixed(2).split(".");
  return fmtMoney(i);
});
const priceDec = computed(() => {
  const d = priceFinal.value.toFixed(2).split(".")[1];
  return d === "00" ? "" : d;
});

/* ✅ cuotas segun regla:
   - display > 300 => 6x
   - 150..300 => 3x
   - si no => sin cuotas
   - cálculo SIEMPRE sobre LISTA (si hay), sino sobre display
*/
const installmentsCount = computed(() => {
  const display = priceFinal.value; // lo que el usuario ve grande (descuento)
  if (!display || display <= 0) return 0;
  if (display > 300) return 6;
  if (display >= 150 && display <= 300) return 3;
  return 0;
});

const installmentHint = computed(() => {
  const n = installmentsCount.value;
  if (!n) return "";

  const base = priceList.value > 0 ? priceList.value : priceFinal.value; // ✅ base lista
  const per = base / n;

  return `En ${n}x $ ${fmtMoney(per)}`;
});

/* ================= labels ================= */
const conditionLabel = computed(() => {
  const p = props.product || {};
  const c = asText(p.condition || p.estado);
  if (c) return c.charAt(0).toUpperCase() + c.slice(1);
  if (p.is_new === true) return "Nuevo";
  if (p.is_new === false) return "Usado";
  return "Nuevo";
});

const soldCountLabel = computed(() => {
  const p = props.product || {};
  const v = toNum(p.sold_count ?? p.vendidos ?? p.sold ?? 0, 0);
  return v > 0 ? `+${v} vendidos` : "";
});

/* rating (si viene) */
const ratingValue = computed(() => {
  const p = props.product || {};
  return Math.max(0, Math.min(5, toNum(p.rating ?? p.stars ?? 0, 0)));
});
const ratingCount = computed(() => {
  const p = props.product || {};
  return Math.max(0, Math.floor(toNum(p.rating_count ?? p.reviews_count ?? p.reviews ?? 0, 0)));
});
const showRating = computed(() => ratingValue.value > 0 && ratingCount.value > 0);

/* ================= marca / modelo / desc (BD) ================= */
const brandText = computed(() => {
  const p = props.product || {};
  return asText(p.brand_name || p.Brand?.name || p.brand || p.marca || "");
});
const modelText = computed(() => {
  const p = props.product || {};
  return asText(p.model || p.model_name || p.modelo || p.model_code || "");
});
const brandModelLine = computed(() => {
  const b = brandText.value;
  const m = modelText.value;
  if (b && m) return `${b} · ${m}`;
  return b || m || "";
});

const brandName = computed(() => brandText.value || "");
function goBrandSearch() {
  const b = brandName.value;
  if (!b) return;
  // Navegamos a la home con el filtro de búsqueda por marca
  router.push({ name: "shopHome", query: { q: b } });
}

/* ✅ única descripción (arriba) */
const shortDesc = computed(() => {
  const p = props.product || {};
  const raw =
    asText(p.short_description) ||
    asText(p.short_desc) ||
    asText(p.subtitle) ||
    asText(p.description) ||
    "";
  return cleanOneLine(raw);
});

/* ================= stock / qty ================= */
const trackStock = computed(() => !!props.product?.track_stock);
const stockQty = computed(() => Math.max(0, Math.floor(toNum(props.product?.stock_qty ?? 0, 0))));

// Total real (suma de todas las sucursales)
const totalStock = computed(() => {
  const p = props.product || {};
  const explicit = toNum(p.stock_total ?? p.stock_qty ?? 0, 0);
  if (Array.isArray(p.stock_by_branch) && p.stock_by_branch.length) {
    return p.stock_by_branch.reduce(
      (acc, r) => acc + Math.max(0, Math.floor(toNum(r?.qty ?? r?.stock_qty ?? 0, 0))),
      0
    );
  }
  return Math.max(0, Math.floor(explicit));
});

const disabledAdd = computed(() => {
  const p = props.product || {};
  if (!p.track_stock) return false;
  return totalStock.value <= 0;
});

/* qty */
const qty = ref(1);

watch(
  () => props.product,
  () => {
    qty.value = 1;
  }
);

// Sin tope artificial: si el producto trackea stock, max = stock real.
// Si no trackea, dejamos un techo alto (99) sólo para el dropdown.
const maxQty = computed(() => {
  const p = props.product || {};
  if (p.track_stock) {
    const stock = totalStock.value;
    return Math.max(1, stock || 1);
  }
  return 99;
});

const qtyItems = computed(() => {
  const m = maxQty.value;
  const out = [];
  for (let i = 1; i <= m; i++) out.push(i);
  return out;
});

const qtyHint = computed(() => {
  const p = props.product || {};
  if (p.track_stock) {
    const s = totalStock.value;
    if (s <= 0) return ""; // "Sin stock" ya se muestra en el bloque de arriba
    return `${s} ${s === 1 ? 'disponible' : 'disponibles'}`;
  }
  return "";
});

/* ================= actions ================= */
function onAddToCart() {
  if (disabledAdd.value) return;
  emit("add", props.product, qty.value);
}
function onBuyNow() {
  if (disabledAdd.value) return;
  emit("buy", props.product, qty.value);
}
</script>

<style scoped>
.ml-side {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.ml-pad { padding: 18px; }

/* ✅ anti “texto vertical” */
.ml-side, .ml-side * {
  word-break: normal !important;
  overflow-wrap: normal !important;
  white-space: normal !important;
}

.ml-muted { color: rgba(0,0,0,.6); font-size: 13px; }
.ml-strong { font-weight: 500; color: rgba(0,0,0,.9); }

.ml-title {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.15;
  margin-bottom: 6px;
}

.ml-brandmodel{
  font-size: 13px;
  font-weight: 500;
  color: rgba(0,0,0,.72);
  margin-bottom: 6px;
}

.ml-shortdesc{
  font-size: 13px;
  color: rgba(0,0,0,.72);
  line-height: 1.35;
  margin-bottom: 10px;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Banner PROMO ===== */
.ml-promo-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 13px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.30);
}
.ml-promo-banner-left {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.ml-promo-banner-title {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
.ml-promo-banner-vig {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.92;
  text-align: right;
  flex-shrink: 0;
}

/* ===== Precio estilo ML ===== */
.ml-price-block { margin-bottom: 6px; }

.ml-price-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.ml-price-list {
  font-size: 14px;
  color: rgba(0,0,0,.55);
  text-decoration: line-through;
  font-weight: 400;
}

.ml-discount-badge {
  font-size: 13px;
  font-weight: 500;
  color: #00a650; /* verde = cash discount default */
}
/* Bordó cuando es promo real */
.ml-discount-badge.is-promo {
  color: #fff;
  background: #ff5722;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  letter-spacing: 0.4px;
}

.ml-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin-bottom: 2px;
}
.ml-currency { font-size: 22px; font-weight: 500; }
.ml-price-int { font-size: 46px; font-weight: 500; letter-spacing: -0.5px; line-height: 1.05; }
.ml-price-dec { font-size: 16px; font-weight: 500; margin-top: 10px; opacity: .9; }

/* Precio en bordó cuando es promo */
.ml-price-wrap.is-promo .ml-currency,
.ml-price-wrap.is-promo .ml-price-int,
.ml-price-wrap.is-promo .ml-price-dec {
  color: #ff5722;
}

.ml-promo-savings {
  font-size: 13px;
  font-weight: 500;
  color: #ff5722;
  margin-top: 2px;
  margin-bottom: 4px;
}

.ml-promo-qty-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 400;
  color: #ff5722;
  background: rgba(255, 87, 34, 0.10);
  border: 1px solid rgba(255, 87, 34, 0.28);
  padding: 7px 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  line-height: 1.3;
}

.ml-installment-hint {
  font-size: 13px;
  font-weight: 400;
  color: #00a650;
  margin-top: 2px;
}

/* Stock / qty */
.ml-stock-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.ml-stock-title { font-size: 15px; font-weight: 500; margin-bottom: 2px; }
.ml-stock-zero { color: #d23f3f; font-weight: 400; }

.ml-stock-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  flex-shrink: 0;
  margin-top: 2px;
}
.ml-stock-pill--ok {
  background: rgba(0, 166, 80, 0.12);
  color: #00a650;
  border: 1px solid rgba(0, 166, 80, 0.25);
}
.ml-stock-pill--out {
  background: rgba(210, 63, 63, 0.10);
  color: #d23f3f;
  border: 1px solid rgba(210, 63, 63, 0.25);
}

.ml-qty { margin-top: 14px; }
.ml-qty-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.ml-qty-hint { font-size: 12px; }
.ml-qty-select { border-radius: 12px; }

/* Link "Ver más productos marca X" arriba */
.ml-brandlink {
  display: inline-block;
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  margin-bottom: 6px;
}
.ml-brandlink:hover { text-decoration: underline; }

/* Link "Ver los medios de pago" debajo del precio */
.ml-payment-link {
  display: inline-block;
  margin-top: 6px;
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
.ml-payment-link:hover { text-decoration: underline; }

/* Botones */
.ml-actions { margin-top: 14px; display: grid; gap: 10px; }
.ml-btn { border-radius: 12px; font-weight: 500; text-transform: none; }

/* Acciones secundarias: favorito + compartir */
.ml-secondary-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ml-action-chip {
  appearance: none;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 10px;
  padding: 9px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 460;
  color: rgba(0, 0, 0, 0.7);
  letter-spacing: 0.005em;
  transition: background 0.16s, border-color 0.16s, color 0.16s;
  white-space: nowrap;
}
.ml-action-chip:hover {
  background: rgba(21, 101, 192, 0.04);
  border-color: rgba(21, 101, 192, 0.32);
  color: rgb(var(--v-theme-primary));
}
.ml-action-chip.is-on {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.32);
  color: #dc2626;
}
.ml-action-chip.is-on:hover {
  background: rgba(239, 68, 68, 0.10);
}
.ml-action-chip.is-busy {
  opacity: 0.6;
  cursor: wait;
}

/* Garantías ML — Devolución gratis + Compra Protegida */
.ml-trust {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ml-trust__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.4;
}
.ml-trust__icon {
  color: rgba(0, 0, 0, 0.55);
  margin-top: 2px;
  flex-shrink: 0;
}
.ml-trust__body { min-width: 0; }
.ml-trust__link {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-decoration: none;
  margin-right: 4px;
}
.ml-trust__link:hover { text-decoration: underline; }
.ml-trust__text { color: rgba(0, 0, 0, 0.7); }

@media (max-width: 980px) {
  .ml-price-int { font-size: 40px; }
}

/* ── KIT / COMBO en PDP ── */
.ml-kit-block {
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(180deg,
    rgba(124, 58, 237, 0.08),
    rgba(124, 58, 237, 0.02)
  );
  border: 1px solid rgba(124, 58, 237, 0.25);
}
.ml-kit-head {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 10px;
}
.ml-kit-title {
  font-size: 14px; font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}
.ml-kit-count {
  margin-left: auto;
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
}
.ml-kit-list {
  display: flex; flex-direction: column; gap: 6px;
}
.ml-kit-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.10);
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
}
.ml-kit-row:hover {
  transform: translateY(-1px);
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.10);
}
.ml-kit-thumb {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.ml-kit-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ml-kit-info { min-width: 0; }
.ml-kit-name {
  font-size: 13px; font-weight: 500;
  line-height: 1.25;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.ml-kit-meta { font-size: 11px; opacity: 0.65; margin-top: 2px; }
.ml-kit-qty {
  font-size: 14px; font-weight: 600;
  color: #7c3aed;
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.1);
}
.ml-kit-savings {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(124, 58, 237, 0.25);
  font-size: 12.5px;
}
.ml-kit-savings-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 2px 0;
}
.ml-kit-savings-old {
  text-decoration: line-through;
  opacity: 0.6;
}
.ml-kit-savings-final {
  display: flex; align-items: center; gap: 6px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(124, 58, 237, 0.20);
  font-size: 13.5px;
  color: rgb(var(--v-theme-success));
}
</style>
