<!-- src/modules/shop/pages/ShopProduct.vue -->
<template>
  <v-container class="py-6">
    <div class="product-shell">
      <v-btn to="/shop" variant="tonal" class="mb-4">
        <v-icon start>mdi-arrow-left</v-icon> Volver
      </v-btn>

      <div v-if="product" class="product-layout">
        <!-- LEFT: GALERÍA -->
        <v-card class="rounded-xl" variant="outlined">
          <v-card-text>
            <div class="gallery">
              <!-- Thumbs (desktop) -->
              <div class="thumbs" v-if="images.length > 1">
                <button
                  v-for="(src, i) in images"
                  :key="src + i"
                  class="thumb"
                  :class="{ active: i === activeIdx }"
                  type="button"
                  @click="activeIdx = i"
                  :title="`Imagen ${i + 1}`"
                >
                  <img :src="src" alt="" />
                </button>
              </div>

              <!-- Main image -->
              <div class="main">
                <div class="main-frame">
                  <img
                    v-if="activeImage"
                    :src="activeImage"
                    class="main-img"
                    alt=""
                  />
                  <div v-else class="main-empty">Sin imagen</div>
                </div>
              </div>
            </div>

            <!-- Thumbs (mobile horizontal) -->
            <div class="thumbs-mobile" v-if="images.length > 1">
              <v-slide-group show-arrows>
                <v-slide-group-item
                  v-for="(src, i) in images"
                  :key="src + i"
                >
                  <v-btn
                    variant="text"
                    class="thumb-btn"
                    :class="{ active: i === activeIdx }"
                    @click="activeIdx = i"
                  >
                    <v-img :src="src" width="72" height="72" cover class="rounded-lg" />
                  </v-btn>
                </v-slide-group-item>
              </v-slide-group>
            </div>
          </v-card-text>
        </v-card>

        <!-- RIGHT: INFO -->
        <v-card class="rounded-xl info" variant="outlined">
          <v-card-text>
            <div class="text-h6 font-weight-bold mb-2">{{ product.name }}</div>

            <div class="text-body-2 text-medium-emphasis mb-3">
              {{ product.description || "—" }}
            </div>

            <div class="price mb-2">
              $ {{ fmtMoney(priceValue(product)) }}
            </div>

            <div class="text-caption mb-4">
              <span v-if="product.track_stock">Stock: {{ Number(product.stock_qty || 0) }}</span>
              <span v-else>Stock: ∞</span>
            </div>

            <div class="d-flex ga-2 flex-wrap">
              <v-btn
                color="primary"
                size="large"
                :disabled="product.track_stock && Number(product.stock_qty) <= 0"
                @click="cart.add(product, 1)"
              >
                Agregar al carrito
              </v-btn>

              <v-btn to="/shop/cart" variant="tonal" size="large">
                Ir al carrito
              </v-btn>
            </div>

            <v-divider class="my-4" />

            <div class="text-caption text-medium-emphasis">
              Elegís sucursal al finalizar si es retiro.
            </div>
          </v-card-text>
        </v-card>
      </div>

      <v-container v-else class="text-center py-12 text-medium-emphasis">
        Cargando...
      </v-container>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { getProduct } from "@/modules/shop/service/shop.public.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const cart = useShopCartStore();

const product = ref(null);
const activeIdx = ref(0);

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

function extractImages(p) {
  if (!p) return [];
  const acc = [];

  // images: ["url"] o [{url/image_url/src/path}]
  if (Array.isArray(p.images)) {
    for (const it of p.images) {
      const u =
        typeof it === "string"
          ? it
          : it?.url || it?.image_url || it?.src || it?.path;
      if (u) acc.push(u);
    }
  }

  // image_urls: ["..."]
  if (Array.isArray(p.image_urls)) {
    for (const u of p.image_urls) if (u) acc.push(u);
  }

  // alternativos comunes (por si el backend manda así)
  if (p.image_url_2) acc.push(p.image_url_2);
  if (p.image2_url) acc.push(p.image2_url);
  if (p.image_url2) acc.push(p.image_url2);
  if (p.image2) acc.push(p.image2);

  // fallback
  if (p.image_url) acc.push(p.image_url);

  return uniqUrls(acc);
}

const images = computed(() => extractImages(product.value));

const activeImage = computed(() => {
  const list = images.value;
  if (!list.length) return product.value?.image_url || "";
  const idx = Math.min(Math.max(0, Number(activeIdx.value || 0)), list.length - 1);
  return list[idx];
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

async function load() {
  product.value = await getProduct(route.params.id);
  activeIdx.value = 0;
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<style scoped>
/* ✅ evita “explosión” en pantallas grandes */
.product-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* ✅ layout ML: 2 columnas reales (no depende de md) */
.product-layout {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

/* izquierda + derecha */
.product-layout > .v-card:first-child {
  flex: 1.2;
  min-width: 0;
}
.product-layout > .info {
  flex: 0.8;
  min-width: 340px;
}

/* ==== Galería ==== */
.gallery {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.thumbs {
  width: 78px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumb {
  width: 78px;
  height: 78px;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,.10);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.thumb.active {
  border-color: rgba(25,118,210,.55);
}

/* MAIN: contenedor con alto fijo => imagen grande sin recorte */
.main {
  flex: 1;
  min-width: 0;
}
.main-frame {
  width: 100%;
  height: 460px;            /* ✅ controla tamaño (no “gigante”) */
  border-radius: 16px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ✅ lo importante: contain REAL sin “tiritas” raras */
.main-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.main-empty {
  color: rgba(0,0,0,.55);
  font-size: 14px;
}

/* thumbs mobile */
.thumbs-mobile {
  display: none;
  margin-top: 12px;
}
.thumb-btn {
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,.08);
  padding: 6px;
}
.thumb-btn.active {
  border-color: rgba(25,118,210,.55);
}

/* Precio */
.price {
  font-size: 34px;
  font-weight: 900;
  line-height: 1.1;
}

/* responsive */
@media (max-width: 980px) {
  .product-layout {
    flex-direction: column;
  }
  .product-layout > .info {
    min-width: 0;
    width: 100%;
  }
  .thumbs {
    display: none;
  }
  .thumbs-mobile {
    display: block;
  }
  .main-frame {
    height: 380px;
  }
  .price {
    font-size: 30px;
  }
}
</style>
