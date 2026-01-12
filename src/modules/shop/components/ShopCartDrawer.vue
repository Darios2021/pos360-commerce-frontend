<!-- src/modules/shop/components/ShopCartDrawer.vue -->
<template>
  <v-navigation-drawer
    v-model="drawer"
    location="right"
    temporary
    width="420"
    class="cart-drawer"
  >
    <!-- Header -->
    <div class="cd-head">
      <div class="cd-title">Mi carrito</div>
      <v-btn icon variant="text" @click="cart.closeDrawer()" aria-label="Cerrar">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider />

    <!-- Body -->
    <div class="cd-body">
      <div v-if="!items.length" class="cd-empty">
        Tu carrito está vacío.
      </div>

      <div v-else class="cd-items">
        <div v-for="it in items" :key="it.product_id" class="cd-item">
          <v-img
            :src="it.image_url || it.image || it.cover_url"
            width="56"
            height="56"
            cover
            class="cd-img"
          />

          <div class="cd-info">
            <div class="cd-name">{{ it.name }}</div>

            <div class="cd-variant text-caption text-medium-emphasis">
              <template v-if="it.color || it.color_name">
                Color: {{ it.color_name || it.color }}
              </template>
              <template v-else-if="it.variant_name">
                {{ it.variant_name }}
              </template>
              <template v-else>
                &nbsp;
              </template>
            </div>

            <div class="cd-qtyrow">
              <v-btn icon size="small" variant="text" @click="cart.dec(it.product_id)">
                <v-icon size="18">mdi-minus</v-icon>
              </v-btn>

              <div class="cd-qty">{{ it.qty }}</div>

              <v-btn icon size="small" variant="text" @click="cart.inc(it.product_id)">
                <v-icon size="18">mdi-plus</v-icon>
              </v-btn>
            </div>
          </div>

          <div class="cd-right">
            <div class="cd-price">$ {{ fmtMoney(lineTotal(it)) }}</div>
            <v-btn icon size="small" variant="text" @click="cart.remove(it.product_id)">
              <v-icon size="18">mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>

        <v-divider class="my-3" />

        <div class="cd-row">
          <span class="text-medium-emphasis">Subtotal</span>
          <b>$ {{ fmtMoney(cart.total) }}</b>
        </div>

        <v-expansion-panels variant="accordion" class="cd-panels">
          <v-expansion-panel>
            <v-expansion-panel-title>Calculá el costo de envío</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-text-field
                v-model="zip"
                label="Código postal"
                variant="outlined"
                density="comfortable"
              />
              <v-btn block variant="tonal" :disabled="!zip">Calcular</v-btn>
              <div class="text-caption text-medium-emphasis mt-2">
                (Placeholder: cálculo real cuando tengas la API)
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>¿Tenés un descuento?</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-text-field
                v-model="coupon"
                label="Cupón"
                variant="outlined"
                density="comfortable"
              />
              <v-btn block variant="tonal" :disabled="!coupon">Aplicar</v-btn>
              <div class="text-caption text-medium-emphasis mt-2">
                (Placeholder: validación real más adelante)
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <div class="cd-row cd-total">
          <span>Total</span>
          <b>$ {{ fmtMoney(cart.total) }}</b>
        </div>

        <v-btn
          color="primary"
          size="large"
          block
          class="cd-cta"
          :disabled="!items.length"
          @click="goCheckout"
        >
          INICIAR COMPRA
        </v-btn>

        <v-btn block variant="text" class="cd-continue" @click="cart.closeDrawer()">
          Seguir comprando
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const router = useRouter();
const cart = useShopCartStore();

const items = computed(() => cart.items || []);

const drawer = computed({
  get: () => cart.drawer_open,
  set: (v) => cart.toggleDrawer(v),
});

const zip = ref("");
const coupon = ref("");

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function unitPrice(i) {
  const d = Number(i?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(i?.price_list || 0);
  if (l > 0) return l;
  return Number(i?.price || 0);
}

function lineTotal(i) {
  return unitPrice(i) * Number(i?.qty || 0);
}

function goCheckout() {
  cart.closeDrawer();
  router.push({ name: "shopCheckout" }); // ✅ FIX: ir a checkout real
}
</script>

<style scoped>
.cart-drawer {
  overflow: hidden;
}

.cd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
}

.cd-title {
  font-size: 18px;
  font-weight: 900;
}

.cd-body {
  padding: 12px 14px 18px;
}

.cd-empty {
  padding: 18px 4px;
  color: rgba(0, 0, 0, 0.55);
}

.cd-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cd-item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: #fff;
}

.cd-img {
  border-radius: 12px;
}

.cd-info {
  min-width: 0;
}

.cd-name {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cd-qtyrow {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 999px;
  padding: 2px 6px;
}

.cd-qty {
  width: 26px;
  text-align: center;
  font-weight: 900;
}

.cd-right {
  display: grid;
  justify-items: end;
  gap: 6px;
}

.cd-price {
  font-weight: 900;
  white-space: nowrap;
}

.cd-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cd-total {
  margin-top: 8px;
  font-size: 15px;
}

.cd-cta {
  margin-top: 12px;
  border-radius: 999px;
  font-weight: 900;
  text-transform: none;
}

.cd-continue {
  margin-top: 6px;
  font-weight: 800;
  text-transform: none;
}

.cd-panels {
  margin-top: 10px;
}
</style>
