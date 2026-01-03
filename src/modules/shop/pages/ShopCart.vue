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
                    :src="it.image_url"
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

      <!-- Checkout -->
      <v-col cols="12" md="4">
        <v-card class="rounded-xl" variant="outlined">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-2">Confirmación</div>

            <div class="d-flex justify-space-between mb-1">
              <span class="text-medium-emphasis">Subtotal</span>
              <span>$ {{ fmtMoney(subtotal) }}</span>
            </div>

            <v-divider class="my-3" />

            <!-- ✅ Fulfillment -->
            <div class="text-subtitle-2 font-weight-bold mb-2">Entrega</div>

            <v-radio-group v-model="fulfillment" density="compact">
              <v-radio label="Retiro en sucursal" value="pickup" />
              <v-radio label="Envío (próximamente / básico)" value="delivery" />
            </v-radio-group>

            <div v-if="fulfillment === 'pickup'" class="mt-2">
              <v-select
                v-model="pickupBranchId"
                :items="branches"
                item-title="name"
                item-value="id"
                label="Elegí sucursal para retirar"
                variant="outlined"
                density="comfortable"
                :loading="loadingBranches"
                :disabled="loadingBranches"
              />
              <div class="text-caption text-medium-emphasis mt-1">
                La sucursal se elige acá, no afecta la navegación del catálogo.
              </div>
            </div>

            <div v-else class="mt-2">
              <v-text-field v-model="ship.name" label="Nombre" variant="outlined" density="comfortable" />
              <v-text-field v-model="ship.phone" label="Teléfono" variant="outlined" density="comfortable" />
              <v-text-field v-model="ship.address1" label="Dirección" variant="outlined" density="comfortable" />
              <v-text-field v-model="ship.city" label="Ciudad" variant="outlined" density="comfortable" />
            </div>

            <v-divider class="my-3" />

            <v-btn
              color="primary"
              block
              size="large"
              :disabled="!canCheckout"
              @click="confirm"
            >
              Confirmar compra
            </v-btn>

            <div v-if="!items.length" class="text-caption text-medium-emphasis mt-2">
              Agregá productos para continuar.
            </div>

            <div v-else-if="fulfillment === 'pickup' && !pickupBranchId" class="text-caption text-medium-emphasis mt-2">
              Elegí una sucursal para retiro.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { getBranches } from "@/modules/shop/service/shop.public.api";

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

// ✅ Fulfillment selector (sucursal solo acá)
const fulfillment = ref("pickup");
const branches = ref([]);
const loadingBranches = ref(false);
const pickupBranchId = ref(null);

const ship = ref({
  name: "",
  phone: "",
  address1: "",
  city: "",
});

const canCheckout = computed(() => {
  if (!items.value.length) return false;
  if (fulfillment.value === "pickup") return !!pickupBranchId.value;
  return !!ship.value.name && !!ship.value.phone;
});

onMounted(async () => {
  loadingBranches.value = true;
  try {
    branches.value = await getBranches();
  } finally {
    loadingBranches.value = false;
  }
});

function confirm() {
  const payload = {
    items: items.value.map((it) => ({ product_id: it.product_id, qty: it.qty })),
    fulfillment: fulfillment.value,
    pickup_branch_id: fulfillment.value === "pickup" ? pickupBranchId.value : null,
    shipping: fulfillment.value === "delivery" ? ship.value : null,
  };

  console.log("✅ CHECKOUT PAYLOAD", payload);
  alert("OK: checkout armado (ver consola). Siguiente paso: crear pedido y pago.");
}
</script>
