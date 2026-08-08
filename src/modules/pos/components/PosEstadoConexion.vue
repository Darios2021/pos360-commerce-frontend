<template>
  <v-expand-transition>
    <div v-if="!conexion.enLinea" class="pec" role="alert" aria-live="assertive">
      <v-icon size="20" class="pec__icono">mdi-wifi-off</v-icon>

      <div class="pec__texto">
        <strong class="pec__titulo">Sin conexión con el servidor</strong>
        <span class="pec__detalle">
          No vas a poder cobrar hasta que vuelva{{ hace ? ` · se cortó hace ${hace}` : "" }}.
          Si estabas cobrando, fijate en Ventas antes de repetir el cobro.
        </span>
      </div>

      <v-btn
        class="pec__boton"
        size="small"
        variant="flat"
        :loading="probando"
        @click="probar"
      >
        Reintentar
      </v-btn>
    </div>
  </v-expand-transition>
</template>

<script setup>
// Aviso de conexion caida. La regla es que el cajero se entere ANTES de armar
// un carrito entero, no cuando aprieta cobrar.
//
// El texto dice explicitamente que mire Ventas antes de repetir el cobro: si la
// conexion se corto justo despues de mandar la venta, esa venta puede haber
// entrado igual. Repetir a ciegas es como se duplican los cobros.

import { computed, onBeforeUnmount, ref } from "vue";
import http from "@/app/api/http";
import { conexion } from "@/app/store/conexion.state";

const probando = ref(false);
const ahora = ref(Date.now());

const reloj = setInterval(() => (ahora.value = Date.now()), 1000);
onBeforeUnmount(() => clearInterval(reloj));

const hace = computed(() => {
  if (!conexion.desde) return "";
  const seg = Math.max(0, Math.floor((ahora.value - conexion.desde) / 1000));
  if (seg < 60) return `${seg} s`;
  const min = Math.floor(seg / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
});

async function probar() {
  probando.value = true;
  try {
    // Cualquier llamada real sirve: el interceptor marca en linea sola si
    // vuelve con respuesta.
    await http.get("/health", { timeout: 8000 });
  } catch {
    /* el interceptor ya lo registro */
  } finally {
    probando.value = false;
  }
}
</script>

<style scoped>
.pec {
  display: flex;
  align-items: center;
  gap: 12px;

  margin-bottom: 10px;
  padding: 10px 14px;

  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-error), 0.35);
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.pec__icono {
  color: rgb(var(--v-theme-error));
  flex: 0 0 auto;
}

.pec__texto {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1 1 auto;
}

.pec__titulo {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  color: rgb(var(--v-theme-error));
}

.pec__detalle {
  font-size: 12px;
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.pec__boton {
  flex: 0 0 auto;
  background: rgba(var(--v-theme-error), 0.14) !important;
  color: rgb(var(--v-theme-error)) !important;
}

@media (max-width: 760px) {
  .pec {
    align-items: flex-start;
  }

  .pec__detalle {
    font-size: 11.5px;
  }
}
</style>
