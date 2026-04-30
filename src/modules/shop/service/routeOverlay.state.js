import { ref } from "vue";

// Estado global del overlay opaco usado durante navegación entre rutas del shop.
// Se activa desde el router (beforeEach cuando hay scroll para restaurar)
// y se desactiva cuando llega el evento "shop:scroll-restored" o por kill-switch.
export const routeOverlayActive = ref(false);

export function showRouteOverlay() {
  routeOverlayActive.value = true;
}

export function hideRouteOverlay() {
  routeOverlayActive.value = false;
}
