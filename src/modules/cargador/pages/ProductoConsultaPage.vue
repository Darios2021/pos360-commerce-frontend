<!--
  Consulta de producto (maqueta, "resultado"): foto, nombre, código y rubro,
  precio grande, los otros precios (el costo sólo el dueño), stock por
  sucursal y datos. Dueño: "Editar producto"; cajero: "Escanear otro".
  Enlaces Derivar y Agregar a la venta; en la APK, Imprimir etiqueta y la
  hora de la copia si el dato salió del catálogo sin conexión.
-->
<template>
  <MovilVista titulo="Producto" :volver="{ name: 'products' }" cuerpo-clase="pc-cu">
    <template #barra>
      <router-link :to="{ name: 'lector', query: { modo: 'consultar' } }" class="mv-ib" aria-label="Escanear otro">
        <v-icon size="24">mdi-barcode-scan</v-icon>
      </router-link>
    </template>

    <div v-if="cargando && !p" class="m-vacio">Cargando…</div>
    <div v-else-if="!p" class="pc-in"><div class="m-error">{{ error || "Producto no encontrado" }}</div></div>
    <template v-else>
      <div class="m-ficha-foto">
        <img v-if="foto" :src="foto" alt="" />
        <v-icon v-else size="40">mdi-package-variant-closed</v-icon>
      </div>
      <div class="pc-in">
        <div class="m-pz">
          <div class="m-pz-b m-pz-b--top">
            <div class="pc-nom">{{ p.name }}</div>
            <div class="m-sub num">{{ [codigoDe(p), p.category?.name].filter(Boolean).join(" · ") }}</div>
            <div class="m-precio-fila" style="margin-top: 12px">
              <div>
                <div class="m-cifra num">{{ pesos(precioPrincipal.valor) }}</div>
                <div class="m-sub">{{ precioPrincipal.rotulo }}</div>
              </div>
              <span v-if="copia" class="m-estampa"><v-icon size="18">mdi-clock-outline</v-icon>{{ hora(copia) }}</span>
            </div>
            <dl class="m-dl" style="margin-top: 12px">
              <template v-if="precioPrincipal.rotulo !== 'Precio lista' && num(p.price_list)">
                <dt>Precio lista</dt><dd class="num">{{ pesos(p.price_list) }}</dd>
              </template>
              <template v-if="num(p.price_reseller)">
                <dt>Precio revendedor</dt><dd class="num">{{ pesos(p.price_reseller) }}</dd>
              </template>
              <template v-if="esAdmin && num(p.cost)">
                <dt>Costo</dt><dd class="num">{{ pesos(p.cost) }}</dd>
              </template>
            </dl>
          </div>
        </div>

        <div v-if="stock.length" class="m-pz">
          <div class="m-pz-h"><h3>Stock por sucursal</h3><span class="num">{{ u(totalStock) }}</span></div>
          <div class="m-pz-b">
            <div v-for="s in stock" :key="s.branch_id" class="m-fila">
              <div class="l">
                <b>{{ s.branch_name }}<span v-if="Number(s.branch_id) === Number(auth.branchId)" class="m-est az" style="margin-left: 6px">Esta</span></b>
                <span class="num">{{ cant(s.current_qty) }}</span>
              </div>
              <div class="m-barra"><s :style="{ width: barra(s.current_qty) + '%' }"></s></div>
            </div>
          </div>
        </div>

        <div class="m-pz">
          <div class="m-pz-h"><h3>Datos</h3></div>
          <div class="m-pz-b">
            <dl class="m-dl">
              <template v-if="p.sku"><dt>SKU</dt><dd class="num">{{ p.sku }}</dd></template>
              <template v-if="p.barcode"><dt>Código de barras</dt><dd class="num">{{ p.barcode }}</dd></template>
              <template v-if="p.category?.name"><dt>Rubro</dt><dd>{{ p.category.name }}</dd></template>
              <template v-if="p.subcategory?.name"><dt>Subrubro</dt><dd>{{ p.subcategory.name }}</dd></template>
              <template v-if="p.brand"><dt>Marca</dt><dd>{{ p.brand }}</dd></template>
              <template v-if="p.model"><dt>Modelo</dt><dd>{{ p.model }}</dd></template>
              <dt>Estado</dt>
              <dd><span class="m-est" :class="activo ? 'ok' : 'gr'">{{ activo ? "Activo" : "Inactivo" }}</span></dd>
            </dl>
          </div>
        </div>

        <router-link v-if="esAdmin" :to="{ name: 'productEdit', params: { id: p.id } }" class="m-btn">Editar producto</router-link>
        <router-link v-else :to="{ name: 'lector', query: { modo: 'consultar' } }" replace class="m-btn">Escanear otro</router-link>
        <div class="m-centro"><button type="button" class="m-lnk" @click="derivar">Derivar</button></div>
        <div class="m-centro pc-pegado"><router-link :to="{ name: 'pos', query: { agregar: p.id } }" class="m-lnk">Agregar a la venta</router-link></div>
        <div v-if="enApk" class="m-centro pc-pegado"><button type="button" class="m-lnk" @click="imprimir">Imprimir etiqueta</button></div>
      </div>
    </template>
    <MovilAviso alto="24px" />
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { isCapacitor } from "@/app/utils/runtime";
import { cant, codigoDe, hora, imagenDe, num, pesos, u } from "../lib/formato";
import { productoEnCache } from "../lib/codigo";
import { avisar } from "../lib/aviso";
import { etiquetaProducto, imprimirEtiqueta, textoImpresion } from "../lib/etiquetas";
import { anotarLectura } from "../state/lecturas";
import { nuevaDerivacion } from "../state/derivacion";
import { sumarProductoADerivacion } from "../lib/ruteo";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const enApk = isCapacitor();
const esAdmin = computed(() => auth.isAdmin === true);

const p = ref(null);
const stock = ref([]);
const cargando = ref(true);
const error = ref("");
const copia = ref(Number(route.query.copia || 0) || null);

const foto = computed(() => imagenDe(p.value));
const activo = computed(() => p.value?.is_active !== false && p.value?.is_active !== 0);
const precioPrincipal = computed(() =>
  num(p.value?.price_discount)
    ? { valor: p.value.price_discount, rotulo: "Precio descuento" }
    : { valor: p.value?.price_list, rotulo: "Precio lista" }
);
const totalStock = computed(() => stock.value.reduce((a, s) => a + num(s.current_qty), 0));
const maxStock = computed(() => Math.max(1, ...stock.value.map((s) => num(s.current_qty))));
const barra = (q) => (num(q) > 0 ? Math.max(3, (num(q) / maxStock.value) * 100) : 0);

async function cargar() {
  const id = route.params.id;
  cargando.value = true;
  try {
    const { data } = await http.get(`/products/${id}`);
    p.value = data?.data || data?.product || data;
    copia.value = null;
    anotarLectura(p.value);
    try {
      const r = await http.get(`/products/${id}/branches`);
      stock.value = (r.data?.data || []).filter((s) => num(s.enabled) || num(s.current_qty));
    } catch {
      stock.value = [];
    }
  } catch (e) {
    const c = productoEnCache(id);
    if (c) {
      p.value = c;
      copia.value = c._copia || copia.value;
      stock.value = [];
    } else {
      error.value = e?.response?.status === 403 ? "Producto no habilitado en la sucursal" : e?.response ? "Producto no encontrado" : "Sin conexión";
    }
  } finally {
    cargando.value = false;
  }
}

async function derivar() {
  nuevaDerivacion();
  await sumarProductoADerivacion(p.value, auth);
  router.push({ name: "derivNueva" });
}

async function imprimir() {
  avisar(textoImpresion[await imprimirEtiqueta((ancho) => etiquetaProducto(p.value, ancho))]);
}

onMounted(cargar);
</script>

<style>
.pc-cu { padding: 0 0 24px !important; gap: 0 !important; }
.pc-in { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.pc-nom { font-size: 19px; font-weight: 800; }
.pc-pegado { margin-top: -12px; }
</style>
