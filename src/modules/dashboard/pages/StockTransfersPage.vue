<template>
  <div class="stp">
    <div class="stp-header">
      <div class="stp-header__left">
        <v-icon size="22" color="primary" class="mr-2">mdi-truck-fast-outline</v-icon>
        <span class="stp-title">Derivaciones de stock</span>
      </div>
    </div>

    <DashboardTransferenciasTab
      :is-admin="isAdmin"
      :is-central="isCentral"
      :current-branch-id="currentBranchId"
      :current-warehouse-id="currentWarehouseId"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import DashboardTransferenciasTab from "../components/DashboardTransferenciasTab.vue";

// ── Auth helpers ───────────────────────────────────────────────
function getAuthUser() {
  try {
    const raw = localStorage.getItem("pos360_user") || localStorage.getItem("user") || "";
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function isAdminUser(u) {
  const email = String(u?.email || u?.identifier || u?.username || "").toLowerCase();
  if (email.includes("admin@360pos.local")) return true;
  if (u?.is_admin === true || u?.isAdmin === true || u?.admin === true) return true;
  const roles = []
    .concat(u?.role  ? [u.role]  : [])
    .concat(u?.rol   ? [u.rol]   : [])
    .concat(Array.isArray(u?.roles) ? u.roles : []);
  return roles
    .map((r) => (typeof r === "string" ? r : r?.name || r?.role || ""))
    .map((s) => String(s).toLowerCase())
    .some((x) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(x));
}

const user = ref(getAuthUser());

const isAdmin         = computed(() => isAdminUser(user.value));
const userBranchId    = computed(() => Number(user.value?.branch_id || 0) || null);
const isCentral       = computed(() =>
  isAdmin.value ||
  user.value?.is_central === true ||
  user.value?.branch_type === "central" ||
  Number(user.value?.branch_id) === 1
);
const currentBranchId    = computed(() => userBranchId.value);
const currentWarehouseId = computed(() => Number(user.value?.warehouse_id || 0) || null);
</script>

<style scoped>
.stp { display: flex; flex-direction: column; gap: 16px; }
.stp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.stp-header__left { display: flex; align-items: center; }
.stp-title { font-size: 18px; font-weight: 700; }
</style>
