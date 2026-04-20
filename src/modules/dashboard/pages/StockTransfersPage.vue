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
import { computed } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import DashboardTransferenciasTab from "../components/DashboardTransferenciasTab.vue";

const auth = useAuthStore();
if (auth.status === "idle") auth.hydrate();

const isAdmin         = computed(() => auth.isAdmin);
const isCentral       = computed(() =>
  auth.isAdmin ||
  auth.user?.is_central === true ||
  auth.user?.branch_type === "central" ||
  Number(auth.user?.branch_id) === 1
);
const currentBranchId    = computed(() => auth.branchId);
const currentWarehouseId = computed(() => Number(auth.user?.warehouse_id || 0) || null);
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
