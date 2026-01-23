<!-- src/modules/shop/pages/ShopCart.vue -->
<template>
  <v-container class="py-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div class="text-h5 font-weight-bold">Carrito</div>
      <v-btn to="/shop" variant="tonal">Seguir comprando</v-btn>
    </div>

    <v-row>
      <!-- Items -->
      <v-col cols="12" md="8">
        <v-card class="rounded-xl" variant="outlined">
          <v-card-text>
            <div v-if="!items.length" class="text-medium-emphasis">
              Tu carrito está vacío.
            </div>

            <div v-else class="d-flex flex-column ga-3">
              <v-card
                v-for="it in items"
                :key="it.product_id"
                class="rounded-lg"
                variant="outlined"
              >
                <v-card-text class="d-flex ga-3 align-center">
                  <v-img
                    :src="it.image_url || it.image || it.cover_url"
                    width="84"
                    height="84"
                    cover
                    class="rounded-lg"
                  />
                  <div class="flex-grow-1">
                    <div class="font-weight-bold">{{ it.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ it.brand || "—" }} {{ it.model || "" }}
                    </div>
                    <div class="mt-1">$ {{ fmtMoney(unitPrice(it)) }}</div>
                  </div>

                  <div class="d-flex align-center ga-2">
                    <v-btn icon variant="text" @click="cart.dec(it.product_id)">
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>

                    <div class="text-subtitle-2" style="min-width: 32px; text-align:center;">
                      {{ it.qty }}
                    </div>

                    <v-btn icon variant="text" @click="cart.inc(it.product_id)">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>

                    <v-btn icon variant="text" @click="cart.remove(it.product_id)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Resumen / CTA -->
      <v-col cols="12" md="4">
        <v-card class="rounded-xl" variant="outlined">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-2">Resumen</div>

            <div class="d-flex justify-space-between mb-1">
              <span class="text-medium-emphasis">Subtotal</span>
              <span>$ {{ fmtMoney(subtotal) }}</span>
            </div>

            <v-divider class="my-3" />

            <v-btn
              color="primary"
              block
              size="large"
              :disabled="!items.length"
              @click="goCheckout"
            >
              Continuar compra
            </v-btn>

            <div v-if="!items.length" class="text-caption text-medium-emphasis mt-2">
              Agregá productos para continuar.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

// ------------------------------------------------------
// ✅ ANTI-TIMEOUT prerender (Cart no se comparte)
// ------------------------------------------------------
function dispatchPrerenderReadySafe() {
  try {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("prerender-ready"));
    }
  } catch {}
}

const router = useRouter();
const cart = useShopCartStore();

const items = computed(() => cart.items || []);

function unitPrice(p) {
  const d = Number(p.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p.price_list || 0);
  if (l > 0) return l;
  return Number(p.price || 0);
}

const subtotal = computed(() =>
  (items.value || []).reduce((a, it) => a + unitPrice(it) * Number(it.qty || 0), 0)
);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function goCheckout() {
  if (router.hasRoute("shopCheckout")) {
    router.push({ name: "shopCheckout" });
    return;
  }
  console.warn("⚠️ No existe la ruta 'shopCheckout'. Revisá shop.routes.js.");
  router.push("/shop/checkout");
}

onMounted(() => {
  // ✅ nunca colgar prerender en rutas no-share
  dispatchPrerenderReadySafe();
});
</script>

