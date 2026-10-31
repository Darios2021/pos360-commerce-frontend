// src/app/composables/useEsTecnico.js
// ¿El usuario está marcado como técnico de Servicio técnico? La marca vive en
// service_technicians (no viene en la sesión), así que se pregunta una vez por
// sesión a GET /admin/service/technicians y se guarda en sessionStorage.
// `soloTecnico`: técnico sin rol de admin; para él el teléfono muestra Órdenes
// en lugar de Ventas y su Inicio son sus órdenes.
import { computed, ref } from "vue";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";

const esTecnico = ref(false);
let pedido = null;
let pedidoUid = null; // si cambia el usuario sin recargar, se vuelve a preguntar

export function useEsTecnico() {
  const auth = useAuthStore();
  const uid = Number(auth.user?.id || 0);
  const clave = "pos360:tecnico:" + uid;

  if (!pedido || pedidoUid !== uid) {
    pedidoUid = uid;
    esTecnico.value = false;
    let cache = null;
    try { cache = sessionStorage.getItem(clave); } catch { /* sin storage */ }
    if (cache != null) {
      esTecnico.value = cache === "1";
      pedido = Promise.resolve();
    } else {
      pedido = http
        .get("admin/service/technicians")
        .then(({ data }) => {
          const lista = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
          esTecnico.value = lista.some((t) => Number(t.id) === uid);
        })
        .catch(() => { esTecnico.value = false; })
        .finally(() => {
          try { sessionStorage.setItem(clave, esTecnico.value ? "1" : "0"); } catch { /* sin storage */ }
        });
    }
  }

  const soloTecnico = computed(() => esTecnico.value && auth.isAdmin !== true);
  return { esTecnico, soloTecnico, listo: pedido };
}
