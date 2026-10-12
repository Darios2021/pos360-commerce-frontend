<template>
  <!--
    ASISTENTE: preguntarle al negocio en castellano (ventas, caja, cierres, arqueos, márgenes, stock).
    Es la cara INTERNA del chatbot (productos/mostrador). La pantalla le habla a /api/v1/asistente
    con la sesión de siempre; la API firma el permiso delegado y reenvía. El navegador no ve claves.
    Lo que consulta cada rol lo recortan mostrador y la API: acá sólo se muestra lo que el servidor dice.

    La respuesta llega en BLOQUES tipados (título, cifras en filas, columnas o dona, tabla, lista,
    aviso) por un stream: primero qué herramienta consulta, después cada bloque entero. Con el
    servicio de antes (JSON con texto plano) la misma pantalla pinta el texto en un solo bloque.
    Especificación: orchestrator/despachos/ZONDITO-asistente-diseno.md (B y C); la lógica de dibujo
    y la lectura del stream están en ../lib, copiadas de Zondito.

    Vista completa, sin cuadros flotantes: es una pantalla de trabajo.
  -->
  <div class="asis asis-vista">
    <div class="asis-cab">
      <h1>Asistente</h1>
      <button v-if="!aviso" type="button" class="asis-mudo" :aria-pressed="silencio"
        :aria-label="silencio ? 'Activar el sonido del asistente' : 'Silenciar el asistente'" @click="alternarSilencio">
        <v-icon :icon="silencio ? 'mdi-volume-off' : 'mdi-volume-high'" />
      </button>
      <div v-if="gasto" class="asis-uso" aria-label="Uso del asistente en el mes">
        <b class="num">USD {{ usd(gasto.usd) }}</b>
        <span class="num">de {{ gasto.tope_usd }} · {{ Math.round(fraccion * 100) }} %</span>
        <div class="asis-pista"><i :style="{ width: anchoBarra(Math.min(fraccion, 1), 1) + '%', background: colorUso }" /></div>
      </div>
    </div>

    <div ref="hilo" class="asis-hilo" role="log" aria-live="polite" aria-label="Conversación con el asistente" @scroll="alDesplazar">
      <AsisAviso v-if="aviso" nivel="info" :texto="aviso" />

      <div v-else-if="!turnos.length && estado" class="asis-sugeridas">
        <button v-for="s in sugeridas" :key="s.pregunta" type="button" class="asis-sug" :disabled="pausa" @click="enviar(s.pregunta)">
          <small>{{ s.fuentes.map(etiquetaDe).join(" · ") }}</small>
          <b>{{ s.pregunta }}</b>
        </button>
      </div>

      <template v-for="t in turnos" :key="t.id">
        <div :class="['asis-pregunta', { 'asis-entra': t.vivo }]"><p>{{ t.pregunta }}</p></div>

        <div v-if="t.estado === 'consultando' || t.estado === 'llegando'" class="asis-pasos">
          <div v-if="!t.pasos.length && t.estado === 'consultando'" class="asis-paso activo asis-entra"><i /><span>Consultando</span></div>
          <div v-for="(p, i) in t.pasos" :key="i" :class="['asis-paso', p.hecho ? 'hecho' : 'activo', 'asis-entra']">
            <i><svg v-if="p.hecho" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" /></svg></i>
            <span>{{ textoPaso(p) }}</span>
          </div>
        </div>

        <AsisPieza v-if="(t.estado === 'llegando' || t.estado === 'listo') && t.bloques.length"
          :bloques="t.bloques" :redactando="t.estado === 'llegando'" :consultado="t.consultado" :hora="t.hora" :vivo="t.vivo" />

        <div v-if="t.estado === 'tope' && t.bloques[0]" :class="{ 'asis-entra': t.vivo }">
          <AsisAviso nivel="atencion" :texto="t.bloques[0].texto" />
        </div>

        <div v-if="t.estado === 'error'" :class="{ 'asis-entra': t.vivo }">
          <!-- Reintentar sólo en la última: más arriba ya pasó otra cosa. -->
          <AsisAviso nivel="problema" :texto="TEXTO_ERROR"
            :accion="esperando || t.id !== turnos[turnos.length - 1].id ? undefined : 'Reintentar'" @accion="reintentar(t)" />
        </div>
      </template>
    </div>

    <div v-if="!aviso" class="asis-entrada">
      <div v-if="pausa" class="asis-pausa">Consultas en pausa hasta el {{ renueva }}</div>
      <form v-else @submit.prevent="enviar(texto)">
        <label for="asistente-texto" class="d-sr-only">Pregunta</label>
        <textarea id="asistente-texto" ref="entrada" v-model="texto" rows="1" maxlength="2000" autocomplete="off"
          placeholder="Ventas, caja, cierres, stock" @input="crecer" @keydown.enter.exact="alEnter" />
        <button type="submit" :disabled="esperando || !texto.trim()">Preguntar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import "../asistente.css";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import http from "@/app/api/http";
import { loadAuth, clearAuth } from "@/app/utils/storage";
import { marcarCaido, marcarEnLinea } from "@/app/store/conexion.state";
import { useAuthStore } from "@/app/store/auth.store";
import AsisPieza from "../components/AsisPieza.vue";
import AsisAviso from "../components/AsisAviso.vue";
import { leerEventos } from "../lib/leerStream";
import { despertar, guardarSilencio, leerSilencio, suenaAlCerrar, tocar } from "../lib/sonido";
import {
  anchoBarra, bloquesDeRespuesta, diaMes, etiquetaDe, etiquetasUnicas, horaSanJuan, normalizar, renuevaPorDefecto,
  SUGERIDAS, TOPES_DE_CONVERSACION, TOPES_DEL_MES, VERSION,
} from "../lib/dibujo";

const TEXTO_ERROR = "Sin conexión con el asistente. La pregunta quedó sin respuesta.";
const TEXTO_LARGO = "La conversación llegó a su largo máximo. La próxima pregunta empieza una nueva.";
const MOTIVOS_DE_FALLA = ["falla", "rechazo", "vueltas"];

const auth = useAuthStore();
const estado = ref(null);
const aviso = ref("");
/** { id, pregunta, estado: consultando|llegando|listo|error|tope, pasos, bloques, consultado, hora, vivo } */
const turnos = ref([]);
const texto = ref("");
const pausa = ref(false);
const hilo = ref(null);
const entrada = ref(null);
let conversacion;
let siguiente = 1;
let pegado = true;

// ── Rol, uso del mes y sugeridas ──

/** Rol de la MATRIZ de la API. Si mostrador no lo manda en el estado, el de la sesión. */
const rol = computed(() => estado.value?.rol || (auth.isSuperAdmin ? "super_admin" : auth.isAdmin ? "admin" : "cajero"));
const esDueno = computed(() => rol.value === "super_admin" || rol.value === "admin");
const gasto = computed(() => (esDueno.value ? estado.value?.gasto || null : null));
const fraccion = computed(() => {
  const g = gasto.value;
  if (!g) return 0;
  return g.tope_usd > 0 ? g.usd / g.tope_usd : g.porcentaje || 0;
});
const colorUso = computed(() => (fraccion.value >= 1 ? "var(--as-rojo)" : fraccion.value >= 0.8 ? "var(--as-ocre)" : "var(--gx-p2)"));
const usd = (n) => Number(n || 0).toFixed(2).replace(".", ",");
const renueva = computed(() => diaMes(estado.value?.renueva || renuevaPorDefecto()));

const sugeridas = computed(() => {
  const e = estado.value;
  const base = e?.sugeridas?.length ? e.sugeridas : SUGERIDAS[rol.value] || [];
  const puede = new Set((e?.puede || []).map((p) => p.nombre));
  return base.filter((s) => !e?.puede || s.fuentes.every((f) => puede.has(f)));
});

const esperando = computed(() => turnos.value.some((t) => t.estado === "consultando" || t.estado === "llegando"));

const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const textoPaso = (p) => {
  const alc = p.alcance ? ` · ${p.alcance}` : "";
  return p.hecho ? `${mayuscula(p.etiqueta)}${alc}` : `Consultando ${p.etiqueta}${alc}`;
};

// ── Sonido: arranca con sonido; el silencio es de cada usuario ──

const usuario = computed(() => auth.user?.id);
const almacen = typeof window !== "undefined" ? window.localStorage : null;
const silencio = ref(leerSilencio(usuario.value, almacen));
watch(usuario, (u) => { silencio.value = leerSilencio(u, almacen); });
function alternarSilencio() {
  silencio.value = !silencio.value;
  guardarSilencio(usuario.value, silencio.value, almacen);
}
const sonar = (nombre) => { if (!silencio.value) tocar(nombre); };

// ── Scroll: sólo el hilo, nunca la página; si la persona subió a leer, no se la baja ──

watch(turnos, async () => {
  await nextTick();
  const h = hilo.value;
  if (h && pegado) h.scrollTop = h.scrollHeight;
}, { deep: true });
function alDesplazar() {
  const h = hilo.value;
  if (h) pegado = h.scrollHeight - h.scrollTop - h.clientHeight < 80;
}

// ── Entrada: de 1 a 4 renglones, Enter envía, Mayús+Enter salta ──

function crecer(e) {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = `${Math.min(120, el.scrollHeight)}px`;
}
function alEnter(e) {
  if (e.isComposing) return;
  e.preventDefault();
  enviar(texto.value);
}

onMounted(async () => {
  try {
    const { data } = await http.get("asistente/estado");
    estado.value = data;
    if (data?.gasto?.agotado) pausa.value = true;
  } catch (e) {
    const s = e?.response?.status;
    aviso.value = s === 404 ? "El asistente no está habilitado para este comercio." : "El asistente no está disponible en este momento.";
  }
});

// ── Enviar y recibir ──

const cambiar = (id, f) => {
  turnos.value = turnos.value.map((t) => (t.id === id ? f(t) : t));
};

function cerrarConTope(id, motivo) {
  if (TOPES_DEL_MES.includes(motivo)) {
    const txt = esDueno.value ? `Tope del mes alcanzado. Las consultas vuelven el ${renueva.value}.` : `Consultas en pausa hasta el ${renueva.value}.`;
    cambiar(id, (t) => ({ ...t, estado: "tope", pasos: [], bloques: [{ tipo: "aviso", nivel: "atencion", texto: txt }] }));
    pausa.value = true;
    return true;
  }
  if (TOPES_DE_CONVERSACION.includes(motivo)) {
    conversacion = undefined;
    cambiar(id, (t) => ({ ...t, estado: "tope", pasos: [], bloques: [{ tipo: "aviso", nivel: "atencion", texto: TEXTO_LARGO }] }));
    return true;
  }
  if (MOTIVOS_DE_FALLA.includes(motivo)) {
    cambiar(id, (t) => ({ ...t, estado: "error", pasos: [], bloques: [] }));
    return true;
  }
  return false;
}

/** Cierra el turno con respuesta; suena una sola vez, sólo si quedó "listo". */
function cerrar(id, f) {
  cambiar(id, f);
  const t = turnos.value.find((x) => x.id === id);
  if (t && suenaAlCerrar(t.estado)) sonar("respuesta");
}

/** POST con fetch (axios no expone el stream), con la misma base y el mismo token que `http`. */
function pedir(cuerpo) {
  const a = loadAuth();
  const token = a?.accessToken || a?.token || a?.access_token || a?.jwt;
  const base = String(http.defaults.baseURL || "/api/v1").replace(/\/+$/, "");
  return fetch(`${base}/asistente/mensaje`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(cuerpo),
  });
}

async function enviar(pregunta) {
  const t = String(pregunta || "").trim();
  if (!t || esperando.value || pausa.value) return;
  despertar(); // dentro del gesto, o el navegador deja el audio mudo
  const id = siguiente++;
  pegado = true;
  turnos.value = [...turnos.value, { id, pregunta: t, estado: "consultando", pasos: [], bloques: [], consultado: [], vivo: true }];
  texto.value = "";
  if (entrada.value) entrada.value.style.height = "";
  sonar("envio");
  try {
    let r;
    try {
      r = await pedir({ texto: t, conversacion });
      marcarEnLinea();
    } catch (e) {
      marcarCaido();
      throw e;
    }
    if (r.status === 401) {
      try { clearAuth(); } catch {}
    }
    // Se decide por lo que contestó, no por lo que se pidió: el servicio de
    // antes de los bloques contesta JSON aunque se le pida el stream.
    if (r.ok && r.body && (r.headers.get("content-type") || "").includes("text/event-stream")) {
      await recibirStream(id, r.body);
    } else {
      const j = await r.json().catch(() => ({}));
      if (j.conversacion) conversacion = j.conversacion;
      if (!r.ok) throw new Error(j.error || String(r.status));
      if (j.tope && cerrarConTope(id, j.tope)) return;
      const nombres = Array.isArray(j.herramientas) ? j.herramientas : [];
      const bloques = bloquesDeRespuesta(j);
      if (!bloques.length) throw new Error("respuesta vacía");
      cerrar(id, (x) => ({ ...x, estado: "listo", pasos: [], bloques, consultado: etiquetasUnicas(nombres), hora: horaSanJuan() }));
    }
  } catch {
    cambiar(id, (x) => (x.estado === "listo" || x.estado === "tope" ? x : { ...x, estado: "error", pasos: [], bloques: [] }));
  } finally {
    await nextTick();
    entrada.value?.focus?.();
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
      if (d?.conversacion) conversacion = d.conversacion;
      if (d?.tope && cerrarConTope(id, d.tope)) return;
      const nombres = Array.isArray(d?.herramientas) ? d.herramientas : [];
      cerrar(id, (t) => {
        // Una versión que este cliente no conoce: lo que haya llegado como texto.
        const bloques = (d?.version ?? VERSION) > VERSION && d?.texto ? [{ tipo: "texto", texto: d.texto }] : t.bloques;
        if (!bloques.length) return { ...t, estado: "error", pasos: [] };
        const consultado = t.pasos.length ? [...new Set(t.pasos.map((p) => p.etiqueta))] : etiquetasUnicas(nombres);
        return { ...t, estado: "listo", pasos: [], bloques, consultado, hora: horaSanJuan() };
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
</script>
