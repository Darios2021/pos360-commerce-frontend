<!-- src/modules/pos/components/modales/PosPrecioDialog.vue -->
<!-- F4 Consulta de precio: se escanea o escribe el código y muestra los tres
     precios y el stock por sucursal. Enter busca; con el producto a la vista,
     Enter lo agrega al carrito. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Consulta de precio"
    tecla="F4"
    icono="mdi-tag-outline"
    :ancho="960"
    accion="Agregar al carrito"
    accion-icono="mdi-cart-plus"
    :accion-deshabilitada="!producto || sinStock"
    @update:model-value="emit('update:modelValue', $event)"
    @abierto="enfocar"
    @accion="agregar"
  >
    <div class="pp">
      <label class="pm-in">
        <v-icon size="28">mdi-barcode-scan</v-icon>
        <input ref="campo" v-model="q" type="text" autocomplete="off" placeholder="Código, código de barras o nombre" />
        <v-progress-circular v-if="cargando" indeterminate size="22" width="3" color="primary" />
      </label>

      <div v-if="producto" class="pp-ficha">
        <span class="pm-foto pp-foto"><img v-if="productImage(producto)" :src="productImage(producto)" alt="" /><v-icon v-else size="48">mdi-image-outline</v-icon></span>
        <div class="pp-datos">
          <div>
            <span class="pp-meta">{{ [producto.brand, producto.code || producto.sku, rubro].filter(Boolean).join(" · ") }}</span>
            <div class="pp-nombre">{{ producto.name }}</div>
          </div>
          <div class="pp-tres">
            <div class="pp-pr is-on"><span class="pm-lab">Contado</span><span class="num">{{ pesos(contado) }}</span></div>
            <div class="pp-pr"><span class="pm-lab">Lista</span><span class="num">{{ pesos(producto.price_list) }}</span></div>
            <div class="pp-pr"><span class="pm-lab">Revendedor</span><span class="num" :class="{ 'pp-tenue': !(Number(producto.price_reseller) > 0) }">{{ Number(producto.price_reseller) > 0 ? pesos(producto.price_reseller) : "—" }}</span></div>
          </div>
          <span class="pm-lab">Stock por sucursal</span>
          <div v-if="sucursales.length" class="pp-sucs">
            <div v-for="s in sucursales" :key="s.branch_id" class="pp-suc" :class="{ 'is-esta': Number(s.branch_id) === Number(branchId) }">
              <span class="pm-c1">{{ s.branch_name }}</span>
              <b class="num" :class="{ 'pp-tenue': !(Number(s.current_qty) > 0) }">{{ Number(s.current_qty) || 0 }}</b>
            </div>
          </div>
          <span v-else class="pm-stock" :class="Number(stock) > 3 ? 'ok' : Number(stock) > 0 ? 'poco' : ''"><i></i>{{ Number(stock) > 0 ? `${stock} en stock` : "sin stock" }}</span>
        </div>
      </div>
      <div v-else-if="buscado && !cargando" class="pm-vacio">Sin resultados para «{{ buscado }}»</div>
    </div>
  </PosModal>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import http from "@/app/api/http";
import PosModal from "./PosModal.vue";
import { useTeclasModal } from "../../composables/useTeclasModal";
import { usePosImages } from "../../composables/usePosImages";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  branchId: { type: Number, default: 0 },
});
const emit = defineEmits(["update:modelValue", "agregar"]);

const { productImage } = usePosImages();
const abierto = computed(() => props.modelValue);
const campo = ref(null);
const q = ref("");
const buscado = ref("");
const producto = ref(null);
const sucursales = ref([]);
const cargando = ref(false);

const pesos = (n) => `$ ${Math.round(Number(n || 0)).toLocaleString("es-AR")}`;
const contado = computed(() => Number(producto.value?.price_discount ?? producto.value?.effective_price ?? producto.value?.price ?? 0));
const stock = computed(() => Number(producto.value?.stock_qty ?? producto.value?.qty ?? 0));
const sinStock = computed(() => producto.value?.track_stock !== false && stock.value <= 0);
const rubro = computed(() => producto.value?.category?.name || producto.value?.category_name || "");

function enfocar() {
  nextTick(() => { campo.value?.focus(); campo.value?.select(); });
}

async function buscar() {
  const texto = q.value.trim();
  if (!texto) return;
  cargando.value = true;
  buscado.value = texto;
  try {
    const { data } = await http.get("/pos/products", {
      params: { q: texto, page: 1, limit: 30, branch_id: props.branchId || undefined, in_stock: "false", sellable: "true" },
    });
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const t = texto.toLowerCase();
    producto.value = rows.find((p) => [p?.barcode, p?.sku, p?.code].some((c) => String(c || "").trim().toLowerCase() === t)) || rows[0] || null;
    sucursales.value = [];
    if (producto.value?.id) {
      try {
        const r = await http.get(`/products/${producto.value.id}/branches`);
        sucursales.value = (Array.isArray(r?.data?.data) ? r.data.data : []).filter((s) => Number(s.enabled) || Number(s.current_qty));
      } catch { sucursales.value = []; }
    }
  } catch {
    producto.value = null;
  } finally {
    cargando.value = false;
    enfocar();
  }
}

function agregar() {
  if (!producto.value || sinStock.value) return;
  emit("agregar", { product: producto.value, qty: 1 });
  emit("update:modelValue", false);
}

useTeclasModal(abierto, (e) => {
  if (e.key !== "Enter") return false;
  // Con el producto ya consultado y el campo sin cambios, Enter lo agrega.
  if (producto.value && q.value.trim() === buscado.value) agregar();
  else buscar();
  return true;
});
</script>

<style>
.pp { display: flex; flex-direction: column; gap: 16px; padding: 18px 22px 22px; }
.pp-ficha { display: flex; gap: 20px; }
.pp-foto { width: 200px; height: 200px; }
.pp-datos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.pp-meta { font-size: 12px; font-weight: 700; color: #5a6678; }
.pp-nombre { font-size: 24px; font-weight: 900; line-height: 1.2; }
.pp-tres { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.pp-pr { display: flex; flex-direction: column; padding: 12px 14px; border-radius: 12px; border: 1px solid #d3dde7; }
.pp-pr > span:last-child { font-size: 28px; font-weight: 900; }
.pp-pr.is-on { background: #eef7fd; border: 2px solid #0f6fae; }
.pp-pr.is-on .pm-lab { color: #0a466e; }
.pp-sucs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.pp-suc { display: flex; flex-direction: column; padding: 10px 12px; border-radius: 10px; border: 1px solid #d3dde7; font-size: 12px; font-weight: 700; color: #5a6678; }
.pp-suc b { font-size: 22px; font-weight: 900; color: #0f172a; }
.pp-suc.is-esta { background: #eef7fd; border: 2px solid #0f6fae; }
.pp-tenue { color: #94a3b8 !important; }
</style>
