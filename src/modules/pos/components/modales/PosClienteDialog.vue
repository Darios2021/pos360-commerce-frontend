<!-- src/modules/pos/components/modales/PosClienteDialog.vue -->
<!-- F3 Cliente de la venta: a la izquierda se busca uno de la ficha (flechas
     y Enter lo asignan); a la derecha se da de alta uno nuevo y queda
     asignado a la venta sin salir del POS. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Cliente de la venta"
    :sub="actual ? `Ahora: ${actual.display_name}` : 'Ahora: consumidor final'"
    tecla="F3"
    icono="mdi-account-plus-outline"
    :ancho="1080"
    :accion="modo === 'nuevo' ? 'Guardar y asignar a la venta' : 'Asignar a la venta'"
    accion-icono="mdi-account-check-outline"
    :accion-deshabilitada="modo === 'nuevo' ? !nuevo.display_name.trim() : sel < 0"
    :cargando="guardando"
    @update:model-value="emit('update:modelValue', $event)"
    @abierto="enfocar"
    @accion="confirmar"
  >
    <div class="pcl">
      <div class="pcl-izq" :class="{ 'is-activo': modo === 'buscar' }" @click="modo = 'buscar'">
        <span class="pm-lab">Buscar cliente</span>
        <label class="pcl-busca">
          <v-icon size="22">mdi-magnify</v-icon>
          <input ref="campoBusca" v-model="q" type="text" autocomplete="off" placeholder="DNI, nombre o teléfono" @focus="modo = 'buscar'" />
          <v-progress-circular v-if="buscando" indeterminate size="18" width="2" color="primary" />
        </label>
        <div ref="listaRef" class="pcl-lista">
          <div class="pm-fila pcl-fila" :class="{ 'is-on': modo === 'buscar' && sel === 0 }" @click="sel = 0" @dblclick="sel = 0; confirmar()">
            <v-icon size="22">mdi-account-outline</v-icon>
            <span class="pcl-n">Consumidor final</span>
          </div>
          <div v-for="(c, i) in resultados" :key="c.id" class="pm-fila pcl-fila" :class="{ 'is-on': modo === 'buscar' && sel === i + 1 }" @click="sel = i + 1" @dblclick="sel = i + 1; confirmar()">
            <v-icon size="22" :color="esMayorista(c) ? 'primary' : undefined">mdi-card-account-details-outline</v-icon>
            <span class="pcl-txt">
              <span class="pcl-n pm-c1">{{ c.display_name }}</span>
              <span class="pcl-s pm-c1">{{ esMayorista(c) ? "mayorista" : [c.doc_number, c.phone].filter(Boolean).join(" · ") || "sin datos de contacto" }}</span>
            </span>
          </div>
          <div v-if="q.trim().length >= 2 && !buscando && !resultados.length" class="pcl-nada">Sin resultados</div>
        </div>
      </div>

      <div class="pcl-der" :class="{ 'is-activo': modo === 'nuevo' }" @click="modo = 'nuevo'">
        <span class="pm-lab">Cliente nuevo</span>
        <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
        <div class="pcl-campos">
          <label class="pcl-c pcl-c--ancho"><span>Nombre o razón social</span><input v-model="nuevo.display_name" type="text" maxlength="160" @focus="modo = 'nuevo'" /></label>
          <label class="pcl-c"><span>DNI / CUIT</span><input v-model="nuevo.doc_number" type="text" inputmode="numeric" maxlength="20" placeholder="Solo números" @focus="modo = 'nuevo'" /></label>
          <label class="pcl-c"><span>Teléfono</span><input v-model="nuevo.phone" type="tel" maxlength="40" @focus="modo = 'nuevo'" /></label>
        </div>
        <span class="pcl-et">Condición frente al IVA</span>
        <div class="pcl-tipos">
          <button v-for="t in TIPOS" :key="t.v" type="button" class="pm-op pcl-tipo" :class="{ 'is-on': nuevo.customer_type === t.v }" @click="modo = 'nuevo'; nuevo.customer_type = t.v">{{ t.t }}</button>
        </div>
        <label class="pcl-sw"><v-switch v-model="nuevo.mayorista" inset density="compact" hide-details color="primary" />Precio revendedor</label>
      </div>
    </div>
  </PosModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import PosModal from "./PosModal.vue";
import { useTeclasModal } from "../../composables/useTeclasModal";
import { listCustomers, createCustomer, getCustomer } from "@/modules/admin/services/customers.service";
import { esMayorista, conMayorista } from "@/app/utils/clienteMayorista";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  posStore: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue", "asignado"]);

const TIPOS = [
  { v: "CONSUMIDOR_FINAL", t: "Consumidor final" },
  { v: "RESPONSABLE_INSCRIPTO", t: "Resp. inscripto" },
  { v: "MONOTRIBUTO", t: "Monotributo" },
  { v: "EXENTO", t: "Exento" },
];

const abierto = computed(() => props.modelValue);
const actual = computed(() => props.posStore?.clienteVenta || null);
const modo = ref("buscar");
const campoBusca = ref(null);
const listaRef = ref(null);
const q = ref("");
const resultados = ref([]);
const buscando = ref(false);
const sel = ref(0);
const guardando = ref(false);
const error = ref("");
const nuevo = reactive({ display_name: "", doc_number: "", phone: "", customer_type: "CONSUMIDOR_FINAL", mayorista: false });

function enfocar() { nextTick(() => campoBusca.value?.focus()); }

let reloj = null;
let turno = 0;
watch(q, (v) => {
  clearTimeout(reloj);
  const texto = String(v || "").trim();
  if (texto.length < 2) { resultados.value = []; sel.value = 0; return; }
  reloj = setTimeout(async () => {
    const mio = ++turno;
    buscando.value = true;
    try {
      const { data } = await listCustomers({ q: texto, limit: 15, is_active: 1 });
      if (mio !== turno) return;
      resultados.value = data?.data || [];
      sel.value = resultados.value.length ? 1 : 0;
    } catch {
      if (mio === turno) resultados.value = [];
    } finally {
      if (mio === turno) buscando.value = false;
    }
  }, 300);
});

function asignar(c) {
  props.posStore?.setClienteVenta?.(c && c.id ? c : null);
  emit("asignado", c);
  emit("update:modelValue", false);
}

async function confirmar() {
  if (modo.value === "buscar") {
    asignar(sel.value === 0 ? null : resultados.value[sel.value - 1]);
    return;
  }
  if (!nuevo.display_name.trim() || guardando.value) return;
  guardando.value = true;
  error.value = "";
  try {
    const { data } = await createCustomer({
      display_name: nuevo.display_name.trim(),
      doc_type: nuevo.doc_number.replace(/\D/g, "").length === 11 ? "CUIT" : "DNI",
      doc_number: nuevo.doc_number.replace(/\D/g, "") || null,
      phone: nuevo.phone.trim() || null,
      customer_type: nuevo.customer_type,
      tags: conMayorista("", nuevo.mayorista) || null,
      source: "pos",
    });
    asignar(data?.data);
  } catch (e) {
    // Documento repetido: se usa el cliente que ya está en la ficha.
    const id = e?.response?.data?.data?.id;
    if (e?.response?.status === 409 && id) {
      try { const r = await getCustomer(id); asignar(r?.data?.data); return; } catch { /* sigue al error */ }
    }
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar el cliente";
  } finally {
    guardando.value = false;
  }
}

watch(abierto, (v) => {
  if (!v) return;
  modo.value = "buscar";
  q.value = "";
  resultados.value = [];
  sel.value = 0;
  error.value = "";
  Object.assign(nuevo, { display_name: "", doc_number: "", phone: "", customer_type: "CONSUMIDOR_FINAL", mayorista: false });
});

function mover(d) {
  const n = resultados.value.length + 1;
  sel.value = (sel.value + d + n) % n;
  nextTick(() => listaRef.value?.querySelector(".pm-fila.is-on")?.scrollIntoView({ block: "nearest" }));
}

useTeclasModal(abierto, (e) => {
  if (modo.value === "buscar" && e.key === "ArrowDown") { mover(1); return true; }
  if (modo.value === "buscar" && e.key === "ArrowUp") { mover(-1); return true; }
  if (e.key === "Enter") { confirmar(); return true; }
  return false;
});
</script>

<style>
.pcl { display: flex; min-height: 100%; }
.pcl-izq { width: 380px; flex-shrink: 0; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; background: #f8fbfd; border-right: 1px solid #e3eaf1; }
.pcl-der { flex: 1; min-width: 0; padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; opacity: 0.75; transition: opacity 120ms ease; }
.pcl-der.is-activo { opacity: 1; }
.pcl-busca { height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border-radius: 12px; border: 1px solid #c9d5e1; background: #ffffff; }
.pcl-izq.is-activo .pcl-busca { border: 2px solid #0f6fae; box-shadow: 0 0 0 4px rgba(15, 111, 174, 0.14); }
.pcl-busca .v-icon { color: #5a6678; }
.pcl-busca input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: 600 16px Inter, sans-serif; color: #0f172a; }
.pcl-lista { display: flex; flex-direction: column; gap: 6px; max-height: 46vh; overflow-y: auto; }
.pcl-fila { background: #ffffff; border: 1px solid #d3dde7; padding: 10px 12px; }
.pcl-fila .v-icon { color: #5a6678; }
.pcl-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pcl-n { font-size: 15px; font-weight: 800; }
.pcl-s { font-size: 12px; font-weight: 700; color: #5a6678; }
.pcl-nada { font-size: 14px; color: #5a6678; padding: 6px 2px; }
.pcl-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pcl-c { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pcl-c--ancho { grid-column: 1 / -1; }
.pcl-c span, .pcl-et { font-size: 13px; font-weight: 700; color: #334155; }
.pcl-c input { height: 52px; padding: 0 14px; border-radius: 12px; border: 1px solid #c9d5e1; font: 600 16px Inter, sans-serif; color: #0f172a; outline: 0; min-width: 0; }
.pcl-c input:focus { border: 2px solid #0f6fae; box-shadow: 0 0 0 4px rgba(15, 111, 174, 0.14); }
.pcl-tipos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.pcl-tipo { padding: 12px !important; font-size: 14px; font-weight: 800; align-items: center !important; }
.pcl-sw { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; cursor: pointer; }
</style>
