<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/admin/pages/ShopLinksView.vue -->
<template>
  <v-container fluid class="sl-page">
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-black">Links del Shop</div>
        <div class="text-caption text-medium-emphasis">
          Gestioná publicaciones de Instagram (carrusel) y otros links. Ordená con <b>Sort</b> (menor = primero).
        </div>
      </div>

      <div class="d-flex ga-2 align-center flex-wrap">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="reload">
          Recargar
        </v-btn>

        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo link
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card variant="tonal" rounded="xl" class="pa-3 mb-4 sl-card">
      <div class="d-flex flex-wrap ga-3 align-center">
        <v-select
          v-model="kind"
          label="Tipo"
          variant="outlined"
          density="comfortable"
          :items="kindItems"
          style="min-width: 260px"
          hide-details
        />

        <v-text-field
          v-model="q"
          label="Buscar (título / URL)"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          style="min-width: 320px; flex: 1"
          @keyup.enter="reload"
        />

        <v-btn variant="tonal" prepend-icon="mdi-magnify" @click="reload" :loading="loading">
          Buscar
        </v-btn>
      </div>
    </v-card>

    <!-- Alerts -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Table -->
    <v-card rounded="xl" variant="outlined" class="sl-table-card">
      <v-data-table
        :headers="headers"
        :items="rows"
        item-key="id"
        :loading="loading"
        :items-per-page="50"
        class="sl-table"
      >
        <!-- Active -->
        <template #item.is_active="{ item }">
          <v-switch
            :model-value="!!item.is_active"
            color="primary"
            density="comfortable"
            hide-details
            @update:model-value="(v) => onToggleActive(item, v)"
          />
        </template>

        <!-- Title -->
        <template #item.title="{ item }">
          <div class="sl-title">
            <div class="font-weight-bold">{{ item.title || "—" }}</div>
            <div class="text-caption text-medium-emphasis sl-kind">{{ item.kind }}</div>
          </div>
        </template>

        <!-- URL -->
        <template #item.url="{ item }">
          <div class="sl-url">
            <a :href="item.url" target="_blank" rel="noopener noreferrer">
              {{ item.url }}
            </a>
            <div v-if="item.subtitle" class="text-caption text-medium-emphasis">
              {{ item.subtitle }}
            </div>
          </div>
        </template>

        <!-- Sort -->
        <template #item.sort_order="{ item }">
          <v-text-field
            :model-value="String(item.sort_order ?? 0)"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 120px"
            @blur="(e) => onSortBlur(item, e)"
          />
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="openEdit(item)"
            >
              Editar
            </v-btn>

            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-open-in-new"
              @click="openUrl(item.url)"
            >
              Abrir
            </v-btn>

            <v-btn
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete"
              @click="confirmDelete(item)"
            >
              Borrar
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <div v-if="!loading && !rows.length" class="pa-6 text-center text-medium-emphasis">
        No hay links cargados para este filtro.
      </div>
    </v-card>

    <!-- Dialog: create/edit -->
    <v-dialog v-model="dlg.open" max-width="720">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-h6 font-weight-black">
            {{ dlg.mode === "create" ? "Nuevo link" : "Editar link" }}
          </div>
          <v-btn icon="mdi-close" variant="text" @click="dlg.open = false" />
        </v-card-title>

        <v-card-text>
          <div class="d-flex flex-wrap ga-3">
            <v-select
              v-model="dlg.form.kind"
              label="Tipo"
              variant="outlined"
              density="comfortable"
              :items="kindItems.filter(k => k.value)"
              style="min-width: 240px; flex: 1"
            />

            <v-text-field
              v-model="dlg.form.sort_order"
              label="Sort (menor = primero)"
              variant="outlined"
              density="comfortable"
              type="number"
              style="min-width: 200px"
            />
          </div>

          <div class="d-flex flex-wrap ga-3 mt-3">
            <v-text-field
              v-model="dlg.form.title"
              label="Título"
              variant="outlined"
              density="comfortable"
              style="min-width: 280px; flex: 1"
            />

            <v-switch
              v-model="dlg.form.is_active"
              color="primary"
              label="Activo"
              hide-details
            />
          </div>

          <v-text-field
            v-model="dlg.form.subtitle"
            label="Subtítulo (opcional)"
            variant="outlined"
            density="comfortable"
            class="mt-3"
          />

          <v-textarea
            v-model="dlg.form.url"
            label="URL"
            variant="outlined"
            density="comfortable"
            auto-grow
            rows="2"
            class="mt-3"
            placeholder="https://www.instagram.com/p/XXXXXXX/"
          />

          <v-alert v-if="dlg.error" type="error" variant="tonal" class="mt-3">
            {{ dlg.error }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="dlg.open = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlg.loading" @click="saveDlg">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete -->
    <v-dialog v-model="del.open" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-black">Eliminar link</v-card-title>
        <v-card-text>
          ¿Seguro que querés borrar este link?
          <div class="mt-2 text-caption text-medium-emphasis">
            {{ del.item?.title || "—" }}<br />
            {{ del.item?.url || "" }}
          </div>

          <v-alert v-if="del.error" type="error" variant="tonal" class="mt-3">
            {{ del.error }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="del.open = false">Cancelar</v-btn>
          <v-btn color="error" :loading="del.loading" @click="doDelete">Borrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import {
  adminListLinks,
  adminCreateLink,
  adminUpdateLink,
  adminDeleteLink,
} from "@/app/services/admin.shopLinks.api";

// ======================
// State
// ======================
const loading = ref(false);
const error = ref("");

const kind = ref("INSTAGRAM_POST");
const q = ref("");

const rows = ref([]);

const kindItems = [
  { title: "Instagram (posts)", value: "INSTAGRAM_POST" },
  { title: "Instagram (perfil)", value: "INSTAGRAM_PROFILE" },
  { title: "Banners / promos", value: "PROMO" },
  { title: "Otros", value: "OTHER" },
  { title: "Todos", value: "" },
];

const headers = computed(() => [
  { title: "Activo", key: "is_active", sortable: false, width: 90 },
  { title: "Título", key: "title", sortable: false, minWidth: 240 },
  { title: "URL", key: "url", sortable: false },
  { title: "Sort", key: "sort_order", sortable: false, width: 140 },
  { title: "Acciones", key: "actions", sortable: false, align: "end", width: 320 },
]);

// ======================
// Helpers
// ======================
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function openUrl(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function normalizeIgUrl(u) {
  let s = String(u || "").trim();
  try {
    const url = new URL(s);
    url.search = "";
    url.hash = "";
    s = url.toString();
  } catch {
    // ok
  }
  return s;
}

async function reload() {
  loading.value = true;
  error.value = "";

  try {
    const r = await adminListLinks({
      kind: kind.value || undefined,
      q: q.value || undefined,
      page: 1,
      limit: 200,
    });

    const items = Array.isArray(r?.items) ? r.items : Array.isArray(r?.data) ? r.data : [];
    rows.value = items
      .map((x) => ({
        id: x.id,
        kind: x.kind,
        title: x.title,
        subtitle: x.subtitle,
        url: x.url,
        sort_order: toInt(x.sort_order, 0),
        is_active: !!x.is_active,
      }))
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          String(a.id).localeCompare(String(b.id))
      );
  } catch (e) {
    error.value = e?.message || "No se pudo cargar links";
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

// ======================
// Create/Edit dialog
// ======================
const dlg = reactive({
  open: false,
  mode: "create", // create | edit
  loading: false,
  error: "",
  id: null,
  form: {
    kind: "INSTAGRAM_POST",
    title: "",
    subtitle: "",
    url: "",
    sort_order: 10,
    is_active: true,
  },
});

function openCreate() {
  dlg.mode = "create";
  dlg.id = null;
  dlg.error = "";
  dlg.form = {
    kind: kind.value || "INSTAGRAM_POST",
    title: "",
    subtitle: "",
    url: "",
    sort_order: 10,
    is_active: true,
  };
  dlg.open = true;
}

function openEdit(item) {
  dlg.mode = "edit";
  dlg.id = item?.id;
  dlg.error = "";
  dlg.form = {
    kind: item?.kind || "INSTAGRAM_POST",
    title: item?.title || "",
    subtitle: item?.subtitle || "",
    url: item?.url || "",
    sort_order: toInt(item?.sort_order, 0),
    is_active: !!item?.is_active,
  };
  dlg.open = true;
}

async function saveDlg() {
  dlg.loading = true;
  dlg.error = "";

  try {
    const payload = {
      kind: String(dlg.form.kind || "").trim(),
      title: String(dlg.form.title || "").trim(),
      subtitle: String(dlg.form.subtitle || "").trim(),
      url: normalizeIgUrl(dlg.form.url),
      sort_order: toInt(dlg.form.sort_order, 0),
      is_active: dlg.form.is_active ? 1 : 0,
    };

    if (!payload.kind) throw new Error("Falta tipo (kind).");
    if (!payload.url) throw new Error("Falta URL.");

    if (dlg.mode === "create") {
      await adminCreateLink(payload);
    } else {
      await adminUpdateLink(dlg.id, payload);
    }

    dlg.open = false;
    await reload();
  } catch (e) {
    dlg.error = e?.message || "No se pudo guardar";
  } finally {
    dlg.loading = false;
  }
}

// ======================
// Inline actions
// ======================
async function onToggleActive(item, v) {
  const prev = !!item.is_active;
  item.is_active = !!v;

  try {
    await adminUpdateLink(item.id, { is_active: item.is_active ? 1 : 0 });
  } catch (e) {
    item.is_active = prev;
    error.value = e?.message || "No se pudo actualizar activo";
  }
}

async function onSortBlur(item, e) {
  const newVal = toInt(e?.target?.value, item.sort_order ?? 0);
  const prev = toInt(item.sort_order, 0);

  if (newVal === prev) return;

  item.sort_order = newVal;

  try {
    await adminUpdateLink(item.id, { sort_order: newVal });
    rows.value = [...rows.value].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  } catch (err) {
    item.sort_order = prev;
    error.value = err?.message || "No se pudo actualizar sort";
  }
}

// ======================
// Delete
// ======================
const del = reactive({
  open: false,
  loading: false,
  error: "",
  item: null,
});

function confirmDelete(item) {
  del.item = item;
  del.error = "";
  del.open = true;
}

async function doDelete() {
  del.loading = true;
  del.error = "";
  try {
    await adminDeleteLink(del.item?.id);
    del.open = false;
    await reload();
  } catch (e) {
    del.error = e?.message || "No se pudo borrar";
  } finally {
    del.loading = false;
  }
}

onMounted(() => reload());
</script>


<style scoped>
.sl-page {
  padding-bottom: 40px;
}

.sl-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.sl-table-card {
  overflow: hidden;
}

.sl-table :deep(th) {
  font-weight: 800;
}

.sl-title {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.sl-kind {
  margin-top: 2px;
}

.sl-url a {
  text-decoration: none;
}
.sl-url a:hover {
  text-decoration: underline;
}
</style>
