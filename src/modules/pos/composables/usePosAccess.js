// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosAccess.js
import { computed } from "vue";
import { useAuthStore } from "../../../app/store/auth.store";

export function usePosAccess() {
  const auth = useAuthStore();

  const roles = computed(() => {
    const arr = auth?.user?.roles;
    return Array.isArray(arr) ? arr.map((x) => String(x).toLowerCase().trim()) : [];
  });

  const permissions = computed(() => {
    // soporta distintas formas según tu authStore
    const a = auth?.user?.permissions;
    const b = auth?.user?.access?.permissions;
    const arr = Array.isArray(a) ? a : Array.isArray(b) ? b : [];
    return arr.map((x) => String(x).toLowerCase().trim());
  });

  const isSuperAdmin = computed(() => roles.value.includes("super_admin"));

  // ✅ Permisos reales del backend
  const canSell = computed(() => permissions.value.includes("pos.sale") || isSuperAdmin.value);
  const canOpenCash = computed(() => permissions.value.includes("pos.cash.open") || isSuperAdmin.value);
  const canCloseCash = computed(() => permissions.value.includes("pos.cash.close") || isSuperAdmin.value);

  const isViewOnly = computed(() => !canSell.value);

  const cashierName = computed(() => auth?.user?.name || auth?.user?.full_name || auth?.user?.email || "—");

  return {
    auth,
    roles,
    permissions,
    isSuperAdmin,
    canSell,
    canOpenCash,
    canCloseCash,
    isViewOnly,
    cashierName,
  };
}