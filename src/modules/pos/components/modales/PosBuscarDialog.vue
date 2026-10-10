<!-- src/modules/pos/components/modales/PosBuscarDialog.vue -->
<!-- F2 Buscar producto: nombre, código o lector. Flechas eligen, + y −
     cambian la cantidad, Enter agrega y deja la ventana lista para el
     siguiente producto. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Buscar producto"
    sub="Nombre, código o lector"
    tecla="F2"
    icono="mdi-magnify"
    :ancho="960"
    :accion="actual ? `Agregar ${cantidad} al carrito` : 'Agregar al carrito'"
    accion-icono="mdi-cart-plus"
    :accion-deshabilitada="!actual || sinStock(actual)"
    @update:model-value="emit('update:modelValue', $event)"
    @abierto="enfocar"
    @accion="agregar"
  >
    <div class="pb">
      <label class="pm-in">
        <v-icon size="28">mdi-barcode-scan</v-icon>
        <input ref="campo" v-model="q" type="text" autocomplete="off" placeholder="Escribí o escaneá" />
        <span v-if="q.trim().length >= 2 && !cargando" class="pb-cuenta num">{{ filas.length }} {{ filas.length === 1 ? "resultado" : "resultados" }}</span>
        <v-progress-circular v-if="cargando" indeterminate size="22" width="3" color="primary" />
      </label>

      <div v-if="filas.length" ref="listaRef" class="pb-lista">
        <div
          v-for="(p, i) in filas"
          :key="p.id"
          class="pm-fila"
          :class="{ 'is-on': i === sel, 'is-off': sinStock(p) }"
          @click="sel = i"
          @dblclick="sel = i; agregar()"
        >
          <span class="pm-foto"><img v-if="productImage(p)" :src="productImage(p)" alt="" /><v-icon v-else size="26">mdi-image-outline</v-icon></span>
          <span class="pb-txt">
            <span class="pb-nombre pm-c1">{{ p.name }}</span>
            <span class="pb-sub pm-c1">{{ [p.brand, p.code || p.sku].filter(Boolean).join(" · ") }}</span>
            <span class="pm-stock" :class="claseStock(p)"><i></i>{{ textoStock(p) }}</span>
          </span>
          <span v-if="i === sel" class="pm-cant" @click.stop>
            <button type="button" @click="cambiar(-1)">−</button>
            <span class="num">{{ cantidad }}</span>
            <button type="button" @click="cambiar(1)">+</button>
          </span>
          <span class="pb-precio">
            <span class="num">{{ pesos(contado(p)) }}</span>
            <small v-if="lista(p) > contado(p)" class="num">lista {{ pesos(lista(p)) }}</small>
          </span>
        </div>
      </div>
      <div v-else-if="q.trim().length >= 2 && !cargando" class="pm-vacio">Sin resultados para «{{ q.trim() }}»</div>
    </div>
  </PosModal>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import http from "@/app/api/http";
import PosModal from "./PosModal.vue";
import { useTeclasModal, enCampo } from "../../composables/useTeclasModal";
import { usePosImages } from "../../composables/usePosImages";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  branchId: { type: Number, default: 0 },
});
const emit = defineEmits(["update:modelValue", "agregar"]);

const { productImage, prefetchImagesForVisible } = usePosImages();
const abierto = computed(() => props.modelValue);
const campo = ref(null);
const listaRef = ref(null);
const q = ref("");
const filas = ref([]);
const sel = ref(0);
const cantidad = ref(1);
const cargando = ref(false);
const actual = computed(() => filas.value[sel.value] || null);

const pesos = (n) => `$ ${Math.round(Number(n || 0)).toLocaleString("es-AR")}`;
const contado = (p) => Number(p?.price_discount ?? p?.effective_price ?? p?.price ?? 0);
const lista = (p) => Number(p?.price_list || 0);
const stockDe = (p) => Number(p?.stock_qty ?? p?.qty ?? 0);
const sinStock = (p) => p?.track_stock !== false && stockDe(p) <= 0;
const claseStock = (p) => (stockDe(p) > 3 ? "ok" : stockDe(p) > 0 ? "poco" : "");
const textoStock = (p) => (stockDe(p) > 0 ? `${stockDe(p)} en stock` : "sin stock");

function enfocar() {
  nextTick(() => { campo.value?.focus(); campo.value?.select(); });
}

let reloj = null;
let turno = 0;
watch(q, (v) => {
  clearTimeout(reloj);
  const texto = String(v || "").trim();
  if (texto.length < 2) { filas.value = []; return; }
  reloj = setTimeout(() => buscar(texto), 250);
});

async function buscar(texto) {
  const mio = ++turno;
  cargando.value = true;
  try {
    const { data } = await http.get("/pos/products", {
      params: { q: texto, page: 1, limit: 30, branch_id: props.branchId || undefined, in_stock: "false", sellable: "true" },
    });
    if (mio !== turno) return;
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    // El código exacto (lector) va primero.
    const t = texto.toLowerCase();
    rows.sort((a, b) => Number(esCodigo(b, t)) - Number(esCodigo(a, t)));
    filas.value = rows;
    sel.value = 0;
    cantidad.value = 1;
    prefetchImagesForVisible(rows.slice(0, 12));
  } catch {
    if (mio === turno) filas.value = [];
  } finally {
    if (mio === turno) cargando.value = false;
  }
}
function esCodigo(p, t) {
  return [p?.barcode, p?.sku, p?.code].some((c) => String(c || "").trim().toLowerCase() === t);
}

function mover(d) {
  if (!filas.value.length) return;
  sel.value = (sel.value + d + filas.value.length) % filas.value.length;
  cantidad.value = 1;
  nextTick(() => listaRef.value?.querySelector(".pm-fila.is-on")?.scrollIntoView({ block: "nearest" }));
}
function cambiar(d) { cantidad.value = Math.max(1, cantidad.value + d); }

function agregar() {
  const p = actual.value;
  if (!p || sinStock(p)) return;
  emit("agregar", { product: p, qty: cantidad.value });
  q.value = "";
  filas.value = [];
  cantidad.value = 1;
  enfocar();
}

useTeclasModal(abierto, (e) => {
  if (e.key === "ArrowDown") { mover(1); return true; }
  if (e.key === "ArrowUp") { mover(-1); return true; }
  // + siempre suma; − sólo el del teclado numérico o fuera del campo, porque
  // el guion aparece en los nombres ("USB-C").
  if (e.key === "+" && actual.value) { cambiar(1); return true; }
  if (e.key === "-" && actual.value && (e.code === "NumpadSubtract" || !enCampo(e))) { cambiar(-1); return true; }
  if (e.key === "Enter") { agregar(); return true; }
  return false;
});

watch(abierto, (v) => { if (!v) { clearTimeout(reloj); } });
</script>

<style>
.pb { display: flex; flex-direction: column; gap: 14px; padding: 18px 22px; }
.pb-cuenta { font-size: 13px; font-weight: 700; color: #5a6678; white-space: nowrap; }
.pb-lista { display: flex; flex-direction: column; gap: 6px; max-height: 52vh; overflow-y: auto; }
.pb-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pb-nombre { font-size: 16px; font-weight: 800; }
.pb-sub { font-size: 13px; color: #5a6678; }
.pb-precio { display: flex; flex-direction: column; align-items: flex-end; min-width: 120px; }
.pb-precio > span { font-size: 22px; font-weight: 900; }
.pb-precio small { font-size: 12px; color: #5a6678; }
.pm-fila.is-off { opacity: 0.5; }
</style>
