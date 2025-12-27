<!-- src/modules/categories/pages/CategoriesPage.vue -->
<template>
  <div>
    <!-- HEADER -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Categorías</div>
        <div class="text-caption text-medium-emphasis">
          Gestión en árbol (Rubro → Subrubro → niveles ilimitados).
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="reload">
          Recargar
        </v-btn>

        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateRoot">
          Nuevo rubro
        </v-btn>

        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus-box"
          :disabled="!selectedId"
          @click="openCreateChild"
        >
          Nueva subcategoría
        </v-btn>
      </div>
    </div>

    <v-alert v-if="cats.error" type="error" variant="tonal" class="mb-4">
      {{ cats.error }}
    </v-alert>

    <v-row dense>
      <!-- LEFT: TREE -->
      <v-col cols="12" md="7">
        <v-card rounded="xl" class="h-100">
          <v-card-text>
            <v-text-field
              v-model="q"
              label="Buscar en categorías"
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
              class="mb-3"
            />

            <v-divider class="mb-3" />

            <!-- TREE -->
            <v-treeview
              :items="treeItems"
              item-title="name"
              item-value="id"
              open-on-click
              activatable
              :search="q"
              v-model:opened="openIds"
              v-model:activated="activeIds"
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
                      <span class="font-weight-medium">
                        {{ item.name }}
                      </span>

                      <v-chip size="x-small" variant="tonal">
                        Nivel {{ item.depth + 1 }}
                      </v-chip>
                    </div>

                    <div class="text-caption text-medium-emphasis">
                      {{ item.path }}
                    </div>
                  </div>

                  <div class="d-flex ga-1">
                    <v-btn
                      icon="mdi-plus-box"
                      variant="text"
                      size="small"
                      title="Crear subcategoría"
                      @click.stop="openCreateChildFrom(item)"
                    />
                    <v-btn
                      icon="mdi-pencil-outline"
                      variant="text"
                      size="small"
                      title="Editar"
                      @click.stop="openEdit(item)"
                    />
                    <v-btn
                      :icon="item.is_active
                        ? 'mdi-close-circle-outline'
                        : 'mdi-check-circle-outline'"
                      variant="text"
                      size="small"
                      :title="item.is_active ? 'Desactivar' : 'Activar'"
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

              <v-btn
                v-if="selectedNode"
                icon="mdi-pencil-outline"
                variant="text"
                title="Editar categoría"
                @click="openEdit(selectedNode)"
              />
            </div>

            <v-divider class="my-3" />

            <div v-if="!selectedNode" class="text-medium-emphasis">
              Seleccioná una categoría del árbol para ver detalles y gestionar.
            </div>

            <div v-else class="d-flex flex-column ga-3">
              <div>
                <div class="text-caption text-medium-emphasis">Nombre</div>
                <div class="text-body-1 font-weight-medium">
                  {{ selectedNode.name }}
                </div>
              </div>

              <div>
                <div class="text-caption text-medium-emphasis">Ruta</div>
                <div class="text-body-2">
                  {{ selectedNode.path }}
                </div>
              </div>

              <div class="d-flex ga-2 flex-wrap">
                <v-chip variant="tonal">ID #{{ selectedNode.id }}</v-chip>
                <v-chip variant="tonal">
                  Nivel {{ selectedNode.depth + 1 }}
                </v-chip>
              </div>

              <v-divider class="my-2" />

              <div class="d-flex flex-column ga-2">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus-box"
                  @click="openCreateChild"
                >
                  Nueva subcategoría aquí
                </v-btn>

                <v-btn
                  variant="tonal"
                  :prepend-icon="selectedNode.is_active
                    ? 'mdi-close-circle-outline'
                    : 'mdi-check-circle-outline'"
                  @click="toggle(selectedNode)"
                >
                  {{ selectedNode.is_active ? "Desactivar" : "Activar" }}
                </v-btn>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Tip: “Nuevo rubro” crea una categoría raíz.  
                “Nueva subcategoría” crea dentro de la seleccionada.
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useCategoriesStore } from "../../../app/store/categories.store";
import CategoryFormDialog from "../components/CategoryFormDialog.vue";

const cats = useCategoriesStore();

const q = ref("");

// dialog
const dlgOpen = ref(false);
const dlgMode = ref("create");
const dlgItem = ref(null);
const dlgPresetKind = ref("root");
const dlgPresetParentId = ref(null);

// tree state (Vuetify 3)
const openIds = ref([]);
const activeIds = ref([]);

// fetch
onMounted(async () => {
  await cats.fetchAll(true);
});

// build tree
function buildTree(items) {
  const map = new Map();
  for (const c of items || []) {
    const pid = Number(c.parent_id || 0);
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid).push(c);
  }

  for (const arr of map.values()) {
    arr.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "es")
    );
  }

  const makeNode = (c, depth, parentPath) => {
    const name = String(c.name || "").trim();
    const path = parentPath ? `${parentPath} > ${name}` : name;

    return {
      id: Number(c.id),
      name,
      is_active: Number(c.is_active ?? 1) !== 0,
      parent_id: c.parent_id ? Number(c.parent_id) : null,
      depth,
      path,
      children: (map.get(Number(c.id)) || []).map((k) =>
        makeNode(k, depth + 1, path)
      ),
    };
  };

  return (map.get(0) || []).map((r) => makeNode(r, 0, ""));
}

const treeItems = computed(() => buildTree(cats.items));

// selection
const selectedId = computed(() =>
  activeIds.value?.[0] ? Number(activeIds.value[0]) : null
);

function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const x = findNode(n.children, id);
      if (x) return x;
    }
  }
  return null;
}

const selectedNode = computed(() =>
  selectedId.value ? findNode(treeItems.value, selectedId.value) : null
);

watch(
  () => selectedNode.value,
  (n) => {
    if (n?.parent_id && !openIds.value.includes(n.parent_id)) {
      openIds.value.push(n.parent_id);
    }
  }
);

// actions
async function reload() {
  await cats.fetchAll(true);
}

function openCreateRoot() {
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgPresetKind.value = "root";
  dlgPresetParentId.value = null;
  dlgOpen.value = true;
}

function openCreateChild() {
  if (!selectedId.value) return;
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgPresetKind.value = "child";
  dlgPresetParentId.value = selectedId.value;
  dlgOpen.value = true;
}

function openCreateChildFrom(item) {
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgPresetKind.value = "child";
  dlgPresetParentId.value = item.id;
  dlgOpen.value = true;
}

function openEdit(item) {
  dlgMode.value = "edit";
  dlgItem.value = item;
  dlgOpen.value = true;
}

async function toggle(item) {
  await cats.update(item.id, { is_active: item.is_active ? 0 : 1 });
  await reload();
}

async function onSaved() {
  await reload();
}
</script>
