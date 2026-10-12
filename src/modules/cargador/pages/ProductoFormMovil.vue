<!--
  Alta y edición de producto en el teléfono (maqueta, "producto-form"): una
  sola vista con scroll. Código de barras (con el lector), fotos ("Tomar foto"),
  datos, precios, stock por sucursal y Activo. Obligatorios los de
  ProductFormPage: nombre, rubro y subrubro (y el subrubro del rubro).
  Precio lista = costo + % de ganancia + IVA, la misma cuenta del escritorio.
  Guarda con products.store (POST/PATCH, SKU con el id, /stock/init por
  sucursal y POST /products/:id/images), como el formulario de escritorio.
-->
<template>
  <MovilVista :titulo="esEdicion ? 'Editar producto' : 'Nuevo producto'" :volver="esEdicion ? { name: 'productoConsulta', params: { id: route.params.id } } : { name: 'home' }">
    <div v-if="cargando" class="m-vacio">Cargando…</div>
    <template v-else>
      <div v-if="errores.length" class="m-error">
        <div v-for="e in errores" :key="e">{{ e }}</div>
      </div>

      <div class="m-cmp">
        <label for="pf-cod">Código de barras</label>
        <div class="m-inpw sinpre">
          <input id="pf-cod" v-model="f.barcode" class="m-inp num" placeholder="Escanear o escribir" autocomplete="off" />
          <button type="button" class="act" aria-label="Escanear" @click="escanearCodigo"><v-icon size="20">mdi-barcode-scan</v-icon></button>
        </div>
      </div>

      <div class="m-rot">Fotos</div>
      <div class="m-fotos">
        <div v-for="(img, i) in fotosExistentes" :key="'e' + img.id" class="m-ftile img">
          <img :src="img.url" alt="" />
          <em v-if="i === 0">Principal</em>
        </div>
        <div v-for="(n, i) in fotosNuevas" :key="'n' + i" class="m-ftile img">
          <img :src="n.url" alt="" />
          <em v-if="!fotosExistentes.length && i === 0">Principal</em>
          <button type="button" class="quitar" aria-label="Quitar foto" @click="quitarFoto(i)"><v-icon size="16">mdi-close</v-icon></button>
        </div>
        <label :for="idFoto" class="m-ftile add">
          <v-icon size="28">mdi-camera-outline</v-icon>Tomar foto
        </label>
        <input :id="idFoto" class="m-archivo" type="file" accept="image/*" capture="environment" @change="onFoto" />
      </div>

      <div class="m-rot">Datos</div>
      <div class="m-cmp">
        <label for="pf-nom">Nombre</label>
        <input id="pf-nom" v-model="f.name" class="m-inp" placeholder="Nombre del producto" />
      </div>
      <div class="m-dos">
        <div class="m-cmp">
          <label for="pf-rub">Rubro</label>
          <select id="pf-rub" v-model.number="f.category_id" class="m-inp" @change="f.subcategory_id = null">
            <option :value="null"></option>
            <option v-for="c in rubros" :key="c.id" :value="Number(c.id)">{{ c.name }}</option>
          </select>
        </div>
        <div class="m-cmp">
          <label for="pf-sub">Subrubro</label>
          <select id="pf-sub" v-model.number="f.subcategory_id" class="m-inp">
            <option :value="null"></option>
            <option v-for="c in subrubrosDelRubro" :key="c.id" :value="Number(c.id)">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <div class="m-dos">
        <div class="m-cmp"><label for="pf-mar">Marca</label><input id="pf-mar" v-model="f.brand" class="m-inp" /></div>
        <div class="m-cmp"><label for="pf-mod">Modelo</label><input id="pf-mod" v-model="f.model" class="m-inp" /></div>
      </div>

      <div class="m-rot">Precios</div>
      <div class="m-dos">
        <div class="m-cmp">
          <label for="pf-cos">Costo</label>
          <div class="m-inpw"><span class="pre">$</span><input id="pf-cos" :value="plata(f.cost)" class="m-inp num" inputmode="numeric" @input="f.cost = entero($event)" /></div>
        </div>
        <div class="m-cmp">
          <label for="pf-mk">% de ganancia</label>
          <input id="pf-mk" v-model="f.markup_pct" class="m-inp num" inputmode="decimal" />
        </div>
      </div>
      <div class="m-dos">
        <div class="m-cmp">
          <label for="pf-lis">Precio lista</label>
          <div class="m-inpw"><span class="pre">$</span><input id="pf-lis" :value="plata(f.price_list)" class="m-inp num" inputmode="numeric" :readonly="listaCalculada" :class="{ 'pf-calc': listaCalculada }" @input="f.price_list = entero($event)" /></div>
        </div>
        <div class="m-cmp">
          <label for="pf-pre">Precio descuento</label>
          <div class="m-inpw"><span class="pre">$</span><input id="pf-pre" :value="plata(f.price_discount)" class="m-inp num" inputmode="numeric" @input="f.price_discount = entero($event)" /></div>
        </div>
      </div>

      <template v-if="esAdmin && stock.length">
        <div class="m-rot">Stock</div>
        <div class="m-dos">
          <div v-for="s in stock" :key="s.branch_id" class="m-cmp">
            <label :for="'pf-stk-' + s.branch_id">{{ s.branch_name }}</label>
            <input :id="'pf-stk-' + s.branch_id" v-model="s.qty" class="m-inp num" inputmode="numeric" />
          </div>
        </div>
      </template>

      <button type="button" class="m-sw" :class="{ on: f.is_active }" @click="f.is_active = !f.is_active">
        <span>Activo</span><span class="t"></span>
      </button>
      <div v-if="esEdicion && esAdmin" class="m-centro">
        <router-link :to="{ name: 'productoBaja', params: { id: route.params.id } }" class="m-lnk rojo">Dar de baja el producto</router-link>
      </div>
    </template>
    <MovilAviso />
    <template #pie>
      <button type="button" class="m-btn" :disabled="guardando || cargando" @click="guardar">{{ esEdicion ? "Guardar cambios" : "Guardar producto" }}</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { useProductsStore } from "@/app/store/products.store";
import { num } from "../lib/formato";
import { avisar } from "../lib/aviso";
import { olvidarCodigo } from "../lib/codigo";
import { cargarDepositos } from "../lib/depositos";
import { tomarCodigoCapturado } from "../state/captura";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const products = useProductsStore();
const esAdmin = computed(() => auth.isAdmin === true);
const esEdicion = computed(() => !!route.params.id);
const idFoto = `pf-foto-${Math.random().toString(36).slice(2, 8)}`;

// El borrador sobrevive a la ida al lector (el componente se desmonta).
const BORRADOR = "pos360.cargador.form";
const f = reactive({
  barcode: "", name: "", category_id: null, subcategory_id: null, brand: "", model: "",
  cost: null, markup_pct: "", tax_rate: 21, price_list: null, price_discount: null, is_active: true,
});
const original = ref(null);
const stock = ref([]); // [{ branch_id, branch_name, warehouse_id, current_qty, qty }]
const fotosExistentes = ref([]);
const fotosNuevas = ref([]); // [{ file, url }]
const rubros = ref([]);
const subrubros = ref([]);
const cargando = ref(true);
const guardando = ref(false);
const errores = ref([]);
const listaCalculada = ref(true);

const subrubrosDelRubro = computed(() => subrubros.value.filter((s) => Number(s.category_id) === Number(f.category_id)));

const plata = (v) => (v === null || v === "" || v === undefined ? "" : Math.round(num(v)).toLocaleString("es-AR"));
const entero = (e) => {
  const d = String(e.target.value || "").replace(/\D/g, "");
  const v = d ? Number(d) : null;
  e.target.value = plata(v);
  return v;
};

// Precio lista = costo + % de ganancia + IVA (la regla de ProductFormPage).
function listaDesdeCosto() {
  const c = num(f.cost), g = f.markup_pct;
  if (!(c > 0) || g === "" || g == null) return null;
  return Math.round(c * (1 + num(g) / 100) * (1 + num(f.tax_rate) / 100));
}
watch(() => [f.cost, f.markup_pct, f.tax_rate], () => {
  if (!listaCalculada.value) return;
  const l = listaDesdeCosto();
  if (l != null) f.price_list = l;
});

/* ── Fotos ── */
function onFoto(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  fotosNuevas.value.push({ file, url: URL.createObjectURL(file) });
}
function quitarFoto(i) {
  const [x] = fotosNuevas.value.splice(i, 1);
  if (x?.url) URL.revokeObjectURL(x.url);
}

/* ── Código con el lector ── */
function escanearCodigo() {
  try { sessionStorage.setItem(BORRADOR, JSON.stringify({ ruta: route.fullPath, f: { ...f }, stock: stock.value })); } catch { /* sin storage */ }
  router.push({ name: "lector", query: { para: "campo" } });
}

/* ── Carga ── */
const filas = (d) => (Array.isArray(d) ? d : d?.items || d?.data || d?.rows || []);
async function cargarTaxonomias() {
  const [c, s] = await Promise.all([
    http.get("/categories").then((r) => filas(r.data)).catch(() => []),
    http.get("/subcategories").then((r) => filas(r.data)).catch(() => []),
  ]);
  rubros.value = c.filter((x) => x && x.id && !x.parent_id && x.is_active !== false);
  subrubros.value = s
    .map((x) => ({ ...x, category_id: x.category_id ?? x.categoryId ?? x.rubro_id ?? x.parent_id }))
    .filter((x) => x && x.id && x.is_active !== false);
}

async function cargarStock(pid) {
  if (!esAdmin.value) return;
  if (pid) {
    const m = await products.fetchBranchesMatrix(pid);
    stock.value = m.map((r) => ({ branch_id: r.branch_id, branch_name: r.branch_name, warehouse_id: r.warehouse_id, current_qty: num(r.current_qty), qty: String(num(r.current_qty)) }));
    return;
  }
  const deps = await cargarDepositos();
  const vistos = new Set();
  stock.value = deps
    .filter((w) => !vistos.has(w.branch_id) && vistos.add(w.branch_id))
    .map((w) => ({ branch_id: w.branch_id, branch_name: w.branch?.name || w.name, warehouse_id: w.id, current_qty: null, qty: "0" }));
}

async function cargar() {
  cargando.value = true;
  try {
    await cargarTaxonomias();
    const pid = Number(route.params.id || 0);
    if (pid) {
      const p = await products.fetchOne(pid, { force: true });
      if (!p) { errores.value = ["Producto no encontrado"]; return; }
      original.value = p;
      Object.assign(f, {
        barcode: p.barcode || "", name: p.name || "", brand: p.brand || "", model: p.model || "",
        category_id: Number(p.category_id || p.category?.id || 0) || null,
        subcategory_id: Number(p.subcategory_id || p.subcategory?.id || 0) || null,
        cost: p.cost != null ? num(p.cost) : null,
        markup_pct: p.markup_pct != null && p.markup_pct !== "" ? String(num(p.markup_pct)) : "",
        tax_rate: p.tax_rate != null ? num(p.tax_rate, 21) : 21,
        price_list: num(p.price_list) || null, price_discount: num(p.price_discount) || null,
        is_active: p.is_active !== false && p.is_active !== 0,
      });
      listaCalculada.value = f.markup_pct !== "";
      fotosExistentes.value = filas(await products.fetchImages(pid)).map((i) => ({ id: i.id, url: i.url || i.image_url })).filter((i) => i.url);
    } else if (route.query.codigo) {
      f.barcode = String(route.query.codigo);
    }
    await cargarStock(pid);

    // Volvió del lector: se recupera lo cargado y se toma el código leído.
    let b = null;
    try { b = JSON.parse(sessionStorage.getItem(BORRADOR) || "null"); sessionStorage.removeItem(BORRADOR); } catch { b = null; }
    if (b && b.ruta === route.fullPath) {
      Object.assign(f, b.f);
      if (Array.isArray(b.stock) && b.stock.length) stock.value = b.stock;
    }
    const leido = tomarCodigoCapturado();
    if (leido) f.barcode = leido;
  } finally {
    cargando.value = false;
  }
}

/* ── Guardar ── */
function iniciales(label, take = 2) {
  const clean = String(label || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  if (!clean) return "";
  const stop = new Set(["DE", "DEL", "LA", "LAS", "EL", "LOS", "Y", "EN", "POR", "PARA"]);
  const parts = clean.split(/\s+/).map((x) => x.toUpperCase()).filter((x) => x && !stop.has(x));
  let out = "";
  for (const p of parts) { out += p[0] || ""; if (out.length >= take) break; }
  if (out.length < take) out += parts.join("").slice(out.length, take);
  return out.slice(0, take).toUpperCase();
}
function skuDe(id) {
  const cat = rubros.value.find((x) => Number(x.id) === Number(f.category_id))?.name;
  const sub = subrubros.value.find((x) => Number(x.id) === Number(f.subcategory_id))?.name;
  return `${iniciales(cat) || "XX"}${iniciales(sub) || "XX"}${String(id).padStart(6, "0")}`;
}

function validar() {
  const e = [];
  if (!String(f.name || "").trim()) e.push("Falta el nombre del producto.");
  if (!f.category_id) e.push("Falta seleccionar el rubro.");
  if (!f.subcategory_id) e.push("Falta seleccionar el subrubro.");
  if (f.category_id && f.subcategory_id && !subrubrosDelRubro.value.some((s) => Number(s.id) === Number(f.subcategory_id))) e.push("El subrubro no corresponde al rubro.");
  return e;
}

function payload() {
  return {
    name: String(f.name || "").trim(),
    barcode: String(f.barcode || "").trim() || null,
    category_id: f.category_id,
    subcategory_id: f.subcategory_id,
    brand: String(f.brand || "").trim(),
    model: String(f.model || "").trim(),
    cost: num(f.cost),
    markup_pct: listaCalculada.value && f.markup_pct !== "" ? num(f.markup_pct) : null,
    tax_rate: num(f.tax_rate, 21),
    price_list: num(f.price_list),
    price_discount: num(f.price_discount),
    is_active: !!f.is_active,
  };
}

async function guardar() {
  errores.value = validar();
  if (errores.value.length) return;
  guardando.value = true;
  try {
    const datos = payload();
    let pid = Number(route.params.id || 0);
    if (pid) {
      // Sin branch_ids: la habilitación por sucursal se maneja en escritorio.
      const ok = await products.update(pid, datos);
      if (!ok) { errores.value = [products.error || "No se pudo guardar"]; return; }
      if (!String(original.value?.sku || "").trim()) await products.update(pid, { sku: skuDe(pid) }).catch(() => {});
    } else {
      const bids = new Set(stock.value.filter((s) => num(s.qty) > 0).map((s) => s.branch_id));
      if (auth.branchId) bids.add(auth.branchId);
      const ok = await products.create({ ...datos, branch_ids: [...bids] });
      pid = Number(products.current?.id || 0);
      if (!ok || !pid) { errores.value = [products.error || "No se pudo crear"]; return; }
      await products.update(pid, { sku: skuDe(pid) }).catch(() => {});
    }
    if (esAdmin.value) {
      for (const s of stock.value) {
        const q = num(s.qty, NaN);
        if (!Number.isFinite(q)) continue;
        if (s.current_qty == null ? q === 0 : q === s.current_qty) continue;
        const ok = await products.initStock({ product_id: pid, branch_id: s.branch_id, warehouse_id: s.warehouse_id, qty: q });
        if (!ok) avisar(`Stock de ${s.branch_name}: no se guardó`);
      }
    }
    if (fotosNuevas.value.length) {
      const up = await products.uploadImages(pid, fotosNuevas.value.map((x) => x.file));
      if (!up) avisar("Las fotos no se subieron");
    }
    if (f.barcode) olvidarCodigo(f.barcode);
    if (esEdicion.value) {
      avisar("Cambios guardados");
      router.replace({ name: "productoConsulta", params: { id: pid } });
    } else {
      avisar("Producto creado");
      router.replace({ name: "home" });
    }
  } finally {
    guardando.value = false;
  }
}

onMounted(cargar);
onBeforeUnmount(() => fotosNuevas.value.forEach((x) => x.url && URL.revokeObjectURL(x.url)));
</script>

<style>
.pf-calc { background: var(--m-variante) !important; }
</style>
