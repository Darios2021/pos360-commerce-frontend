<!-- src/modules/shop/components/shop/ShopCartDrawer.vue -->
<template>
  <v-navigation-drawer
    v-model="drawer"
    location="right"
    temporary
    width="400"
    class="cart-drawer"
  >
    <!-- Header -->
    <div class="cd-head">
      <div class="cd-title">Mi carrito</div>
      <v-btn icon variant="text" size="small" @click="cart.closeDrawer()" aria-label="Cerrar">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div class="cd-rule" />

    <!-- Body -->
    <div class="cd-body">
      <div v-if="!items.length" class="cd-empty">
        <v-icon size="32" color="grey-lighten-1">mdi-cart-outline</v-icon>
        <div class="cd-empty-title">Tu carrito está vacío</div>
        <div class="cd-empty-sub">Agregá productos para empezar la compra.</div>
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          :elevation="0"
          class="cd-btn cd-btn--sm cd-btn--cart mt-4"
          @click="cart.closeDrawer()"
        >
          Seguir comprando
        </v-btn>
      </div>

      <template v-else>
        <!-- Items: lista plana, hairlines entre cada uno -->
        <div class="cd-items">
          <template v-for="(it, idx) in items" :key="it.product_id">
            <div v-if="idx > 0" class="cd-rule" />
            <div class="cd-item">
              <div class="cd-thumb">
                <img
                  v-if="it.image_url || it.image || it.cover_url"
                  :src="it.image_url || it.image || it.cover_url"
                  :alt="it.name"
                />
                <v-icon v-else size="22" color="grey-lighten-1">mdi-image-off-outline</v-icon>
              </div>

              <div class="cd-info">
                <div class="cd-name" :title="it.name">{{ it.name }}</div>

                <div class="cd-qtyrow">
                  <div class="cd-qtybox">
                    <button
                      type="button"
                      class="cd-qtybtn"
                      :disabled="(it.qty || 1) <= 1"
                      @click="cart.dec(it.product_id)"
                      aria-label="Disminuir"
                    >−</button>
                    <div class="cd-qty">{{ it.qty }}</div>
                    <button
                      type="button"
                      class="cd-qtybtn"
                      @click="cart.inc(it.product_id)"
                      aria-label="Aumentar"
                    >+</button>
                  </div>

                  <button
                    type="button"
                    class="cd-link"
                    @click="cart.remove(it.product_id)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div class="cd-price">$ {{ fmtMoney(lineTotal(it)) }}</div>
            </div>
          </template>
        </div>

        <!-- Totales -->
        <div class="cd-rule" />
        <div class="cd-totals">
          <div class="cd-row">
            <span class="cd-muted">Subtotal</span>
            <span>$ {{ fmtMoney(cart.total) }}</span>
          </div>
          <div class="cd-row cd-total-row">
            <span>Total</span>
            <span class="cd-total-amount">$ {{ fmtMoney(cart.total) }}</span>
          </div>
        </div>

        <!-- CTAs -->
        <div class="cd-actions">
          <v-btn
            color="primary"
            variant="flat"
            :elevation="0"
            block
            class="cd-btn cd-btn--buy"
            :disabled="!items.length"
            @click="goCheckout"
          >
            Iniciar compra
          </v-btn>

          <v-btn
            color="primary"
            variant="tonal"
            :elevation="0"
            block
            class="cd-btn cd-btn--cart"
            @click="cart.closeDrawer()"
          >
            Seguir comprando
          </v-btn>
        </div>

        <div class="cd-hint">
          Podés revisar envío, descuentos y pago en el checkout.
        </div>
      </template>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const router = useRouter();
const cart = useShopCartStore();

const items = computed(() => cart.items || []);

const drawer = computed({
  get: () => cart.drawer_open,
  set: (v) => cart.toggleDrawer(v),
});

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
  router.push({ name: "shopCheckout" });
}
</script>

<style scoped>
.cart-drawer {
  overflow: hidden;
}

/* ===== Header ===== */
.cd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.cd-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.94);
}

/* ===== Hairline reusable ===== */
.cd-rule {
  height: 1px;
  width: 100%;
  background: rgba(0, 0, 0, 0.06);
}

/* ===== Body ===== */
.cd-body {
  padding: 8px 16px 18px;
  display: flex;
  flex-direction: column;
}

/* ===== Empty ===== */
.cd-empty {
  padding: 36px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(0, 0, 0, 0.6);
}
.cd-empty-title {
  font-size: 15px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.92);
  margin-top: 10px;
}
.cd-empty-sub {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 4px;
}

/* ===== Items ===== */
.cd-items {
  display: flex;
  flex-direction: column;
}

.cd-item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
}

.cd-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.cd-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cd-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cd-name {
  font-weight: 460;
  font-size: 13px;
  line-height: 1.35;
  color: rgba(17, 24, 39, 0.92);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-transform: none;
}

.cd-qtyrow {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Qty box rectangular tipo ML */
.cd-qtybox {
  display: grid;
  grid-template-columns: 28px 36px 28px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  height: 30px;
}
.cd-qtybtn {
  border: 0;
  background: rgba(0, 0, 0, 0.03);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  color: rgba(17, 24, 39, 0.7);
  transition: background 0.14s;
}
.cd-qtybtn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
}
.cd-qtybtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.cd-qty {
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.92);
}

.cd-link {
  background: transparent;
  border: 0;
  padding: 0;
  color: rgb(var(--v-theme-primary));
  font-size: 12.5px;
  cursor: pointer;
  font-weight: 460;
}
.cd-link:hover {
  text-decoration: underline;
}

.cd-price {
  font-weight: 500;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.94);
  white-space: nowrap;
  align-self: flex-start;
  margin-top: 2px;
}

/* ===== Totales ===== */
.cd-totals {
  padding: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cd-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13.5px;
}

.cd-muted {
  color: rgba(0, 0, 0, 0.6);
}

.cd-total-row {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-weight: 500;
  font-size: 15px;
  color: rgba(17, 24, 39, 0.94);
}
.cd-total-amount {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* ===== Actions ===== */
.cd-actions {
  margin-top: 14px;
  display: grid;
  gap: 8px;
}

/* Botones — mismo patrón que el resto del shop */
.cd-btn {
  border-radius: 6px;
  font-weight: 460;
  letter-spacing: 0.005em;
  text-transform: none;
  font-size: 14px;
  min-height: 44px;
  box-shadow: none !important;
}

/* ✅ Variante compacta — empty state, secondary inline */
.cd-btn--sm {
  min-height: 36px !important;
  height: 36px !important;
  font-size: 13px !important;
  padding: 0 16px !important;
}

.cd-btn--buy {
  font-weight: 500;
}
.cd-btn--buy :deep(.v-btn__overlay) { opacity: 0; }
.cd-btn--buy:hover :deep(.v-btn__overlay) {
  opacity: 0.08;
  background: #000;
}

.cd-btn--cart {
  background: rgba(21, 101, 192, 0.08) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
.cd-btn--cart :deep(.v-btn__overlay) { opacity: 0; }
.cd-btn--cart:hover {
  background: rgba(21, 101, 192, 0.14) !important;
}

.cd-hint {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.4;
}
</style>
