<!-- src/modules/users/pages/UsersPage.vue -->
<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Usuarios</div>
        <div class="text-caption text-medium-emphasis">
          Total: {{ usersStore.items.length }} · Activos: {{ activeCount }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center">
        <v-text-field
          v-model="q"
          density="comfortable"
          variant="outlined"
          hide-details
          style="min-width: 360px"
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar (nombre / email / usuario)"
          clearable
        />
        <v-btn variant="tonal" @click="refresh" :loading="usersStore.loading">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>

        <v-btn color="primary" @click="openCreate">
          <v-icon start>mdi-account-plus-outline</v-icon>
          Nuevo
        </v-btn>
      </div>
    </div>

    <v-card class="rounded-xl" elevation="1">
      <v-card-text>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th style="width:60px;">ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Sucursales</th>
              <th style="width:120px;">Estado</th>
              <th style="width:160px;" class="text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td class="text-caption">{{ u.id }}</td>
              <td>
                <div class="font-weight-bold">{{ u.full_name || "—" }}</div>
                <div class="text-caption text-medium-emphasis">@{{ u.username || "—" }}</div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <v-chip
                  v-for="r in (u.roles || [])"
                  :key="r"
                  size="small"
                  variant="tonal"
                  class="mr-1 mb-1"
                >
                  {{ r }}
                </v-chip>
                <span v-if="!(u.roles||[]).length" class="text-caption text-medium-emphasis">—</span>
              </td>
              <td>
                <v-chip
                  v-for="b in (u.branches || [])"
                  :key="b.id || b"
                  size="small"
                  variant="tonal"
                  class="mr-1 mb-1"
                >
                  {{ b.name || b }}
                </v-chip>
                <span v-if="!(u.branches||[]).length" class="text-caption text-medium-emphasis">—</span>
              </td>
              <td>
                <v-chip
                  size="small"
                  :color="u.is_active ? 'green' : 'red'"
                  variant="tonal"
                >
                  {{ u.is_active ? "Activo" : "Inactivo" }}
                </v-chip>
              </td>

              <td class="text-right">
                <v-btn size="small" variant="tonal" @click="openEdit(u)">
                  <v-icon start>mdi-pencil-outline</v-icon>
                  Editar
                </v-btn>

                <v-btn
                  size="small"
                  class="ml-2"
                  :variant="u.is_active ? 'tonal' : 'flat'"
                  :color="u.is_active ? 'red' : 'green'"
                  @click="toggleActive(u)"
                  :loading="usersStore.togglingId === u.id"
                >
                  <v-icon start>{{ u.is_active ? "mdi-account-off-outline" : "mdi-account-check-outline" }}</v-icon>
                  {{ u.is_active ? "Desactivar" : "Activar" }}
                </v-btn>
              </td>
            </tr>

            <tr v-if="!usersStore.loading && filtered.length === 0">
              <td colspan="7" class="text-center py-10 text-medium-emphasis">
                <v-icon size="48" class="mb-2">mdi-account-search-outline</v-icon>
                <div class="text-h6">No hay usuarios</div>
                <div class="text-caption">Probá ajustar el filtro.</div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Dialog Create/Edit -->
    <UserUpsertDialog
      v-model:open="dlgOpen"
      :mode="dlgMode"
      :item="dlgItem"
      :roles="usersStore.meta.roles"
      :branches="usersStore.meta.branches"
      :loading="usersStore.saving"
      @save="onSave"
    />

    <v-snackbar v-model="toast.show" :timeout="3200">
      {{ toast.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useUsersStore } from "@/app/store/users.store";
import UserUpsertDialog from "../components/UserUpsertDialog.vue";

const usersStore = useUsersStore();
const q = ref("");
const toast = ref({ show: false, text: "" });

const dlgOpen = ref(false);
const dlgMode = ref("create"); // create | edit
const dlgItem = ref(null);

const activeCount = computed(() => (usersStore.items || []).filter((x) => x.is_active).length);

const filtered = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  const arr = usersStore.items || [];

  if (!qq) return arr;

  return arr.filter((u) => {
    const hay =
      String(u.full_name || "").toLowerCase().includes(qq) ||
      String(u.email || "").toLowerCase().includes(qq) ||
      String(u.username || "").toLowerCase().includes(qq) ||
      String((u.roles || []).join(" ")).toLowerCase().includes(qq) ||
      String((u.branches || []).map((b) => b.name || b).join(" ")).toLowerCase().includes(qq);
    return hay;
  });
});

async function refresh() {
  try {
    await usersStore.fetchAll();
  } catch (e) {
    toast.value = { show: true, text: e?.message || "Error cargando usuarios" };
  }
}

function openCreate() {
  dlgMode.value = "create";
  dlgItem.value = null;
  dlgOpen.value = true;
}

function openEdit(u) {
  dlgMode.value = "edit";
  dlgItem.value = u;
  dlgOpen.value = true;
}

async function toggleActive(u) {
  try {
    await usersStore.toggleActive(u.id);
    toast.value = { show: true, text: "✅ Estado actualizado" };
  } catch (e) {
    toast.value = { show: true, text: e?.message || "Error actualizando estado" };
  }
}

async function onSave(payload) {
  try {
    if (dlgMode.value === "create") {
      await usersStore.create(payload);
      toast.value = { show: true, text: "✅ Usuario creado" };
    } else {
      await usersStore.update(dlgItem.value.id, payload);
      toast.value = { show: true, text: "✅ Usuario actualizado" };
    }
    dlgOpen.value = false;
  } catch (e) {
    toast.value = { show: true, text: e?.message || "Error guardando" };
  }
}

onMounted(async () => {
  await usersStore.fetchMeta();
  await refresh();
});
</script>
