<!-- src/modules/products/pages/SuppliersPage.vue -->
<!-- Proveedores: lista con buscador, productos de cada uno y última compra. -->
<template>
  <div class="sp">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Proveedores</h1>
        <span class="sp-cab__sub num">{{ subtitulo }}</span>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="sp-nuevo" :to="{ name: 'supplierNew' }">Nuevo proveedor</v-btn>
    </div>

    <div class="sp-busca">
      <div class="sp-busca__campo">
        <v-icon size="22" class="sp-busca__ic">mdi-magnify</v-icon>
        <input v-model="q" type="search" class="sp-busca__input" placeholder="Nombre, CUIT, teléfono o correo" @input="buscar" />
      </div>
      <label class="sp-check">
        <input v-model="inactivos" type="checkbox" @change="cargar" />
        Mostrar los dados de baja
      </label>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="sp-caja">
      <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
      <div class="sp-tabla-scroll">
        <table class="sp-tabla">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th class="c-cuit">CUIT</th>
              <th class="c-contacto">Contacto</th>
              <th class="c-num">Productos</th>
              <th class="c-fecha">Última compra</th>
              <th class="c-ver"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filas" :key="p.id" :class="{ 'is-baja': !p.is_active }" @click="abrir($event, p.id)" @auxclick="abrir($event, p.id)">
              <td>
                <router-link :to="ruta(p.id)" class="sp-nombre" @click.stop>{{ p.name }}</router-link>
                <span v-if="!p.is_active" class="sp-baja">dado de baja</span>
              </td>
              <td class="num">{{ p.tax_id || "—" }}</td>
              <td><div class="clamp1">{{ p.phone || "" }}</div><div class="sp-s clamp1">{{ p.email || "" }}</div><span v-if="!p.phone && !p.email" class="sp-tenue">—</span></td>
              <td class="c-num num sp-b">{{ p.products_count }}</td>
              <td class="num">{{ fecha(p.last_purchase) || "—" }}</td>
              <td class="c-ver"><router-link :to="ruta(p.id)" class="sp-link" @click.stop>Editar<v-icon size="18">mdi-chevron-right</v-icon></router-link></td>
            </tr>
            <tr v-if="!cargando && !filas.length">
              <td colspan="6" class="sp-vacio">
                {{ q ? "Ningún proveedor coincide con la búsqueda" : "Todavía no hay proveedores" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import http from "@/app/api/http";
import "../styles/proveedores.css";

const router = useRouter();
const filas = ref([]);
const q = ref("");
const inactivos = ref(false);
const cargando = ref(false);
const error = ref("");

const subtitulo = computed(() => {
  const activos = filas.value.filter((p) => p.is_active).length;
  return `${activos} ${activos === 1 ? "proveedor activo" : "proveedores activos"}`;
});

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await http.get("/products/suppliers", { params: { q: q.value.trim(), inactivos: inactivos.value ? 1 : 0, limit: 500 } });
    filas.value = Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar los proveedores";
  } finally {
    cargando.value = false;
  }
}
let t = null;
function buscar() {
  clearTimeout(t);
  t = setTimeout(cargar, 250);
}
const ruta = (id) => ({ name: "supplierEdit", params: { id } });
function abrir(e, id) {
  if (window.getSelection?.()?.toString()) return;
  if (e.button === 1 || e.ctrlKey || e.metaKey) { window.open(router.resolve(ruta(id)).href, "_blank"); return; }
  if (e.type === "click") router.push(ruta(id));
}
function fecha(v) {
  const [y, m, d] = String(v || "").slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : "";
}

onMounted(cargar);
</script>
