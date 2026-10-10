<!-- src/modules/products/pages/SupplierEditPage.vue -->
<!-- Proveedor: alta, edición, baja y sus productos. Vista completa, no modal. -->
<template>
  <div class="sp">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <router-link :to="{ name: 'suppliers' }" class="se-volver"><v-icon size="18">mdi-arrow-left</v-icon>Proveedores</router-link>
        <h1 class="sp-cab__titulo">{{ esNuevo ? "Nuevo proveedor" : (form.name || "Proveedor") }}</h1>
        <span v-if="!esNuevo && !cargando" class="sp-cab__sub num">
          {{ productos.length }} {{ productos.length === 1 ? "producto" : "productos" }}<template v-if="!activo"> · dado de baja</template>
        </span>
      </div>
      <v-btn color="primary" variant="flat" class="sp-nuevo" :loading="guardando" :disabled="cargando" @click="guardar">
        {{ esNuevo ? "Guardar proveedor" : "Guardar cambios" }}
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="se-grilla">
      <section class="sp-caja">
        <div class="se-banda"><span>Datos</span></div>
        <div class="se-campos">
          <label class="se-campo se-campo--ancho"><span>Nombre o razón social</span><input v-model="form.name" type="text" maxlength="160" /></label>
          <label class="se-campo"><span>CUIT</span><input v-model="form.tax_id" type="text" inputmode="numeric" maxlength="20" placeholder="20-12345678-9" /></label>
          <label class="se-campo"><span>Teléfono</span><input v-model="form.phone" type="tel" maxlength="40" /></label>
          <label class="se-campo se-campo--ancho"><span>Correo</span><input v-model="form.email" type="email" maxlength="160" /></label>
        </div>
        <div v-if="!esNuevo" class="se-baja">
          <template v-if="activo">
            <template v-if="!confirmandoBaja">
              <span class="sp-s">Al dar de baja deja de aparecer al cargar productos; sus productos no cambian.</span>
              <a href="#" class="se-baja__link" @click.prevent="confirmandoBaja = true">Dar de baja</a>
            </template>
            <template v-else>
              <span class="sp-b">¿Dar de baja a {{ form.name }}?</span>
              <a href="#" class="sp-link" @click.prevent="confirmandoBaja = false">No</a>
              <v-btn color="error" variant="flat" size="small" :loading="guardando" @click="cambiarEstado(false)">Dar de baja</v-btn>
            </template>
          </template>
          <template v-else>
            <span class="sp-s">Este proveedor está dado de baja.</span>
            <v-btn color="primary" variant="tonal" size="small" :loading="guardando" @click="cambiarEstado(true)">Reactivar</v-btn>
          </template>
        </div>
      </section>

      <section v-if="!esNuevo" class="sp-caja">
        <div class="se-banda"><span>Productos</span><small class="num">{{ productos.length }}</small></div>
        <div v-if="!productos.length" class="sp-vacio">Ningún producto tiene cargado este proveedor</div>
        <div v-else class="se-filas">
          <router-link v-for="p in productos" :key="p.id" :to="{ name: 'productView', params: { id: p.id } }" class="se-prod">
            <span class="se-prod__txt">
              <span class="sp-b clamp1">{{ p.name }}</span>
              <span class="sp-s clamp1 num">{{ [p.sku, p.supplier_code ? `cód. prov. ${p.supplier_code}` : "", p.purchase_date ? `compra ${fecha(p.purchase_date)}` : ""].filter(Boolean).join(" · ") }}</span>
            </span>
            <span class="se-prod__precios num">
              <span v-if="Number(p.cost) > 0" class="sp-s">costo {{ p.cost_currency === "USD" ? "US$" : "$" }} {{ Number(p.cost).toLocaleString("es-AR") }}</span>
              <span class="sp-b">$ {{ Math.round(Number(p.price_list || 0)).toLocaleString("es-AR") }}</span>
            </span>
          </router-link>
        </div>
      </section>
    </div>

    <v-snackbar v-model="aviso.open" :timeout="2600">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import "../styles/proveedores.css";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id || 0));
const esNuevo = computed(() => !id.value);

const form = reactive({ name: "", tax_id: "", phone: "", email: "" });
const activo = ref(true);
const productos = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const confirmandoBaja = ref(false);
const aviso = reactive({ open: false, text: "" });

function fecha(v) {
  const [y, m, d] = String(v || "").slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : "";
}

async function cargar() {
  if (esNuevo.value) return;
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await http.get(`/products/suppliers/${id.value}`);
    const s = data?.data || {};
    Object.assign(form, { name: s.name || "", tax_id: s.tax_id || "", phone: s.phone || "", email: s.email || "" });
    activo.value = s.is_active !== false;
    productos.value = Array.isArray(s.products) ? s.products : [];
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el proveedor";
  } finally {
    cargando.value = false;
  }
}

async function guardar() {
  if (!form.name.trim()) { error.value = "Falta el nombre del proveedor."; return; }
  guardando.value = true;
  error.value = "";
  try {
    if (esNuevo.value) {
      const { data } = await http.post("/products/suppliers", { ...form });
      const nuevo = data?.data;
      aviso.text = data?.existed ? "Ese proveedor ya existía: se abrió el que estaba" : "Proveedor guardado";
      aviso.open = true;
      if (nuevo?.id) router.replace({ name: "supplierEdit", params: { id: nuevo.id } });
    } else {
      await http.put(`/products/suppliers/${id.value}`, { ...form });
      aviso.text = "Cambios guardados";
      aviso.open = true;
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar";
  } finally {
    guardando.value = false;
  }
}

async function cambiarEstado(valor) {
  guardando.value = true;
  error.value = "";
  try {
    await http.put(`/products/suppliers/${id.value}`, { ...form, is_active: valor });
    activo.value = valor;
    confirmandoBaja.value = false;
    aviso.text = valor ? "Proveedor reactivado" : "Proveedor dado de baja";
    aviso.open = true;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cambiar el estado";
  } finally {
    guardando.value = false;
  }
}

onMounted(cargar);
watch(id, () => { confirmandoBaja.value = false; cargar(); });
</script>
