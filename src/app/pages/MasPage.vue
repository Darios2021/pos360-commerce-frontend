<!--
  Más: todo lo que no entra en la barra inferior del teléfono (informe 2.1).
  Lista agrupada como el menú de escritorio (Operación, Gestión, CRM, Tienda,
  Sistema, Cuenta) con los mismos permisos: hasRoute, isAdmin, isSuperAdmin y
  usaAsistente. Arriba la ficha de la cuenta; al final Modo oscuro y Cerrar
  sesión.
-->
<template>
  <div class="mas m-vista">
    <div class="m-pz">
      <router-link :to="{ name: 'profile' }" class="m-it">
        <span class="mas-avatar">{{ iniciales }}</span>
        <span class="tx"><b>{{ nombre }}</b><small>{{ rolTexto }}</small></span>
        <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
      </router-link>
    </div>

    <template v-for="g in grupos" :key="g.titulo">
      <div class="m-rot">{{ g.titulo }}</div>
      <div class="m-pz">
        <router-link v-for="it in g.items" :key="it.name" :to="{ name: it.name }" class="m-it mas-it">
          <v-icon size="24" class="mas-ic">{{ it.icon }}</v-icon>
          <span class="tx"><b>{{ it.label }}</b></span>
          <span v-if="it.badge > 0" class="m-est no num">{{ it.badge }}</span>
          <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
        </router-link>
      </div>
    </template>

    <div class="m-rot">Cuenta</div>
    <div class="m-pz">
      <button type="button" class="m-it mas-it m-sw" :class="{ on: isDark }" @click="toggleDark">
        <v-icon size="24" class="mas-ic">mdi-weather-night</v-icon>
        <span class="tx"><b>Modo oscuro</b></span>
        <span class="t"></span>
      </button>
      <button type="button" class="m-it mas-it mas-salir" @click="onLogout">
        <v-icon size="24">mdi-logout-variant</v-icon>
        <span class="tx"><b>Cerrar sesión</b></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";
import { useThemeStore } from "@/app/store/theme.store";
import { setDarkMode } from "@/app/theme/darkMode";
import { useTransferNotifications } from "@/modules/dashboard/composables/useTransferNotifications";

const router = useRouter();
const auth = useAuthStore();
const themeStore = useThemeStore();

const isAdmin = computed(() => auth.isAdmin === true);
const isSuperAdmin = computed(() => auth.isSuperAdmin === true);
const isCajero = computed(() => auth.isCajero === true);

function hasRoute(name) {
  try { return router.hasRoute(name) === true; } catch { return false; }
}

// Asistente: igual que el menú de escritorio, sólo si el servidor lo habilitó.
const usaAsistente = ref(false);
onMounted(async () => {
  try {
    const { data } = await http.get("asistente/estado");
    usaAsistente.value = (data?.puede || []).length > 0;
  } catch {
    usaAsistente.value = false;
  }
});

const { pendingForMe } = useTransferNotifications();
const derivaciones = computed(() => pendingForMe.value.length);

// Pedidos web sin preparar (mismo criterio que el badge de la barra).
const pedidos = ref(0);
onMounted(async () => {
  if (!isSuperAdmin.value || !hasRoute("shopOrders")) return;
  try {
    const { data } = await http.get("/admin/shop/orders", { params: { page: 1, limit: 1, status: "created" } });
    pedidos.value = Number(data?.meta?.total || 0) || 0;
  } catch {
    pedidos.value = 0;
  }
});

const showShopMenu = computed(() =>
  ["shopOrders", "shopPaymentsSettings", "shopLinks", "shopQA", "adminGaleriaMultimedia"].some(hasRoute)
);

function it(name, label, icon, cond = true, badge = 0) {
  return cond && hasRoute(name) ? { name, label, icon, badge } : null;
}

const grupos = computed(() => {
  const g = [
    {
      titulo: "Operación",
      items: [
        // El cajero no tiene Inicio en la barra: queda acá, como en el menú de escritorio.
        it("home", "Inicio", "mdi-home-outline", isCajero.value),
        it("asistente", "Asistente", "mdi-forum-outline", usaAsistente.value),
        // El dueño entra a la Caja desde acá; el cajero la tiene en la barra.
        it("caja", "Caja", "mdi-cash-multiple", !isCajero.value),
        it("transfers", "Derivaciones", "mdi-truck-fast-outline", true, derivaciones.value),
        it("budgets", "Presupuestos", "mdi-file-document-edit-outline"),
        it("posPrinter", "Impresión", "mdi-printer-pos-outline"),
      ],
    },
    {
      titulo: "Gestión",
      items: [
        it("adminCashRegisters", "Cajas", "mdi-cash-register", isAdmin.value),
        it("reports", "Reportes", "mdi-chart-line", isAdmin.value),
        it("suppliers", "Proveedores", "mdi-truck-outline"),
        it("costsMissing", "Costos faltantes", "mdi-cash-edit", isAdmin.value),
        it("categories", "Categorías", "mdi-shape-outline"),
        it("productsLabels", "Etiquetas", "mdi-printer-pos"),
      ],
    },
    {
      titulo: "CRM",
      items: [
        it("adminCustomers", "Clientes", "mdi-account-group-outline"),
        it("emailPromoBlocks", "Promociones email", "mdi-tag-multiple-outline", isSuperAdmin.value),
        it("adminContenidos", "Gestión de contenidos", "mdi-movie-open-play-outline", isAdmin.value),
      ],
    },
    {
      titulo: "Tienda",
      items: isSuperAdmin.value && showShopMenu.value
        ? [
            it("shopOrders", "Pedidos", "mdi-receipt-text-outline", true, pedidos.value),
            it("shopQA", "Consultas web", "mdi-message-question-outline"),
            it("shopBranding", "Marca", "mdi-palette-outline"),
            it("shopBrandingContact", "Contacto", "mdi-card-account-phone-outline"),
            it("shopBrandingSocial", "Redes", "mdi-share-variant-outline"),
            it("adminBranches", "Sucursales", "mdi-map-marker-multiple-outline"),
            it("shopBrandingShare", "Vista al compartir", "mdi-image-text"),
            it("shopPaymentsSettings", "Pagos", "mdi-credit-card-outline"),
            it("shopLinks", "Links Tienda", "mdi-link-variant"),
            it("adminGaleriaMultimedia", "Galería multimedia", "mdi-image-multiple-outline"),
          ]
        : [],
    },
    {
      titulo: "Sistema",
      items: [
        it("users", "Usuarios", "mdi-account-multiple-outline", isAdmin.value),
        it("priceSettings", "Parámetros de precios", "mdi-tune-variant", isAdmin.value),
        it("adminPaymentMethods", "Medios de pago", "mdi-credit-card-outline", isAdmin.value),
        it("adminFiscal", "Fiscal", "mdi-file-document-outline", isAdmin.value),
        it("adminTelegram", "Alertas Telegram", "mdi-send-variant", isSuperAdmin.value),
        it("shopBranding", "Tienda", "mdi-storefront-outline", isSuperAdmin.value && !showShopMenu.value),
      ],
    },
  ];
  return g
    .map((x) => ({ ...x, items: x.items.filter(Boolean) }))
    .filter((x) => x.items.length);
});

const nombre = computed(() => {
  const u = auth.user || {};
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || u.email || "Cuenta";
});
const iniciales = computed(() => {
  const u = auth.user || {};
  const a = String(u.first_name || u.username || u.email || "").trim()[0] || "";
  const b = String(u.last_name || "").trim()[0] || "";
  return (a + b).toUpperCase() || "U";
});
const rolTexto = computed(() => {
  const roles = auth.roles || [];
  let rol = "Cajero";
  if (auth.isSuperAdmin) rol = "Dueño";
  else if (roles.includes("admin")) rol = "Administrador";
  else if (roles.includes("vendedor") || roles.includes("seller")) rol = "Vendedor";
  const bid = Number(auth.user?.branch_id || 0);
  const suc = (auth.branches || []).find((b) => Number(b.id) === bid)?.name || "";
  return [rol, suc].filter(Boolean).join(" · ");
});

const isDark = computed(() => themeStore.isDark);
function toggleDark() {
  const v = !themeStore.isDark;
  themeStore.setDark(v);
  setDarkMode(v);
}

function onLogout() {
  auth.logout?.();
  router.push({ name: "login" });
}
</script>

<style scoped>
.mas {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: -16px -16px 0;
  padding: 12px 16px 8px;
  background: transparent;
}
.mas .m-it { min-height: 52px; padding: 10px 16px; }
.mas-ic { color: var(--m-accion-txt); flex: none; }
.mas-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--m-avatar);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 800;
  flex: none;
}
.mas-it.m-sw { justify-content: flex-start; font-weight: 400; }
.mas-salir { color: var(--m-rojo) !important; }
.mas-salir .v-icon { color: var(--m-rojo); }
</style>
