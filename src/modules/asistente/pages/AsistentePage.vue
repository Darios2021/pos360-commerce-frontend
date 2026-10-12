<template>
  <!--
    ASISTENTE: preguntarle al negocio en castellano (ventas, caja, cierres, arqueos, márgenes, stock).
    Es la cara INTERNA del chatbot (productos/mostrador). La pantalla le habla a /api/v1/asistente
    con la sesión de siempre; la API firma el permiso delegado y reenvía. El navegador no ve claves.
    Lo que consulta cada rol lo recortan mostrador y la API: acá sólo se muestra lo que el servidor dice.
    Vista completa, sin cuadros flotantes: es una pantalla de trabajo.
  -->
  <div class="asis">
    <div class="asis-cabeza">
      <h1 class="asis-titulo">Asistente</h1>
      <div v-if="estado?.gasto" class="asis-uso" :title="`Uso del asistente en el mes`">
        <span class="asis-uso-pista"><span :class="['asis-uso-barra', claseUso]" :style="{ width: pct + '%' }" /></span>
        <span class="asis-uso-txt">Uso del mes: USD {{ usd(estado.gasto.usd) }} de {{ estado.gasto.tope_usd }} · {{ pct }} %</span>
      </div>
    </div>

    <v-alert v-if="aviso" type="info" variant="tonal" density="comfortable" class="mb-4">{{ aviso }}</v-alert>

    <template v-else>
      <div class="asis-puede">
        <span class="asis-puede-rot">Consulta</span>
        <v-chip v-for="p in (estado?.puede || [])" :key="p.nombre" size="small" variant="tonal" color="primary" label>{{ ETIQUETA[p.nombre] || p.nombre }}</v-chip>
        <span v-if="!estado" class="asis-gris">Cargando…</span>
      </div>

      <v-card class="asis-hilo" variant="flat">
        <div ref="log" class="asis-log" role="log" aria-live="polite" aria-label="Conversación con el asistente">
          <div v-if="!mensajes.length && estado" class="asis-sugeridas">
            <button v-for="s in sugeridas" :key="s.pregunta" type="button" class="asis-sug" @click="enviar(s.pregunta)">
              <small>{{ s.fuente }}</small><b>{{ s.pregunta }}</b>
            </button>
          </div>
          <div v-for="(m, i) in mensajes" :key="i" :class="['asis-m', m.autor === 'yo' ? 'asis-yo' : 'asis-bot', m.error ? 'asis-error' : '']">{{ m.texto }}</div>
          <div v-if="esperando" class="asis-esperando">Consultando…</div>
        </div>
        <form class="asis-entrada" @submit.prevent="enviar(texto)">
          <label for="asis-texto" class="d-sr-only">Pregunta</label>
          <v-textarea id="asis-texto" ref="campo" v-model="texto" rows="1" auto-grow max-rows="5" maxlength="2000" variant="outlined" density="comfortable" hide-details
            placeholder="Por ejemplo: ¿cuánto se vendió ayer?" @keydown.enter.exact.prevent="enviar(texto)" />
          <v-btn type="submit" color="primary" :disabled="esperando || !texto.trim()" :loading="esperando" size="large">Preguntar</v-btn>
        </form>
      </v-card>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import http from "@/app/api/http";

const ETIQUETA = {
  estado_caja: "Caja abierta", ventas: "Ventas", cajas: "Cajas y cierres", arqueo_de_caja: "Arqueos",
  mas_vendidos: "Más vendidos", margenes: "Márgenes", stock: "Stock",
};
// Una por herramienta permitida, impersonales (la pantalla no le habla en segunda persona).
const SUGERENCIA = {
  estado_caja: "¿Cómo viene la caja abierta?",
  ventas: "¿Cuánto se vendió hoy y con qué medios?",
  cajas: "¿Qué cierres de la semana tuvieron diferencia?",
  arqueo_de_caja: "¿Cómo dio el arqueo de la última caja cerrada?",
  mas_vendidos: "¿Qué fue lo más vendido en 30 días?",
  margenes: "¿Qué margen dejaron las ventas del mes?",
  stock: "¿Qué productos están bajo el mínimo?",
};

const estado = ref(null);
const aviso = ref("");
const mensajes = ref([]);
const texto = ref("");
const esperando = ref(false);
const conversacion = ref(undefined);
const log = ref(null);
const campo = ref(null);

const sugeridas = computed(() => (estado.value?.puede || [])
  .filter((p) => SUGERENCIA[p.nombre])
  .map((p) => ({ pregunta: SUGERENCIA[p.nombre], fuente: ETIQUETA[p.nombre] || p.nombre })));
const pct = computed(() => Math.min(100, Math.round((estado.value?.gasto?.porcentaje || 0) * 100)));
const claseUso = computed(() => (estado.value?.gasto?.agotado ? "es-tope" : estado.value?.gasto?.aviso ? "es-aviso" : ""));
const usd = (n) => Number(n || 0).toFixed(2).replace(".", ",");

async function bajar() {
  await nextTick();
  if (log.value) log.value.scrollTop = log.value.scrollHeight;
}

onMounted(async () => {
  try {
    const { data } = await http.get("asistente/estado");
    estado.value = data;
  } catch (e) {
    const s = e?.response?.status;
    aviso.value = s === 404 ? "El asistente no está habilitado para este comercio." : "El asistente no está disponible en este momento.";
  }
});

async function enviar(pregunta) {
  const t = String(pregunta || "").trim();
  if (!t || esperando.value) return;
  mensajes.value.push({ autor: "yo", texto: t });
  texto.value = "";
  esperando.value = true;
  bajar();
  try {
    const { data } = await http.post("asistente/mensaje", { texto: t, conversacion: conversacion.value }, { timeout: 120000 });
    if (data?.conversacion) conversacion.value = data.conversacion;
    mensajes.value.push({ autor: "asistente", texto: data?.texto || "Sin respuesta." });
  } catch (e) {
    const msg = e?.response?.data?.error || "No hubo respuesta del asistente. Se puede volver a preguntar.";
    mensajes.value.push({ autor: "asistente", texto: msg, error: true });
  } finally {
    esperando.value = false;
    bajar();
    campo.value?.focus?.();
  }
}
</script>

<style scoped>
.asis { display: flex; flex-direction: column; gap: 14px; max-width: 1080px; margin: 0 auto; padding: 16px; min-height: calc(100dvh - 120px); }
.asis-cabeza { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.asis-titulo { font-size: 22px; font-weight: 800; margin: 0; }
.asis-uso { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; opacity: .8; }
.asis-uso-pista { width: 110px; height: 8px; border-radius: 4px; background: rgba(var(--v-theme-on-surface), .1); overflow: hidden; }
.asis-uso-barra { display: block; height: 100%; background: rgb(var(--v-theme-primary)); }
.asis-uso-barra.es-aviso { background: rgb(var(--v-theme-warning)); }
.asis-uso-barra.es-tope { background: rgb(var(--v-theme-error)); }
.asis-uso-txt { font-variant-numeric: tabular-nums; }
.asis-puede { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.asis-puede-rot { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; opacity: .65; margin-right: 4px; }
.asis-gris { opacity: .6; font-size: 13px; }
.asis-hilo { flex: 1; display: flex; flex-direction: column; min-height: 460px; border: 1px solid rgba(var(--v-border-color), .16); border-radius: 14px; }
.asis-log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.asis-sugeridas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: auto; }
.asis-sug { text-align: left; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(var(--v-border-color), .2); background: rgb(var(--v-theme-surface)); cursor: pointer; display: grid; gap: 2px; }
.asis-sug:hover { border-color: rgb(var(--v-theme-primary)); }
.asis-sug:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.asis-sug small { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgb(var(--v-theme-primary)); }
.asis-sug b { font-size: 15px; font-weight: 700; }
.asis-m { max-width: min(760px, 86%); padding: 10px 14px; border-radius: 12px; font-size: 15px; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
.asis-yo { align-self: flex-end; background: rgba(var(--v-theme-primary), .12); font-weight: 600; border-bottom-right-radius: 4px; }
.asis-bot { align-self: flex-start; background: rgba(var(--v-theme-on-surface), .05); border-bottom-left-radius: 4px; }
.asis-error { background: rgba(var(--v-theme-error), .1); }
.asis-esperando { align-self: flex-start; font-size: 13px; opacity: .65; }
.asis-entrada { display: flex; gap: 10px; align-items: flex-end; padding: 12px; border-top: 1px solid rgba(var(--v-border-color), .16); }
@media (max-width: 600px) {
  .asis { padding: 10px; }
  .asis-sugeridas { grid-template-columns: 1fr; }
  .asis-m { max-width: 92%; }
}
</style>
