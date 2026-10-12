<!--
  Nueva derivación (maqueta, "deriv-nueva"): origen (depósito), destino
  (sucursal), productos leídos por lote con su stock en el origen, nota,
  "Guardar borrador" y "Despachar N unidades". Con ?borrador=id retoma un
  borrador (origen y destino quedan fijos: la API sólo edita ítems y nota).
-->
<template>
  <MovilVista titulo="Nueva derivación" :volver="{ name: 'transfers' }">
    <div v-if="error" class="m-error">{{ error }}</div>
    <div class="m-cmp">
      <label for="dn-origen">Origen</label>
      <select id="dn-origen" v-model.number="d.origenWarehouseId" class="m-inp" :disabled="!!d.borradorId" @change="recalcularStock">
        <option v-for="w in depositos" :key="w.id" :value="Number(w.id)">{{ rotuloDeposito(w) }}</option>
      </select>
    </div>
    <div class="m-rot">Destino</div>
    <div class="m-ops" role="radiogroup">
      <button v-for="b in destinos" :key="b.id" type="button" class="m-op" :class="{ on: Number(d.destinoBranchId) === Number(b.id) }" role="radio" :aria-checked="Number(d.destinoBranchId) === Number(b.id)" :disabled="!!d.borradorId" @click="d.destinoBranchId = Number(b.id)">
        <span class="tx"><b>{{ b.name }}</b></span><span class="rd"></span>
      </button>
    </div>

    <div class="m-pz">
      <div class="m-pz-h"><h3>Productos</h3><span class="num">{{ resumen }}</span></div>
      <div v-if="!d.lineas.length" class="m-ln"><span class="tx"><small>Sin productos</small></span></div>
      <div v-for="l in d.lineas" :key="l.product_id" class="m-ln" :class="{ apagada: !(l.stock > 0) }">
        <Miniatura :src="l.image || ''" />
        <span class="tx">
          <b>{{ l.name }}</b>
          <small v-if="l.stock > 0" class="num">{{ cant(l.stock) }} en {{ origenNombre }}</small>
          <small v-else class="no">Sin stock en {{ origenNombre }}</small>
        </span>
        <span v-if="l.stock > 0" class="m-stp">
          <button type="button" :aria-label="l.qty === 1 ? 'Quitar' : 'Menos'" @click="menos(l)"><v-icon size="20">{{ l.qty === 1 ? "mdi-close" : "mdi-minus" }}</v-icon></button>
          <span class="num">{{ cant(l.qty) }}</span>
          <button type="button" aria-label="Más" :disabled="l.qty >= l.stock" @click="l.qty = Math.min(l.stock, l.qty + 1)"><v-icon size="20">mdi-plus</v-icon></button>
        </span>
        <button v-else type="button" class="quitar" aria-label="Quitar" @click="quitarDeLaDerivacion(l.product_id)"><v-icon size="20">mdi-close</v-icon></button>
      </div>
      <div class="m-pz-f" style="padding-top: 12px">
        <router-link :to="{ name: 'lote', query: { modo: 'derivar' } }" class="m-btn"><v-icon size="20">mdi-barcode-scan</v-icon>Escanear productos</router-link>
      </div>
    </div>

    <div class="m-cmp">
      <label for="dn-nota">Nota</label>
      <input id="dn-nota" v-model="d.nota" class="m-inp" placeholder="Opcional" />
    </div>
    <div class="m-centro"><button type="button" class="m-lnk" :disabled="ocupado || !puedeGuardar" @click="guardarBorrador">Guardar borrador</button></div>
    <MovilAviso />
    <template #pie>
      <button type="button" class="m-btn" :disabled="ocupado || !total || !d.destinoBranchId" @click="despachar">{{ total ? `Despachar ${unidades(total)}` : "Despachar" }}</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import Miniatura from "../components/Miniatura.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { cant, imagenDe, mensajeDe, num, unidades, u } from "../lib/formato";
import { avisar } from "../lib/aviso";
import { cargarDepositos, cargarSucursales, depositoPropio, depositos, rotuloDeposito, sucursales } from "../lib/depositos";
import { despacharDerivacion, faltaDeStock, guardarDerivacion, traerDerivacion } from "../lib/derivaciones";
import { stockEnDeposito } from "../services/conteos.service";
import { derivacion as d, lineasValidas, nuevaDerivacion, quitarDeLaDerivacion, unidadesDerivacion } from "../state/derivacion";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ocupado = ref(false);
const error = ref("");

const origen = computed(() => depositos.value.find((w) => Number(w.id) === Number(d.origenWarehouseId)) || null);
const origenNombre = computed(() => origen.value?.branch?.name || origen.value?.name || "el origen");
const destinos = computed(() => sucursales.value.filter((b) => Number(b.id) !== Number(origen.value?.branch_id)));
const total = computed(() => unidadesDerivacion());
const resumen = computed(() => {
  const n = lineasValidas().length;
  return n ? `${n} · ${u(total.value)}` : "0";
});
const puedeGuardar = computed(() => !!d.destinoBranchId && lineasValidas().length > 0);

function menos(l) {
  if (l.qty <= 1) quitarDeLaDerivacion(l.product_id);
  else l.qty -= 1;
}

async function recalcularStock() {
  for (const l of d.lineas) {
    try { l.stock = await stockEnDeposito(d.origenWarehouseId, { id: l.product_id, barcode: l.code, name: l.name }); } catch { /* queda el anterior */ }
    if (l.stock > 0) l.qty = Math.min(Math.max(1, l.qty || 1), l.stock);
  }
}

async function guardar() {
  const t = await guardarDerivacion({
    id: d.borradorId,
    origenBranchId: origen.value?.branch_id,
    origenWarehouseId: d.origenWarehouseId,
    destinoBranchId: d.destinoBranchId,
    nota: d.nota,
    lineas: lineasValidas(),
  });
  if (t?.id) d.borradorId = t.id;
  return t;
}

async function guardarBorrador() {
  ocupado.value = true;
  error.value = "";
  try {
    await guardar();
    nuevaDerivacion();
    avisar("Borrador guardado");
    router.replace({ name: "transfers" });
  } catch (e) {
    error.value = mensajeDe(e, "No se guardó el borrador");
  } finally {
    ocupado.value = false;
  }
}

async function despachar() {
  ocupado.value = true;
  error.value = "";
  try {
    await guardar();
    const t = await despacharDerivacion(d.borradorId);
    nuevaDerivacion();
    avisar("Derivación despachada");
    router.replace({ name: "derivDetalle", params: { id: t?.id || route.query.borrador } });
  } catch (e) {
    const falta = faltaDeStock(e?.response?.data?.message);
    const l = falta && d.lineas.find((x) => x.name === falta.nombre);
    if (l) {
      l.stock = falta.disponible;
      if (l.stock > 0) l.qty = Math.min(l.qty, l.stock);
      avisar(`Sin stock suficiente: ${l.name}`);
    } else {
      error.value = mensajeDe(e, "No se despachó");
    }
  } finally {
    ocupado.value = false;
  }
}

async function retomarBorrador(id) {
  if (Number(d.borradorId) === Number(id) && d.lineas.length) return;
  const t = await traerDerivacion(id);
  if (!t || t.status !== "draft") return;
  nuevaDerivacion();
  d.borradorId = t.id;
  d.origenWarehouseId = t.from_warehouse_id;
  d.destinoBranchId = t.to_branch_id;
  d.nota = t.note || "";
  d.lineas = (t.items || []).map((it) => ({
    product_id: it.product_id,
    name: it.product?.name || `Producto ${it.product_id}`,
    code: it.product?.barcode || it.product?.sku || "",
    image: imagenDe(it.product),
    qty: num(it.qty_sent),
    stock: num(it.qty_sent),
  }));
  await recalcularStock();
}

onMounted(async () => {
  await Promise.all([cargarDepositos(), cargarSucursales()]);
  try {
    if (route.query.borrador) await retomarBorrador(route.query.borrador);
  } catch (e) {
    error.value = mensajeDe(e, "No se pudo abrir el borrador");
  }
  if (!d.origenWarehouseId) d.origenWarehouseId = depositoPropio(depositos.value, auth.branchId)?.id || null;
  if (!d.destinoBranchId && destinos.value.length) d.destinoBranchId = Number(destinos.value[0].id);
});
</script>
