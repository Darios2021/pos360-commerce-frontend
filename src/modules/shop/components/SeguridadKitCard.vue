<!-- src/modules/shop/components/SeguridadKitCard.vue -->
<!--
  Tarjeta de un kit de seguridad armado con productos del catalogo.

  El precio NO viene del kit: se suma en vivo desde los productos que lo
  componen, asi nunca queda un total viejo pegado. Si falta algun componente
  en el catalogo, la tarjeta lo dice en vez de mostrar un total incompleto.
-->
<template>
  <v-card variant="flat" rounded="lg" class="kit-card">
    <div class="kit-head">
      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" size="42" rounded="lg">
          <v-icon color="white">{{ kit.icono }}</v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <div class="kit-nombre">{{ kit.nombre }}</div>
          <div v-if="kit.ideal" class="kit-ideal">{{ kit.ideal }}</div>
        </div>
        <v-chip v-if="kit.etiqueta" color="primary" size="small" variant="flat" label>
          {{ kit.etiqueta }}
        </v-chip>
      </div>

      <p class="kit-resumen">{{ kit.resumen }}</p>
    </div>

    <!-- Miniaturas de lo que trae -->
    <div v-if="!cargando && componentes.length" class="kit-thumbs">
      <div v-for="c in componentes" :key="c.product_id" class="kit-thumb">
        <img v-if="c.image_url" :src="c.image_url" :alt="c.name" loading="lazy" />
        <v-icon v-else size="18" color="grey">mdi-package-variant</v-icon>
        <span v-if="c.qty > 1" class="kit-thumb-qty">{{ c.qty }}</span>
      </div>
    </div>

    <!-- Detalle -->
    <v-expansion-panels variant="accordion" flat class="kit-panels">
      <v-expansion-panel elevation="0">
        <v-expansion-panel-title class="kit-panel-title">
          Que trae el kit ({{ kit.componentes.length }} items)
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div v-if="cargando" class="py-2">
            <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-two-line" />
          </div>
          <ul v-else class="kit-lista">
            <li v-for="c in componentes" :key="c.product_id">
              <span class="kit-qty">{{ c.qty }}x</span>
              <router-link
                class="kit-link"
                :to="{ name: 'shopProduct', params: { id: c.product_id } }"
              >{{ c.name }}</router-link>
              <span class="kit-parcial">{{ money(c.precio * c.qty) }}</span>
            </li>
          </ul>
          <p v-if="faltantes.length" class="kit-aviso">
            {{ faltantes.length }} de los items no esta disponible en este momento.
          </p>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div v-if="!cargando && sinStock.length" class="kit-stock">
      <v-icon size="15" color="warning" class="mr-1">mdi-alert-outline</v-icon>
      Stock parcial: {{ sinStock.length }} de los items no alcanza para la
      cantidad del kit. Se agrega lo disponible.
    </div>

    <v-divider />

    <!-- Precio y accion -->
    <div class="kit-pie">
      <div>
        <div class="kit-precio-label">Total del kit</div>
        <div v-if="cargando" class="kit-precio-skel">
          <v-skeleton-loader type="text" width="140" />
        </div>
        <div v-else class="kit-precio">{{ money(total) }}</div>
        <div v-if="!cargando && totalLista > total" class="kit-lista-tachada">
          Precio de lista <s>{{ money(totalLista) }}</s>
        </div>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        :loading="cargando"
        :disabled="!componentes.length"
        @click="agregar"
      >
        Agregar el kit
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const props = defineProps({
  kit: { type: Object, required: true },
  // Mapa product_id -> producto del catalogo, lo provee la pagina para no
  // pedir 31 productos una vez por tarjeta.
  catalogo: { type: Object, default: () => ({}) },
  cargando: { type: Boolean, default: false },
});

const router = useRouter();
const cart = useShopCartStore();

function precioDe(p) {
  const n = (v) => Number(String(v ?? "").replace(",", ".")) || 0;
  const d = n(p?.price_discount);
  if (d > 0) return d;
  const l = n(p?.price_list);
  if (l > 0) return l;
  return n(p?.price);
}

const componentes = computed(() =>
  (props.kit.componentes || [])
    .map((c) => {
      const p = props.catalogo?.[c.product_id];
      if (!p) return null;
      return {
        product_id: Number(c.product_id),
        qty: Number(c.qty) || 1,
        nota: c.nota || "",
        name: p.name || c.nota || `Producto ${c.product_id}`,
        image_url: p.image_url || "",
        precio: precioDe(p),
        raw: p,
      };
    })
    .filter(Boolean)
);

const faltantes = computed(() =>
  (props.kit.componentes || []).filter((c) => !props.catalogo?.[c.product_id])
);

const total = computed(() =>
  componentes.value.reduce((a, c) => a + c.precio * c.qty, 0)
);

// Suma de los precios de lista. La diferencia contra el total NO es un ahorro
// por comprar el kit: es el descuento que cada producto ya tiene por su
// cuenta, y se obtiene igual comprandolos sueltos. Por eso se muestra como
// precio de lista tachado y no como "ahorras X".
//
// Un ahorro real recien existe si el kit se carga como producto con is_kit=1
// y precio propio por debajo de la suma de sus partes.
const totalLista = computed(() =>
  componentes.value.reduce((a, c) => {
    const l = Number(c.raw?.price_list) || c.precio;
    return a + l * c.qty;
  }, 0)
);

// Cuanto hay realmente de cada componente en la sucursal activa. El carrito
// clampea por stock, asi que un kit de 4 camaras con stock 1 entraria como 1
// sin avisar nada. Preferimos decirlo antes de que lo descubra en el carrito.
function disponible(p) {
  if (!p) return 0;
  const track = String(p.track_stock ?? 1);
  if (track === "0" || track === "false") return Infinity;

  const bid = Number(cart.branch_id) || 0;
  const lista = Array.isArray(p.stock_by_branch) ? p.stock_by_branch : [];
  if (bid && lista.length) {
    const f = lista.find((x) => Number(x?.branch_id) === bid);
    if (f) return Math.max(0, Number(f.qty) || 0);
  }
  return Math.max(0, Number(p.stock_qty) || 0);
}

const sinStock = computed(() =>
  componentes.value.filter((c) => disponible(c.raw) < c.qty)
);

function money(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
}

function agregar() {
  for (const c of componentes.value) cart.add(c.raw, c.qty);
  cart.openDrawer();
}
</script>

<style scoped>
.kit-card {
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e4e6ea;
}
.kit-head { padding: 18px 18px 12px; }
.kit-nombre { font-size: 16px; font-weight: 700; line-height: 1.3; }
.kit-ideal { font-size: 12.5px; color: #6b7280; margin-top: 2px; }
.kit-resumen { margin: 12px 0 0; font-size: 13.5px; color: #5b6478; line-height: 1.5; }

.kit-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 18px 14px;
}
.kit-thumb {
  position: relative;
  width: 46px;
  height: 46px;
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  background: #fafbfc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.kit-thumb img { width: 100%; height: 100%; object-fit: contain; }
.kit-thumb-qty {
  position: absolute;
  right: 0;
  bottom: 0;
  background: #121e47;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 6px 0 0 0;
}

.kit-panels { flex-grow: 1; }
.kit-panel-title { font-size: 13.5px; font-weight: 600; min-height: 44px; }

.kit-lista { list-style: none; margin: 0; padding: 0; }
.kit-lista li {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 8px;
  align-items: baseline;
  padding: 5px 0;
  font-size: 13px;
  border-bottom: 1px solid #f1f2f4;
}
.kit-lista li:last-child { border-bottom: 0; }
.kit-qty { font-weight: 700; color: #121e47; }
.kit-link { color: inherit; text-decoration: none; }
.kit-link:hover { color: #1488d1; text-decoration: underline; }
.kit-parcial { color: #6b7280; white-space: nowrap; font-variant-numeric: tabular-nums; }
.kit-aviso { margin: 10px 0 0; font-size: 12.5px; color: #b26a00; }

.kit-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  flex-wrap: wrap;
}
.kit-precio-label { font-size: 12px; color: #6b7280; }
.kit-precio {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.kit-precio-skel { height: 28px; }
.kit-lista-tachada { font-size: 12.5px; color: #6b7280; margin-top: 2px; }
.kit-stock {
  display: flex;
  align-items: flex-start;
  padding: 10px 18px;
  font-size: 12.5px;
  line-height: 1.45;
  color: #8a5a00;
  background: #fff8e6;
}
</style>
