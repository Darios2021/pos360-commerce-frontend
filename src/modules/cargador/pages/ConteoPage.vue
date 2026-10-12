<!--
  Conteo (maqueta, "conteo"): depósito, rubro, chips Todos / Iguales / Con
  diferencia (suman el total), cada producto con su stock del sistema, lo
  contado (stepper) y la diferencia. Lector por lote para contar. El conteo
  vive en el servidor (/stock/counts): se retoma en otro teléfono.
-->
<template>
  <MovilVista titulo="Conteo" :volver="{ name: 'home' }">
    <template #barra>
      <span v-if="sucursal" class="m-pill suc"><i></i>{{ sucursal }}</span>
    </template>
    <div v-if="error" class="m-error">{{ error }}</div>
    <div class="m-cmp">
      <label for="co-dep">Depósito</label>
      <select id="co-dep" v-model.number="conteo.warehouseId" class="m-inp" :disabled="conteo.lineas.length > 0">
        <option v-for="w in depositos" :key="w.id" :value="Number(w.id)">{{ rotuloDeposito(w) }}</option>
      </select>
    </div>
    <div class="m-cmp">
      <label for="co-rub">Rubro</label>
      <select id="co-rub" v-model.number="conteo.categoryId" class="m-inp">
        <option :value="null">Todos</option>
        <option v-for="c in rubros" :key="c.id" :value="Number(c.id)">{{ c.name }}</option>
      </select>
    </div>
    <div class="m-chips">
      <button v-for="c in chips" :key="c.v" type="button" class="m-chip num" :class="{ on: filtro === c.v }" @click="filtro = c.v">{{ c.t }} {{ c.n }}</button>
    </div>
    <div class="m-pz">
      <div class="m-pz-h"><h3>Contados</h3><span>{{ conteo.estado === "pending" ? "Enviado para aprobar" : "Sistema · Contado" }}</span></div>
      <div v-if="!visibles.length" class="m-ln"><span class="tx"><small>Sin productos contados</small></span></div>
      <div v-for="l in visibles" :key="l.product_id" class="m-ln">
        <span class="tx"><b>{{ l.name }}</b><small class="num">Sistema {{ cant(l.sistema) }}</small></span>
        <span class="m-stp">
          <button type="button" aria-label="Menos" :disabled="!puedeEditar || l.contado <= 0" @click="fijar(l, l.contado - 1)"><v-icon size="20">mdi-minus</v-icon></button>
          <span class="num">{{ cant(l.contado) }}</span>
          <button type="button" aria-label="Más" :disabled="!puedeEditar" @click="fijar(l, l.contado + 1)"><v-icon size="20">mdi-plus</v-icon></button>
        </span>
        <span class="m-dif num" :style="{ color: colorDif(l) }">{{ textoDif(l) }}</span>
      </div>
      <div class="m-pz-f" style="padding-top: 12px">
        <router-link :to="{ name: 'lote', query: { modo: 'contar' } }" class="m-btn" :class="{ 'is-off': !puedeEditar }"><v-icon size="20">mdi-barcode-scan</v-icon>Escanear</router-link>
      </div>
    </div>
    <MovilAviso />
    <template #pie>
      <router-link :to="{ name: 'conteoDiferencias' }" class="m-btn" :class="{ 'is-off': !conteo.lineas.length }">Revisar diferencias</router-link>
    </template>
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import http from "@/app/api/http";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { cant } from "../lib/formato";
import { avisar } from "../lib/aviso";
import { cargarDepositos, depositoPropio, depositos, rotuloDeposito } from "../lib/depositos";
import { textoError } from "../services/conteos.service";
import { abrirConteo, conteo, diferencia, fijarContado, nuevoConteo, refrescarConteo, retomarBorrador } from "../state/conteo";

const auth = useAuthStore();
const route = useRoute();
const filtro = ref("");
const rubros = ref([]);
const error = ref("");

const deposito = computed(() => depositos.value.find((w) => Number(w.id) === Number(conteo.warehouseId)) || null);
const sucursal = computed(() => deposito.value?.branch?.name || "");
// En "pending" sólo el administrador corrige (lo dice la API).
const puedeEditar = computed(() => conteo.estado !== "pending" || auth.isAdmin);

const delRubro = computed(() =>
  conteo.lineas.filter((l) => !conteo.categoryId || !conteo.rubros[l.product_id] || Number(conteo.rubros[l.product_id]) === Number(conteo.categoryId))
);
const iguales = computed(() => delRubro.value.filter((l) => diferencia(l) === 0));
const conDif = computed(() => delRubro.value.filter((l) => diferencia(l) !== 0));
const chips = computed(() => [
  { v: "", t: "Todos", n: delRubro.value.length },
  { v: "ok", t: "Iguales", n: iguales.value.length },
  { v: "dif", t: "Con diferencia", n: conDif.value.length },
]);
const visibles = computed(() => (filtro.value === "ok" ? iguales.value : filtro.value === "dif" ? conDif.value : delRubro.value));

const textoDif = (l) => { const d = diferencia(l); return d ? (d > 0 ? "+" : "−") + cant(Math.abs(d)) : "="; };
const colorDif = (l) => { const d = diferencia(l); return d ? (d < 0 ? "var(--m-rojo)" : "var(--m-ocre)") : "var(--m-verde)"; };

async function fijar(l, q) {
  try { await fijarContado(l.product_id, q); } catch (e) { avisar(textoError(e)); }
}

watch(() => conteo.warehouseId, (n, o) => {
  if (o && n !== o && !conteo.lineas.length) {
    nuevoConteo(n);
    retomarBorrador({ esAdmin: auth.isAdmin });
  }
});

onMounted(async () => {
  const lista = await cargarDepositos();
  if (!conteo.warehouseId) conteo.warehouseId = depositoPropio(lista, auth.branchId)?.id || null;
  // ?id= viene del aviso push "Conteo para aprobar": abre ese conteo.
  if (route.query.id) await abrirConteo(route.query.id);
  await refrescarConteo();
  await retomarBorrador({ esAdmin: auth.isAdmin });
  try {
    const { data } = await http.get("/categories");
    const f = Array.isArray(data) ? data : data?.items || data?.data || data?.rows || [];
    rubros.value = f.filter((c) => c && c.id && !c.parent_id && c.is_active !== false);
  } catch { rubros.value = []; }
});
</script>

<style>
.m-btn.is-off { opacity: 0.45; pointer-events: none; }
</style>
