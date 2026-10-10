<!-- src/modules/dashboard/pages/TransferPage.vue -->
<!-- Una derivación (maqueta aprobada 10/10), según su estado:
     - nueva o borrador: origen → destino, productos con foto y cantidad,
       nota; un botón "Despachar" (descuenta el stock del origen).
     - en camino y es para esta sucursal: "¿Qué llegó?" renglón por renglón y
       "Confirmar recepción" (suma al destino, la diferencia queda registrada).
     - el resto: línea de tiempo y productos enviados / recibidos. -->
<template>
  <div class="sp tp">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <router-link :to="{ name: 'transfers' }" class="se-volver"><v-icon size="18">mdi-chevron-left</v-icon>Derivaciones</router-link>
        <h1 class="sp-cab__titulo">{{ titulo }}</h1>
        <span v-if="!esNueva && tr" class="sp-cab__sub tp-ruta">
          <span><v-icon size="18">mdi-store-outline</v-icon>{{ origenNombre }}</span>
          <v-icon size="20" class="tp-flecha">mdi-arrow-right</v-icon>
          <span class="is-dest"><v-icon size="18">mdi-store-outline</v-icon>{{ destinoNombre }}</span>
          <template v-if="tr.dispatched_at && modo === 'recibir'"> · despachada el {{ fecha(tr.dispatched_at) }}</template>
        </span>
      </div>
      <span v-if="tr && modo === 'ver'" :class="`tp-chip tp-chip--${tr.status}`">{{ etiqueta(tr.status) }}</span>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
    <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />

    <!-- ── Armar (nueva o borrador) ─────────────────────────────────── -->
    <template v-if="modo === 'armar'">
      <section class="sp-caja tp-od">
        <div class="tp-od__c">
          <span class="tp-lab">Sale de</span>
          <div class="tp-fijo"><v-icon size="24">mdi-store-outline</v-icon>{{ origenNombre || "Tu sucursal" }}</div>
        </div>
        <v-icon size="34" class="tp-flecha tp-od__f">mdi-arrow-right</v-icon>
        <div class="tp-od__c">
          <span class="tp-lab">Va a</span>
          <v-select v-model="destinoId" :items="destinos" item-title="name" item-value="id" placeholder="Elegí la sucursal" density="comfortable" variant="outlined" hide-details :disabled="!esNueva" class="tp-sel" />
        </div>
      </section>

      <div class="tp-dos">
        <section class="sp-caja">
          <div class="se-banda"><span>Productos a mandar</span><small class="num">{{ lineas.length }} {{ lineas.length === 1 ? "producto" : "productos" }} · {{ fmt(unidades) }} unidades</small></div>
          <div class="sp-tabla-scroll">
            <table class="sp-tabla tp-tabla">
              <thead><tr><th>Producto</th><th class="c-stock">Stock en {{ origenNombre || "origen" }}</th><th class="c-cant">Cantidad</th><th class="c-x"></th></tr></thead>
              <tbody>
                <tr v-for="(l, i) in lineas" :key="l.product_id" :class="{ 'is-excede': l.stock != null && l.qty > l.stock }">
                  <td><span class="tp-prod"><span class="tp-foto"><img v-if="foto(l)" :src="foto(l)" alt="" /><v-icon v-else size="22">mdi-image-outline</v-icon></span><b>{{ l.name }}</b></span></td>
                  <td class="c-stock num">{{ l.stock == null ? "—" : fmt(l.stock) }}</td>
                  <td class="c-cant">
                    <span class="tp-cant">
                      <button type="button" @click="l.qty = Math.max(1, l.qty - 1)">−</button>
                      <input v-model.number="l.qty" type="number" min="1" class="num" />
                      <button type="button" @click="l.qty++">+</button>
                    </span>
                  </td>
                  <td class="c-x"><button type="button" class="tp-quitar" title="Quitar" @click="lineas.splice(i, 1)"><v-icon size="20">mdi-close</v-icon></button></td>
                </tr>
                <tr class="tp-agregar">
                  <td colspan="4">
                    <button type="button" class="tp-busca" @click="abrirBuscador"><v-icon size="22">mdi-plus</v-icon>Agregar producto: buscá por nombre, código o lector</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="tp-lado">
          <section class="sp-caja tp-res">
            <span class="tp-lab">Resumen</span>
            <b class="tp-grande num">{{ fmt(unidades) }} {{ unidades === 1 ? "unidad" : "unidades" }}</b>
            <span class="sp-s">{{ lineas.length }} {{ lineas.length === 1 ? "producto" : "productos" }}<template v-if="destinoNombre"> · {{ origenNombre }} → {{ destinoNombre }}</template></span>
            <span v-if="excede" class="tp-aviso">Hay cantidades que superan el stock del origen</span>
            <button type="button" class="tp-btn" :disabled="!puedeDespachar || trabajando" @click="despachar">
              <v-progress-circular v-if="trabajando" indeterminate size="20" width="2" />
              <v-icon v-else size="20">mdi-truck-fast-outline</v-icon>Despachar
            </button>
            <span class="tp-nota-btn">Descuenta el stock de {{ origenNombre || "origen" }}; {{ destinoNombre || "el destino" }} lo suma al recibir.</span>
            <a v-if="lineas.length && destinoId" href="#" class="sp-link tp-centro" @click.prevent="guardarBorrador">Guardar como borrador</a>
            <template v-if="!esNueva">
              <a v-if="!confirmarCancelar" href="#" class="tp-cancelar" @click.prevent="confirmarCancelar = true">Cancelar derivación</a>
              <span v-else class="tp-conf">¿Cancelar {{ tr?.number }}? <a href="#" class="sp-link" @click.prevent="confirmarCancelar = false">No</a> <a href="#" class="tp-cancelar" @click.prevent="cancelar">Sí, cancelar</a></span>
            </template>
          </section>
          <section class="sp-caja">
            <div class="se-banda"><span>Nota</span></div>
            <div class="tp-notabox"><input v-model="nota" type="text" maxlength="255" placeholder="Remito, transporte o lo que haga falta" /></div>
          </section>
        </aside>
      </div>
    </template>

    <!-- ── Recibir ──────────────────────────────────────────────────── -->
    <template v-else-if="modo === 'recibir'">
      <div class="tp-dos">
        <section class="sp-caja">
          <div class="se-banda"><span>¿Qué llegó?</span><small class="num">{{ recep.length }} productos · {{ fmt(enviadas) }} unidades</small></div>
          <div class="sp-tabla-scroll">
            <table class="sp-tabla tp-tabla">
              <thead><tr><th>Producto</th><th class="c-stock">Enviado</th><th class="c-cant">Llegó</th><th class="c-dif">Diferencia</th></tr></thead>
              <tbody>
                <tr v-for="r in recep" :key="r.item_id" :class="{ 'is-dif': r.qty_received !== r.qty_sent }">
                  <td><span class="tp-prod"><span class="tp-foto"><img v-if="foto(r)" :src="foto(r)" alt="" /><v-icon v-else size="22">mdi-image-outline</v-icon></span><b>{{ r.name }}</b></span></td>
                  <td class="c-stock num">{{ fmt(r.qty_sent) }}</td>
                  <td class="c-cant">
                    <span class="tp-cant">
                      <button type="button" @click="r.qty_received = Math.max(0, r.qty_received - 1)">−</button>
                      <input v-model.number="r.qty_received" type="number" min="0" class="num" />
                      <button type="button" @click="r.qty_received++">+</button>
                    </span>
                  </td>
                  <td class="c-dif num">{{ difTexto(r) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <aside class="tp-lado">
          <section class="sp-caja tp-res">
            <span class="tp-lab">Recepción</span>
            <b class="tp-grande num">{{ fmt(recibidas) }} de {{ fmt(enviadas) }}</b>
            <span :class="hayDif ? 'tp-aviso' : 'tp-ok'">{{ hayDif ? "Hay diferencias con lo enviado" : "Llegó todo lo enviado" }}</span>
            <button type="button" class="tp-btn tp-btn--verde" :disabled="trabajando" @click="recibir">
              <v-progress-circular v-if="trabajando" indeterminate size="20" width="2" />
              <v-icon v-else size="20">mdi-package-variant-closed-check</v-icon>Confirmar recepción
            </button>
            <span class="tp-nota-btn">Suma al stock de {{ destinoNombre }} lo que llegó; la diferencia queda registrada.</span>
          </section>
          <section v-if="tr?.note" class="sp-caja"><div class="se-banda"><span>Nota</span></div><div class="tp-notatxt">{{ tr.note }}</div></section>
        </aside>
      </div>
    </template>

    <!-- ── Ver ──────────────────────────────────────────────────────── -->
    <template v-else-if="modo === 'ver' && tr">
      <section class="sp-caja tp-linea">
        <div v-for="(p, i) in pasos" :key="p.t" class="tp-paso" :class="{ 'is-ok': p.f, 'is-ult': i === pasos.length - 1 }">
          <span class="tp-paso__c"><v-icon size="20">{{ p.f ? "mdi-check" : "mdi-circle-small" }}</v-icon></span>
          <span class="tp-paso__t"><b>{{ p.t }}</b><small class="num">{{ p.f ? fechaHora(p.f) : "pendiente" }}</small></span>
          <span v-if="i < pasos.length - 1" class="tp-paso__l" :class="{ 'is-ok': pasos[i + 1].f }"></span>
        </div>
      </section>
      <div class="tp-dos">
        <section class="sp-caja">
          <div class="se-banda"><span>Productos</span><small class="num">{{ (tr.items || []).length }} productos · {{ fmt(enviadas) }} unidades</small></div>
          <div class="sp-tabla-scroll">
            <table class="sp-tabla tp-tabla">
              <thead><tr><th>Producto</th><th class="c-stock">Enviado</th><th class="c-stock">Recibido</th><th class="c-dif">Diferencia</th></tr></thead>
              <tbody>
                <tr v-for="it in tr.items || []" :key="it.id" :class="{ 'is-dif': it.qty_received != null && Number(it.qty_received) !== Number(it.qty_sent) }">
                  <td><span class="tp-prod"><span class="tp-foto"><img v-if="foto({ product_id: it.product_id, product: it.product })" :src="foto({ product_id: it.product_id, product: it.product })" alt="" /><v-icon v-else size="22">mdi-image-outline</v-icon></span><b>{{ it.product?.name || `Producto #${it.product_id}` }}</b></span></td>
                  <td class="c-stock num">{{ fmt(it.qty_sent) }}</td>
                  <td class="c-stock num" :class="{ 'tp-okt': it.qty_received != null }">{{ it.qty_received == null ? "—" : fmt(it.qty_received) }}</td>
                  <td class="c-dif num">{{ it.qty_received == null ? "—" : difTexto({ qty_sent: Number(it.qty_sent), qty_received: Number(it.qty_received) }) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <aside class="tp-lado">
          <section class="sp-caja"><div class="se-banda"><span>Nota</span></div><div class="tp-notatxt">{{ tr.note || "Sin nota" }}</div></section>
        </aside>
      </div>
    </template>

    <!-- Buscador de productos con fotos -->
    <PosModal v-model="buscadorAbierto" titulo="Agregar producto" :sub="`Con stock en ${origenNombre || 'tu sucursal'}`" icono="mdi-magnify" :ancho="1100">
      <div class="tp-bus">
        <label class="pm-in"><v-icon size="26">mdi-barcode-scan</v-icon><input ref="busRef" v-model="busQ" type="text" autocomplete="off" placeholder="Nombre, código o lector" @input="buscarProductos" @keydown.enter.prevent="agregar(resultados[0])" /></label>
        <div class="tp-grilla">
          <article v-for="p in resultados" :key="p.id" class="tp-card" :class="{ 'is-dentro': yaEsta(p) }" @click="agregar(p)">
            <div class="tp-card__foto"><img v-if="productImage(p)" :src="productImage(p)" alt="" /><v-icon v-else size="36">mdi-image-off-outline</v-icon><span v-if="yaEsta(p)" class="tp-card__ya">{{ yaEsta(p).qty }} en la derivación</span></div>
            <div class="tp-card__info"><b>{{ p.name }}</b><small>{{ p.sku || p.code }}</small><span class="num">{{ fmt(stockDe(p)) }} en stock</span></div>
          </article>
          <div v-if="!buscando && !resultados.length" class="pm-vacio">Sin productos con stock para «{{ busQ }}»</div>
        </div>
      </div>
    </PosModal>

    <v-snackbar v-model="aviso.open" :timeout="2600">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import PosModal from "@/modules/pos/components/modales/PosModal.vue";
import { usePosImages } from "@/modules/pos/composables/usePosImages";
import {
  getTransfer, createTransfer, updateTransfer, dispatchTransfer, receiveTransfer, cancelTransfer,
  listBranchesApi, searchProducts,
} from "../service/stockTransfer.api";
import "@/modules/products/styles/proveedores.css";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { productImage, prefetchImagesForVisible } = usePosImages();

const NOMBRES = { draft: "Borrador", dispatched: "En camino", received: "Recibida", partial: "Recibida con diferencias", rejected: "Rechazada", cancelled: "Cancelada" };
const etiqueta = (s) => NOMBRES[s] || s;
const fmt = (v) => Number(v || 0).toLocaleString("es-AR", { maximumFractionDigits: 3 });

const tr = ref(null);
const branches = ref([]);
const destinoId = ref(null);
const lineas = ref([]); // { product_id, name, qty, stock, image }
const recep = ref([]);  // { item_id, product_id, name, qty_sent, qty_received }
const nota = ref("");
const cargando = ref(false);
const trabajando = ref(false);
const error = ref("");
const confirmarCancelar = ref(false);
const aviso = reactive({ open: false, text: "" });

const esNueva = computed(() => !route.params.id);
const miSucursal = computed(() => Number(auth.branchId || 0));
const origenBranchId = computed(() => (esNueva.value ? miSucursal.value : Number(tr.value?.fromWarehouse?.branch_id || 0)));
const nombreSucursal = (id) => branches.value.find((b) => Number(b.id) === Number(id))?.name || "";
const limpiar = (s) => String(s || "").replace(/^Depósito\s+/i, "");
const origenNombre = computed(() => nombreSucursal(origenBranchId.value) || limpiar(tr.value?.fromWarehouse?.name));
const destinoNombre = computed(() => nombreSucursal(destinoId.value || tr.value?.to_branch_id) || limpiar(tr.value?.toWarehouse?.name));
const destinos = computed(() => branches.value.filter((b) => Number(b.id) !== origenBranchId.value));

const puedeOperarOrigen = computed(() => auth.isAdmin || origenBranchId.value === miSucursal.value);
const modo = computed(() => {
  if (esNueva.value) return "armar";
  if (!tr.value) return "";
  if (tr.value.status === "draft" && puedeOperarOrigen.value) return "armar";
  if (tr.value.status === "dispatched" && (auth.isAdmin || Number(tr.value.to_branch_id) === miSucursal.value)) return "recibir";
  return "ver";
});
const titulo = computed(() => {
  if (esNueva.value) return "Nueva derivación";
  if (!tr.value) return "Derivación";
  return modo.value === "recibir" ? `Recibir ${tr.value.number}` : tr.value.number;
});

const unidades = computed(() => lineas.value.reduce((a, l) => a + Number(l.qty || 0), 0));
const excede = computed(() => lineas.value.some((l) => l.stock != null && l.qty > l.stock));
const puedeDespachar = computed(() => !!destinoId.value && lineas.value.length > 0 && lineas.value.every((l) => Number(l.qty) > 0));
const enviadas = computed(() => (modo.value === "recibir" ? recep.value : tr.value?.items || []).reduce((a, r) => a + Number(r.qty_sent || 0), 0));
const recibidas = computed(() => recep.value.reduce((a, r) => a + Number(r.qty_received || 0), 0));
const hayDif = computed(() => recep.value.some((r) => r.qty_received !== r.qty_sent));
function difTexto(r) {
  const d = Number(r.qty_received) - Number(r.qty_sent);
  if (!d) return "—";
  return d < 0 ? `faltan ${fmt(-d)}` : `sobran ${fmt(d)}`;
}
const pasos = computed(() => {
  const t = tr.value || {};
  const fin = t.status === "cancelled" ? { t: "Cancelada", f: t.updated_at } : { t: "Recibida", f: t.received_at };
  return [{ t: "Creada", f: t.created_at }, { t: "Despachada", f: t.dispatched_at }, fin];
});

function fecha(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d) ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : "";
}
function fechaHora(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d) ? `${fecha(v)} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
}
const foto = (l) => l?.image || productImage({ id: l?.product_id, ...(l?.product || {}) });

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const b = await listBranchesApi();
    branches.value = (Array.isArray(b?.data?.data) ? b.data.data : Array.isArray(b?.data) ? b.data : []).filter((x) => x.is_active !== false);
    if (!esNueva.value) {
      const { data } = await getTransfer(route.params.id);
      tr.value = data?.transfer || data?.data || null;
      destinoId.value = Number(tr.value?.to_branch_id) || null;
      nota.value = tr.value?.note || "";
      lineas.value = (tr.value?.items || []).map((i) => ({ product_id: Number(i.product_id), name: i.product?.name || `Producto #${i.product_id}`, qty: Number(i.qty_sent), stock: null }));
      recep.value = (tr.value?.items || []).map((i) => ({ item_id: i.id, product_id: Number(i.product_id), name: i.product?.name || `Producto #${i.product_id}`, qty_sent: Number(i.qty_sent), qty_received: Number(i.qty_sent) }));
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar la derivación";
  } finally {
    cargando.value = false;
  }
}

function payload() {
  return { to_branch_id: destinoId.value, note: nota.value.trim() || null, items: lineas.value.map((l) => ({ product_id: l.product_id, qty_sent: Number(l.qty) })) };
}
async function guardar() {
  if (esNueva.value) {
    const { data } = await createTransfer(payload());
    return data?.transfer || data?.data;
  }
  const { data } = await updateTransfer(tr.value.id, payload());
  return data?.transfer || data?.data || tr.value;
}
async function guardarBorrador() {
  trabajando.value = true;
  error.value = "";
  try {
    const t = await guardar();
    aviso.text = "Borrador guardado"; aviso.open = true;
    if (esNueva.value && t?.id) router.replace({ name: "transferView", params: { id: t.id } });
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar";
  } finally { trabajando.value = false; }
}
async function despachar() {
  if (!puedeDespachar.value) return;
  trabajando.value = true;
  error.value = "";
  try {
    const t = await guardar();
    await dispatchTransfer(t.id);
    aviso.text = "Derivación despachada"; aviso.open = true;
    router.replace({ name: "transferView", params: { id: t.id } });
    if (!esNueva.value) await cargar();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo despachar";
  } finally { trabajando.value = false; }
}
async function recibir() {
  trabajando.value = true;
  error.value = "";
  try {
    await receiveTransfer(tr.value.id, { receptions: recep.value.map((r) => ({ item_id: r.item_id, qty_received: Number(r.qty_received) || 0 })) });
    aviso.text = hayDif.value ? "Recepción confirmada con diferencias" : "Recepción confirmada"; aviso.open = true;
    await cargar();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo confirmar la recepción";
  } finally { trabajando.value = false; }
}
async function cancelar() {
  trabajando.value = true;
  try {
    await cancelTransfer(tr.value.id);
    confirmarCancelar.value = false;
    await cargar();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cancelar";
  } finally { trabajando.value = false; }
}

// Buscador
const buscadorAbierto = ref(false);
const busQ = ref("");
const busRef = ref(null);
const resultados = ref([]);
const buscando = ref(false);
const stockDe = (p) => Number(p?.stock_qty ?? p?.qty ?? p?.stock ?? 0);
const yaEsta = (p) => lineas.value.find((l) => l.product_id === Number(p.id));
function abrirBuscador() {
  buscadorAbierto.value = true;
  busQ.value = "";
  buscarAhora();
  nextTick(() => setTimeout(() => busRef.value?.focus(), 150));
}
let reloj = null;
function buscarProductos() { clearTimeout(reloj); reloj = setTimeout(buscarAhora, 280); }
async function buscarAhora() {
  buscando.value = true;
  try {
    const { data } = await searchProducts({ search: busQ.value.trim() || undefined, limit: 24, branchId: origenBranchId.value || undefined });
    resultados.value = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    prefetchImagesForVisible(resultados.value);
  } catch { resultados.value = []; } finally { buscando.value = false; }
}
function agregar(p) {
  if (!p) return;
  const ya = yaEsta(p);
  if (ya) ya.qty++;
  else lineas.value.push({ product_id: Number(p.id), name: p.name, qty: 1, stock: stockDe(p), image: productImage(p) });
}

watch(() => route.params.id, () => { tr.value = null; lineas.value = []; cargar(); });
onMounted(cargar);
</script>

<style>
.tp-ruta { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 800 !important; color: var(--sp-texto) !important; }
.tp-ruta > span { display: inline-flex; align-items: center; gap: 5px; }
.tp-ruta .v-icon { color: var(--sp-suave); }
.tp-ruta .is-dest .v-icon, .tp-flecha { color: #0f6fae !important; }
.tp-chip { padding: 8px 14px; border-radius: 9999px; font-weight: 800; font-size: 14px; background: var(--sp-hover); }
.tp-chip--received { background: #e3f4ee; color: #1f7a5f; }
.tp-chip--partial { background: #fff4e5; color: #b45309; }
.tp-chip--cancelled { background: #f1f5f9; color: #5a6678; }
.tp-chip--dispatched { background: #eef7fd; color: #0a466e; }
.tp-lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--sp-suave); }
.tp-od { display: flex; align-items: flex-end; gap: 16px; padding: 18px 22px; }
.tp-od__c { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.tp-od__f { padding-bottom: 12px; }
.tp-fijo { height: 56px; display: flex; align-items: center; gap: 10px; padding: 0 16px; border-radius: 12px; background: var(--sp-hover); border: 1px solid var(--sp-borde); font-size: 18px; font-weight: 800; }
.tp-fijo .v-icon { color: var(--sp-suave); }
.tp-sel .v-field { min-height: 56px; font-size: 18px; font-weight: 800; }
.tp-dos { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
.tp-lado { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 70px; }
.tp-tabla tbody tr { cursor: default; }
.tp-tabla .c-stock { width: 150px; text-align: right; }
.tp-tabla .c-cant { width: 170px; }
.tp-tabla .c-dif { width: 120px; text-align: right; font-weight: 800; color: var(--sp-tenue); }
.tp-tabla .c-x { width: 50px; text-align: center; }
.tp-tabla tr.is-dif td { background: rgba(240, 180, 41, 0.08); }
.tp-tabla tr.is-dif .c-dif { color: #b45309; }
.tp-tabla tr.is-excede .c-stock { color: #c2413a; font-weight: 800; }
.tp-prod { display: flex; align-items: center; gap: 12px; }
.tp-prod b { font-size: 14px; }
.tp-foto { width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--sp-linea); background: #fff; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.tp-foto img { width: 100%; height: 100%; object-fit: contain; }
.tp-foto .v-icon { color: #c3c9d6; }
.tp-cant { display: inline-flex; align-items: center; gap: 6px; }
.tp-cant button { width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 900 18px Inter, sans-serif; cursor: pointer; }
.tp-cant button:hover { background: #cfe5f5; }
.tp-cant input { width: 56px; height: 36px; text-align: center; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 900 16px Inter, sans-serif; }
.tp-quitar { width: 36px; height: 36px; border: 0; border-radius: 9px; background: transparent; cursor: pointer; }
.tp-quitar .v-icon { color: #a3322c; }
.tp-quitar:hover { background: #fdeceb; }
.tp-agregar td { background: var(--sp-hover); }
.tp-busca { width: 100%; height: 48px; display: flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-suave); font: 600 15px Inter, sans-serif; cursor: pointer; text-align: left; }
.tp-busca .v-icon { color: #0f6fae; }
.tp-busca:hover { background: #cfe5f5; border-color: #3f8fc6; }
.tp-res { padding: 18px; display: flex; flex-direction: column; gap: 8px; }
.tp-grande { font-size: 30px; font-weight: 900; }
.tp-aviso { font-size: 14px; font-weight: 700; color: #b45309; }
.tp-ok { font-size: 14px; font-weight: 700; color: #1f7a5f; }
.tp-btn { margin-top: 8px; height: 52px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 12px; background: #0f6fae; color: #ffffff; font: 800 16px Inter, sans-serif; cursor: pointer; box-shadow: 0 6px 16px rgba(15,111,174,.25); }
.tp-btn .v-icon { color: #ffffff; }
.tp-btn:disabled { opacity: .45; cursor: not-allowed; }
.tp-btn--verde { background: #2E9E7B; box-shadow: 0 6px 16px rgba(46,158,123,.3); }
.tp-nota-btn { font-size: 13px; color: var(--sp-suave); text-align: center; }
.tp-centro { justify-content: center; }
.tp-cancelar { font-size: 14px; font-weight: 800; color: #b23b35; text-decoration: none; text-align: center; }
.tp-conf { font-size: 14px; text-align: center; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.tp-notabox { padding: 12px 16px; }
.tp-notabox input { width: 100%; height: 46px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 500 15px Inter, sans-serif; outline: 0; box-sizing: border-box; }
.tp-notatxt { padding: 14px 16px; font-size: 15px; font-weight: 700; }
.tp-linea { display: flex; align-items: center; padding: 18px 22px; }
.tp-paso { display: flex; align-items: center; gap: 10px; flex: 1; }
.tp-paso.is-ult { flex: 0 0 auto; }
.tp-paso__c { width: 34px; height: 34px; border-radius: 9999px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tp-paso__c .v-icon { color: #ffffff; }
.tp-paso.is-ok .tp-paso__c { background: #2E9E7B; }
.tp-paso__t { display: flex; flex-direction: column; }
.tp-paso__t b { font-size: 15px; }
.tp-paso__t small { font-size: 13px; color: var(--sp-suave); }
.tp-paso__l { flex: 1; height: 2px; margin: 0 14px; background: var(--sp-borde); }
.tp-paso__l.is-ok { background: #2E9E7B; }
.tp-okt { color: #1f7a5f; font-weight: 800; }
.tp-bus { display: flex; flex-direction: column; gap: 14px; padding: 18px 22px; }
.tp-grilla { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.tp-card { border-radius: 12px; overflow: hidden; border: 1px solid #d3dde7; background: #fff; cursor: pointer; transition: box-shadow 120ms ease, transform 120ms ease; }
.tp-card:hover { box-shadow: inset 0 0 0 2px #0f6fae, 0 10px 22px rgba(10,70,110,.18); transform: translateY(-2px); }
.tp-card.is-dentro { border-color: #2E9E7B; }
.tp-card__foto { position: relative; height: 130px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #eef2f6; }
.tp-card__foto img { max-width: 100%; max-height: 100%; object-fit: contain; }
.tp-card__ya { position: absolute; left: 8px; top: 8px; padding: 3px 8px; border-radius: 9999px; background: #2E9E7B; color: #fff; font-size: 11px; font-weight: 800; }
.tp-card__info { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; color: #0f172a; }
.tp-card__info b { font-size: 14px; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tp-card__info small { font-size: 12px; color: #5a6678; }
.tp-card__info span { font-size: 13px; font-weight: 700; color: #1f7a5f; }
@media (max-width: 1100px) { .tp-dos { grid-template-columns: 1fr; } .tp-lado { position: static; } .tp-grilla { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
