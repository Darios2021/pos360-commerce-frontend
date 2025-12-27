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
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="reload">Recargar</v-btn>

        <!-- ✅ Acciones claras -->
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateRoot">
          Nuevo rubro
        </v-btn>

        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus-box"
          :disabled="!selectedId"
          @click="openCreateChild"
          title="Crea una subcategoría dentro de la categoría seleccionada"
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
            <div class="d-flex ga-2 align-center mb-3">
              <v-text-field
                v-model="q"
                label="Buscar en categorías"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
              />
              <v-chip v-if="selectedNode" variant="tonal" color="primary" class="ml-1">
                Seleccionada: {{ selectedNode.name }}
              </v-chip>
            </div>

            <v-divider class="mb-3" />

            <!-- ✅ TREE VIEW -->
            <v-treeview
              :items="treeItems"
              item-title="name"
              item-value="id"
              open-on-click
              activatable
              :search="q"
              :open.sync="openIds"
              :active.sync="activeIds"
              density="comfortable"
            >
              <!-- render de cada nodo -->
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

                      <v-chip
                        size="x-small"
                        variant="tonal"
                        :color="item.is_active ? 'primary' : 'red'"
                      >
                        {{ item.is_active ? "Activa" : "Inactiva" }}
                      </v-chip>

                      <v-chip size="x-small" variant="tonal">
                        Nivel {{ item.depth + 1 }}
                      </v-chip>
                    </div>

                    <div class="text-caption text-medium-emphasis">
                      {{ item.path }}
                    </div>
                  </div>

                  <!-- acciones inline -->
                  <div class="d-flex ga-1">
                    <v-btn
                      icon="mdi-plus-box"
                      variant="text"
                      size="small"
                      @click.stop="openCreateChildFrom(item)"
                      title="Crear subcategoría dentro de esta"
                    />
                    <v-btn
                      icon="mdi-pencil-outline"
                      variant="text"
                      size="small"
                      @click.stop="openEdit(item)"
                      title="Editar"
                    />
                    <v-btn
                      :icon="item.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                      variant="text"
                      size="small"
                      @click.stop="toggle(item)"
                      :title="item.is_active ? 'Desactivar' : 'Activar'"
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

      <!-- RIGHT: DETAILS -->
      <v-col cols="12" md="5">
        <v-card rounded="xl" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div class="text-h6 font-weight-bold">Detalle</div>

              <v-btn
                v-if="selectedNode"
                icon="mdi-pencil-outline"
                variant="text"
                @click="openEdit(selectedNode)"
                title="Editar seleccionada"
              />
            </div>

            <v-divider class="my-3" />

            <div v-if="!selectedNode" class="text-medium-emphasis">
              Seleccioná una categoría del árbol para ver detalles y gestionar.
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
                <v-chip variant="tonal">ID #{{ selectedNode.id }}</v-chip>
                <v-chip variant="tonal">Nivel {{ selectedNode.depth + 1 }}</v-chip>
                <v-chip
                  variant="tonal"
                  :color="selectedNode.is_active ? 'primary' : 'red'"
                >
                  {{ selectedNode.is_active ? "Activa" : "Inactiva" }}
                </v-chip>
              </div>

              <v-divider class="my-2" />

              <div class="d-flex flex-column ga-2">
                <v-btn color="primary" prepend-icon="mdi-plus-box" @click="openCreateChild" :disabled="!selectedId">
                  Nueva subcategoría aquí
                </v-btn>

                <v-btn
                  variant="tonal"
                  :prepend-icon="selectedNode.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                  @click="toggle(selectedNode)"
                >
                  {{ selectedNode.is_active ? "Desactivar" : "Activar" }}
                </v-btn>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Tip: “Nuevo rubro” crea raíz. “Nueva subcategoría” crea dentro de la seleccionada.
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

const dlgOpen = ref(false);
const dlgMode = ref("create"); // create | edit
const dlgItem = ref(null);

// ✅ presets para crear intuitivo
const dlgPresetKind = ref("root"); // root | child
const dlgPresetParentId = ref(null);

// tree state
const openIds = ref([]);
const activeIds = ref([]);

// ============================
// FETCH
// ============================
onMounted(async () => {
  await cats.fetchAll(true);
});

// ============================
// TREE BUILD (n niveles)
// ============================
const itemsById = computed(() => {
  const map = new Map();
  for (const c of cats.items || []) map.set(Number(c.id), c);
  return map;
});

function buildTree(sourceItems) {
  const childrenByParent = new Map();
  for (const c of sourceItems) {
    const pid = Number(c.parent_id || 0);
    if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
    childrenByParent.get(pid).push(c);
  }
  for (const [k, arr] of childrenByParent) {
    arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    childrenByParent.set(k, arr);
  }

  const makeNode = (c, depth, parentPath) => {
    const name = String(c.name || "").trim();
    const path = parentPath ? `${parentPath} > ${name}` : name;

    const node = {
      id: Number(c.id),
      name,
      is_active: Number(c.is_active ?? 1) !== 0,
      parent_id: c.parent_id ? Number(c.parent_id) : null,
      depth,
      path,
      children: [],
    };

    const kids = childrenByParent.get(node.id) || [];
    node.children = kids.map((k) => makeNode(k, depth + 1, path));
    return node;
  };

  const roots = childrenByParent.get(0) || [];
  return roots.map((r) => makeNode(r, 0, ""));
}

const treeItems = computed(() => buildTree(cats.items || []));

// ============================
// SELECTION
// ============================
const selectedId = computed(() => Number(activeIds.value?.[0] || 0) || null);

function findNodeInTree(nodes, id) {
  for (const n of nodes) {
    if (Number(n.id) === Number(id)) return n;
    if (n.children?.length) {
      const x = findNodeInTree(n.children, id);
      if (x) return x;
    }
  }
  return null;
}

const selectedNode = computed(() => {
  if (!selectedId.value) return null;
  return findNodeInTree(treeItems.value, selectedId.value);
});

// auto abrir ramas cuando seleccionas (mejor UX)
watch(
  () => selectedNode.value,
  (n) => {
    if (!n) return;
    // abrimos la rama del parent para que siempre se vea
    const pid = n.parent_id ? Number(n.parent_id) : 0;
    if (pid && !openIds.value.includes(pid)) openIds.value = [...openIds.value, pid];
  }
);

// ============================
// ACTIONS
// ============================
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
  dlgPresetParentId.value = Number(item.id);
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
