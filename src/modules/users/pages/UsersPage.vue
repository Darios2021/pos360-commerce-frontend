<!-- src/modules/users/pages/UsersPage.vue -->
<template>
  <div class="up">

    <!-- HEADER -->
    <AppPageHeader
      icon="mdi-account-multiple-outline"
      title="Usuarios"
      subtitle="Gestión de cuentas, roles y sucursales habilitadas"
    >
      <v-btn
        variant="tonal"
        size="small"
        rounded="lg"
        prepend-icon="mdi-refresh"
        :loading="usersStore.loading"
        @click="refresh"
      >
        Actualizar
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-account-plus"
        @click="openCreate"
      >
        Nuevo usuario
      </v-btn>
    </AppPageHeader>

    <!-- KPIs -->
    <div class="up-kpis">
      <div class="up-kpi up-kpi--total">
        <div class="up-kpi__badge"><v-icon size="18" color="white">mdi-account-group</v-icon></div>
        <div>
          <div class="up-kpi__val">{{ totalCount }}</div>
          <div class="up-kpi__lbl">Total</div>
        </div>
      </div>
      <div class="up-kpi up-kpi--active">
        <div class="up-kpi__badge"><v-icon size="18" color="white">mdi-account-check</v-icon></div>
        <div>
          <div class="up-kpi__val">{{ activeCount }}</div>
          <div class="up-kpi__lbl">Activos</div>
        </div>
      </div>
      <div class="up-kpi up-kpi--inactive">
        <div class="up-kpi__badge"><v-icon size="18" color="white">mdi-account-off</v-icon></div>
        <div>
          <div class="up-kpi__val">{{ totalCount - activeCount }}</div>
          <div class="up-kpi__lbl">Inactivos</div>
        </div>
      </div>
      <div class="up-kpi up-kpi--admins">
        <div class="up-kpi__badge"><v-icon size="18" color="white">mdi-shield-account</v-icon></div>
        <div>
          <div class="up-kpi__val">{{ adminsCount }}</div>
          <div class="up-kpi__lbl">Administradores</div>
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="up-filters">
      <v-text-field
        v-model="q"
        prepend-inner-icon="mdi-magnify"
        placeholder="Buscar por nombre, email o usuario…"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="up-filter up-filter--search"
      />
      <v-select
        v-model="roleFilter"
        :items="roleOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        placeholder="Todos los roles"
        clearable
        class="up-filter"
      />
      <v-select
        v-model="branchFilter"
        :items="branchOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        placeholder="Todas las sucursales"
        clearable
        class="up-filter"
      />
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        class="up-filter"
      />
    </div>

    <div class="up-info">
      <span class="up-info__count">
        {{ filtered.length }}
        {{ filtered.length === 1 ? 'usuario' : 'usuarios' }}
      </span>
    </div>

    <!-- TABLA -->
    <div class="up-table-wrap">
      <table class="up-table">
        <thead>
          <tr>
            <th class="col-user">Usuario</th>
            <th class="col-email">Email</th>
            <th class="col-roles">Roles</th>
            <th class="col-branches">Sucursales</th>
            <th class="col-status">Estado</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="usersStore.loading && !filtered.length">
            <td colspan="6" class="up-td-loading">
              <v-progress-circular size="22" indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!filtered.length">
            <td colspan="6" class="up-td-empty">
              <v-icon size="36" color="medium-emphasis">mdi-account-search-outline</v-icon>
              <div>Sin usuarios para estos filtros</div>
            </td>
          </tr>
          <tr
            v-for="u in filtered"
            :key="u.id"
            class="up-row"
            @click="openEdit(u)"
          >
            <td>
              <div class="up-user">
                <div class="up-user__av" :style="{ background: avatarColor(u) }">
                  {{ initialsOf(u) }}
                </div>
                <div class="up-user__body">
                  <div class="up-user__name">
                    {{ u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '—' }}
                  </div>
                  <div class="up-user__handle">
                    <span class="up-id">#{{ u.id }}</span>
                    <span v-if="u.username" class="up-handle">@{{ u.username }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="up-email">
              <v-icon size="12" class="up-email-ic">mdi-email-outline</v-icon>
              <span>{{ (u.email || '—').toLowerCase() }}</span>
            </td>
            <td>
              <div v-if="(u.roles || []).length" class="up-chips">
                <span
                  v-for="r in rolesArr(u)"
                  :key="r"
                  class="up-role"
                  :class="roleClass(r)"
                >
                  {{ roleLabel(r) }}
                </span>
              </div>
              <span v-else class="up-dash">—</span>
            </td>
            <td>
              <div v-if="(u.branches || []).length" class="up-chips">
                <span
                  v-for="b in (u.branches || [])"
                  :key="b.id || b"
                  class="up-branch"
                >
                  <v-icon size="10">mdi-store</v-icon>
                  {{ b.name || b }}
                </span>
              </div>
              <span v-else class="up-dash">Sin asignar</span>
            </td>
            <td>
              <span class="up-status" :class="u.is_active ? 'is-active' : 'is-inactive'">
                <span class="up-status__dot" />
                {{ u.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="up-action" @click.stop>
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                </template>
                <v-list density="compact" nav>
                  <v-list-item @click="openEdit(u)" prepend-icon="mdi-pencil-outline">
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openResetPassword(u)" prepend-icon="mdi-lock-reset">
                    <v-list-item-title>Cambiar contraseña</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    @click="toggleActive(u)"
                    :prepend-icon="u.is_active ? 'mdi-account-off-outline' : 'mdi-account-check-outline'"
                    :class="u.is_active ? 'text-error' : 'text-success'"
                  >
                    <v-list-item-title>
                      {{ u.is_active ? 'Desactivar' : 'Activar' }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog Create/Edit -->
    <UserUpsertDialog
      v-model:open="dlgOpen"
      :mode="dlgMode"
      :item="dlgItem"
      :roles="usersStore.meta.roles"
      :branches="usersStore.meta.branches"
      :loading="usersStore.saving"
      :initial-tab="initialTab"
      @save="onSave"
    />

    <v-snackbar v-model="toast.show" :timeout="3000" :color="toast.color">
      {{ toast.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useUsersStore } from "@/app/store/users.store";
import UserUpsertDialog from "../components/UserUpsertDialog.vue";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const usersStore = useUsersStore();
const q = ref("");
const roleFilter = ref(null);
const branchFilter = ref(null);
const statusFilter = ref("all");
const toast = ref({ show: false, text: "", color: "primary" });

const dlgOpen = ref(false);
const dlgMode = ref("create");
const dlgItem = ref(null);
const initialTab = ref("identity");

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Solo activos" },
  { value: "inactive", label: "Solo inactivos" },
];

const roleOptions = computed(() => {
  const metaRoles = usersStore.meta?.roles || [];
  return metaRoles.map((r) => ({
    value: r.name || r,
    label: roleLabel(r.name || r),
  }));
});

const branchOptions = computed(() => {
  const metaBranches = usersStore.meta?.branches || [];
  return metaBranches.map((b) => ({
    value: b.id || b,
    label: b.name || String(b),
  }));
});

const totalCount = computed(() => (usersStore.items || []).length);
const activeCount = computed(() =>
  (usersStore.items || []).filter((x) => x.is_active).length
);
const adminsCount = computed(() =>
  (usersStore.items || []).filter((u) =>
    rolesArr(u).some((r) => ["super_admin", "admin"].includes(String(r).toLowerCase()))
  ).length
);

function rolesArr(u) {
  const raw = u?.roles || [];
  return raw.map((r) => (typeof r === "object" ? r.name : r)).filter(Boolean);
}

const filtered = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  const arr = usersStore.items || [];

  return arr.filter((u) => {
    // Status
    if (statusFilter.value === "active" && !u.is_active) return false;
    if (statusFilter.value === "inactive" && u.is_active) return false;

    // Role
    if (roleFilter.value) {
      const has = rolesArr(u)
        .map((r) => String(r).toLowerCase())
        .includes(String(roleFilter.value).toLowerCase());
      if (!has) return false;
    }

    // Branch
    if (branchFilter.value) {
      const bids = (u.branches || []).map((b) => Number(b.id || b));
      if (!bids.includes(Number(branchFilter.value))) return false;
    }

    // Text
    if (qq) {
      const hay =
        String(u.full_name || "").toLowerCase().includes(qq) ||
        String(u.first_name || "").toLowerCase().includes(qq) ||
        String(u.last_name || "").toLowerCase().includes(qq) ||
        String(u.email || "").toLowerCase().includes(qq) ||
        String(u.username || "").toLowerCase().includes(qq);
      if (!hay) return false;
    }
    return true;
  });
});

async function refresh() {
  try {
    await usersStore.fetchAll();
  } catch (e) {
    toast.value = { show: true, text: e?.message || "Error cargando usuarios", color: "error" };
  }
}

function openCreate() {
  dlgMode.value = "create";
  dlgItem.value = null;
  initialTab.value = "identity";
  dlgOpen.value = true;
}

function openEdit(u) {
  dlgMode.value = "edit";
  dlgItem.value = u;
  initialTab.value = "identity";
  dlgOpen.value = true;
}

function openResetPassword(u) {
  dlgMode.value = "edit";
  dlgItem.value = u;
  initialTab.value = "password";
  dlgOpen.value = true;
}

async function toggleActive(u) {
  try {
    await usersStore.toggleActive(u.id);
    toast.value = {
      show: true,
      text: u.is_active ? "Usuario desactivado" : "Usuario activado",
      color: "success",
    };
  } catch (e) {
    toast.value = { show: true, text: e?.message || "Error", color: "error" };
  }
}

async function onSave(payload) {
  try {
    if (dlgMode.value === "create") {
      await usersStore.create(payload);
      toast.value = { show: true, text: "Usuario creado correctamente", color: "success" };
    } else {
      await usersStore.update(dlgItem.value.id, payload);
      toast.value = { show: true, text: "Usuario actualizado", color: "success" };
    }
    dlgOpen.value = false;
  } catch (e) {
    toast.value = { show: true, text: e?.message || "Error al guardar", color: "error" };
  }
}

/* ─── helpers visuales ─── */
function initialsOf(u) {
  const src = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.email || "";
  const s = String(src).trim();
  if (!s) return "?";
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}

// Color pseudo-random pero estable según id — paleta calma.
const AVATAR_PALETTE = [
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ec4899, #db2777)",
  "linear-gradient(135deg, #64748b, #475569)",
  "linear-gradient(135deg, #6366f1, #4f46e5)",
];
function avatarColor(u) {
  const id = Number(u.id || 0);
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

function roleLabel(r) {
  const map = {
    super_admin: "Super admin",
    admin: "Admin",
    manager: "Encargado",
    cashier: "Cajero",
  };
  const key = String(r || "").toLowerCase();
  return map[key] || r;
}
function roleClass(r) {
  const key = String(r || "").toLowerCase();
  return `up-role--${key}`;
}

onMounted(async () => {
  await usersStore.fetchMeta();
  await refresh();
});
</script>

<style scoped>
.up {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

/* Header */
.up-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.up-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.up-title {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.01em;
  margin: 0;
}
.up-subtitle {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 500;
}
.up-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* KPIs */
.up-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.up-kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.up-kpi__badge {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15);
}
.up-kpi--total .up-kpi__badge    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.up-kpi--active .up-kpi__badge   { background: linear-gradient(135deg, #22c55e, #16a34a); }
.up-kpi--inactive .up-kpi__badge { background: linear-gradient(135deg, #94a3b8, #64748b); }
.up-kpi--admins .up-kpi__badge   { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.up-kpi__val {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.01em;
}
.up-kpi__lbl {
  font-size: 10.5px;
  font-weight: 500;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Filtros */
.up-filters {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1fr;
  gap: 10px;
}
.up-filter :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
}

.up-info {
  font-size: 12px;
  opacity: 0.75;
}
.up-info__count { font-weight: 400; }

/* Tabla */
.up-table-wrap {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  overflow: hidden;
}
.up-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.up-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 500;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
  white-space: nowrap;
}
.col-user     { width: 22%; min-width: 230px; }
.col-email    { width: 20%; }
.col-roles    { width: 22%; }
.col-branches { width: 16%; }
.col-status   { width: 110px; }
.col-action   { width: 50px; }

.up-row td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
  font-size: 13px;
  vertical-align: middle;
  overflow: hidden;
}
.up-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
  cursor: pointer;
}
.up-row:last-child td { border-bottom: none; }

.up-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.up-user__av {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.2);
}
.up-user__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.up-user__name {
  font-weight: 500;
  font-size: 13.5px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.up-user__handle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  line-height: 1;
}
.up-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  opacity: 0.45;
  font-weight: 400;
}
.up-handle {
  opacity: 0.6;
  font-weight: 500;
}

.up-email {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.up-email-ic { opacity: 0.5; flex-shrink: 0; }

.up-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Roles — colores por tipo */
.up-role {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.up-role--super_admin {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}
.up-role--admin {
  background: rgba(139, 92, 246, 0.16);
  color: #7c3aed;
}
:global(.v-theme--dark) .up-role--admin { color: #a78bfa; }
.up-role--manager {
  background: rgba(59, 130, 246, 0.16);
  color: #2563eb;
}
:global(.v-theme--dark) .up-role--manager { color: #60a5fa; }
.up-role--cashier {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.up-branch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 400;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.82);
  white-space: nowrap;
}
.up-branch :deep(.v-icon) { opacity: 0.6; }

.up-dash {
  font-size: 11px;
  opacity: 0.4;
  font-style: italic;
}

.up-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.up-status__dot { width: 7px; height: 7px; border-radius: 50%; }
.up-status.is-active {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}
.up-status.is-active .up-status__dot {
  background: rgb(var(--v-theme-success));
  animation: up-pulse 2s ease-in-out infinite;
}
.up-status.is-inactive {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.up-status.is-inactive .up-status__dot {
  background: rgba(var(--v-theme-on-surface), 0.4);
}
@keyframes up-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
  50%      { box-shadow: 0 0 0 4px rgba(var(--v-theme-success), 0.28); }
}

.up-action { text-align: right; }

.up-td-loading,
.up-td-empty {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
}
.up-td-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 400;
}

@media (max-width: 1200px) {
  .up-table { min-width: 900px; }
  .up-table-wrap { overflow-x: auto; }
}
@media (max-width: 900px) {
  .up-filters { grid-template-columns: 1fr 1fr; }
  .up-filter--search { grid-column: 1 / -1; }
}

/* ── Mobile app-like ── */
@media (max-width: 600px) {
  .up-kpis { display: none !important; }
}
</style>
