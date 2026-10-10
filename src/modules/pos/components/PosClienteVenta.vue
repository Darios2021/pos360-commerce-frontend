<!-- src/modules/pos/components/PosClienteVenta.vue
     Cliente de la ficha para la venta en curso. Se elige en el carrito, antes
     de cobrar, porque define el precio: si es mayorista, todo el carrito pasa
     a precio Revendedor (pos.store: setClienteVenta / setUsarPrecioMayorista).
     Diseño de Zondito: sin cliente, el campo; con cliente, la ficha verde y,
     si es mayorista, el selector de precio con el estilo de Retiro/Delivery. -->
<template>
  <div class="cv">
    <!-- Sin cliente: un botón que abre la ventana Cliente (F3), con el
         buscador grande y la pestaña de mayoristas. -->
    <button v-if="!cliente" type="button" class="cv-elegir" :disabled="disabled" @click="abrirBuscador">
      <span class="cv-elegir__ic"><v-icon size="22">mdi-account-search-outline</v-icon></span>
      <span class="cv-elegir__txt"><small>Cliente</small><b>Consumidor final</b></span>
      <span class="cv-tk">F3</span>
    </button>

    <template v-else>
      <div class="cv-ficha" :class="{ 'cv-ficha--may': mayorista }">
        <span class="cv-avatar">{{ inicial }}</span>
        <span class="cv-datos">
          <span class="cv-nombre">{{ cliente.display_name }}</span>
          <span v-if="mayorista" class="cv-tag">Mayorista</span>
          <span v-else class="cv-sub">{{ subtitulo }}</span>
        </span>
        <button type="button" class="cv-btn" :disabled="disabled" title="Cambiar cliente" aria-label="Cambiar cliente" @click="abrirBuscador">
          <v-icon size="20">mdi-account-switch-outline</v-icon>
        </button>
        <button type="button" class="cv-btn cv-btn--sacar" :disabled="disabled" title="Sacar el cliente de esta venta" aria-label="Sacar el cliente de esta venta" @click="elegir(null)">
          <v-icon size="20">mdi-close</v-icon>
        </button>
      </div>
      <div v-if="mayorista" class="cv-precio" role="radiogroup" aria-label="Precio de la venta">
        <button type="button" class="cv-seg" :class="{ 'is-on': aplicado }" :disabled="disabled" @click="usarRevendedor(true)">
          <v-icon size="20">mdi-tag-outline</v-icon>Revendedor
        </button>
        <button type="button" class="cv-seg" :class="{ 'is-on': !aplicado }" :disabled="disabled" @click="usarRevendedor(false)">
          <v-icon size="20">mdi-cash</v-icon>Normal
        </button>
      </div>
    </template>

    <PosClienteDialog v-if="posStore" v-model="buscadorAbierto" :pos-store="posStore" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { listCustomers } from "@/modules/admin/services/customers.service";
import PosClienteDialog from "./modales/PosClienteDialog.vue";
import { esMayorista } from "@/app/utils/clienteMayorista";

const props = defineProps({
  posStore: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
});

const busqueda = ref("");
const opciones = ref([]);
const buscando = ref(false);

const cliente = computed(() => props.posStore?.clienteVenta || null);
const mayorista = computed(() => esMayorista(cliente.value));
const aplicado = computed(() => mayorista.value && props.posStore?.usarPrecioMayorista !== false);
const inicial = computed(() => String(cliente.value?.display_name || "?").trim().charAt(0).toUpperCase());
const subtitulo = computed(() => {
  const c = cliente.value || {};
  if (mayorista.value) return "Cliente mayorista";
  return [c.doc_number, c.phone].filter(Boolean).join(" · ") || "Cliente de la ficha";
});

let reloj = null;
let turno = 0;
watch(busqueda, (q) => {
  clearTimeout(reloj);
  const texto = String(q || "").trim();
  if (texto.length < 2) return;
  reloj = setTimeout(async () => {
    const mio = ++turno;
    buscando.value = true;
    try {
      const { data } = await listCustomers({ q: texto, limit: 15, is_active: 1 });
      if (mio === turno) opciones.value = data?.data || [];
    } catch {
      if (mio === turno) opciones.value = [];
    } finally {
      if (mio === turno) buscando.value = false;
    }
  }, 300);
});

function elegir(c) {
  props.posStore?.setClienteVenta?.(c && c.id ? c : null);
  busqueda.value = "";
  opciones.value = [];
}

// La misma ventana Cliente de F3, montada acá para que también ande en el
// celular, donde no está la barra de teclas.
const buscadorAbierto = ref(false);
function abrirBuscador() {
  buscadorAbierto.value = true;
}

function usarRevendedor(activo) {
  props.posStore?.setUsarPrecioMayorista?.(activo);
}
</script>

<style scoped>
.cv { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-bottom: 1px solid var(--z-linea, rgba(15, 23, 42, 0.06)); }
.cv-elegir { width: 100%; height: 56px; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 8px; border-radius: 12px; border: 1px solid #c9d5e1; background: #ffffff; cursor: pointer; text-align: left; transition: background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease; }
.cv-elegir:hover:not(:disabled) { background: #cfe5f5; border-color: #3f8fc6; box-shadow: inset 0 0 0 1px #3f8fc6; }
.cv-elegir:disabled { opacity: 0.5; cursor: not-allowed; }
.cv-elegir__ic { width: 40px; height: 40px; border-radius: 10px; background: rgba(14, 165, 233, 0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cv-elegir__ic .v-icon { color: #0369a1; }
.cv-elegir__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.cv-elegir__txt small { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #5a6678; }
.cv-elegir__txt b { font-size: 15px; font-weight: 800; color: #0f172a; }
.cv-tk { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 26px; padding: 0 7px; border-radius: 6px; border: 1px solid rgba(100, 116, 139, 0.6); background: linear-gradient(#f8fafc, #cbd5e1); box-shadow: 0 2px 0 rgba(15, 23, 42, 0.45); color: #1e293b; font: 900 13px ui-monospace, Menlo, Consolas, monospace; }
.cv-ficha { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; border-radius: 12px; background: #e3f4ee; border: 1px solid #9fd5c2; }
.cv-ficha--may { background: #eef7fd; border-color: #8cc0e3; }
.cv-avatar { width: 40px; height: 40px; flex-shrink: 0; border-radius: 9999px; display: flex; align-items: center; justify-content: center; background: #2e9e7b; color: #ffffff; font: 900 16px Inter, sans-serif; }
.cv-ficha--may .cv-avatar { background: #0f6fae; }
.cv-datos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cv-nombre { font-size: 15px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-sub { font-size: 12px; font-weight: 600; color: #5a6678; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-tag { align-self: flex-start; padding: 1px 8px; border-radius: 9999px; background: #0f6fae; color: #ffffff; font-size: 10.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
.cv-btn { width: 34px; height: 34px; flex-shrink: 0; border-radius: 9px; border: 0; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.cv-btn .v-icon { color: #334155; }
.cv-btn:hover { background: rgba(15, 23, 42, 0.08); }
.cv-btn--sacar:hover { background: #fdeceb; }
.cv-btn--sacar:hover .v-icon { color: #a3322c; }
.cv-precio { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cv-seg { height: 46px; display: flex; align-items: center; justify-content: center; gap: 6px; border-radius: 10px; border: 1px solid #c9d5e1; background: #ffffff; color: #334155; font: 800 14px Inter, sans-serif; cursor: pointer; transition: background-color 120ms ease, border-color 120ms ease; }
.cv-seg .v-icon { color: #5a6678; }
.cv-seg:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
.cv-seg.is-on { background: #0f6fae; border-color: #0f6fae; color: #ffffff; box-shadow: 0 4px 12px rgba(15, 111, 174, 0.25); }
.cv-seg.is-on .v-icon { color: #ffffff; }
</style>
