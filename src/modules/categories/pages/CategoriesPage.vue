<!-- src/modules/categories/pages/CategoriesPage.vue -->
<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Categorías</div>
        <div class="text-caption text-medium-emphasis">
          Rubros (parent_id NULL) y Subrubros (parent_id = rubro)
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="reload">Recargar</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nueva categoría</v-btn>
      </div>
    </div>

    <v-alert v-if="cats.error" type="error" variant="tonal" class="mb-4">
      {{ cats.error }}
    </v-alert>

    <v-card rounded="xl">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select
              v-model="rubroId"
              label="Filtrar por rubro"
              :items="rubros"
              item-title="name"
              item-value="id"
              clearable
              prepend-inner-icon="mdi-shape-outline"
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="q"
              label="Buscar categoría"
              prepend-inner-icon="mdi-magnify"
              hide-details
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-data-table
          :items="filtered"
          :headers="headers"
          :loading="cats.loading"
          density="comfortable"
        >
          <template #item.parent="{ item }">
            <span class="text-medium-emphasis">
              {{ parentName(item) }}
            </span>
          </template>

          <template #item.is_active="{ item }">
            <v-chip size="small" :color="item.is_active ? 'primary' : 'red'" variant="tonal">
              {{ item.is_active ? "Activa" : "Inactiva" }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-1 justify-end">
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="openEdit(item)" />
              <v-btn
                :icon="item.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                variant="text"
                size="small"
                @click="toggle(item)"
              />
            </div>
          </template>

          <template #no-data>
            <div class="py-8 text-center text-medium-emphasis">Sin categorías.</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <CategoryFormDialog
      v-model:open="dlgOpen"
      :mode="dlgMode"
      :item="dlgItem"
      @saved="reload"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useCategoriesStore } from "../../../app/store/categories.store";
import CategoryFormDialog from "../components/CategoryFormDialog.vue";

const cats = useCategoriesStore();

const rubroId = ref(null);
const q = ref("");

const dlgOpen = ref(false);
const dlgMode = ref("create");
const dlgItem = ref(null);

const headers = [
  { title: "Nombre", key: "name" },
  { title: "Padre (rubro)", key: "parent" },
  { title: "Estado", key: "is_active", width: 120 },
  { title: "", key: "actions", align: "end", width: 120 },
];

onMounted(async () => {
  await cats.fetchAll(true);
});

const rubros = computed(() => (cats.items || []).filter((c) => !c.parent_id));

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  return (cats.items || [])
    .filter((c) => (rubroId.value ? c.parent_id === rubroId.value || c.id === rubroId.value : true))
    .filter((c) => (term ? String(c.name || "").toLowerCase().includes(term) : true))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
});

function parentName(item) {
  if (!item.parent_id) return "—";
  const p = (cats.items || []).find((x) => x.id === item.parent_id);
  return p?.name || `#${item.parent_id}`;
}

async function reload() {
  await cats.fetchAll(true);
}

function openCreate() {
  dlgMode.value = "create";
  dlgItem.value = null;
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
</script>
