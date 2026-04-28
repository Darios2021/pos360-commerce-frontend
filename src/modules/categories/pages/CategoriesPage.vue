<!-- src/modules/categories/pages/CategoriesPage.vue -->
<template>
  <div class="lp">

    <!-- ── HEADER ───────────────────────────────────────── -->
    <header class="lp-header">
      <div class="lp-header__left">
        <h1 class="lp-title">Categorías</h1>
        <div class="lp-meta">
          <span class="lp-meta__strong">{{ totalRubros }}</span>
          <span class="lp-meta__sep">·</span>
          <span>{{ totalSubrubros }} subrubros</span>
          <span class="lp-meta__sep">·</span>
          <span>Ecommerce: Rubro → Subrubro</span>
        </div>
      </div>
      <div class="lp-header__right">
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-refresh"
          :disabled="busyAny"
          :loading="busyKey === '__reload__'"
          @click="reload"
        >
          Recargar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          rounded="lg"
          prepend-icon="mdi-plus"
          :disabled="busyAny"
          @click="openCreateRoot"
        >
          Nuevo rubro
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-plus-box"
          :disabled="busyAny || !selectedParentId"
          @click="openCreateChild"
        >
          Nueva subcategoría
        </v-btn>
      </div>
    </header>

    <!-- Loader global -->
    <v-progress-linear v-if="busyAny" indeterminate rounded class="lp-loader" />

    <!-- Error -->
    <v-alert v-if="errorText" type="error" variant="tonal" density="compact" class="lp-alert">
      {{ errorText }}
    </v-alert>

    <!-- ── FILTER BAR ───────────────────────────────────── -->
    <section class="lp-filters">
      <div class="lp-filters__primary">
        <v-text-field
          v-model="q"
          placeholder="Buscar rubro o subrubro..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="lp-filters__search"
          :disabled="busyAny"
        />
      </div>
    </section>

    <!-- ── MASTER / DETAIL ──────────────────────────────── -->
    <div class="lp-master-detail">

      <!-- LEFT: TREE -->
      <section class="lp-content lp-content--md">
        <div class="lp-content__head">
          <div class="lp-content__head-left">
            <span class="lp-content__title">Árbol de categorías</span>
            <v-chip size="x-small" variant="tonal">{{ totalRubros }} rubros</v-chip>
          </div>
        </div>

        <div class="lp-content__body">
          <v-treeview
            :items="treeItems"
            item-title="name"
            item-value="key"
            open-on-click
            activatable
            :search="q"
            v-model:opened="openKeys"
            v-model:activated="activeKeys"
            density="comfortable"
            class="cat-tree"
          >
            <template #prepend="{ item }">
              <v-icon size="18" :color="item.depth === 0 ? 'primary' : undefined">
                {{ item.children?.length ? "mdi-folder-outline" : "mdi-tag-outline" }}
              </v-icon>
            </template>

            <template #title="{ item }">
              <div class="cat-row">
                <div class="cat-row__info">
                  <div class="cat-row__title">
                    <span class="cat-row__name">{{ item.name }}</span>
                    <v-chip
                      size="x-small"
                      variant="tonal"
                      :color="item.depth === 0 ? 'primary' : undefined"
                    >
                      {{ item.depth === 0 ? "Rubro" : "Subrubro" }}
                    </v-chip>
                    <v-chip v-if="!item.is_active" size="x-small" variant="tonal" color="warning">
                      Inactivo
                    </v-chip>
                  </div>
                  <div class="cat-row__path">{{ item.path }}</div>
                </div>

                <div class="cat-row__actions" @click.stop>
                  <v-btn
                    v-if="item.depth === 0"
                    icon="mdi-plus-box"
                    variant="text"
                    size="x-small"
                    title="Crear subcategoría"
                    :disabled="busyAny"
                    :loading="isBusy(item.key)"
                    @click.stop="openCreateChildFrom(item)"
                  />
                  <v-btn
                    v-if="item.depth === 0"
                    icon="mdi-pencil-outline"
                    variant="text"
                    size="x-small"
                    title="Editar rubro"
                    :disabled="busyAny"
                    :loading="isBusy(item.key)"
                    @click.stop="openEditCategory(item)"
                  />
                  <v-btn
                    v-if="item.depth === 1"
                    icon="mdi-pencil-outline"
                    variant="text"
                    size="x-small"
                    title="Editar subrubro"
                    :disabled="busyAny"
                    :loading="isBusy(item.key)"
                    @click.stop="openEditSubcategory(item)"
                  />
                  <v-btn
                    :icon="item.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                    variant="text"
                    size="x-small"
                    :title="item.is_active ? 'Desactivar' : 'Activar'"
                    :color="item.is_active ? undefined : 'success'"
                    :disabled="busyAny && !isBusy(item.key)"
                    :loading="isBusy(item.key)"
                    @click.stop="toggle(item)"
                  />
                </div>
              </div>
            </template>

            <template #no-data>
              <div class="cat-empty">
                <v-icon size="40" color="medium-emphasis">mdi-folder-open-outline</v-icon>
                <span>Sin categorías.</span>
              </div>
            </template>
          </v-treeview>
        </div>
      </section>

      <!-- RIGHT: DETAIL -->
      <section class="lp-content lp-content--md">
        <div class="lp-content__head">
          <div class="lp-content__head-left">
            <span class="lp-content__title">Detalle</span>
            <v-chip v-if="selectedNode" size="x-small" variant="tonal" :color="selectedNode.depth === 0 ? 'primary' : undefined">
              {{ selectedNode.depth === 0 ? "Rubro" : "Subrubro" }}
            </v-chip>
          </div>
        </div>

        <div class="lp-content__body">
          <div v-if="!selectedNode" class="cat-detail-empty">
            <v-icon size="44" color="medium-emphasis">mdi-cursor-pointer</v-icon>
            <div class="cat-detail-empty__title">Seleccioná un rubro o subrubro</div>
            <div class="cat-detail-empty__sub">Las acciones detalladas aparecen acá</div>
          </div>

          <div v-else class="cat-detail">
            <div class="cat-detail__field">
              <div class="cat-detail__label">Nombre</div>
              <div class="cat-detail__value">{{ selectedNode.name }}</div>
            </div>

            <div class="cat-detail__field">
              <div class="cat-detail__label">Ruta</div>
              <div class="cat-detail__path">{{ selectedNode.path }}</div>
            </div>

            <div class="cat-detail__chips">
              <v-chip size="small" variant="tonal" :color="selectedNode.depth === 0 ? 'primary' : undefined">
                {{ selectedNode.depth === 0 ? "Rubro" : "Subrubro" }}
              </v-chip>
              <v-chip size="small" variant="tonal">ID #{{ selectedNode.id }}</v-chip>
              <v-chip
                size="small"
                variant="tonal"
                :color="selectedNode.is_active ? 'success' : 'warning'"
              >
                {{ selectedNode.is_active ? "Activo" : "Inactivo" }}
              </v-chip>
            </div>

            <v-divider />

            <div class="cat-detail__actions">
              <v-btn
                v-if="selectedNode.depth === 0"
                color="primary"
                variant="flat"
                size="small"
                rounded="lg"
                prepend-icon="mdi-plus-box"
                :disabled="busyAny"
                @click="openCreateChild"
              >
                Nueva subcategoría aquí
              </v-btn>
              <v-btn
                v-if="selectedNode.depth === 0"
                variant="tonal"
                size="small"
                rounded="lg"
                prepend-icon="mdi-pencil-outline"
                :disabled="busyAny"
                @click="openEditCategory(selectedNode)"
              >
                Editar
              </v-btn>
              <v-btn
                :variant="selectedNode.is_active ? 'tonal' : 'flat'"
                :color="selectedNode.is_active ? 'warning' : 'success'"
                size="small"
                rounded="lg"
                :prepend-icon="selectedNode.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                :disabled="busyAny && !isBusy(selectedNode.key)"
                :loading="isBusy(selectedNode.key)"
                @click="toggle(selectedNode)"
              >
                {{ selectedNode.is_active ? "Desactivar" : "Activar" }}
              </v-btn>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- DIALOG -->
    <CategoryFormDialog
      v-model:open="dlgOpen"
      :mode="dlgMode"
      :item="dlgItem"
      :preset-kind="dlgPresetKind"
      :preset-parent-id="dlgPresetParentId"
      @saved="onSaved"
    />

    <!-- SNACKBAR -->
    <v-snackbar v-model="snack.open" :timeout="2400" location="bottom right" rounded="lg">
      {{ snack.text }}
      <template #actions>
        <v-btn variant="text" @click="snack.open = false">OK</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import http from "../../../app/api/http";
import { useCategoriesStore } from "../../../app/store/categories.store";
import CategoryFormDialog from "../components/CategoryFormDialog.vue";

const cats = useCategoriesStore();
const q = ref("");

const dlgOpen = ref(false);
const dlgMode = ref("create");
const dlgItem = ref(null);
const dlgPresetKind = ref("root");
const dlgPresetParentId = ref(null);

const openKeys = ref([]);
const activeKeys = ref([]);

const errorText = ref("");

// snackbar
const snack = ref({ open: false, text: "" });
function toast(text) {
  snack.value.text = String(text || "");
  snack.value.open = true;
}

// busy: evita doble click
const busyKey = ref(null); // string | null
const busyAny = computed(() => !!busyKey.value);
function isBusy(key) {
  return busyKey.value === key;
}
function beginBusy(key) {
  if (busyKey.value) return false;
  busyKey.value = key;
  return true;
}
function endBusy() {
  busyKey.value = null;
}

// ===== Fetch ecommerce tree =====
const parents = ref([]); // rubros
const subsByCat = ref({}); // category_id -> subcategories

async function loadEcomTree() {
  errorText.value = "";

  await cats.fetchAll(true);

  parents.value = (cats.parents || []).map((c) => ({
    id: Number(c.id),
    name: String(c.name || "").trim(),
    is_active: Number(c.is_active ?? 1) !== 0,
  }));

  const map = {};
  for (const p of parents.value) {
    try {
      const { data } = await http.get(`/categories/${p.id}/subcategories`);
      map[p.id] = (data?.items || []).map((s) => ({
        id: Number(s.id),
        name: String(s.name || "").trim(),
        is_active: Number(s.is_active ?? 1) !== 0,
        category_id: Number(s.category_id),
      }));
    } catch (e) {
      map[p.id] = [];
    }
  }
  subsByCat.value = map;
}

onMounted(async () => {
  await loadEcomTree();
});

async function reload() {
  if (!beginBusy("__reload__")) return;
  try {
    await loadEcomTree();
    toast("Actualizado");
  } catch (e) {
    errorText.value = e?.response?.data?.message || e?.message || String(e);
  } finally {
    endBusy();
  }
}

// ===== Tree build (2 niveles) =====
const treeItems = computed(() => {
  const out = [];
  const parentsSorted = [...parents.value].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );

  for (const p of parentsSorted) {
    const path = p.name;

    const kids = (subsByCat.value[p.id] || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((s) => ({
        key: `s:${s.id}`,
        id: s.id,
        name: s.name,
        is_active: s.is_active,
        depth: 1,
        path: `${path} > ${s.name}`,
        type: "subcategory",
        category_id: p.id,
        children: [],
      }));

    out.push({
      key: `c:${p.id}`,
      id: p.id,
      name: p.name,
      is_active: p.is_active,
      depth: 0,
      path,
      type: "category",
      children: kids,
    });
  }

  return out;
});

// totales para el header
const totalRubros = computed(() => parents.value.length);
const totalSubrubros = computed(() => {
  let n = 0;
  for (const k of Object.keys(subsByCat.value)) {
    n += (subsByCat.value[k] || []).length;
  }
  return n;
});

// ===== Selection =====
const selectedKey = computed(() =>
  activeKeys.value?.[0] ? String(activeKeys.value[0]) : null
);

function findNode(nodes, key) {
  for (const n of nodes) {
    if (n.key === key) return n;
    if (n.children?.length) {
      const x = findNode(n.children, key);
      if (x) return x;
    }
  }
  return null;
}

const selectedNode = computed(() =>
  selectedKey.value ? findNode(treeItems.value, selectedKey.value) : null
);

// solo rubros para crear subcat
const selectedParentId = computed(() => {
  if (!selectedNode.value) return null;
  return selectedNode.value.depth === 0
    ? selectedNode.value.id
    : selectedNode.value.category_id;
});

// ===== Dialog actions =====
function openCreateRoot() {
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgPresetKind.value = "root";
  dlgPresetParentId.value = null;
  dlgOpen.value = true;
}

function openCreateChild() {
  if (!selectedParentId.value) return;
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgPresetKind.value = "child";
  dlgPresetParentId.value = selectedParentId.value;
  dlgOpen.value = true;
}

function openCreateChildFrom(item) {
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgPresetKind.value = "child";
  dlgPresetParentId.value = item.id;
  dlgOpen.value = true;
}

function openEditCategory(item) {
  dlgMode.value = "edit";
  dlgItem.value = {
    id: item.id,
    name: item.name,
    parent_id: null,
    is_active: item.is_active ? 1 : 0,
  };
  dlgOpen.value = true;
}

function openEditSubcategory(item) {
  toast("Editar subrubros: si querés te armo el dialog dedicado.");
}

// ===== Toggle con confirm + loader + anti doble click =====
async function toggle(item) {
  const key = item?.key || "__toggle__";
  if (!beginBusy(key)) return;

  try {
    const willDeactivate = !!item.is_active;

    const ok = window.confirm(
      willDeactivate
        ? `¿Desactivar "${item.name}"? (No se verá en tienda)`
        : `¿Activar "${item.name}"?`
    );
    if (!ok) return;

    if (item.type === "category") {
      await cats.update(item.id, { is_active: willDeactivate ? 0 : 1 });
    } else {
      await http.patch(`/categories/${item.category_id}/subcategories/${item.id}`, {
        name: item.name,
        is_active: willDeactivate ? 0 : 1,
      });
    }

    await loadEcomTree();
    toast(willDeactivate ? "Desactivado" : "Activado");
  } catch (e) {
    errorText.value = e?.response?.data?.message || e?.message || String(e);
  } finally {
    endBusy();
  }
}

async function onSaved() {
  await reload();
}
</script>

<style scoped>
/* ============================================================
   LIST PAGE — patrón estandarizado (lp-*)
   Compartido con Productos / Ventas. Mantener sincronizado.
   ============================================================ */

.lp {
  --lp-gap: 14px;
  --lp-radius: 14px;
  --lp-radius-sm: 12px;
  --lp-card-bg: rgb(var(--v-theme-surface));
  --lp-card-border: rgba(var(--v-border-color), var(--v-border-opacity));
  --lp-muted: rgba(var(--v-theme-on-surface), 0.55);
  --lp-strong: rgba(var(--v-theme-on-surface), 0.9);

  display: flex;
  flex-direction: column;
  gap: var(--lp-gap);
  min-width: 0;
}

/* HEADER */
.lp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 4px 2px 0;
}
.lp-header__left  { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lp-header__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lp-title {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}
.lp-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--lp-muted);
  flex-wrap: wrap;
}
.lp-meta__strong {
  font-weight: 500;
  color: var(--lp-strong);
  font-feature-settings: "tnum";
}
.lp-meta__sep { opacity: 0.4; }

/* LOADER + ALERT */
.lp-loader { margin: 0 !important; }
.lp-alert  { margin-bottom: 0 !important; }

/* FILTER BAR (modo simple — solo search) */
.lp-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-filters__primary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lp-filters__search { flex: 1 1 100%; min-width: 220px; }
.lp-filters__search :deep(.v-field) { border-radius: 10px; }

/* CONTENT WRAPPER */
.lp-content {
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.lp-content__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--lp-card-border);
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.lp-content__head-left { display: flex; align-items: center; gap: 8px; }
.lp-content__title { font-size: 13px; font-weight: 500; letter-spacing: 0.01em; }
.lp-content__body { padding: 12px; flex: 1; min-height: 0; }
.lp-content--md { min-height: 480px; }

/* MASTER-DETAIL GRID */
.lp-master-detail {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--lp-gap);
  align-items: start;
}

/* ============================================================
   CATEGORÍAS — específico
   ============================================================ */

.cat-tree {
  background: transparent;
}
.cat-tree :deep(.v-list-item) {
  border-radius: 8px;
  margin-bottom: 2px;
}
.cat-tree :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.1);
}

.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.cat-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.cat-row__title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.cat-row__name {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cat-row__path {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-feature-settings: "tnum";
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cat-row__actions {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.cat-row__actions :deep(.v-btn) {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
}

.cat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 0;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 13px;
}

/* DETAIL */
.cat-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 48px 16px;
  text-align: center;
  min-height: 240px;
}
.cat-detail-empty__title {
  font-size: 15px;
  font-weight: 400;
  margin-top: 4px;
}
.cat-detail-empty__sub {
  font-size: 12.5px;
  color: var(--lp-muted);
}

.cat-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px;
}
.cat-detail__field { display: flex; flex-direction: column; gap: 3px; }
.cat-detail__label {
  font-size: 11px;
  font-weight: 400;
  color: var(--lp-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cat-detail__value {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.cat-detail__path {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(var(--v-theme-on-surface), 0.04);
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
}
.cat-detail__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cat-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* RESPONSIVE */
@media (max-width: 960px) {
  .lp { gap: 12px; }
  .lp-filters { padding: 10px 12px; }
  .lp-master-detail { grid-template-columns: 1fr; }
  .lp-content--md { min-height: auto; }
}

@media (max-width: 600px) {
  .lp-title { font-size: 18px; }
  .cat-row__path { display: none; }
  .cat-row__actions :deep(.v-btn) {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
  }
}
</style>
