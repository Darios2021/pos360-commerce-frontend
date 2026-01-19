<!-- src/modules/categories/pages/CategoriesPage.vue -->
<template>
  <div>
    <!-- HEADER -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Categorías</div>
        <div class="text-caption text-medium-emphasis">
          Ecommerce: Rubro → Subrubro (tabla subcategories).
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="reload"
          :disabled="busyAny"
          :loading="busyKey === '__reload__'"
        >
          Recargar
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateRoot"
          :disabled="busyAny"
        >
          Nuevo rubro
        </v-btn>

        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus-box"
          :disabled="busyAny || !selectedParentId"
          @click="openCreateChild"
        >
          Nueva subcategoría
        </v-btn>
      </div>
    </div>

    <!-- ✅ Loader global -->
    <v-progress-linear v-if="busyAny" indeterminate class="mb-3" />

    <v-alert v-if="errorText" type="error" variant="tonal" class="mb-4">
      {{ errorText }}
    </v-alert>

    <v-row dense>
      <!-- LEFT: TREE -->
      <v-col cols="12" md="7">
        <v-card rounded="xl" class="h-100">
          <v-card-text>
            <v-text-field
              v-model="q"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
              class="mb-3"
              :disabled="busyAny"
            />

            <v-divider class="mb-3" />

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
            >
              <template #prepend="{ item }">
                <v-icon size="18">
                  {{ item.children?.length ? "mdi-folder-outline" : "mdi-tag-outline" }}
                </v-icon>
              </template>

              <template #title="{ item }">
                <div class="d-flex align-center justify-space-between ga-2 w-100">
                  <div class="d-flex flex-column">
                    <div class="d-flex align-center ga-2">
                      <span class="font-weight-medium">{{ item.name }}</span>

                      <v-chip size="x-small" variant="tonal">
                        {{ item.depth === 0 ? "Rubro" : "Subrubro" }}
                      </v-chip>

                      <v-chip v-if="!item.is_active" size="x-small" variant="tonal" color="warning">
                        Inactivo
                      </v-chip>
                    </div>

                    <div class="text-caption text-medium-emphasis">
                      {{ item.path }}
                    </div>
                  </div>

                  <div class="d-flex ga-1 align-center">
                    <!-- Solo permitir crear subcategoría en rubros -->
                    <v-btn
                      v-if="item.depth === 0"
                      icon="mdi-plus-box"
                      variant="text"
                      size="small"
                      title="Crear subcategoría (ecommerce)"
                      :disabled="busyAny"
                      :loading="isBusy(item.key)"
                      @click.stop="openCreateChildFrom(item)"
                    />

                    <v-btn
                      v-if="item.depth === 0"
                      icon="mdi-pencil-outline"
                      variant="text"
                      size="small"
                      title="Editar rubro"
                      :disabled="busyAny"
                      :loading="isBusy(item.key)"
                      @click.stop="openEditCategory(item)"
                    />

                    <v-btn
                      v-if="item.depth === 1"
                      icon="mdi-pencil-outline"
                      variant="text"
                      size="small"
                      title="Editar subrubro"
                      :disabled="busyAny"
                      :loading="isBusy(item.key)"
                      @click.stop="openEditSubcategory(item)"
                    />

                    <v-btn
                      :icon="item.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                      variant="text"
                      size="small"
                      :title="item.is_active ? 'Desactivar' : 'Activar'"
                      :disabled="busyAny && !isBusy(item.key)"
                      :loading="isBusy(item.key)"
                      @click.stop="toggle(item)"
                    />
                  </div>
                </div>
              </template>

              <template #no-data>
                <div class="py-8 text-center text-medium-emphasis">
                  Sin categorías.
                </div>
              </template>
            </v-treeview>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- RIGHT: DETAIL -->
      <v-col cols="12" md="5">
        <v-card rounded="xl" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div class="text-h6 font-weight-bold">Detalle</div>
            </div>

            <v-divider class="my-3" />

            <div v-if="!selectedNode" class="text-medium-emphasis">
              Seleccioná un rubro o subrubro.
            </div>

            <div v-else class="d-flex flex-column ga-3">
              <div>
                <div class="text-caption text-medium-emphasis">Nombre</div>
                <div class="text-body-1 font-weight-medium">{{ selectedNode.name }}</div>
              </div>

              <div>
                <div class="text-caption text-medium-emphasis">Ruta</div>
                <div class="text-body-2">{{ selectedNode.path }}</div>
              </div>

              <div class="d-flex ga-2 flex-wrap">
                <v-chip variant="tonal">Tipo: {{ selectedNode.depth === 0 ? "Rubro" : "Subrubro" }}</v-chip>
                <v-chip variant="tonal">ID #{{ selectedNode.id }}</v-chip>
                <v-chip variant="tonal">{{ selectedNode.is_active ? "Activo" : "Inactivo" }}</v-chip>
              </div>

              <v-divider class="my-2" />

              <div class="d-flex flex-column ga-2">
                <v-btn
                  v-if="selectedNode.depth === 0"
                  color="primary"
                  prepend-icon="mdi-plus-box"
                  @click="openCreateChild"
                  :disabled="busyAny"
                >
                  Nueva subcategoría aquí
                </v-btn>

                <v-btn
                  variant="tonal"
                  :prepend-icon="selectedNode.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                  @click="toggle(selectedNode)"
                  :disabled="busyAny && !isBusy(selectedNode.key)"
                  :loading="isBusy(selectedNode.key)"
                >
                  {{ selectedNode.is_active ? "Desactivar" : "Activar" }}
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- DIALOG -->
    <CategoryFormDialog
      v-model:open="dlgOpen"
      :mode="dlgMode"
      :item="dlgItem"
      :preset-kind="dlgPresetKind"
      :preset-parent-id="dlgPresetParentId"
      @saved="onSaved"
    />

    <!-- ✅ SNACKBAR feedback -->
    <v-snackbar v-model="snack.open" :timeout="2400">
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

// ✅ snackbar
const snack = ref({ open: false, text: "" });
function toast(text) {
  snack.value.text = String(text || "");
  snack.value.open = true;
}

// ✅ busy: evita doble click
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
