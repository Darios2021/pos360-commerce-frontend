<template>
  <v-row dense>
    <!-- Ventas por día -->
    <v-col cols="12" md="8">
      <v-card rounded="xl" elevation="1">
        <v-card-title class="font-weight-bold">
          Ventas por día
        </v-card-title>
        <v-card-text>
          <apexchart
            height="300"
            type="line"
            :options="salesOptions"
            :series="salesSeries"
          />
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Métodos de pago -->
    <v-col cols="12" md="4">
      <v-card rounded="xl" elevation="1">
        <v-card-title class="font-weight-bold">
          Métodos de pago
        </v-card-title>
        <v-card-text>
          <apexchart
            height="300"
            type="donut"
            :options="paymentOptions"
            :series="paymentSeries"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  salesByDay: { type: Array, default: () => [] }, // [{ date, total }]
  payments: { type: Object, default: () => ({}) }, // { CASH: 1000 }
});

// ================= Ventas =================
const salesSeries = computed(() => [
  { name: "Ventas", data: props.salesByDay.map(i => i.total) },
]);

const salesOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  stroke: { curve: "smooth", width: 3 },
  xaxis: { categories: props.salesByDay.map(i => i.date) },
  dataLabels: { enabled: false },
  colors: ["#1976D2"],
  tooltip: {
    y: {
      formatter: v =>
        new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(v),
    },
  },
}));

// ================= Pagos =================
const paymentSeries = computed(() => Object.values(props.payments));

const paymentOptions = computed(() => ({
  labels: Object.keys(props.payments).map(methodLabel),
  legend: { position: "bottom" },
  colors: ["#2E7D32", "#1565C0", "#6A1B9A", "#EF6C00"],
}));

function methodLabel(m) {
  if (m === "CASH") return "Efectivo";
  if (m === "CARD") return "Tarjeta";
  if (m === "TRANSFER") return "Transferencia";
  if (m === "QR") return "QR";
  return m;
}
</script>
