<template>
  <div class="stp">
    <!-- Sin header duplicado: el breadcrumb global ya muestra la sección.
         La identidad visual (icono + título + KPIs + acciones) se mantiene
         en el componente embebido. -->
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
.stp { display: flex; flex-direction: column; }
</style>
