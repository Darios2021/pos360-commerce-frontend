<!--
  AppBottomNav: barra inferior del teléfono como cargador y consultor
  (maqueta diseno-cargador). La misma para el dueño y el cajero:
    Inicio · Productos · Escanear (botón central) · Derivaciones · Más
  Vender salió de la barra: está en Inicio y en Más, con su flujo de siempre.
  Badge de Derivaciones: por recibir en la sucursal del usuario. Badge de
  Más: pedidos web sin preparar.
-->
<template>
  <nav class="bn" aria-label="Navegación principal">
    <template v-for="item in items" :key="item.name">
      <button
        v-if="item.lector"
        type="button"
        class="bn__it bn__lector"
        aria-label="Escanear"
        @click="go(item)"
      >
        <span class="m-bola"><v-icon size="28">mdi-barcode-scan</v-icon></span>
        <span class="bn__lab">{{ item.label }}</span>
      </button>
      <button
        v-else
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
    </template>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  /** Derivaciones por recibir en la sucursal del usuario. */
  transferUnreadCount: { type: Number, default: 0 },
  /** Pedidos web sin preparar. */
  pedidosPendientes: { type: Number, default: 0 },
});

const route = useRoute();
const router = useRouter();

const items = computed(() => [
  { name: "home", label: "Inicio", icon: "mdi-home-outline", to: { name: "home" } },
  {
    name: "products",
    label: "Productos",
    icon: "mdi-package-variant-closed",
    to: { name: "products" },
    activeNames: ["products", "productNew", "productEdit", "productView", "productProfile", "productoConsulta"],
  },
  { name: "lector", label: "Escanear", lector: true, to: { name: "lector" } },
  {
    name: "transfers",
    label: "Derivaciones",
    icon: "mdi-swap-horizontal",
    to: { name: "transfers" },
    badge: Number(props.transferUnreadCount || 0),
  },
  { name: "mas", label: "Más", icon: "mdi-menu", to: { name: "mas" }, badge: Number(props.pedidosPendientes || 0) },
]);

function isActive(item) {
  if (Array.isArray(item.activeNames)) return item.activeNames.includes(route.name);
  return route.name === item.name;
}
function go(item) {
  if (route.name === item.name && !route.query?.estado && !route.query?.stock) return;
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
  /* --m-sab: barra de gestos (movil.css) */
  height: calc(64px + var(--m-sab, env(safe-area-inset-bottom, 0px)));
  padding-bottom: var(--m-sab, env(safe-area-inset-bottom, 0px));
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
.bn { overflow: visible; }
.bn__lector { color: var(--m-tinta); }
.bn__lector:active .m-bola { background: var(--m-accion-osc); }
</style>
