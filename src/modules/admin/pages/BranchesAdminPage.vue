<!-- /admin/branches — Gestión de sucursales -->

<template>
  <v-container class="mx-auto" style="max-width: 1200px">
    <AppPageHeader
      icon="mdi-map-marker-multiple-outline"
      title="Sucursales"
      subtitle="Puntos físicos de retiro y venta. Cargá la ubicación geográfica para que aparezcan en el mapa del checkout."
    >
      <v-btn variant="tonal" size="small" rounded="lg" prepend-icon="mdi-refresh" :loading="loading" @click="reload">
        Recargar
      </v-btn>
      <v-btn color="primary" variant="flat" size="small" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">
        Nueva sucursal
      </v-btn>
    </AppPageHeader>

    <v-card rounded="xl" elevation="3" class="pa-4">
      <!-- Toolbar -->
      <div class="d-flex align-center ga-2 flex-wrap mb-3">
        <v-text-field
          v-model="search"
          placeholder="Buscar por nombre, código o ciudad…"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          rounded="lg"
          class="flex-grow-1"
          style="min-width: 240px"
        />

        <v-btn-toggle
          v-model="filterActive"
          mandatory
          color="primary"
          variant="outlined"
          density="comfortable"
          rounded="lg"
        >
          <v-btn value="all">Todas</v-btn>
          <v-btn value="active">Activas</v-btn>
          <v-btn value="inactive">Inactivas</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Alertas -->
      <v-alert
        v-if="errorMsg"
        type="error"
        variant="tonal"
        rounded="lg"
        class="mb-3"
        closable
        @click:close="errorMsg = ''"
      >
        {{ errorMsg }}
      </v-alert>

      <v-alert
        v-if="!loading && missingGeo > 0"
        type="warning"
        variant="tonal"
        rounded="lg"
        class="mb-3"
      >
        Hay <b>{{ missingGeo }}</b> sucursal{{ missingGeo === 1 ? "" : "es" }} sin coordenadas.
        Cargales la ubicación para que aparezcan en el mapa del checkout.
      </v-alert>

      <!-- Lista -->
      <div v-if="loading" class="text-center py-10 text-medium-emphasis">
        <v-progress-circular indeterminate />
        <div class="text-caption mt-3">Cargando sucursales…</div>
      </div>

      <div v-else-if="!filteredItems.length" class="text-center py-10">
        <v-icon size="36" class="text-medium-emphasis">mdi-storefront-outline</v-icon>
        <div class="text-subtitle-2 mt-2">
          {{ items.length === 0 ? "Sin sucursales cargadas" : "Sin resultados" }}
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          {{
            items.length === 0
              ? "Creá tu primera sucursal con el botón de arriba."
              : "Probá con otro término de búsqueda o filtros distintos."
          }}
        </div>
      </div>

      <v-row v-else dense>
        <v-col v-for="b in filteredItems" :key="b.id" cols="12">
          <v-card
            rounded="xl"
            variant="tonal"
            class="pa-4 ba-row"
            :class="{ 'ba-row--inactive': !b.is_active }"
          >
            <div class="d-flex align-center justify-space-between flex-wrap ga-3">
              <div class="d-flex align-center ga-3 min-w-0 flex-grow-1">
                <v-avatar
                  size="44"
                  rounded="lg"
                  :color="b.is_active ? 'primary' : 'grey-lighten-2'"
                  variant="tonal"
                >
                  <v-icon size="22">mdi-storefront-outline</v-icon>
                </v-avatar>

                <div class="min-w-0">
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <span class="text-caption text-medium-emphasis ba-code">{{ b.code }}</span>
                    <v-chip
                      :color="b.is_active ? 'success' : 'default'"
                      size="x-small"
                      variant="tonal"
                      class="ba-chip"
                    >
                      <v-icon start size="11">
                        {{ b.is_active ? "mdi-check-circle" : "mdi-pause-circle" }}
                      </v-icon>
                      {{ b.is_active ? "Activa" : "Inactiva" }}
                    </v-chip>
                  </div>
                  <div class="font-weight-medium ba-name">{{ b.name }}</div>

                  <div class="text-caption text-medium-emphasis ba-meta mt-1">
                    <span v-if="b.address || b.city" class="ba-meta-item">
                      <v-icon size="12">mdi-map-marker-outline</v-icon>
                      {{ [b.address, b.city, b.province].filter(Boolean).join(" · ") || "Sin dirección" }}
                    </span>
                    <span v-if="b.phone" class="ba-meta-item">
                      <v-icon size="12">mdi-phone-outline</v-icon>
                      {{ b.phone }}
                    </span>
                    <span v-if="b.hours" class="ba-meta-item">
                      <v-icon size="12">mdi-clock-outline</v-icon>
                      {{ b.hours }}
                    </span>
                    <span class="ba-meta-item ba-coords" :class="{ 'ba-coords--missing': !hasCoords(b) }">
                      <v-icon size="12">{{ hasCoords(b) ? "mdi-crosshairs-gps" : "mdi-crosshairs-off" }}</v-icon>
                      {{ fmtCoords(b) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex ga-1">
                <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  rounded="lg"
                  prepend-icon="mdi-pencil-outline"
                  @click="openEdit(b)"
                >
                  Editar
                </v-btn>

                <v-btn
                  v-if="b.is_active"
                  variant="text"
                  color="error"
                  size="small"
                  rounded="lg"
                  prepend-icon="mdi-pause-circle-outline"
                  @click="confirmRemove(b)"
                >
                  Dar de baja
                </v-btn>
                <v-btn
                  v-else
                  variant="text"
                  color="primary"
                  size="small"
                  rounded="lg"
                  prepend-icon="mdi-play-circle-outline"
                  @click="toggleActive(b, true)"
                >
                  Reactivar
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- DIALOGS -->
    <BranchEditDialog v-model="editDialog" :branch="editingBranch" @saved="onSaved" />

    <v-dialog v-model="confirmDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title>¿Dar de baja esta sucursal?</v-card-title>
        <v-card-text>
          <b>{{ pendingRemove?.name || "" }}</b> dejará de aparecer en el shop público.
          Podés reactivarla cuando quieras desde esta misma pantalla.
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="confirmDialog = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="error" variant="flat" rounded="lg" :loading="removing" @click="doRemove">
            Dar de baja
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import {
  listBranches,
  deleteBranch,
  updateBranch,
} from "@/modules/admin/services/branches.api";
import BranchEditDialog from "@/modules/admin/components/branches/BranchEditDialog.vue";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const items = ref([]);
const loading = ref(false);
const errorMsg = ref("");

const search = ref("");
const filterActive = ref("all");

const editDialog = ref(false);
const editingBranch = ref(null);

const confirmDialog = ref(false);
const pendingRemove = ref(null);
const removing = ref(false);

function hasCoords(b) {
  return Number.isFinite(Number(b?.latitude)) && Number.isFinite(Number(b?.longitude));
}

function fmtCoords(b) {
  if (!hasCoords(b)) return "Sin coordenadas";
  const lat = Number(b.latitude).toFixed(5);
  const lng = Number(b.longitude).toFixed(5);
  return `${lat}, ${lng}`;
}

const missingGeo = computed(() => items.value.filter((b) => b.is_active && !hasCoords(b)).length);

const filteredItems = computed(() => {
  const q = String(search.value || "").trim().toLowerCase();
  return items.value.filter((b) => {
    if (filterActive.value === "active" && !b.is_active) return false;
    if (filterActive.value === "inactive" && b.is_active) return false;
    if (!q) return true;
    const hay = [b.code, b.name, b.address, b.city, b.province, b.phone]
      .map((s) => String(s || "").toLowerCase())
      .join(" ");
    return hay.includes(q);
  });
});

async function reload() {
  loading.value = true;
  errorMsg.value = "";
  try {
    items.value = await listBranches();
  } catch (e) {
    const status = e?.response?.status;
    if (status === 403) {
      errorMsg.value = "No tenés permisos para ver el listado completo de sucursales.";
    } else {
      errorMsg.value = e?.response?.data?.message || e?.message || "Error cargando sucursales.";
    }
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingBranch.value = null;
  editDialog.value = true;
}

function openEdit(b) {
  editingBranch.value = b;
  editDialog.value = true;
}

function onSaved(saved) {
  if (!saved?.id) return;
  const idx = items.value.findIndex((x) => Number(x.id) === Number(saved.id));
  if (idx >= 0) items.value[idx] = { ...items.value[idx], ...saved };
  else items.value.unshift(saved);
}

function confirmRemove(b) {
  pendingRemove.value = b;
  confirmDialog.value = true;
}

async function doRemove() {
  if (!pendingRemove.value) return;
  removing.value = true;
  try {
    await deleteBranch(pendingRemove.value.id);
    const idx = items.value.findIndex((x) => Number(x.id) === Number(pendingRemove.value.id));
    if (idx >= 0) items.value[idx] = { ...items.value[idx], is_active: false };
    confirmDialog.value = false;
    pendingRemove.value = null;
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo dar de baja.";
  } finally {
    removing.value = false;
  }
}

async function toggleActive(b, toActive) {
  try {
    const saved = await updateBranch(b.id, { ...b, is_active: !!toActive });
    onSaved(saved);
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo actualizar el estado.";
  }
}

onMounted(reload);
</script>

<style scoped>
.min-w-0 {
  min-width: 0;
}

.ba-row {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.ba-row:hover {
  transform: translateY(-1px);
}
.ba-row--inactive {
  opacity: 0.7;
}

.ba-code {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 500;
  font-size: 10.5px;
}

.ba-chip {
  font-weight: 500 !important;
  font-size: 10.5px !important;
  letter-spacing: 0.02em;
}

.ba-name {
  font-size: 16px;
  letter-spacing: -0.005em;
  margin-top: 1px;
}

.ba-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  align-items: center;
}
.ba-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.ba-meta-item .v-icon {
  opacity: 0.6;
}

.ba-coords {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
}
.ba-coords--missing {
  color: rgb(var(--v-theme-warning));
}
.ba-coords--missing .v-icon {
  opacity: 1;
}
</style>
