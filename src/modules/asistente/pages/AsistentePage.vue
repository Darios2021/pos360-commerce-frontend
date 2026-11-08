<template>
  <!--
    ASISTENTE POS 360 (2026-10-31): la forma del asistente de Alade, que tomó el modelo de
    Gemini y Claude, con la marca de POS 360 (azules del kit, no los colores de Gemini).
      · barra propia: ☰ conversaciones, el título de la conversación y "Nueva conversación"
      · inicio con la estrella, "Hola, X" en degradado y las preguntas frecuentes
        (tarjetas en escritorio, chips sobre el campo en el teléfono)
      · respuesta sin globo, con la estrella que gira mientras consulta, los pasos y los
        BLOQUES de siempre (cifras, filas, columnas, dona, tabla); debajo Copiar y Volver a preguntar
      · campo redondeado con el micrófono que pasa a enviar
      · panel de conversaciones guardadas por día, con buscador, cambiar nombre y borrar
    La pregunta va a /api/v1/asistente/mensaje (stream de bloques); el historial, a
    /api/v1/asistente/conversaciones, que reenvía a mostrador con el permiso delegado.
  -->
  <div class="ap asis" :class="{ 'ap--movil': movil, 'ap--ventana': ventana, 'ap--cerrada': ventana && !lateral, 'ap--vacio': ventana && !turnos.length && !aviso }">
    <svg width="0" height="0" class="ap-defs" aria-hidden="true">
      <defs>
        <linearGradient id="ap-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a466e" />
          <stop offset="50%" stop-color="#1488d1" />
          <stop offset="100%" stop-color="#6fc0f2" />
        </linearGradient>
      </defs>
    </svg>

    <!-- ── Barra ── -->
    <div class="ap-barra">
      <button v-if="!aviso && !ventana" type="button" class="ap-ib" aria-label="Conversaciones" @click="abrirHistorial">
        <v-icon size="24">mdi-menu</v-icon>
      </button>
      <div class="ap-tit">
        <b>{{ tituloActual }}</b>
      </div>
      <button v-if="!aviso" type="button" class="ap-ib" :aria-pressed="silencio"
        :aria-label="silencio ? 'Activar el sonido del asistente' : 'Silenciar el asistente'" @click="alternarSilencio">
        <v-icon size="22">{{ silencio ? "mdi-volume-off" : "mdi-volume-high" }}</v-icon>
      </button>
      <div v-if="gasto && !movil" class="ap-uso" aria-label="Uso del asistente en el mes">
        <span class="num"><b>USD {{ usd(gasto.usd) }}</b> de {{ gasto.tope_usd }}</span>
        <i><s :style="{ width: Math.min(100, Math.round(fraccion * 100)) + '%', background: colorUso }" /></i>
      </div>
      <button v-if="movil && !aviso" type="button" class="ap-ib" aria-label="Nueva conversación" :disabled="esperando || !turnos.length" @click="nueva">
        <v-icon size="22">mdi-square-edit-outline</v-icon>
      </button>
      <button v-else-if="!aviso && !ventana && turnos.length" type="button" class="ap-nueva" :disabled="esperando" @click="nueva">
        <v-icon size="20">mdi-square-edit-outline</v-icon>Nueva conversación
      </button>
    </div>

    <!-- ── Conversación ── -->
    <section ref="hilo" class="ap-conv" role="log" aria-live="polite" aria-label="Conversación con el asistente" @scroll="alDesplazar">
      <div class="ap-col">
        <div v-if="aviso" class="ap-aviso"><v-icon size="24">mdi-information-outline</v-icon><span>{{ aviso }}</span></div>

        <div v-else-if="!turnos.length" class="ap-inicio">
          <span class="ap-estrella ap-estrella--grande ap-estrella--fin"><svg viewBox="0 0 24 24"><path :d="ESTRELLA" fill="url(#ap-grad)" /></svg></span>
          <h1 class="ap-saludo"><span class="ap-grad">{{ saludo }}</span></h1>
          <p v-if="!ventana" class="ap-sub">¿Qué querés saber del negocio?</p>
          <div v-if="!movil && !ventana && estado" class="ap-tarjetas">
            <button v-for="(s, i) in sugeridas" :key="s.pregunta" type="button" class="ap-sug" :disabled="pausa"
              :style="{ animationDelay: `${120 + i * 60}ms` }" @click="enviar(s.pregunta)">
              <span class="ap-sug-txt">{{ s.pregunta }}</span>
              <span class="ap-sug-ico"><v-icon size="20">{{ iconoDe(s.fuentes) }}</v-icon></span>
            </button>
          </div>
        </div>

        <div v-for="t in turnos" :key="t.id" class="ap-turno">
          <div class="ap-yo">{{ t.pregunta }}</div>
          <div class="ap-resp">
            <span class="ap-estrella" :class="{ 'ap-estrella--pensando': t.estado === 'consultando' || t.estado === 'llegando', 'ap-estrella--fin': t.vivo && t.estado === 'listo' }">
              <svg viewBox="0 0 24 24"><path :d="ESTRELLA" fill="url(#ap-grad)" /></svg>
            </span>
            <div class="ap-cuerpo">
              <div v-if="t.estado === 'consultando' || t.estado === 'llegando'" class="ap-pasos">
                <div v-if="!t.pasos.length && t.estado === 'consultando'" class="ap-espera">
                  <span>Consultando…</span><i class="ap-brillo" /><i class="ap-brillo ap-brillo--corto" />
                </div>
                <div v-for="(p, i) in t.pasos" :key="i" class="ap-paso" :class="{ hecho: p.hecho }">
                  <v-icon size="16">{{ p.hecho ? "mdi-check" : "mdi-database-search-outline" }}</v-icon>{{ textoPaso(p) }}
                </div>
              </div>

              <AsisPieza v-if="(t.estado === 'llegando' || t.estado === 'listo') && t.bloques.length"
                :bloques="t.bloques" :redactando="t.estado === 'llegando'" :consultado="t.consultado" :hora="t.hora" :vivo="t.vivo" />

              <AsisAviso v-if="t.estado === 'tope' && t.bloques[0]" nivel="atencion" :texto="t.bloques[0].texto" />

              <template v-if="t.estado === 'error'">
                <div class="ap-error">{{ t.textoError || TEXTO_ERROR }}</div>
                <button v-if="t.id === turnos[turnos.length - 1].id && !t.guardado" type="button" class="ap-reint" :disabled="esperando" @click="reintentar(t)">Reintentar</button>
              </template>

              <div v-if="t.estado === 'listo'" class="ap-acc">
                <button type="button" :aria-label="t.copiado ? 'Copiado' : 'Copiar la respuesta'" @click="copiar(t)">
                  <v-icon size="20">{{ t.copiado ? "mdi-check" : "mdi-content-copy" }}</v-icon>
                </button>
                <button type="button" aria-label="Volver a preguntar" :disabled="esperando || pausa" @click="enviar(t.pregunta)">
                  <v-icon size="20">mdi-refresh</v-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Campo ── -->
    <div v-if="!aviso" class="ap-pie">
      <!-- Las preguntas frecuentes en chips: sobre el campo en el teléfono, debajo en la ventana (como Gemini). -->
      <div v-if="(movil || ventana) && !turnos.length && estado" class="ap-chips">
        <button v-for="s in sugeridas" :key="s.pregunta" type="button" class="ap-chip" :disabled="pausa" @click="enviar(s.pregunta)">
          <v-icon size="18">{{ iconoDe(s.fuentes) }}</v-icon>{{ s.pregunta }}
        </button>
      </div>
      <div v-if="pausa" class="ap-pausa">Consultas en pausa hasta el {{ renueva }}</div>
      <form v-else class="ap-entrada" :class="{ 'ap-entrada--activa': foco }" @submit.prevent="enviar(texto)">
        <label for="asistente-texto" class="d-sr-only">Pregunta</label>
        <textarea id="asistente-texto" ref="entrada" v-model="texto" class="ap-campo" rows="1" maxlength="2000" autocomplete="off"
          :placeholder="movil ? 'Preguntale al asistente' : 'Preguntá sobre ventas, caja, cierres o stock'"
          @input="crecer" @focus="foco = true" @blur="foco = false" @keydown.enter.exact="alEnter" />
        <div class="ap-acc-campo">
          <button v-if="voz.soportado && !texto.trim() && !esperando" type="button" class="ap-enviar"
            :aria-label="voz.escuchando.value ? 'Dejar de escuchar' : 'Dictar la pregunta'" @click="voz.alternar">
            <v-icon size="22">{{ voz.escuchando.value ? "mdi-stop" : "mdi-microphone" }}</v-icon>
          </button>
          <button v-if="texto.trim() || esperando" type="submit" class="ap-enviar ap-enviar--go" :disabled="esperando || !texto.trim()" aria-label="Enviar">
            <v-icon size="22">mdi-send</v-icon>
          </button>
        </div>
      </form>
      <p v-if="!movil" class="ap-nota">El asistente solo consulta datos del sistema y puede equivocarse.</p>
    </div>

    <!-- ── Conversaciones guardadas ── -->
    <transition name="ap-fondo"><div v-if="hist.abierto && !ventana" class="ap-dr-fondo" @click="cerrarHistorial" /></transition>
    <transition name="ap-dr">
      <aside v-if="hist.abierto && !ventana" class="ap-dr" aria-label="Conversaciones">
        <div class="ap-dr-top">
          <h2>Conversaciones</h2>
          <button type="button" class="ap-ib" aria-label="Cerrar" @click="cerrarHistorial"><v-icon size="24">mdi-close</v-icon></button>
        </div>
        <label class="ap-dr-bus">
          <v-icon size="20">mdi-magnify</v-icon>
          <input v-model="hist.buscar" type="search" placeholder="Buscar en conversaciones" aria-label="Buscar en conversaciones" autocomplete="off" />
        </label>
        <button type="button" class="ap-dr-nueva" @click="nueva(); cerrarHistorial()">
          <v-icon size="20">mdi-square-edit-outline</v-icon>Nueva conversación
        </button>
        <div class="ap-dr-lista">
          <p v-if="hist.cargando && !hist.items.length" class="ap-dr-nota">Cargando…</p>
          <p v-else-if="hist.error" class="ap-dr-nota">{{ hist.error }}</p>
          <p v-else-if="!hist.items.length" class="ap-dr-nota">{{ hist.buscar.trim() ? "No hay conversaciones con eso." : "Todavía no hay conversaciones." }}</p>
          <template v-for="g in gruposHist" :key="g.titulo">
            <div class="ap-dr-g">{{ g.titulo }}</div>
            <template v-for="c in g.items" :key="c.id">
              <form v-if="hist.renombrando === c.id" class="ap-dr-ren" @submit.prevent="guardarNombre(c)">
                <input v-model="hist.nombre" maxlength="120" aria-label="Nombre de la conversación" />
                <button type="submit">Guardar</button>
              </form>
              <div v-else-if="hist.borrando === c.id" class="ap-dr-borrar">
                <span>¿Borrar esta conversación?</span>
                <button type="button" class="rojo" @click="borrarConversacion(c)">Borrar</button>
                <button type="button" @click="hist.borrando = null">Cancelar</button>
              </div>
              <div v-else class="ap-dr-fila" :class="{ on: c.id === conversacion }">
                <button type="button" class="ap-dr-i" @click="abrirConversacion(c)">{{ c.titulo }}</button>
                <button type="button" class="ap-dr-mas" :aria-label="`Cambiar el nombre de ${c.titulo}`" @click="renombrar(c)"><v-icon size="18">mdi-pencil-outline</v-icon></button>
                <button type="button" class="ap-dr-mas" :aria-label="`Borrar ${c.titulo}`" @click="hist.borrando = c.id"><v-icon size="18">mdi-delete-outline</v-icon></button>
              </div>
            </template>
          </template>
        </div>
        <p class="ap-dr-pie">Se guardan {{ hist.dias || 90 }} días. Las ves desde cualquier teléfono o computadora con tu usuario.</p>
      </aside>
    </transition>

    <!-- ── Ventana de escritorio: la barra lateral de Gemini, como Alade /ia ──
         Arriba el nombre, Buscar y Cerrar; Nueva conversación; la lista; abajo,
         volver al sistema. Cerrada queda la franja de íconos (se recuerda). -->
    <aside v-if="ventana" class="gm" :class="{ 'gm--cerrada': !lateral }" aria-label="Conversaciones">
      <div class="gm-top">
        <template v-if="lateral">
          <button type="button" class="gm-marca" @click="nueva">Asistente POS 360</button>
          <button type="button" class="ap-ib" aria-label="Buscar conversaciones" @click="alternarBuscar"><v-icon size="22">mdi-magnify</v-icon></button>
          <button type="button" class="ap-ib" aria-label="Cerrar barra lateral" @click="alternarLateral"><v-icon size="22">mdi-dock-left</v-icon></button>
        </template>
        <button v-else type="button" class="ap-ib" aria-label="Abrir barra lateral" @click="alternarLateral"><v-icon size="24">mdi-menu</v-icon></button>
      </div>
      <label v-if="lateral && buscarAbierto" class="gm-bus">
        <v-icon size="20">mdi-magnify</v-icon>
        <input ref="campoBuscar" v-model="hist.buscar" type="search" placeholder="Buscar conversaciones" aria-label="Buscar conversaciones" autocomplete="off" />
      </label>
      <button type="button" class="gm-fila gm-nav" :class="{ on: !conversacion && !turnos.length }" :aria-label="lateral ? undefined : 'Nueva conversación'" :disabled="esperando" @click="nueva">
        <v-icon size="22">mdi-square-edit-outline</v-icon><span v-if="lateral">Nueva conversación</span>
      </button>
      <div v-if="lateral" class="gm-lista">
        <div class="gm-sec">Conversaciones</div>
        <p v-if="hist.cargando && !hist.items.length" class="gm-nota">Cargando…</p>
        <p v-else-if="hist.error" class="gm-nota">{{ hist.error }}</p>
        <p v-else-if="!hist.items.length" class="gm-nota">{{ hist.buscar.trim() ? "No hay conversaciones con eso." : "Todavía no hay conversaciones." }}</p>
        <template v-for="c in hist.items" :key="c.id">
          <form v-if="hist.renombrando === c.id" class="ap-dr-ren" @submit.prevent="guardarNombre(c)">
            <input v-model="hist.nombre" maxlength="120" aria-label="Nombre de la conversación" />
            <button type="submit">Guardar</button>
          </form>
          <div v-else-if="hist.borrando === c.id" class="ap-dr-borrar">
            <span>¿Borrar esta conversación?</span>
            <button type="button" class="rojo" @click="borrarConversacion(c)">Borrar</button>
            <button type="button" @click="hist.borrando = null">Cancelar</button>
          </div>
          <div v-else class="gm-fila" :class="{ on: c.id === conversacion }">
            <button type="button" class="gm-i" :title="c.titulo" @click="abrirConversacion(c)">{{ c.titulo }}</button>
            <button type="button" class="gm-mas" :aria-label="`Cambiar el nombre de ${c.titulo}`" @click="renombrar(c)"><v-icon size="18">mdi-pencil-outline</v-icon></button>
            <button type="button" class="gm-mas" :aria-label="`Borrar ${c.titulo}`" @click="hist.borrando = c.id"><v-icon size="18">mdi-delete-outline</v-icon></button>
          </div>
        </template>
      </div>
      <div v-else class="gm-lista" />
      <router-link class="gm-fila gm-nav gm-pie" :to="{ name: 'home' }" :aria-label="lateral ? undefined : 'Ir al sistema'">
        <v-icon size="22">mdi-view-dashboard-outline</v-icon><span v-if="lateral">Ir al sistema</span>
      </router-link>
    </aside>
  </div>
</template>

<script setup>
import "../asistente.css";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import http from "@/app/api/http";
import { loadAuth, clearAuth } from "@/app/utils/storage";
import { marcarCaido, marcarEnLinea } from "@/app/store/conexion.state";
import { useAuthStore } from "@/app/store/auth.store";
import { usePosDictado } from "@/modules/pos/composables/usePosDictado";
import AsisPieza from "../components/AsisPieza.vue";
import AsisAviso from "../components/AsisAviso.vue";
import { leerEventos } from "../lib/leerStream";
import { despertar, guardarSilencio, leerSilencio, suenaAlCerrar, tocar } from "../lib/sonido";
import {
  bloquesDeRespuesta, diaMes, etiquetaDe, etiquetasUnicas, horaSanJuan, normalizar, renuevaPorDefecto,
  SUGERIDAS, TOPES_DE_CONVERSACION, TOPES_DEL_MES, VERSION,
} from "../lib/dibujo";

const ESTRELLA = "M12 2C12.6 7.1 16.9 11.4 22 12C16.9 12.6 12.6 16.9 12 22C11.4 16.9 7.1 12.6 2 12C7.1 11.4 11.4 7.1 12 2Z";
const TEXTO_ERROR = "Sin conexión con el asistente. La pregunta quedó sin respuesta.";
const TEXTO_LARGO = "La conversación llegó a su largo máximo. La próxima pregunta empieza una nueva.";
const MOTIVOS_DE_FALLA = ["falla", "rechazo", "vueltas"];

const props = defineProps({ ventana: { type: Boolean, default: false } });
const ruta = useRoute();
const auth = useAuthStore();
const { mobile } = useDisplay();
/* Escritorio: el asistente va en su propia pestaña (/app/ia), sin el menú del sistema. */
const ventana = computed(() => props.ventana);
const movil = computed(() => !ventana.value && mobile.value);
/* La barra lateral de la ventana, abierta o en franja (se recuerda). */
const lateral = ref(typeof window === "undefined" || window.localStorage.getItem("asis-lateral") !== "0");
function alternarLateral() {
  lateral.value = !lateral.value;
  try { window.localStorage.setItem("asis-lateral", lateral.value ? "1" : "0"); } catch { /* sin almacenamiento */ }
}
const buscarAbierto = ref(false);
const campoBuscar = ref(null);
function alternarBuscar() {
  buscarAbierto.value = !buscarAbierto.value;
  if (buscarAbierto.value) nextTick(() => campoBuscar.value?.focus());
  else if (hist.buscar) hist.buscar = "";
}
const estado = ref(null);
const aviso = ref("");
/** { id, pregunta, estado: consultando|llegando|listo|error|tope, pasos, bloques, consultado, hora, vivo } */
const turnos = ref([]);
const texto = ref("");
const foco = ref(false);
const pausa = ref(false);
const hilo = ref(null);
const entrada = ref(null);
const conversacion = ref(undefined);
const tituloConv = ref("");
let siguiente = 1;
let pegado = true;

// ── Saludo, título, rol y uso del mes ──
const saludo = computed(() => {
  const u = auth.user || {};
  const nombre = String(u.first_name || u.name || u.username || "").trim().split(/\s+/)[0];
  return nombre ? `Hola, ${nombre.charAt(0).toUpperCase() + nombre.slice(1)}` : "Hola";
});
const tituloActual = computed(() => tituloConv.value || (turnos.value[0]?.pregunta) || "Asistente POS 360");
const rol = computed(() => estado.value?.rol || (auth.isSuperAdmin ? "super_admin" : auth.isAdmin ? "admin" : "cajero"));
const esDueno = computed(() => rol.value === "super_admin" || rol.value === "admin");
const gasto = computed(() => (esDueno.value ? estado.value?.gasto || null : null));
const fraccion = computed(() => {
  const g = gasto.value;
  if (!g) return 0;
  return g.tope_usd > 0 ? g.usd / g.tope_usd : g.porcentaje || 0;
});
const colorUso = computed(() => (fraccion.value >= 1 ? "var(--m-rojo)" : fraccion.value >= 0.8 ? "var(--m-ocre)" : "var(--m-accion)"));
const usd = (n) => Number(n || 0).toFixed(2).replace(".", ",");
const renueva = computed(() => diaMes(estado.value?.renueva || renuevaPorDefecto()));

const sugeridas = computed(() => {
  const e = estado.value;
  if (e?.sugeridas?.length) return e.sugeridas.filter((s) => s?.pregunta).map((s) => ({ pregunta: s.pregunta, fuentes: s.fuentes || [] }));
  const puede = new Set((e?.puede || []).map((p) => p.nombre));
  return (SUGERIDAS[rol.value] || []).filter((s) => !e?.puede || s.fuentes.every((f) => puede.has(f)));
});
const ICONOS = [
  ["caja", "mdi-cash-register"], ["cierre", "mdi-cash-check"], ["arqueo", "mdi-cash-check"], ["vendid", "mdi-trophy-outline"],
  ["margen", "mdi-percent-outline"], ["stock", "mdi-package-variant-closed"], ["cliente", "mdi-account-group-outline"],
  ["rotaci", "mdi-chart-line-variant"], ["agrupad", "mdi-chart-bar"], ["auditor", "mdi-shield-search"], ["venta", "mdi-receipt-text-outline"],
];
function iconoDe(fuentes) {
  const f = (fuentes || []).join(" ").toLowerCase();
  return (ICONOS.find(([k]) => f.includes(k)) || [null, "mdi-creation"])[1];
}

const esperando = computed(() => turnos.value.some((t) => t.estado === "consultando" || t.estado === "llegando"));
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const textoPaso = (p) => {
  const alc = p.alcance ? ` · ${p.alcance}` : "";
  return p.hecho ? `${mayuscula(p.etiqueta)}${alc}` : `Consultando ${p.etiqueta}${alc}`;
};

// ── Sonido ──
const usuario = computed(() => auth.user?.id);
const almacen = typeof window !== "undefined" ? window.localStorage : null;
const silencio = ref(leerSilencio(usuario.value, almacen));
watch(usuario, (u) => { silencio.value = leerSilencio(u, almacen); });
function alternarSilencio() {
  silencio.value = !silencio.value;
  guardarSilencio(usuario.value, silencio.value, almacen);
}
const sonar = (nombre) => { if (!silencio.value) tocar(nombre); };

// ── Scroll del hilo ──
async function bajar() {
  await nextTick();
  const h = hilo.value;
  if (h && pegado) h.scrollTop = h.scrollHeight;
}
watch(turnos, bajar, { deep: true });
function alDesplazar() {
  const h = hilo.value;
  if (h) pegado = h.scrollHeight - h.scrollTop - h.clientHeight < 80;
}

// ── Campo y micrófono ──
function crecer() {
  const el = entrada.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(160, el.scrollHeight)}px`;
}
function alEnter(e) {
  if (e.isComposing) return;
  e.preventDefault();
  enviar(texto.value);
}
const voz = usePosDictado({
  alTexto: (t) => { texto.value = t; },
  alTerminar: (t) => { texto.value = t; nextTick(crecer); },
});

onMounted(async () => {
  try {
    const { data } = await http.get("asistente/estado");
    if (!data?.puede?.length) {
      aviso.value = "El asistente no tiene consultas habilitadas para este usuario.";
      return;
    }
    estado.value = data;
    if (data?.gasto?.agotado) pausa.value = true;
    // En la ventana la lista está siempre a la vista: se carga al entrar.
    if (ventana.value) cargarHistorial();
    // Desde un aviso del tablero: llega con ?q= y se pregunta sola.
    const q = String(ruta.query.q || "").trim();
    if (q && !pausa.value) { await nextTick(); enviar(q.slice(0, 300)); }
  } catch (e) {
    const s = e?.response?.status;
    aviso.value = s === 404 ? "El asistente no está habilitado para este comercio." : "El asistente no está disponible en este momento.";
  }
});

// ── Enviar y recibir (stream de bloques) ──
const cambiar = (id, f) => { turnos.value = turnos.value.map((t) => (t.id === id ? f(t) : t)); };

function cerrarConTope(id, motivo) {
  if (TOPES_DEL_MES.includes(motivo)) {
    const txt = esDueno.value ? `Tope del mes alcanzado. Las consultas vuelven el ${renueva.value}.` : `Consultas en pausa hasta el ${renueva.value}.`;
    cambiar(id, (t) => ({ ...t, estado: "tope", pasos: [], bloques: [{ tipo: "aviso", nivel: "atencion", texto: txt }] }));
    pausa.value = true;
    return true;
  }
  if (TOPES_DE_CONVERSACION.includes(motivo)) {
    conversacion.value = undefined;
    cambiar(id, (t) => ({ ...t, estado: "tope", pasos: [], bloques: [{ tipo: "aviso", nivel: "atencion", texto: TEXTO_LARGO }] }));
    return true;
  }
  if (MOTIVOS_DE_FALLA.includes(motivo)) {
    cambiar(id, (t) => ({ ...t, estado: "error", pasos: [], bloques: [] }));
    return true;
  }
  return false;
}
function cerrar(id, f) {
  cambiar(id, f);
  const t = turnos.value.find((x) => x.id === id);
  if (t && suenaAlCerrar(t.estado)) sonar("respuesta");
}
function pedir(cuerpo) {
  const a = loadAuth();
  const token = a?.accessToken || a?.token || a?.access_token || a?.jwt;
  const base = String(http.defaults.baseURL || "/api/v1").replace(/\/+$/, "");
  return fetch(`${base}/asistente/mensaje`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream, application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(cuerpo),
  });
}

async function enviar(pregunta) {
  const t = String(pregunta || "").trim();
  if (!t || esperando.value || pausa.value) return;
  if (voz.escuchando.value) voz.detener?.();
  despertar();
  const id = siguiente++;
  pegado = true;
  turnos.value = [...turnos.value, { id, pregunta: t, estado: "consultando", pasos: [], bloques: [], consultado: [], vivo: true }];
  texto.value = "";
  if (entrada.value) entrada.value.style.height = "";
  sonar("envio");
  const eraNueva = !conversacion.value;
  try {
    let r;
    try {
      r = await pedir({ texto: t, conversacion: conversacion.value });
      marcarEnLinea();
    } catch (e) {
      marcarCaido();
      throw e;
    }
    if (r.status === 401) { try { clearAuth(); } catch { /* sin sesión */ } }
    if (r.ok && r.body && (r.headers.get("content-type") || "").includes("text/event-stream")) {
      await recibirStream(id, r.body);
    } else {
      const j = await r.json().catch(() => ({}));
      if (j.conversacion) conversacion.value = j.conversacion;
      if (!r.ok) throw new Error(j.error || String(r.status));
      if (j.tope && cerrarConTope(id, j.tope)) return;
      const bloques = bloquesDeRespuesta(j);
      if (!bloques.length) throw new Error("respuesta vacía");
      cerrar(id, (x) => ({ ...x, estado: "listo", pasos: [], bloques, consultado: etiquetasUnicas(Array.isArray(j.herramientas) ? j.herramientas : []), hora: horaSanJuan() }));
    }
  } catch {
    cambiar(id, (x) => (x.estado === "listo" || x.estado === "tope" ? x : { ...x, estado: "error", pasos: [], bloques: [] }));
  } finally {
    if (eraNueva && conversacion.value && ventana.value) cargarHistorial();
    await nextTick();
    if (!movil.value) entrada.value?.focus?.();
  }
}

async function recibirStream(id, cuerpo) {
  let cerrado = false;
  for await (const { evento, datos: d } of leerEventos(cuerpo)) {
    if (evento === "herramienta" && d?.nombre) {
      if (d.estado === "inicio") {
        cambiar(id, (t) => ({ ...t, pasos: [...t.pasos, { nombre: d.nombre, etiqueta: d.etiqueta || etiquetaDe(d.nombre), alcance: d.alcance, hecho: false }] }));
      } else {
        cambiar(id, (t) => {
          const k = t.pasos.findIndex((p) => p.nombre === d.nombre && !p.hecho);
          return k < 0 ? t : { ...t, pasos: t.pasos.map((p, i) => (i === k ? { ...p, hecho: true } : p)) };
        });
      }
    } else if (evento === "bloque") {
      const b = normalizar(d?.bloque);
      if (!b) continue;
      cambiar(id, (t) => {
        const bloques = [...t.bloques];
        const i = Number.isInteger(d.indice) && d.indice >= 0 && d.indice <= bloques.length ? d.indice : bloques.length;
        bloques[i] = b;
        return { ...t, estado: "llegando", bloques };
      });
    } else if (evento === "fin") {
      cerrado = true;
      if (d?.conversacion) conversacion.value = d.conversacion;
      if (d?.tope && cerrarConTope(id, d.tope)) return;
      const nombres = Array.isArray(d?.herramientas) ? d.herramientas : [];
      cerrar(id, (t) => {
        const bloques = (d?.version ?? VERSION) > VERSION && d?.texto ? [{ tipo: "texto", texto: d.texto }] : t.bloques;
        if (!bloques.length) return { ...t, estado: "error", pasos: [] };
        const consultado = t.pasos.length ? [...new Set(t.pasos.map((p) => p.etiqueta))] : etiquetasUnicas(nombres);
        return { ...t, estado: "listo", pasos: [], bloques, consultado, hora: horaSanJuan(), texto: d?.texto || "" };
      });
    } else if (evento === "error") {
      cerrado = true;
      cambiar(id, (t) => ({ ...t, estado: "error", pasos: [], bloques: [] }));
    }
  }
  if (!cerrado) throw new Error("el stream se cortó");
}

function reintentar(turno) {
  turnos.value = turnos.value.filter((t) => t.id !== turno.id);
  enviar(turno.pregunta);
}

function nueva() {
  if (esperando.value) return;
  turnos.value = [];
  conversacion.value = undefined;
  tituloConv.value = "";
  pegado = true;
}

/** Texto plano de una respuesta para copiar: lo que dijo el servicio o lo que se ve en los bloques. */
function textoDe(t) {
  if (t.texto) return t.texto;
  const out = [];
  for (const b of t.bloques || []) {
    if (b.titulo) out.push(b.titulo);
    if (b.texto) out.push(b.texto);
    for (const f of b.filas || b.items || []) {
      if (Array.isArray(f)) out.push(f.join(" · "));
      else if (f && typeof f === "object") out.push([f.etiqueta || f.nombre, f.cifra ?? f.valor, f.sub].filter((x) => x != null && x !== "").join(" · "));
    }
  }
  return out.join("\n");
}
async function copiar(t) {
  try {
    await navigator.clipboard.writeText(textoDe(t));
    cambiar(t.id, (x) => ({ ...x, copiado: true }));
    setTimeout(() => cambiar(t.id, (x) => ({ ...x, copiado: false })), 1800);
  } catch { /* sin portapapeles */ }
}

// ── Conversaciones guardadas (mostrador, 90 días, por persona) ──
const hist = reactive({ abierto: false, cargando: false, error: "", items: [], buscar: "", dias: null, renombrando: null, borrando: null, nombre: "" });
const errorDe = (e, defecto) => e?.response?.data?.error || defecto;
async function cargarHistorial() {
  hist.cargando = true;
  hist.error = "";
  try {
    const { data } = await http.get("asistente/conversaciones", { params: { buscar: hist.buscar.trim() || undefined } });
    hist.items = Array.isArray(data?.conversaciones) ? data.conversaciones : [];
    hist.dias = data?.retencion_dias || hist.dias;
  } catch (e) {
    hist.error = errorDe(e, "No se pudieron traer las conversaciones.");
  } finally {
    hist.cargando = false;
  }
}
function abrirHistorial() { hist.abierto = true; cargarHistorial(); }
function cerrarHistorial() { hist.abierto = false; hist.renombrando = null; hist.borrando = null; }
let buscando = null;
watch(() => hist.buscar, () => { clearTimeout(buscando); buscando = setTimeout(cargarHistorial, 300); });

const gruposHist = computed(() => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const DIA = 864e5;
  const grupos = [["Hoy", 0], ["Ayer", DIA], ["Últimos 7 días", 7 * DIA], ["Últimos 30 días", 30 * DIA], ["Anteriores", Infinity]]
    .map(([titulo, hasta]) => ({ titulo, hasta, items: [] }));
  for (const c of hist.items) {
    const atras = hoy - new Date(new Date(c.actualizada).setHours(0, 0, 0, 0));
    (grupos.find((x) => atras <= x.hasta) || grupos[grupos.length - 1]).items.push(c);
  }
  return grupos.filter((g) => g.items.length);
});

async function abrirConversacion(c) {
  cerrarHistorial();
  if (c.id === conversacion.value || esperando.value) return;
  try {
    const { data } = await http.get(`asistente/conversaciones/${c.id}`);
    const lista = [];
    for (const m of data?.mensajes || []) {
      if (m.autor === "cliente") {
        lista.push({ id: siguiente++, pregunta: m.texto, estado: "error", textoError: "Esta pregunta quedó sin respuesta.", pasos: [], bloques: [], consultado: [], guardado: true });
      } else if (m.autor === "bot" && lista.length) {
        const crudos = Array.isArray(m.bloques) ? m.bloques : [];
        const bloques = crudos.map(normalizar).filter(Boolean);
        Object.assign(lista[lista.length - 1], {
          estado: "listo", texto: m.texto || "",
          bloques: bloques.length ? bloques : [{ tipo: "texto", texto: m.texto || "" }],
          consultado: etiquetasUnicas(Array.isArray(m.herramientas) ? m.herramientas.map((h) => h?.nombre || h) : []),
          hora: m.creado ? horaSanJuan(new Date(m.creado)) : "",
        });
      }
    }
    pegado = true;
    turnos.value = lista;
    conversacion.value = c.id;
    tituloConv.value = c.titulo;
  } catch (e) {
    hist.error = errorDe(e, "No se pudo abrir la conversación.");
    hist.abierto = true;
  }
}
function renombrar(c) { hist.borrando = null; hist.renombrando = c.id; hist.nombre = c.titulo; }
async function guardarNombre(c) {
  const nombre = hist.nombre.trim();
  try {
    await http.patch(`asistente/conversaciones/${c.id}`, { titulo: nombre });
    c.titulo = nombre || c.titulo;
    if (c.id === conversacion.value) tituloConv.value = c.titulo;
  } catch (e) {
    hist.error = errorDe(e, "No se pudo cambiar el nombre.");
  }
  hist.renombrando = null;
}
async function borrarConversacion(c) {
  try {
    await http.delete(`asistente/conversaciones/${c.id}`);
    hist.items = hist.items.filter((x) => x.id !== c.id);
    if (c.id === conversacion.value) nueva();
  } catch (e) {
    hist.error = errorDe(e, "No se pudo borrar la conversación.");
  }
  hist.borrando = null;
}
</script>

<style scoped>
/* Marca POS 360 sobre la forma de Alade/Gemini: tokens del kit (--m-*) y el degradado de los azules. */
.ap {
  --ap-grad: linear-gradient(74deg, #0a466e 0%, #0f6fae 9%, #1488d1 20%, #6fc0f2 24%, #1488d1 35%, #0a466e 44%, #0f6fae 50%, #6fc0f2 56%, #ffffff00 75%);
  --ap-sup: var(--m-variante, #eef2f6);
  --ap-sup-hover: var(--m-accion-hover, #cfe5f5);
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--v-layout-top, 56px) - var(--v-layout-bottom, 0px) - 32px);
  min-height: 480px;
  margin: 16px;
  padding: 10px 12px 8px;
  border-radius: 14px;
  background: var(--m-pieza, #fff);
  border: 1px solid var(--m-linea, #d3dde7);
  color: var(--m-tinta, #0f172a);
  font-family: Inter, system-ui, sans-serif;
  overflow: hidden;
}
.ap--movil {
  margin: 0;
  border: 0;
  border-radius: 0;
  height: calc(100dvh - var(--v-layout-top, 56px) - 64px - env(safe-area-inset-bottom, 0px));
  padding: 4px 8px 8px;
}
.ap-defs { position: absolute; }
.num { font-variant-numeric: tabular-nums; }

/* Barra */
.ap-barra { display: flex; align-items: center; gap: 6px; min-height: 48px; padding: 0 4px; }
.ap-ib { width: 40px; height: 40px; border: 0; border-radius: 50%; background: none; color: var(--m-suave); display: grid; place-items: center; cursor: pointer; flex: none; }
.ap-ib:hover:not(:disabled) { background: var(--ap-sup); }
.ap-ib:disabled { opacity: .4; cursor: default; }
.ap-tit { flex: 1; min-width: 0; }
.ap-tit b { display: block; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-uso { display: flex; flex-direction: column; gap: 4px; min-width: 130px; font-size: 12px; color: var(--m-suave); }
.ap-uso b { color: var(--m-tinta); }
.ap-uso i { display: block; height: 4px; border-radius: 2px; background: var(--m-pista, rgba(15,23,42,.07)); overflow: hidden; }
.ap-uso s { display: block; height: 100%; text-decoration: none; }
.ap-nueva { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border: 0; border-radius: 20px; background: var(--ap-sup); color: var(--m-tinta); font: 600 14px Inter, system-ui, sans-serif; cursor: pointer; }
.ap-nueva:hover:not(:disabled) { background: var(--ap-sup-hover); }

/* Conversación */
.ap-conv { flex: 1; overflow-y: auto; scrollbar-width: thin; }
.ap-col { max-width: 800px; margin: 0 auto; padding: 8px 20px 24px; min-height: 100%; display: flex; flex-direction: column; gap: 28px; }
.ap-aviso { margin: auto; display: flex; align-items: center; gap: 12px; padding: 18px 24px; border-radius: 14px; background: var(--ap-sup); font-size: 16px; }

/* Inicio */
.ap-inicio { margin: auto 0; padding-bottom: 16px; }
.ap-saludo { margin: 12px 0 0; font-size: clamp(34px, 5vw, 54px); font-weight: 600; line-height: 1.15; letter-spacing: -0.02em; }
.ap-grad { background: var(--ap-grad); background-size: 400% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: ap-entra-grad 1.6s cubic-bezier(.2,.7,.2,1) both; }
.ap-sub { margin: 4px 0 0; font-size: clamp(20px, 3vw, 32px); font-weight: 500; line-height: 1.25; color: #9aa6b5; animation: ap-sube .7s .15s cubic-bezier(.2,.7,.2,1) both; }
.ap-tarjetas { margin-top: 36px; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
.ap-sug { position: relative; min-height: 124px; padding: 16px 16px 52px; border: 0; border-radius: 12px; background: var(--ap-sup); color: var(--m-tinta); font: 500 15px/1.35 Inter, system-ui, sans-serif; text-align: left; cursor: pointer; transition: background-color .2s ease; animation: ap-sube .5s cubic-bezier(.2,.7,.2,1) both; }
.ap-sug:hover:not(:disabled) { background: var(--ap-sup-hover); }
.ap-sug:focus-visible { outline: 2px solid var(--m-accion); outline-offset: 2px; }
.ap-sug-ico { position: absolute; right: 12px; bottom: 12px; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; background: var(--m-pieza); color: var(--m-accion-txt); }

/* Turnos */
.ap-turno { display: flex; flex-direction: column; gap: 18px; }
.ap-yo { align-self: flex-end; max-width: 78%; padding: 12px 18px; border-radius: 20px 20px 4px 20px; background: var(--ap-sup); font-size: 16px; line-height: 1.45; white-space: pre-wrap; animation: ap-sube .35s ease both; }
.ap-resp { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 14px; align-items: start; }
.ap-cuerpo { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.ap-estrella { width: 28px; height: 28px; display: grid; place-items: center; margin-top: 2px; }
.ap-estrella svg { width: 100%; height: 100%; }
.ap-estrella--grande { width: 44px; height: 44px; }
.ap-estrella--pensando svg { animation: ap-gira 1.4s linear infinite; }
.ap-estrella--fin svg { animation: ap-pop .6s cubic-bezier(.2,.7,.2,1) both; }
.ap-espera { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.ap-espera span { font-size: 14px; color: var(--m-suave); }
.ap-brillo { display: block; height: 14px; width: 100%; border-radius: 7px; background: linear-gradient(90deg, var(--ap-sup) 0%, #cfe5f5 40%, var(--ap-sup) 80%); background-size: 200% 100%; animation: ap-brillo 1.4s linear infinite; }
.ap-brillo--corto { width: 60%; }
.ap-pasos { display: flex; flex-direction: column; gap: 6px; }
.ap-paso { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--m-suave); animation: ap-sube .3s ease both; }
.ap-paso .v-icon { color: var(--m-accion-txt); }
.ap-paso.hecho { color: var(--m-tinta); }
.ap-error { padding: 12px 16px; border-radius: 12px; background: var(--m-rojo-tinte); color: var(--m-rojo); font-size: 15px; }
.ap-reint { align-self: flex-start; border: 0; background: none; color: var(--m-accion-txt); font: 600 14px Inter, system-ui, sans-serif; cursor: pointer; padding: 4px 0; }
.ap-acc { display: flex; gap: 4px; margin-top: -2px; }
.ap-acc button { width: 36px; height: 36px; border: 0; border-radius: 50%; background: none; color: var(--m-suave); display: grid; place-items: center; cursor: pointer; }
.ap-acc button:hover:not(:disabled) { background: var(--ap-sup); color: var(--m-tinta); }

/* Campo */
.ap-pie { max-width: 800px; width: 100%; margin: 0 auto; padding: 0 12px; }
.ap-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 4px 2px 10px; }
.ap-chips::-webkit-scrollbar { display: none; }
.ap-chip { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border: 1px solid var(--m-linea); border-radius: 19px; background: var(--m-pieza); color: var(--m-tinta); font: 500 14px Inter, system-ui, sans-serif; white-space: nowrap; cursor: pointer; }
.ap-chip .v-icon { color: var(--m-accion-txt); }
.ap-entrada { display: flex; align-items: flex-end; gap: 8px; padding: 8px 8px 8px 20px; border-radius: 28px; background: var(--ap-sup); border: 1px solid var(--m-gris); transition: border-color .2s, background-color .2s, box-shadow .2s; }
.ap-entrada--activa { background: var(--m-pieza); border-color: var(--m-accion); box-shadow: 0 2px 10px rgba(15, 111, 174, .12); }
.ap-campo { flex: 1; min-height: 40px; max-height: 160px; padding: 9px 0; border: 0; outline: 0; background: none; resize: none; color: var(--m-tinta); font: 400 16px/1.4 Inter, system-ui, sans-serif; }
.ap-acc-campo { display: flex; gap: 4px; }
.ap-enviar { width: 40px; height: 40px; border: 0; border-radius: 50%; background: none; color: var(--m-suave); display: grid; place-items: center; cursor: pointer; }
.ap-enviar--go { background: var(--m-accion); color: #fff; }
.ap-enviar--go .v-icon { color: #fff; }
.ap-enviar:disabled { opacity: .5; cursor: default; }
.ap-pausa { padding: 14px; border-radius: 14px; background: var(--ap-sup); text-align: center; font-size: 14px; color: var(--m-suave); }
.ap-nota { margin: 8px 0 2px; text-align: center; font-size: 12px; color: var(--m-suave); }

/* Panel de conversaciones */
.ap-dr-fondo { position: absolute; inset: 0; background: rgba(15, 23, 42, .32); z-index: 5; }
.ap-dr { position: absolute; top: 0; bottom: 0; left: 0; width: min(340px, 88%); z-index: 6; display: flex; flex-direction: column; gap: 10px; padding: 12px; background: var(--m-pieza); border-right: 1px solid var(--m-linea); box-shadow: 8px 0 24px rgba(15, 23, 42, .12); }
.ap-dr-top { display: flex; align-items: center; justify-content: space-between; padding-left: 6px; }
.ap-dr-top h2 { margin: 0; font-size: 18px; font-weight: 700; }
.ap-dr-bus { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; border-radius: 22px; background: var(--ap-sup); color: var(--m-suave); }
.ap-dr-bus input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; color: var(--m-tinta); font: 400 15px Inter, system-ui, sans-serif; }
.ap-dr-nueva { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border: 0; border-radius: 22px; background: none; color: var(--m-tinta); font: 600 15px Inter, system-ui, sans-serif; cursor: pointer; }
.ap-dr-nueva:hover { background: var(--ap-sup); }
.ap-dr-lista { flex: 1; overflow-y: auto; scrollbar-width: thin; }
.ap-dr-g { margin: 14px 8px 4px; font-size: 12px; font-weight: 700; color: var(--m-suave); }
.ap-dr-fila { display: flex; align-items: center; border-radius: 20px; }
.ap-dr-fila:hover, .ap-dr-fila.on { background: var(--ap-sup); }
.ap-dr-fila.on .ap-dr-i { color: var(--m-accion-txt); font-weight: 600; }
.ap-dr-i { flex: 1; min-width: 0; height: 40px; padding: 0 12px; border: 0; background: none; color: var(--m-tinta); font: 400 14px Inter, system-ui, sans-serif; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.ap-dr-mas { width: 32px; height: 32px; border: 0; border-radius: 50%; background: none; color: var(--m-suave); display: grid; place-items: center; cursor: pointer; opacity: 0; flex: none; }
.ap-dr-fila:hover .ap-dr-mas, .ap-dr-fila:focus-within .ap-dr-mas, .ap--movil .ap-dr-mas { opacity: 1; }
.ap-dr-ren { display: flex; gap: 6px; padding: 4px; }
.ap-dr-ren input { flex: 1; min-width: 0; height: 36px; padding: 0 10px; border: 1px solid var(--m-accion); border-radius: 10px; font: 400 14px Inter, system-ui, sans-serif; color: var(--m-tinta); background: var(--m-pieza); }
.ap-dr-ren button, .ap-dr-borrar button { height: 36px; padding: 0 10px; border: 0; border-radius: 10px; background: var(--m-accion); color: #fff; font: 600 13px Inter, system-ui, sans-serif; cursor: pointer; }
.ap-dr-borrar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 6px 8px; border-radius: 12px; background: var(--m-rojo-tinte); font-size: 13px; }
.ap-dr-borrar span { flex: 1 1 100%; color: var(--m-tinta); }
.ap-dr-borrar button { background: var(--ap-sup); color: var(--m-tinta); }
.ap-dr-borrar button.rojo { background: var(--m-rojo); color: #fff; }
.ap-dr-nota { margin: 14px 8px; font-size: 14px; color: var(--m-suave); }
.ap-dr-pie { margin: 0; padding: 8px; font-size: 12px; color: var(--m-suave); border-top: 1px solid var(--m-linea2); }

/* Ventana de escritorio (2026-11-08, modelo Gemini como Alade /ia): barra lateral de
   320 px en el color de superficie, el resto en el fondo; filas de 44 px en píldora;
   vacía, el saludo y el campo al medio con las fichas debajo. */
.ap--ventana { position: fixed; inset: 0; height: 100dvh; min-height: 0; margin: 0; padding: 8px 16px 8px 336px; border: 0; border-radius: 0; transition: padding-left .2s ease; }
.ap--ventana.ap--cerrada { padding-left: 88px; }
.ap--ventana .ap-barra { padding-left: 4px; }
.ap--ventana .ap-tit b { font-size: 20px; font-weight: 400; }
.ap--ventana .ap-saludo { font-size: 32px; font-weight: 400; letter-spacing: 0; text-align: center; }
.ap--ventana .ap-inicio .ap-estrella { margin: 0 auto; }
.ap--ventana .ap-chip { font-weight: 500; }
.ap--vacio .ap-conv { flex: 1 1 auto; display: flex; }
.ap--vacio .ap-col { flex: 1; justify-content: flex-end; min-height: 0; }
.ap--vacio .ap-inicio { margin: 0; padding-bottom: 8px; }
.ap--vacio .ap-pie { flex: 1; display: flex; flex-direction: column; }
.ap--vacio .ap-chips { order: 2; flex-wrap: wrap; justify-content: center; padding-top: 16px; overflow: visible; }
.ap--vacio .ap-nota { order: 3; margin-top: auto; }

.gm { position: absolute; z-index: 6; top: 0; bottom: 0; left: 0; width: 320px; display: flex; flex-direction: column; padding: 8px; background: var(--ap-sup); border-right: 1px solid var(--m-gris); transition: width .2s ease; overflow: hidden; }
.gm--cerrada { width: 72px; }
.gm-top { display: flex; align-items: center; gap: 4px; min-height: 48px; padding-left: 8px; }
.gm--cerrada .gm-top { padding-left: 4px; }
.gm-marca { flex: 1; min-width: 0; padding: 0; border: 0; background: none; color: var(--m-tinta); font: 500 19px Inter, system-ui, sans-serif; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.gm .ap-ib:hover { background: var(--ap-sup-hover); color: var(--m-tinta); }
.gm-bus { display: flex; align-items: center; gap: 10px; min-height: 44px; margin: 4px 0 6px; padding: 0 16px; border-radius: 9999px; background: var(--m-pieza); color: var(--m-suave); }
.gm-bus input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; color: var(--m-tinta); font: 400 15px Inter, system-ui, sans-serif; }
.gm-fila { position: relative; display: flex; align-items: center; min-height: 44px; border-radius: 9999px; color: var(--m-tinta); transition: background-color .15s ease; }
.gm-fila:hover { background: var(--ap-sup-hover); }
.gm-fila.on { background: var(--m-accion-tinte); }
.gm-fila.on .gm-i { color: var(--m-accion-txt); font-weight: 600; }
.gm-nav { gap: 14px; width: 100%; margin-top: 16px; padding: 0 12px; border: 0; background-color: transparent; font: 400 16px Inter, system-ui, sans-serif; text-align: left; text-decoration: none; white-space: nowrap; cursor: pointer; }
.gm-nav:disabled { opacity: .5; cursor: default; }
.gm--cerrada .gm-nav { width: 48px; padding: 0 12px; }
.gm-nav .v-icon { color: var(--m-suave); }
.gm-lista { flex: 1; overflow-y: auto; margin-top: 12px; scrollbar-width: thin; }
.gm-sec { padding: 8px 16px; font-size: 14px; color: var(--m-suave); }
.gm-nota { margin: 8px 16px; font-size: 14px; color: var(--m-suave); }
.gm-i { flex: 1; min-width: 0; min-height: 44px; padding: 0 4px 0 16px; border: 0; background: none; color: inherit; font: 400 15px Inter, system-ui, sans-serif; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.gm-mas { flex: none; width: 34px; height: 34px; border: 0; border-radius: 50%; background: none; color: var(--m-suave); display: grid; place-items: center; cursor: pointer; opacity: 0; }
.gm-fila:hover .gm-mas, .gm-fila:focus-within .gm-mas { opacity: 1; }
.gm-mas:hover { background: var(--m-pieza); color: var(--m-tinta); }
.gm-pie { margin-top: 4px; }

.ap-dr-enter-active, .ap-dr-leave-active { transition: transform .25s cubic-bezier(.2,.7,.2,1); }
.ap-dr-enter-from, .ap-dr-leave-to { transform: translateX(-100%); }
.ap-fondo-enter-active, .ap-fondo-leave-active { transition: opacity .25s; }
.ap-fondo-enter-from, .ap-fondo-leave-to { opacity: 0; }

@keyframes ap-entra-grad { from { background-position: 100% 0; opacity: 0; } to { background-position: 0 0; opacity: 1; } }
@keyframes ap-sube { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes ap-gira { to { transform: rotate(360deg); } }
@keyframes ap-pop { 0% { transform: scale(.6) rotate(-45deg); opacity: 0; } 100% { transform: none; opacity: 1; } }
@keyframes ap-brillo { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .ap-grad, .ap-sub, .ap-sug, .ap-yo, .ap-paso, .ap-estrella svg, .ap-brillo { animation: none !important; }
}
</style>
