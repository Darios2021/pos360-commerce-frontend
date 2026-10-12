<!--
  AppBottomNav: barra inferior del teléfono (rediseño móvil aprobado, informe 2.1).

  Cinco destinos según el rol:
    dueño (admin, super_admin, owner): Inicio · Vender · Ventas · Productos · Más
    cajero (cajero, vendedor, sin rol): Vender · Ventas · Caja · Productos · Más

  El escáner dejó de ser un botón central: es el ícono de código de barras
  dentro del buscador de Vender, Productos y el campo "Código de barras". El
  badge de Más suma derivaciones por recibir y pedidos web sin preparar.
-->
<template>
  <nav class="bn" aria-label="Navegación principal">
    <button
      v-for="item in items"
      :key="item.name"
      type="button"
      class="bn__it"
      :class="{ on: isActive(item) }"
      :aria-current="isActive(item) ? 'page' : undefined"
      @click="go(item)"
    >
      <span class="bn__ic">
        <v-icon size="24">{{ item.icon }}</v-icon>
        <span v-if="item.badge > 0" class="bn__bd">{{ item.badge > 9 ? "9+" : item.badge }}</span>
      </span>
      <span class="bn__lab">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

const props = defineProps({
  /** Derivaciones por recibir. */
  transferUnreadCount: { type: Number, default: 0 },
  /** Pedidos web sin preparar. */
  pedidosPendientes: { type: Number, default: 0 },
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const INICIO = {
  name: "home",
  label: "Inicio",
  icon: "mdi-home-outline",
  to: { name: "home" },
};
const VENDER = {
  name: "pos",
  label: "Vender",
  icon: "mdi-cash-register",
  to: { name: "pos" },
  activeNames: ["pos", "posCarrito"],
};
const VENTAS = {
  name: "posSales",
  label: "Ventas",
  icon: "mdi-receipt-text-outline",
  to: { name: "posSales" },
  activeNames: ["posSales", "posSaleDetail"],
};
const CAJA = {
  name: "caja",
  label: "Caja",
  icon: "mdi-cash-multiple",
  to: { name: "caja" },
};
const PRODUCTOS = {
  name: "products",
  label: "Productos",
  icon: "mdi-package-variant-closed",
  to: { name: "products" },
  activeNames: ["products", "productNew", "productEdit", "productView", "productProfile"],
};

const masBadge = computed(() => Number(props.transferUnreadCount || 0) + Number(props.pedidosPendientes || 0));

const items = computed(() => {
  const mas = { name: "mas", label: "Más", icon: "mdi-menu", to: { name: "mas" }, badge: masBadge.value };
  return auth.isCajero
    ? [VENDER, VENTAS, CAJA, PRODUCTOS, mas]
    : [INICIO, VENDER, VENTAS, PRODUCTOS, mas];
});

function isActive(item) {
  if (Array.isArray(item.activeNames)) return item.activeNames.includes(route.name);
  return route.name === item.name;
}
function go(item) {
  if (route.name === item.name) return;
  router.push(item.to);
}
</script>

<style scoped>
.bn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1006;
  height: calc(64px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
  display: flex;
  background: var(--m-pieza);
  border-top: 1px solid var(--m-linea);
  font-family: Inter, system-ui, sans-serif;
}
.bn__it {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: 600 12px Inter, system-ui, sans-serif;
  color: var(--m-suave);
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.bn__it .v-icon { color: inherit; }
.bn__it.on { color: var(--m-accion-txt); }
.bn__it.on::before {
  content: "";
  position: absolute;
  top: 0;
  left: 22%;
  right: 22%;
  height: 3px;
  border-radius: 0 0 3px 3px;
  background: var(--m-accion-txt);
}
.bn__ic { position: relative; display: grid; place-items: center; }
.bn__bd {
  position: absolute;
  top: -6px;
  left: calc(50% + 6px);
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 9999px;
  background: var(--m-rojo);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
}
.bn__lab { white-space: nowrap; }
</style>
