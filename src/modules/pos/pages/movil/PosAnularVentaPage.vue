<!--
  Anular venta en el teléfono (maqueta pantalla 10). Resumen, motivo,
  observación y el botón rojo. Mismo pedido que el escritorio
  (DELETE /pos/sales/:id: anula, restaura el stock, no cuenta en el arqueo).
  El motivo y la observación viajan en el cuerpo; la API los guarda en
  sales.cancel_reason y sales.cancel_note (y en la nota de la venta).
-->
<template>
  <MovilVista :titulo="`Anular venta #${id}`" :volver="{ name: 'posSaleDetail', params: { id } }">
    <div v-if="cargando" class="m-vacio">Cargando…</div>
    <template v-else-if="venta">
      <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
        <dt>Total</dt><dd class="f num">{{ pesos(venta.total) }}</dd>
        <dt>Medio de pago</dt><dd>{{ medio }}</dd>
        <dt>Comprobante</dt><dd>{{ comprobante }}</dd>
        <dt>Stock que vuelve</dt><dd>{{ articulos === 1 ? "1 artículo" : `${articulos} artículos` }}</dd>
      </dl></div></div>

      <div class="m-rot">Motivo</div>
      <div class="m-ops">
        <button v-for="m in MOTIVOS" :key="m" type="button" class="m-op" :class="{ on: motivo === m }" @click="motivo = m">
          <span class="tx"><b>{{ m }}</b></span><span class="rd"></span>
        </button>
      </div>
      <div class="m-cmp">
        <label for="av-obs">Observación</label>
        <textarea id="av-obs" v-model="obs" class="m-inp" maxlength="240"></textarea>
      </div>
      <div v-if="error" class="m-error">{{ error }}</div>
    </template>
    <div v-else class="m-error">{{ error || "Venta no encontrada" }}</div>

    <template #pie>
      <button type="button" class="m-btn rojo" :disabled="!venta || anulando || !motivo || venta.status === 'CANCELLED'" @click="anular">
        <v-progress-circular v-if="anulando" indeterminate size="22" width="3" />
        <template v-else>Anular venta #{{ id }}</template>
      </button>
    </template>
  </MovilVista>
  <MovilAviso />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { useSnackbar } from "../../composables/useSnackbar";
import { pesos } from "../../utils/cobroReglas";

const MOTIVOS = ["Error de carga", "Devolución del cliente", "Cobro duplicado", "Otro"];
const ETIQUETA_MEDIO = { CASH: "Efectivo", CARD: "Tarjeta", TRANSFER: "Transferencia", MERCADOPAGO: "Mercado Pago", QR: "Mercado Pago", CREDIT_SJT: "Crédito SJT", OTHER: "Otro" };

const route = useRoute();
const router = useRouter();
const { toast } = useSnackbar();
const id = computed(() => String(route.params.id || ""));

const cargando = ref(true);
const venta = ref(null);
const motivo = ref("");
const obs = ref("");
const anulando = ref(false);
const error = ref("");

const medio = computed(() => {
  const pays = Array.isArray(venta.value?.payments) ? venta.value.payments : [];
  const nombres = [...new Set(pays.map((p) => p.payment_method_name || p.label || ETIQUETA_MEDIO[String(p.method || "").toUpperCase()] || "Otro"))];
  return nombres.join(" + ") || "Sin dato";
});
const comprobante = computed(() => {
  const v = venta.value || {};
  if (String(v.invoice_mode || "").toUpperCase() !== "FISCAL") return "No fiscal";
  const tipo = String(v.invoice_type || "").toUpperCase();
  return [tipo ? `Factura ${tipo}` : "Factura", v.invoice_number || v.cbte_numero || ""].filter(Boolean).join(" ");
});
const articulos = computed(() =>
  (Array.isArray(venta.value?.items) ? venta.value.items : []).reduce((a, it) => a + Number(it.quantity || it.qty || 0), 0)
);

async function anular() {
  if (anulando.value || !motivo.value) return;
  anulando.value = true;
  error.value = "";
  try {
    const { data } = await http.delete(`/pos/sales/${id.value}`, {
      data: { reason: motivo.value, note: obs.value.trim() || null },
    });
    if (!data?.ok) throw new Error(data?.message || "La venta no se anuló");
    toast(`Venta #${id.value} anulada`);
    window.dispatchEvent(new CustomEvent("pos:caja-cambio"));
    router.replace({ name: "posSaleDetail", params: { id: id.value } });
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "La venta no se anuló";
  } finally {
    anulando.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    venta.value = data?.data?.sale || null;
    if (venta.value?.status === "CANCELLED") error.value = "La venta ya está anulada";
  } catch (e) {
    error.value = e?.response?.data?.message || "Venta no encontrada";
  } finally {
    cargando.value = false;
  }
});
</script>
