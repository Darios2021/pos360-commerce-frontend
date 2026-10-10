<!-- src/modules/categories/pages/CategoriesPage.vue -->
<!-- Categorías con el diseño nuevo (10/10): a la izquierda los rubros con su
     cantidad de subrubros; a la derecha el rubro elegido, que se edita ahí
     mismo (nombre, activo, subrubros), sin ventanas. Un solo botón arriba. -->
<template>
  <div class="sp ct">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Categorías</h1>
        <span class="sp-cab__sub num">{{ rubros.length }} rubros · {{ totalSub }} subrubros</span>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="sp-nuevo" @click="nuevoRubro">Nuevo rubro</v-btn>
    </div>

    <div class="sp-busca">
      <div class="sp-busca__campo">
        <v-icon size="22" class="sp-busca__ic">mdi-magnify</v-icon>
        <input v-model="q" type="search" class="sp-busca__input" placeholder="Buscar rubro o subrubro" />
      </div>
      <label class="sp-check"><input v-model="verInactivos" type="checkbox" />Mostrar los inactivos</label>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="ct-cuerpo">
      <!-- Rubros -->
      <section class="sp-caja ct-lista">
        <div class="se-banda"><span>Rubros</span><small class="num">{{ lista.length }}</small></div>
        <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
        <div class="ct-filas">
          <button
            v-for="r in lista"
            :key="r.id"
            type="button"
            class="ct-fila"
            :class="{ 'is-on': sel && sel.id === r.id, 'is-off': !r.is_active }"
            @click="elegir(r)"
          >
            <span class="ct-fila__ic"><v-icon size="20">mdi-folder-outline</v-icon></span>
            <span class="ct-fila__txt">
              <b class="clamp1">{{ r.name }}</b>
              <small class="num">{{ subsDe(r).length }} {{ subsDe(r).length === 1 ? "subrubro" : "subrubros" }}<template v-if="!r.is_active"> · inactivo</template></small>
              <small v-if="q && coincidencias(r).length" class="ct-match clamp1">{{ coincidencias(r).join(" · ") }}</small>
            </span>
            <v-icon size="20" class="ct-fila__ir">mdi-chevron-right</v-icon>
          </button>
          <div v-if="!cargando && !lista.length" class="sp-vacio">{{ q ? "Ningún rubro coincide" : "Todavía no hay rubros" }}</div>
        </div>
      </section>

      <!-- Rubro elegido -->
      <section class="sp-caja ct-detalle">
        <template v-if="sel">
          <div class="se-banda"><span>{{ sel.id ? "Rubro" : "Nuevo rubro" }}</span><small v-if="sel.id" class="num">{{ subsDe(sel).length }} subrubros</small></div>
          <div class="se-campos">
            <label class="se-campo se-campo--ancho"><span>Nombre del rubro</span>
              <input ref="nombreRef" v-model="form.name" type="text" maxlength="120" @keydown.enter="guardarRubro" />
            </label>
            <label v-if="sel.id" class="ct-sw se-campo--ancho"><v-switch v-model="form.is_active" inset density="compact" hide-details color="primary" />Activo</label>
          </div>
          <div class="ct-accion">
            <v-btn color="primary" variant="flat" class="sp-nuevo" :loading="guardando" :disabled="!cambiado" @click="guardarRubro">
              {{ sel.id ? "Guardar cambios" : "Crear rubro" }}
            </v-btn>
          </div>

          <template v-if="sel.id">
            <div class="se-banda ct-banda2"><span>Subrubros</span></div>
            <div class="ct-subs">
              <div v-for="s in subsDe(sel)" :key="s.id" class="ct-sub" :class="{ 'is-off': !s.is_active }">
                <input v-model="s.name" type="text" maxlength="120" class="ct-sub__in" @keydown.enter="$event.target.blur()" @blur="guardarSub(s)" />
                <label class="ct-sw ct-sw--chico"><v-switch :model-value="s.is_active" inset density="compact" hide-details color="primary" @update:model-value="(v) => activarSub(s, v)" />{{ s.is_active ? "Activo" : "Inactivo" }}</label>
              </div>
              <div v-if="!subsDe(sel).length" class="ct-nada">Este rubro todavía no tiene subrubros</div>
              <div class="ct-nuevo">
                <v-icon size="20">mdi-plus</v-icon>
                <input v-model="nuevoSub" type="text" maxlength="120" placeholder="Nuevo subrubro y Enter" @keydown.enter="crearSub" />
                <v-progress-circular v-if="creandoSub" indeterminate size="18" width="2" color="primary" />
              </div>
            </div>
          </template>
        </template>
        <div v-else class="sp-vacio">Elegí un rubro de la lista</div>
      </section>
    </div>

    <v-snackbar v-model="aviso.open" :timeout="2200">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import http from "@/app/api/http";
import { useCategoriesStore } from "@/app/store/categories.store";
import "@/modules/products/styles/proveedores.css";

const cats = useCategoriesStore();
const rubros = ref([]);
const subs = ref({}); // category_id -> subrubros
const cargando = ref(false);
const guardando = ref(false);
const creandoSub = ref(false);
const error = ref("");
const q = ref("");
const verInactivos = ref(false);
const sel = ref(null);
const form = reactive({ name: "", is_active: true });
const nuevoSub = ref("");
const nombreRef = ref(null);
const aviso = reactive({ open: false, text: "" });

const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const subsDe = (r) => (subs.value[r?.id] || []).filter((s) => verInactivos.value || s.is_active).sort((a, b) => a.name.localeCompare(b.name, "es"));
const totalSub = computed(() => Object.values(subs.value).reduce((a, l) => a + l.length, 0));
function coincidencias(r) {
  const t = norm(q.value.trim());
  return t ? (subs.value[r.id] || []).filter((s) => norm(s.name).includes(t)).map((s) => s.name) : [];
}
const lista = computed(() => {
  const t = norm(q.value.trim());
  return rubros.value
    .filter((r) => verInactivos.value || r.is_active)
    .filter((r) => !t || norm(r.name).includes(t) || coincidencias(r).length)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
});
const cambiado = computed(() => {
  if (!sel.value) return false;
  if (!sel.value.id) return !!form.name.trim();
  return form.name.trim() !== sel.value.name || form.is_active !== sel.value.is_active;
});

function avisar(t) { aviso.text = t; aviso.open = true; }

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    await cats.fetchAll(true);
    rubros.value = (cats.parents || []).map((c) => ({ id: Number(c.id), name: String(c.name || "").trim(), is_active: Number(c.is_active ?? 1) !== 0 }));
    const mapa = {};
    await Promise.all(rubros.value.map(async (r) => {
      try {
        const { data } = await http.get(`/categories/${r.id}/subcategories`);
        mapa[r.id] = (data?.items || []).map((s) => ({ id: Number(s.id), name: String(s.name || "").trim(), nombreGuardado: String(s.name || "").trim(), is_active: Number(s.is_active ?? 1) !== 0, category_id: r.id }));
      } catch { mapa[r.id] = []; }
    }));
    subs.value = mapa;
    if (sel.value?.id) sel.value = rubros.value.find((r) => r.id === sel.value.id) || null;
    if (!sel.value && lista.value.length) elegir(lista.value[0]);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar las categorías";
  } finally {
    cargando.value = false;
  }
}

function elegir(r) {
  sel.value = r;
  form.name = r.name;
  form.is_active = r.is_active;
  nuevoSub.value = "";
}
function nuevoRubro() {
  sel.value = { id: null, name: "", is_active: true };
  form.name = "";
  form.is_active = true;
  nextTick(() => nombreRef.value?.focus());
}

async function guardarRubro() {
  const name = form.name.trim();
  if (!name || !cambiado.value || guardando.value) return;
  guardando.value = true;
  error.value = "";
  try {
    if (sel.value.id) {
      await cats.update(sel.value.id, { name, is_active: form.is_active ? 1 : 0, parent_id: null });
      avisar("Rubro guardado");
    } else {
      const creado = await cats.create({ name, is_active: 1, parent_id: null });
      sel.value = { id: Number(creado?.id) || null, name, is_active: true };
      avisar("Rubro creado");
    }
    await cargar();
  } catch (e) {
    error.value = cats.error || e?.response?.data?.message || e?.message || "No se pudo guardar el rubro";
  } finally {
    guardando.value = false;
  }
}

async function guardarSub(s) {
  const name = String(s.name || "").trim();
  if (!name) { s.name = s.nombreGuardado; return; }
  if (name === s.nombreGuardado) return;
  try {
    await http.patch(`/categories/${s.category_id}/subcategories/${s.id}`, { name });
    s.nombreGuardado = name;
    avisar("Subrubro guardado");
  } catch (e) {
    s.name = s.nombreGuardado;
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar el subrubro";
  }
}
async function activarSub(s, v) {
  try {
    await http.patch(`/categories/${s.category_id}/subcategories/${s.id}`, { is_active: v ? 1 : 0 });
    s.is_active = v;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cambiar el subrubro";
  }
}
async function crearSub() {
  const name = nuevoSub.value.trim();
  if (!name || !sel.value?.id || creandoSub.value) return;
  creandoSub.value = true;
  try {
    const { data } = await http.post(`/categories/${sel.value.id}/subcategories`, { name, is_active: 1 });
    const it = data?.item || data?.data || {};
    (subs.value[sel.value.id] ||= []).push({ id: Number(it.id), name, nombreGuardado: name, is_active: true, category_id: sel.value.id });
    nuevoSub.value = "";
    avisar("Subrubro agregado");
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo crear el subrubro";
  } finally {
    creandoSub.value = false;
  }
}

onMounted(cargar);
</script>

<style>
.ct-cuerpo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 16px; align-items: start; }
.ct-filas { display: flex; flex-direction: column; max-height: calc(100vh - 300px); overflow-y: auto; }
.ct-fila { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: 0; border-bottom: 1px solid var(--sp-linea); background: transparent; text-align: left; cursor: pointer; font-family: Inter, sans-serif; color: var(--sp-texto); border-left: 3px solid transparent; }
.ct-fila:hover { background: var(--sp-hover); }
.ct-fila.is-on { background: rgba(15, 111, 174, 0.08); border-left-color: #0f6fae; }
.ct-fila.is-off { opacity: .6; }
.ct-fila__ic { width: 36px; height: 36px; border-radius: 10px; background: var(--sp-hover); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ct-fila__ic .v-icon { color: #0f6fae; }
.ct-fila__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ct-fila__txt b { font-size: 15px; font-weight: 800; }
.ct-fila__txt small { font-size: 12px; color: var(--sp-suave); }
.ct-match { color: #0f6fae !important; font-weight: 700; }
.ct-fila__ir { color: var(--sp-tenue) !important; }
.ct-detalle { position: sticky; top: 70px; }
.ct-accion { display: flex; justify-content: flex-end; padding: 0 16px 16px; }
.ct-banda2 { border-top: 1px solid var(--sp-linea); }
.ct-sw { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; cursor: pointer; }
.ct-sw--chico { font-size: 13px; color: var(--sp-suave); min-width: 120px; }
.ct-subs { display: flex; flex-direction: column; padding: 8px 16px 16px; }
.ct-sub { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--sp-linea); }
.ct-sub.is-off .ct-sub__in { color: var(--sp-tenue); }
.ct-sub__in { flex: 1; min-width: 0; height: 40px; padding: 0 10px; border-radius: 8px; border: 1px solid transparent; background: transparent; font: 600 15px Inter, sans-serif; color: var(--sp-texto); outline: 0; }
.ct-sub__in:hover { border-color: var(--sp-borde); }
.ct-sub__in:focus { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, 0.18); background: var(--sp-caja); }
.ct-nada { padding: 12px 0; font-size: 14px; color: var(--sp-suave); }
.ct-nuevo { display: flex; align-items: center; gap: 8px; margin-top: 10px; height: 46px; padding: 0 12px; border-radius: 10px; border: 1px dashed var(--sp-borde); }
.ct-nuevo .v-icon { color: #0f6fae; }
.ct-nuevo input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: 600 15px Inter, sans-serif; color: var(--sp-texto); }
.ct-nuevo:focus-within { border-style: solid; border-color: #3f8fc6; }
@media (max-width: 900px) { .ct-cuerpo { grid-template-columns: 1fr; } .ct-detalle { position: static; } }
</style>
