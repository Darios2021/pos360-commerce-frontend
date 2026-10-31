<!--
  Asistente POS 360: avisos del tablero de escritorio (pedido del usuario, 2026-10-31).
  Revisa el negocio con reglas sobre datos reales del sistema y muestra solo lo que pide
  atención, ordenado por importancia. Se recalcula cada 5 minutos y al cambiar de sucursal.
  Cada aviso lleva al listado que lo explica y ofrece preguntarle al asistente (abre el chat
  con la pregunta hecha). No usa la IA para armar los avisos: no tiene costo por mirar.
    · cierres de caja con faltante en los últimos 7 días
    · cajas abiertas hace más de 12 horas
    · pedidos web sin preparar hace más de 2 horas
    · equipos reparados sin retirar (más de 15 días) y presupuestos sin respuesta
    · derivaciones por recibir
    · productos sin stock
    · ventas de hoy muy por debajo de ayer a la misma hora
-->
<template>
  <section class="tb-bloque aa">
    <div class="tb-bloque__tit">
      <span class="tb-h">Asistente POS 360</span>
      <span class="tb-nota">avisos de hoy · {{ actualizado ? `revisado a las ${actualizado}` : "revisando…" }}</span>
    </div>
    <div class="tb-caja">
      <div class="tb-banda">
        <span>Para mirar</span>
        <span class="num">{{ cargando && !avisos.length ? "…" : avisos.length === 0 ? "nada pendiente" : avisos.length === 1 ? "1 aviso" : `${avisos.length} avisos` }}</span>
      </div>
      <div class="aa-lista">
        <div v-if="!cargando && !avisos.length" class="aa-ok">
          <v-icon size="22">mdi-check-circle-outline</v-icon>
          <span>Todo en orden: sin faltantes de caja, pedidos demorados ni equipos esperando.</span>
        </div>
        <div v-for="a in avisos" :key="a.k" class="aa-it" :class="{ 'aa-it--alerta': a.alerta }">
          <span class="aa-ic"><v-icon size="20">{{ a.icon }}</v-icon></span>
          <router-link :to="a.to" class="aa-tx">
            <b>{{ a.titulo }}</b>
            <small>{{ a.sub }}</small>
          </router-link>
          <router-link v-if="a.pregunta && hayAsistente" :to="{ name: 'asistente', query: { q: a.pregunta } }" class="aa-preg">
            <v-icon size="16">mdi-creation</v-icon>Preguntar
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";
import { useTransferNotifications } from "@/modules/dashboard/composables/useTransferNotifications";
import { adminListCashRegisters } from "@/modules/pos/services/posCashRegisters.service";

const props = defineProps({
  selectedBranch: { type: [Number, null], default: null },
  stock: { type: Object, default: () => ({}) },
});

const auth = useAuthStore();
const router = useRouter();
const { pendingForMe } = useTransferNotifications();

const pesos = (v) => `$ ${Math.abs(Math.round(Number(v || 0))).toLocaleString("es-AR")}`;
const dd = (x) => String(x).padStart(2, "0");
function cuando(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = new Date(d); dia.setHours(0, 0, 0, 0);
  const dif = Math.round((hoy - dia) / 86400000);
  const hh = `${dd(d.getHours())}:${dd(d.getMinutes())}`;
  return dif === 0 ? `hoy ${hh}` : dif === 1 ? `ayer ${hh}` : `${dd(d.getDate())}/${dd(d.getMonth() + 1)}`;
}
const isoDia = (d) => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
const ruta = (name, extra = {}) => (router.hasRoute(name) ? { name, ...extra } : { name: "home" });

// ── Datos ──
const cargando = ref(true);
const actualizado = ref("");
const hayAsistente = ref(false);
const datos = ref({ cerradas: [], abiertas: [], pedidos: [], taller: null, hoy: null, ayer: null });

async function revisar() {
  cargando.value = true;
  const suc = props.selectedBranch ? { branch_id: props.selectedBranch } : {};
  const ahora = new Date();
  const hace7 = new Date(ahora.getTime() - 7 * 86400000);
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  const iniAyer = new Date(ini.getTime() - 86400000);
  const pedir = (p) => p.then((r) => r).catch(() => null);
  const [cer, abi, ped, tal, hoy, ayer] = await Promise.all([
    pedir(adminListCashRegisters({ shortage_only: true, ...suc, date_from: isoDia(hace7), date_to: isoDia(ahora), page: 1, limit: 50 })),
    pedir(adminListCashRegisters({ status: "OPEN", ...suc, page: 1, limit: 20 })),
    auth.isAdmin ? pedir(http.get("/admin/shop/orders", { params: { page: 1, limit: 20, status: "created", ...suc } })) : null,
    pedir(http.get("/admin/service/orders/stats")),
    pedir(http.get("/pos/sales/stats", { params: { ...suc, status: "PAID", from: ini.toISOString(), to: ahora.toISOString() } })),
    pedir(http.get("/pos/sales/stats", { params: { ...suc, status: "PAID", from: iniAyer.toISOString(), to: new Date(ahora.getTime() - 86400000).toISOString() } })),
  ]);
  const lista = (r) => (Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : []);
  const suma = (r) => { const d = r?.data?.data || {}; const v = Number(d.total_sum ?? d.gross_total_sum); return Number.isFinite(v) ? v : null; };
  datos.value = {
    cerradas: lista(cer),
    abiertas: lista(abi),
    pedidos: lista(ped),
    taller: tal?.data?.data || null,
    hoy: suma(hoy),
    ayer: suma(ayer),
  };
  actualizado.value = `${dd(ahora.getHours())}:${dd(ahora.getMinutes())}`;
  cargando.value = false;
}

// ── Reglas ── (orden: lo que es plata y lo que espera un cliente, primero)
const avisos = computed(() => {
  const out = [];
  const d = datos.value;
  const ahora = Date.now();

  const faltantes = d.cerradas.filter((c) => c.status !== "OPEN" && Number(c.difference_cash) < 0);
  if (faltantes.length) {
    const peor = [...faltantes].sort((a, b) => Number(a.difference_cash) - Number(b.difference_cash))[0];
    out.push({
      k: "faltante", alerta: true, icon: "mdi-cash-remove",
      titulo: faltantes.length === 1
        ? `La caja #${peor.id} cerró con un faltante de ${pesos(peor.difference_cash)}`
        : `${faltantes.length} cierres con faltante esta semana`,
      sub: faltantes.length === 1
        ? [peor.branch_name, peor.opened_by_name, cuando(peor.closed_at)].filter(Boolean).join(" · ")
        : `El mayor: caja #${peor.id}, ${pesos(peor.difference_cash)}${peor.branch_name ? " en " + peor.branch_name : ""}`,
      to: faltantes.length === 1 ? ruta("adminCashRegisterDetail", { params: { id: peor.id } }) : ruta("adminCashRegisters"),
      pregunta: "¿Qué cierres de la semana tuvieron diferencia?",
    });
  }

  const largas = d.abiertas.filter((c) => c.opened_at && ahora - new Date(c.opened_at).getTime() > 12 * 3600000);
  for (const c of largas.slice(0, 2)) {
    out.push({
      k: "abierta" + c.id, icon: "mdi-clock-alert-outline",
      titulo: `La caja #${c.id} está abierta desde ${cuando(c.opened_at)}`,
      sub: [c.branch_name, c.opened_by_name, "más de 12 horas sin cerrar"].filter(Boolean).join(" · "),
      to: ruta("adminCashRegisterDetail", { params: { id: c.id } }),
      pregunta: "¿Cómo viene la caja abierta?",
    });
  }

  const demorados = d.pedidos.filter((o) => o.created_at && ahora - new Date(o.created_at).getTime() > 2 * 3600000);
  if (demorados.length) {
    const viejo = demorados[demorados.length - 1];
    out.push({
      k: "pedidos", icon: "mdi-storefront-outline",
      titulo: demorados.length === 1 ? `Un pedido web espera hace más de 2 horas` : `${demorados.length} pedidos web esperan hace más de 2 horas`,
      sub: `El más viejo: #${viejo.public_code || viejo.id}${String(viejo.customer_name || "").trim() ? " de " + String(viejo.customer_name).trim() : ""}, ${cuando(viejo.created_at)}`,
      to: ruta("shopOrders", { query: { status: "created" } }),
    });
  }

  const g = d.taller?.grupos || {};
  if (Number(g.sin_retirar) > 0) {
    out.push({
      k: "sinretirar", icon: "mdi-wrench-outline",
      titulo: `${g.sin_retirar === 1 ? "Un equipo reparado" : `${g.sin_retirar} equipos reparados`} sin retirar hace más de 15 días`,
      sub: "Conviene volver a avisar al cliente por WhatsApp",
      to: ruta("serviceOrders"),
    });
  }
  if (Number(g.aprobacion) > 0) {
    out.push({
      k: "presup", icon: "mdi-file-document-outline",
      titulo: `${g.aprobacion === 1 ? "Un presupuesto espera" : `${g.aprobacion} presupuestos esperan`} la respuesta del cliente`,
      sub: "Servicio técnico",
      to: ruta("serviceOrders"),
    });
  }

  const der = (pendingForMe.value || []).length;
  if (der > 0) {
    out.push({
      k: "deriv", icon: "mdi-truck-fast-outline",
      titulo: der === 1 ? "Una derivación por recibir" : `${der} derivaciones por recibir`,
      sub: "Mercadería despachada desde otra sucursal",
      to: ruta("transfers", { query: { estado: "dispatched" } }),
    });
  }

  const sin = Number(props.stock?.outOfStockCount || 0);
  if (sin > 0) {
    out.push({
      k: "stock", icon: "mdi-package-variant-closed",
      titulo: sin === 1 ? "Un producto sin stock" : `${sin.toLocaleString("es-AR")} productos sin stock`,
      sub: "Revisá cuáles se venden y conviene reponer",
      to: ruta("products", { query: { stock: "without" } }),
      pregunta: "¿Qué productos están sin stock?",
    });
  }

  // Solo si ayer a esta hora hubo movimiento y hoy va muy por debajo.
  if (d.hoy != null && d.ayer != null && d.ayer > 0 && new Date().getHours() >= 11) {
    const pct = Math.round(((d.hoy - d.ayer) / d.ayer) * 100);
    if (pct <= -40) {
      out.push({
        k: "ventas", icon: "mdi-trending-down",
        titulo: `Hoy se vendió un ${Math.abs(pct)} % menos que ayer a esta hora`,
        sub: `${pesos(d.hoy)} contra ${pesos(d.ayer)}`,
        to: ruta("posSales"),
        pregunta: "¿Cuánto se vendió hoy y con qué medios?",
      });
    }
  }
  return out;
});

let reloj = null;
onMounted(async () => {
  revisar();
  reloj = setInterval(revisar, 5 * 60 * 1000);
  try {
    const { data } = await http.get("asistente/estado");
    hayAsistente.value = (data?.puede || []).length > 0;
  } catch { hayAsistente.value = false; }
});
onBeforeUnmount(() => clearInterval(reloj));
watch(() => props.selectedBranch, revisar);
</script>

<style>
.aa-lista { display: flex; flex-direction: column; }
.aa-it { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 16px; border-top: 1px solid var(--tb-linea); }
.aa-it:first-child { border-top: 0; }
.aa-ic { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--tb-pista); }
.aa-ic .v-icon { color: var(--tb-acento); }
.aa-it--alerta .aa-ic { background: rgba(196, 69, 63, 0.12); }
.aa-it--alerta .aa-ic .v-icon { color: var(--tb-rojo); }
.aa-tx { min-width: 0; color: var(--tb-texto); text-decoration: none; }
.aa-tx:hover b { color: var(--tb-acento); }
.aa-tx b { display: block; font-size: 15px; font-weight: 700; line-height: 1.3; }
.aa-tx small { display: block; margin-top: 2px; font-size: 13px; color: var(--tb-suave); }
.aa-preg { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--tb-acento); text-decoration: none; white-space: nowrap; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--tb-borde); }
.aa-preg:hover { background: var(--tb-pista); }
.aa-ok { display: flex; align-items: center; gap: 10px; padding: 16px; font-size: 14px; color: var(--tb-suave); }
.aa-ok .v-icon { color: var(--tb-acento); }
</style>
