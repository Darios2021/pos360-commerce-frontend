<template>
  <div class="cad">
    <!-- HEADER -->
    <div class="cad-head">
      <div class="cad-head__left">
        <v-icon size="22" color="primary">mdi-account-group-outline</v-icon>
        <div>
          <h1 class="cad-title">Clientes</h1>
          <span class="cad-subtitle">Banco de datos para promociones, fidelización y reportes</span>
        </div>
      </div>
      <div class="cad-head__right">
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-database-sync-outline"
          :loading="busyBackfill"
          @click="onBackfill"
        >
          Backfill desde ventas
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          rounded="lg"
          prepend-icon="mdi-account-plus-outline"
          @click="openCreate"
        >
          Nuevo cliente
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
      {{ error }}
    </v-alert>

    <!-- BARRA DE FILTROS -->
    <div class="cad-filters">
      <v-text-field
        v-model="filters.q"
        placeholder="Buscar por nombre, email, teléfono, documento…"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="cad-search"
        @update:model-value="onSearch"
      />
      <v-select
        v-model="filters.customer_type"
        :items="customerTypeItems"
        label="Tipo"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="cad-type"
      />
      <v-checkbox
        v-model="filters.accepts_promos"
        label="Solo con promos"
        density="compact"
        hide-details
      />
      <v-spacer />
      <span v-if="meta.total" class="cad-count">
        {{ meta.total }} cliente{{ meta.total === 1 ? '' : 's' }}
      </span>
    </div>

    <!-- BARRA DE BULK (selección) -->
    <div v-if="selectionCount > 0" class="cad-bulk">
      <div class="cad-bulk__left">
        <v-icon size="16" color="primary">mdi-checkbox-multiple-marked-outline</v-icon>
        <span><b>{{ selectionCount }}</b> seleccionado{{ selectionCount === 1 ? '' : 's' }}</span>
        <button class="cad-bulk__clear" type="button" @click="clearSelection">Limpiar</button>
      </div>
      <div class="cad-bulk__right">
        <v-btn
          v-if="selectionCount >= 2"
          color="primary"
          size="small"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-set-merge"
          @click="openMerge"
        >
          Unificar {{ selectionCount }} en uno
        </v-btn>
      </div>
    </div>

    <!-- TABLA -->
    <div class="cad-table-wrap">
      <table class="cad-table">
        <thead>
          <tr>
            <th class="col-check">
              <v-checkbox
                :model-value="allOnPageSelected"
                :indeterminate="!allOnPageSelected && someOnPageSelected"
                hide-details
                density="compact"
                color="primary"
                @click.stop="toggleSelectAllOnPage"
              />
            </th>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Contacto</th>
            <th>Tipo</th>
            <th class="num">Compras</th>
            <th class="num">Total</th>
            <th>Última</th>
            <th>Promos</th>
            <th class="cad-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length">
            <td colspan="10" class="cad-loading">
              <v-progress-circular indeterminate size="22" color="primary" />
            </td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="10" class="cad-empty">
              <v-icon size="36" color="medium-emphasis">mdi-account-search-outline</v-icon>
              <div>Sin clientes para estos filtros.</div>
              <v-btn
                v-if="!filters.q"
                size="small"
                variant="tonal"
                color="primary"
                class="mt-2"
                prepend-icon="mdi-database-sync-outline"
                @click="onBackfill"
              >Importar desde historial de ventas</v-btn>
            </td>
          </tr>
          <tr
            v-for="r in items"
            :key="r.id"
            class="cad-row"
            :class="{ 'is-selected': isSelected(r.id), 'is-inactive': !r.is_active }"
            @click="openEdit(r)"
          >
            <td class="cad-check" @click.stop>
              <v-checkbox
                :model-value="isSelected(r.id)"
                hide-details
                density="compact"
                color="primary"
                @update:model-value="toggleSelect(r.id)"
              />
            </td>
            <td>
              <div class="cad-name">
                <div class="cad-name__avatar">{{ initialsOf(r) }}</div>
                <div>
                  <div class="cad-name__main">{{ r.display_name }}</div>
                  <div v-if="r.tags" class="cad-name__tags">{{ r.tags }}</div>
                </div>
              </div>
            </td>
            <td class="cad-doc">
              <span v-if="r.doc_number">
                <span class="cad-doc__type">{{ r.doc_type || 'DNI' }}</span>
                <span class="cad-doc__num">{{ r.doc_number }}</span>
              </span>
              <span v-else class="cad-dim">—</span>
            </td>
            <td>
              <div v-if="r.email" class="cad-contact">
                <v-icon size="12">mdi-email-outline</v-icon>{{ r.email }}
              </div>
              <div v-if="r.phone" class="cad-contact">
                <v-icon size="12">mdi-phone-outline</v-icon>{{ r.phone }}
              </div>
              <span v-if="!r.email && !r.phone" class="cad-dim">—</span>
            </td>
            <td>
              <span class="cad-type-chip" :class="`cad-type-chip--${r.customer_type?.toLowerCase()}`">
                {{ typeLabel(r.customer_type) }}
              </span>
            </td>
            <td class="num">{{ r.stats?.sales_count || 0 }}</td>
            <td class="num"><b>${{ fmtNum(r.stats?.sales_total) }}</b></td>
            <td>{{ fmtDate(r.stats?.last_sold_at) }}</td>
            <td>
              <v-icon v-if="r.accepts_promos" size="16" color="success">mdi-bell-ring</v-icon>
              <v-icon v-else size="16" color="medium-emphasis">mdi-bell-off-outline</v-icon>
            </td>
            <td class="cad-action" @click.stop>
              <v-menu :close-on-content-click="true">
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                </template>
                <v-list density="compact" nav>
                  <v-list-item prepend-icon="mdi-eye-outline" @click="openEdit(r)">
                    <v-list-item-title>Ver / editar</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    prepend-icon="mdi-bell-ring-outline"
                    @click="quickToggleAcceptsPromos(r)"
                  >
                    <v-list-item-title>{{ r.accepts_promos ? 'Quitar de promos' : 'Marcar para promos' }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    prepend-icon="mdi-trash-can-outline"
                    @click="confirmDelete(r)"
                    class="text-error"
                  >
                    <v-list-item-title>{{ r.is_active ? 'Desactivar' : 'Eliminar definitivo' }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- PAGINACIÓN -->
      <div v-if="meta.total > filters.limit" class="cad-pager">
        <v-btn size="small" variant="tonal" :disabled="filters.page <= 1" @click="goPage(filters.page - 1)">
          <v-icon start>mdi-chevron-left</v-icon>Anterior
        </v-btn>
        <span class="cad-pager__info">Pág <b>{{ filters.page }}</b> de <b>{{ totalPages }}</b></span>
        <v-btn size="small" variant="tonal" :disabled="filters.page >= totalPages" @click="goPage(filters.page + 1)">
          Siguiente<v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- DIALOG: edit/create -->
    <v-dialog v-model="editDialog.show" max-width="640" persistent>
      <v-card rounded="xl" class="cad-edit">
        <div class="cad-edit__head">
          <v-icon size="22" color="primary">{{ editDialog.id ? 'mdi-account-edit-outline' : 'mdi-account-plus-outline' }}</v-icon>
          <div>
            <p class="cad-edit__eyebrow">{{ editDialog.id ? `Cliente #${editDialog.id}` : 'Nuevo cliente' }}</p>
            <h3 class="cad-edit__title">{{ editDialog.id ? form.display_name : 'Crear cliente' }}</h3>
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="editDialog.show = false" />
        </div>
        <div class="cad-edit__body">
          <div class="cad-edit__grid">
            <v-text-field v-model="form.first_name" label="Nombre" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.last_name" label="Apellido / Razón social" variant="outlined" density="compact" hide-details />
            <v-select
              v-model="form.doc_type"
              :items="['DNI','CUIT','CUIL','PASAPORTE','OTRO']"
              label="Tipo doc"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
            <v-text-field v-model="form.doc_number" label="Número doc" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.email" label="Email" variant="outlined" density="compact" hide-details type="email" />
            <v-text-field v-model="form.phone" label="Teléfono" variant="outlined" density="compact" hide-details />
            <v-select
              v-model="form.customer_type"
              :items="customerTypeItems"
              label="Tipo de cliente"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field v-model="form.tax_condition" label="Condición fiscal" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.address" label="Dirección" variant="outlined" density="compact" hide-details class="cad-edit__full" />
            <v-text-field v-model="form.city" label="Ciudad" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.province" label="Provincia" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.postal_code" label="CP" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.tags" label="Tags (separados por coma)" placeholder="vip, mayorista" variant="outlined" density="compact" hide-details class="cad-edit__full" />
            <v-textarea v-model="form.notes" label="Notas internas" variant="outlined" density="compact" hide-details rows="2" auto-grow class="cad-edit__full" />
          </div>

          <div class="cad-edit__switches">
            <v-switch
              v-model="form.accepts_promos"
              color="primary"
              hide-details
              density="compact"
              :label="form.accepts_promos ? 'Acepta promociones / marketing' : 'No recibir promociones'"
            />
            <v-switch
              v-model="form.is_active"
              color="success"
              hide-details
              density="compact"
              :label="form.is_active ? 'Cliente activo' : 'Cliente inactivo'"
            />
          </div>

          <!-- Stats si es edición -->
          <div v-if="editDialog.id && editDialog.stats" class="cad-edit__stats">
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Compras</span>
              <span class="cad-edit__stat-v">{{ editDialog.stats.sales_count || 0 }}</span>
            </div>
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Total</span>
              <span class="cad-edit__stat-v">${{ fmtNum(editDialog.stats.sales_total) }}</span>
            </div>
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Ticket prom.</span>
              <span class="cad-edit__stat-v">${{ fmtNum(editDialog.stats.avg_ticket) }}</span>
            </div>
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Última</span>
              <span class="cad-edit__stat-v">{{ fmtDate(editDialog.stats.last_sold_at) }}</span>
            </div>
          </div>
        </div>
        <div class="cad-edit__actions">
          <v-btn variant="text" :disabled="busySave" @click="editDialog.show = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="busySave"
            prepend-icon="mdi-content-save-outline"
            @click="onSave"
          >
            {{ editDialog.id ? 'Guardar cambios' : 'Crear cliente' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG: merge -->
    <v-dialog v-model="mergeDialog.show" max-width="540" persistent>
      <v-card rounded="xl">
        <div class="cad-edit__head">
          <v-icon size="22" color="primary">mdi-set-merge</v-icon>
          <div>
            <p class="cad-edit__eyebrow">Unificar {{ mergeDialog.candidates.length }} clientes</p>
            <h3 class="cad-edit__title">Elegí el cliente principal</h3>
          </div>
        </div>
        <div class="cad-edit__body">
          <p class="cad-help">
            Las ventas de los demás clientes se reasignarán al principal y los duplicados se eliminarán.
            Esta acción no se puede deshacer.
          </p>
          <v-radio-group v-model="mergeDialog.target_id" hide-details density="compact">
            <v-radio
              v-for="c in mergeDialog.candidates"
              :key="c.id"
              :value="c.id"
              :label="`${c.display_name} (${c.stats?.sales_count || 0} compras · $${fmtNum(c.stats?.sales_total)})`"
            />
          </v-radio-group>
        </div>
        <div class="cad-edit__actions">
          <v-btn variant="text" :disabled="busyMerge" @click="mergeDialog.show = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="busyMerge"
            :disabled="!mergeDialog.target_id"
            prepend-icon="mdi-set-merge"
            @click="onMerge"
          >
            Unificar en seleccionado
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG: confirm delete -->
    <v-dialog v-model="deleteDialog.show" max-width="460" persistent>
      <v-card rounded="xl">
        <div class="cad-edit__head">
          <v-icon size="22" color="error">mdi-trash-can-outline</v-icon>
          <div>
            <p class="cad-edit__eyebrow">Cliente #{{ deleteDialog.row?.id }}</p>
            <h3 class="cad-edit__title">{{ deleteDialog.row?.is_active ? 'Desactivar cliente' : 'Eliminar definitivo' }}</h3>
          </div>
        </div>
        <div class="cad-edit__body">
          <v-alert type="warning" variant="tonal" density="compact">
            <span v-if="deleteDialog.row?.is_active">
              Desactivar lo oculta de listados pero mantiene el historial de ventas asociado. Podés
              reactivarlo después.
            </span>
            <span v-else>
              Esta acción borra el cliente para siempre. Las ventas existentes pierden el vínculo
              (quedan como "Cliente eliminado" con el snapshot del momento de la venta).
            </span>
          </v-alert>
        </div>
        <div class="cad-edit__actions">
          <v-btn variant="text" :disabled="busyDelete" @click="deleteDialog.show = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="busyDelete"
            @click="doDelete"
          >
            {{ deleteDialog.row?.is_active ? 'Desactivar' : 'Eliminar' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500" rounded="xl">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  listCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, mergeCustomers, backfillCustomers,
} from "../services/customers.service";

const customerTypeItems = [
  { title: "Consumidor final", value: "CONSUMIDOR_FINAL" },
  { title: "Responsable inscripto", value: "RESPONSABLE_INSCRIPTO" },
  { title: "Monotributo", value: "MONOTRIBUTO" },
  { title: "Exento", value: "EXENTO" },
  { title: "Otro", value: "OTRO" },
];

const items = ref([]);
const meta = ref({ page: 1, limit: 25, total: 0, pages: 1 });
const loading = ref(false);
const error = ref("");

const filters = reactive({
  q: "",
  customer_type: null,
  accepts_promos: false,
  page: 1,
  limit: 25,
});

const selectedIds = ref(new Set());
const editDialog = reactive({ show: false, id: null, stats: null });
const form = reactive(emptyForm());
const mergeDialog = reactive({ show: false, candidates: [], target_id: null });
const deleteDialog = reactive({ show: false, row: null });
const snack = reactive({ show: false, text: "" });

const busySave = ref(false);
const busyMerge = ref(false);
const busyDelete = ref(false);
const busyBackfill = ref(false);

function emptyForm() {
  return {
    first_name: "",
    last_name: "",
    display_name: "",
    doc_type: null,
    doc_number: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    customer_type: "CONSUMIDOR_FINAL",
    tax_condition: "",
    tags: "",
    notes: "",
    accepts_promos: false,
    is_active: true,
  };
}

const totalPages = computed(() => Math.max(1, Math.ceil((meta.value.total || 0) / (filters.limit || 25))));
const selectionCount = computed(() => selectedIds.value.size);
const allOnPageSelected = computed(() =>
  items.value.length > 0 && items.value.every((r) => selectedIds.value.has(r.id))
);
const someOnPageSelected = computed(() =>
  items.value.some((r) => selectedIds.value.has(r.id))
);

function toast(text) { snack.show = true; snack.text = String(text || ""); }
function fmtNum(v) { return new Intl.NumberFormat("es-AR").format(Number(v || 0)); }
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function initialsOf(r) {
  const src = r.display_name || `${r.first_name || ""} ${r.last_name || ""}`;
  const parts = String(src).trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || "?";
}
function typeLabel(v) {
  const found = customerTypeItems.find((i) => i.value === v);
  return found?.title || v || "—";
}

async function reload() {
  loading.value = true;
  error.value = "";
  try {
    const params = {
      q: filters.q,
      customer_type: filters.customer_type || "",
      accepts_promos: filters.accepts_promos ? 1 : "",
      page: filters.page,
      limit: filters.limit,
    };
    const { data } = await listCustomers(params);
    items.value = data?.data || [];
    meta.value = data?.meta || { page: 1, limit: filters.limit, total: 0 };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar.";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

let searchTimer = null;
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { filters.page = 1; reload(); }, 300);
}
watch(() => filters.customer_type, () => { filters.page = 1; reload(); });
watch(() => filters.accepts_promos, () => { filters.page = 1; reload(); });

function goPage(p) {
  filters.page = Math.max(1, Math.min(totalPages.value, p));
  reload();
}

// ── Selección ──
function isSelected(id) { return selectedIds.value.has(id); }
function toggleSelect(id) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedIds.value = next;
}
function toggleSelectAllOnPage() {
  const next = new Set(selectedIds.value);
  if (allOnPageSelected.value) for (const r of items.value) next.delete(r.id);
  else for (const r of items.value) next.add(r.id);
  selectedIds.value = next;
}
function clearSelection() { selectedIds.value = new Set(); }

// ── Crear / editar ──
function openCreate() {
  Object.assign(form, emptyForm());
  editDialog.id = null;
  editDialog.stats = null;
  editDialog.show = true;
}
async function openEdit(row) {
  editDialog.id = row.id;
  editDialog.stats = row.stats || null;
  Object.assign(form, emptyForm(), {
    first_name: row.first_name || "",
    last_name:  row.last_name || "",
    display_name: row.display_name || "",
    doc_type:   row.doc_type || null,
    doc_number: row.doc_number || "",
    email:      row.email || "",
    phone:      row.phone || "",
    address:    row.address || "",
    city:       row.city || "",
    province:   row.province || "",
    postal_code: row.postal_code || "",
    customer_type: row.customer_type || "CONSUMIDOR_FINAL",
    tax_condition: row.tax_condition || "",
    tags:       row.tags || "",
    notes:      row.notes || "",
    accepts_promos: !!row.accepts_promos,
    is_active:  row.is_active !== false,
  });
  editDialog.show = true;
  // Stats frescos del backend (si la lista no los traía con detalle).
  try {
    const { data } = await getCustomer(row.id);
    if (data?.data) {
      editDialog.stats = data.data.stats || null;
    }
  } catch (_) {}
}

async function onSave() {
  busySave.value = true;
  try {
    if (editDialog.id) {
      await updateCustomer(editDialog.id, form);
      toast("Cliente actualizado");
    } else {
      await createCustomer(form);
      toast("Cliente creado");
    }
    editDialog.show = false;
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo guardar");
  } finally {
    busySave.value = false;
  }
}

async function quickToggleAcceptsPromos(row) {
  try {
    await updateCustomer(row.id, { accepts_promos: !row.accepts_promos });
    toast(`Marketing ${!row.accepts_promos ? "activado" : "desactivado"}`);
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo actualizar");
  }
}

// ── Merge ──
function openMerge() {
  const cands = items.value.filter((r) => selectedIds.value.has(r.id));
  if (cands.length < 2) {
    toast("Seleccioná al menos 2 clientes para unificar");
    return;
  }
  // Default target: el que más compras tiene.
  const sorted = [...cands].sort(
    (a, b) => (b.stats?.sales_count || 0) - (a.stats?.sales_count || 0)
  );
  mergeDialog.candidates = sorted;
  mergeDialog.target_id = sorted[0]?.id || null;
  mergeDialog.show = true;
}
async function onMerge() {
  if (!mergeDialog.target_id) return;
  busyMerge.value = true;
  try {
    const targetId = mergeDialog.target_id;
    const sourceIds = mergeDialog.candidates
      .map((c) => c.id)
      .filter((id) => id !== targetId);
    const { data } = await mergeCustomers({ target_id: targetId, source_ids: sourceIds });
    toast(`Unificados ${data?.data?.merged || 0} clientes (${data?.data?.sales_reassigned || 0} ventas reasignadas)`);
    mergeDialog.show = false;
    clearSelection();
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo unificar");
  } finally {
    busyMerge.value = false;
  }
}

// ── Delete ──
function confirmDelete(row) {
  deleteDialog.row = row;
  deleteDialog.show = true;
}
async function doDelete() {
  const row = deleteDialog.row;
  if (!row?.id) return;
  busyDelete.value = true;
  try {
    // Si ya está inactivo, hard-delete (force=1). Si está activo, soft-delete.
    await deleteCustomer(row.id, { force: !row.is_active });
    toast(row.is_active ? "Cliente desactivado" : "Cliente eliminado");
    deleteDialog.show = false;
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo eliminar");
  } finally {
    busyDelete.value = false;
  }
}

// ── Backfill ──
async function onBackfill() {
  busyBackfill.value = true;
  try {
    const { data } = await backfillCustomers({ dryRun: false });
    toast(data?.message || "Backfill completado");
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo backfill");
  } finally {
    busyBackfill.value = false;
  }
}

onMounted(reload);
</script>

<style scoped>
.cad {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 24px;
}

.cad-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.cad-head__left { display: flex; align-items: center; gap: 12px; }
.cad-title { font-size: 22px; font-weight: 900; line-height: 1.1; margin: 0; }
.cad-subtitle { font-size: 12px; opacity: 0.65; font-weight: 500; }
.cad-head__right { display: flex; gap: 8px; flex-wrap: wrap; }

.cad-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.cad-search { flex: 1; min-width: 240px; max-width: 480px; }
.cad-type { min-width: 200px; }
.cad-count {
  font-size: 12px;
  font-weight: 700;
  opacity: 0.65;
  letter-spacing: 0.02em;
}

.cad-bulk {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1.5px solid rgba(var(--v-theme-primary), 0.35);
  flex-wrap: wrap;
}
.cad-bulk__left {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 600;
}
.cad-bulk__clear {
  background: transparent; border: none; cursor: pointer;
  font-size: 11.5px; font-weight: 700;
  color: rgb(var(--v-theme-primary));
  padding: 4px 8px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.cad-bulk__clear:hover { background: rgba(var(--v-theme-primary), 0.12); }

/* Tabla */
.cad-table-wrap {
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
.cad-table {
  width: 100%;
  border-collapse: collapse;
}
.cad-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.cad-table th.num, .cad-table td.num { text-align: right; }
.col-check { width: 44px; padding-left: 12px !important; padding-right: 0 !important; }
.cad-action { width: 60px; text-align: right; }
.cad-row td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
  font-size: 13px;
  vertical-align: middle;
}
.cad-row { cursor: pointer; transition: background 0.12s; }
.cad-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
.cad-row.is-selected { background: rgba(var(--v-theme-primary), 0.08); }
.cad-row.is-inactive { opacity: 0.55; }
.cad-row:last-child td { border-bottom: none; }
.cad-check { padding-left: 12px !important; padding-right: 0 !important; }
.cad-loading, .cad-empty {
  text-align: center; padding: 40px 20px; opacity: 0.65;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.cad-empty { font-size: 13px; font-weight: 600; }

.cad-name { display: flex; align-items: center; gap: 10px; }
.cad-name__avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 11px; font-weight: 800;
}
.cad-name__main { font-weight: 700; font-size: 13px; }
.cad-name__tags { font-size: 10.5px; opacity: 0.6; margin-top: 1px; }

.cad-doc__type {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; opacity: 0.55; margin-right: 4px;
}
.cad-doc__num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.cad-dim { opacity: 0.45; font-size: 11.5px; }

.cad-contact {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; opacity: 0.85;
  margin-right: 8px;
}

.cad-type-chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.cad-type-chip--consumidor_final  { background: rgba(99, 102, 241, 0.14); color: #6366f1; }
.cad-type-chip--responsable_inscripto { background: rgba(16, 185, 129, 0.14); color: #10b981; }
.cad-type-chip--monotributo       { background: rgba(245, 158, 11, 0.14); color: #d97706; }
.cad-type-chip--exento            { background: rgba(139, 92, 246, 0.14); color: #8b5cf6; }
.cad-type-chip--otro              { background: rgba(var(--v-theme-on-surface), 0.08); color: rgba(var(--v-theme-on-surface), 0.7); }

.cad-pager {
  display: flex; justify-content: center; align-items: center;
  gap: 12px; padding: 12px;
}
.cad-pager__info { font-size: 12px; opacity: 0.65; }

/* Edit dialog */
.cad-edit__head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.cad-edit__eyebrow {
  margin: 0; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0.6;
}
.cad-edit__title { margin: 2px 0 0; font-size: 18px; font-weight: 800; line-height: 1.1; }
.cad-edit__body { padding: 16px 20px; }
.cad-edit__grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.cad-edit__full { grid-column: 1 / span 2; }
.cad-edit__switches {
  display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px;
}
.cad-edit__stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  margin-top: 16px;
}
.cad-edit__stat {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cad-edit__stat-k {
  font-size: 9.5px; font-weight: 800;
  letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0.55;
}
.cad-edit__stat-v {
  font-size: 14px; font-weight: 800; margin-top: 2px;
}
.cad-edit__actions {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.cad-help { font-size: 12.5px; opacity: 0.85; line-height: 1.5; margin-bottom: 8px; }

@media (max-width: 720px) {
  .cad-edit__grid { grid-template-columns: 1fr; }
  .cad-edit__full { grid-column: 1; }
  .cad-edit__stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
