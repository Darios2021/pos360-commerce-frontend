<!-- Campaña a medida (maqueta aprobada 25/10, artboards 1, 2 y 4): el comercio cuenta en
     una frase qué quiere vender y el servicio le arma la campaña (con IA y su estrategia,
     o de plantilla); acá la revisa y la guarda en Mis campañas. Con `editar` abre una
     campaña suya ya guardada. Sólo se muestra si la plataforma le habilitó la autonomía
     (GET /campanas). Vista completa, sin modales. -->
<template>
  <!-- La tarjeta: una frase y Armar campaña -->
  <section v-if="etapa === 'pedido'" class="cm cm-tarjeta" aria-labelledby="cm-t">
    <div class="cm-tarjeta__izq">
      <span class="cm-marca">CAMPAÑA A MEDIDA</span>
      <h2 id="cm-t">Contá qué querés vender y te armamos la campaña</h2>
      <label for="cm-pedido" class="cm-rot">Tu idea, en una frase</label>
      <textarea id="cm-pedido" v-model="pedido" rows="2" maxlength="300" placeholder="Ej.: promo de cámaras con instalación incluida, esta semana" @keydown.enter.exact.prevent="armar()"></textarea>
      <div v-if="ideas.length" class="cm-ideas">
        <span>Ideas:</span>
        <button v-for="i in ideas" :key="i" type="button" @click="pedido = i">{{ i }}</button>
      </div>
      <div class="cm-fila">
        <button type="button" class="cm-pri" :disabled="pedido.trim().length < 4 || !hayLugar" @click="armar()"><v-icon size="20">mdi-creation-outline</v-icon>Armar campaña</button>
        <span class="cm-s">{{ estado.ia?.activa ? `Con IA · te quedan USD ${numero(estado.ia.quedaUsd)} este mes` : "Sale de plantilla: revisá los textos" }}</span>
      </div>
      <p v-if="!hayLugar" class="cm-aviso">Tenés {{ estado.autonomia.tope }} campañas prendidas, el máximo. Apagá una en Mis campañas para sumar otra.</p>
      <p v-if="error" class="cm-mal" role="alert">{{ error }}</p>
    </div>
    <aside class="cm-tarjeta__der" aria-label="Tu estrategia">
      <div class="cm-fila cm-fila--entre"><b>Así hablamos de vos</b><button type="button" class="cm-lnk" @click="$emit('estrategia')">Editar</button></div>
      <template v-if="tieneEstrategia">
        <div v-for="[k, t] in RESUMEN" v-show="estado.perfil?.[k]" :key="k" class="cm-dato"><b>{{ t }}</b> {{ estado.perfil?.[k] }}</div>
      </template>
      <p v-else class="cm-s">Contanos qué vendés y qué te distingue: cada campaña va a hablar como vos.</p>
    </aside>
  </section>

  <section v-else-if="etapa === 'armando'" class="cm cm-tarjeta cm-armando" aria-live="polite">
    <div class="cm-fila"><v-progress-circular indeterminate size="26" width="3" color="#1488d1" /><b class="cm-grande">Armando tu campaña…</b></div>
    <span class="cm-s">Pensando el nombre, las fechas y lo que dice el video.</span>
    <div class="cm-hueso" style="width: 70%"></div><div class="cm-hueso" style="width: 90%"></div><div class="cm-hueso" style="width: 55%"></div>
  </section>

  <!-- La revisión: todo lo que trae el borrador, editable -->
  <div v-else class="cm cm-rev">
    <div class="cm-pieza cm-cab">
      <button type="button" class="cm-sec" @click="cerrar"><v-icon size="18">mdi-chevron-left</v-icon>{{ editar ? "Mis campañas" : "Nuevo reel" }}</button>
      <div class="cm-cab__t">
        <h2>{{ editar ? "Editar campaña" : "Revisá tu campaña" }}</h2>
        <span v-if="!editar" class="cm-s">Pediste: “{{ pedido }}”</span>
      </div>
      <span v-if="origen" class="cm-chip" :class="{ 'cm-chip--gris': origen !== 'ia' }"><v-icon v-if="origen === 'ia'" size="15">mdi-creation-outline</v-icon>{{ origen === "ia" ? "Armada con IA" : "De plantilla" }}</span>
    </div>

    <div class="cm-cuerpo">
      <div class="cm-col">
        <section class="cm-pieza">
          <h3>La campaña</h3>
          <div class="ct-campo"><label for="cm-nombre">Nombre</label><input id="cm-nombre" v-model="c.nombre" maxlength="40" /></div>
          <div class="cm-fila cm-fila--abajo">
            <div class="ct-campo"><label>Cuándo</label>
              <div class="cm-seg" role="group" aria-label="Cuándo se ofrece">
                <button v-for="(t, k) in VENTANAS" :key="k" type="button" :class="{ 'is-on': c.ventana.tipo === k }" :aria-pressed="c.ventana.tipo === k" @click="c.ventana.tipo = k">{{ t }}</button>
              </div>
            </div>
            <div v-if="c.ventana.tipo === 'recurrente'" class="ct-campo cm-ancho"><label for="cm-cuando">Cuándo</label><input id="cm-cuando" v-model="c.ventana.cuando" maxlength="60" placeholder="todos los viernes" /></div>
            <template v-if="c.ventana.tipo === 'fija'">
              <div class="ct-campo"><label for="cm-desde">Desde</label><input id="cm-desde" v-model="c.ventana.fecha" type="date" :min="hoy" /></div>
              <div class="ct-campo"><label for="cm-hasta">Hasta</label><input id="cm-hasta" v-model="c.ventana.hasta" type="date" :min="c.ventana.fecha || hoy" /></div>
            </template>
          </div>
        </section>

        <section class="cm-pieza">
          <div class="cm-fila"><h3>Productos</h3><span class="cm-s">los podés cambiar al armar el video</span></div>
          <div class="cm-fila cm-fila--abajo">
            <div class="ct-campo"><label for="cm-regla">Qué toma</label>
              <select id="cm-regla" v-model="c.productos.regla" class="cm-sel"><option v-for="(t, k) in REGLAS" :key="k" :value="k">{{ t }}</option></select></div>
            <div class="ct-campo"><label for="cm-n">Cuántos</label><input id="cm-n" v-model.number="c.productos.n" type="number" min="1" max="6" style="width: 90px" /></div>
            <div v-if="c.productos.regla === 'categoria'" class="ct-campo cm-ancho"><label for="cm-filtro">Categorías</label><input id="cm-filtro" v-model="c.productos.filtro" maxlength="120" placeholder="cámaras, alarmas" /></div>
          </div>
          <div v-if="muestra.length" class="cm-prods">
            <div v-for="p in muestra" :key="p.id" class="cm-prod"><span class="cm-prod__img"><img v-if="p.imagen" :src="p.imagen" alt="" loading="lazy" /></span><span><b>{{ p.titulo }}</b><span class="num">{{ pesos(p.precio) }}</span></span></div>
          </div>
        </section>

        <section class="cm-pieza">
          <div class="cm-fila"><h3>Lo que dice el video</h3><span class="cm-s">lo que está entre llaves se completa solo con cada producto</span></div>
          <div class="cm-fila cm-fila--abajo">
            <div class="ct-campo cm-ancho"><label for="cm-tit">Titular</label><input id="cm-tit" v-model="c.textos.titular" maxlength="60" /></div>
            <div class="ct-campo cm-ancho"><label for="cm-baj">Bajada</label><input id="cm-baj" v-model="c.textos.bajada" maxlength="90" /></div>
          </div>
          <div class="ct-campo"><label for="cm-vi">Voz de la apertura</label><textarea id="cm-vi" v-model="c.textos.vozIntro" rows="2" maxlength="200"></textarea></div>
          <div class="ct-campo"><label for="cm-vp">Voz de cada producto</label><textarea id="cm-vp" v-model="c.textos.vozItem" rows="2" maxlength="200"></textarea>
            <span v-if="muestra[0] && c.textos.vozItem" class="cm-ej">Con el primero: “{{ llenarEj(c.textos.vozItem, muestra[0]) }}”</span></div>
          <div class="cm-fila cm-fila--abajo">
            <div class="ct-campo cm-ancho"><label for="cm-vc">Voz del cierre</label><textarea id="cm-vc" v-model="c.textos.vozCierre" rows="2" maxlength="200"></textarea></div>
            <div class="ct-campo"><label for="cm-ll">Botón</label><input id="cm-ll" v-model="c.textos.llamado" maxlength="40" /></div>
          </div>
          <div class="ct-campo"><label for="cm-cap">Texto de la publicación</label><textarea id="cm-cap" v-model="c.textos.caption" rows="2" maxlength="400"></textarea></div>
          <div class="cm-fila cm-fila--abajo">
            <div class="ct-campo"><label for="cm-est">Estilo</label><select id="cm-est" v-model="c.estilo" class="cm-sel"><option v-for="e in estilos" :key="e.id" :value="e.id">{{ e.nombre }}</option></select></div>
            <div class="ct-campo"><label for="cm-mus">Música</label><select id="cm-mus" v-model="c.musica" class="cm-sel"><option :value="null">La del estilo</option><option v-for="m in musicas" :key="m.id" :value="m.id">{{ m.nombre }}</option></select></div>
            <div class="ct-campo"><label for="cm-voz">Voz</label><select id="cm-voz" v-model="c.voz.locutor" class="cm-sel"><option v-for="v in voces" :key="v.id" :value="v.id">{{ v.nombre }}</option></select></div>
          </div>
        </section>
      </div>

      <aside class="cm-lado" aria-label="Vista previa">
        <span class="cm-rot">ASÍ ARRANCA EL VIDEO</span>
        <EscenaReel tipo="intro" :apertura="{ titular: llenarEj(c.textos.titular) || c.nombre, bajada: llenarEj(c.textos.bajada) }" :foto="muestra[0]?.imagen || ''" :fuente="fuente" :ancho="260" />
        <button v-if="!editar" type="button" class="cm-sec" :disabled="armandoOtra" @click="otraVersion"><v-progress-circular v-if="armandoOtra" indeterminate size="16" width="2" /><v-icon v-else size="18">mdi-refresh</v-icon>Otra versión</button>
      </aside>
    </div>

    <div class="cm-pieza cm-pie">
      <span class="cm-s cm-ancho">{{ editar ? "Los videos ya hechos con esta campaña no cambian." : "Queda en Mis campañas: la usás cuando quieras y la apagás cuando termina." }}</span>
      <p v-if="error" class="cm-mal" role="alert">{{ error }}</p>
      <button type="button" class="cm-sec cm-sec--alto" :disabled="guardando || !valida" @click="guardar(false)">Guardar</button>
      <button type="button" class="cm-pri" :disabled="guardando || !valida" @click="guardar(true)"><v-progress-circular v-if="guardando" indeterminate size="18" width="2" />Guardar y armar el video<v-icon size="18">mdi-chevron-right</v-icon></button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import EscenaReel from "@/modules/admin/components/contenidos/EscenaReel.vue";
import { pesos } from "@/modules/admin/components/contenidos/campanas";
import { armarBorrador, crearCampana, guardarCampana } from "@/modules/admin/services/contenidos.service";

const props = defineProps({
  fuente: { type: Object, default: null },
  // videos de GET /recursos (estilos, voces y músicas habilitados)
  recursos: { type: Object, required: true },
  catalogo: { type: Array, default: () => [] },
  // GET /campanas: { autonomia, perfil, ia }
  estado: { type: Object, required: true },
  // Una campaña suya para editar (de GET /campanas); null = nueva desde una frase.
  editar: { type: Object, default: null },
});
const emit = defineEmits(["guardada", "revisando", "estrategia", "cerrar"]);

const VENTANAS = { libre: "Siempre", recurrente: "Cada tanto", fija: "Con fecha" };
const REGLAS = { manual: "Los elijo al armar", descuento: "Los que están en oferta", masVendidos: "Los más vendidos", nuevos: "Los últimos que cargué", conCuotas: "Los que tienen cuotas", categoria: "De una categoría" };
const RESUMEN = [["vende", "Vendés"], ["distingue", "Te distingue"], ["contacto", "Te contactan por"], ["evitar", "Nunca decimos"]];
const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

const etapa = ref(props.editar ? "revision" : "pedido");
const pedido = ref("");
const origen = ref("");
const error = ref("");
const guardando = ref(false);
const armandoOtra = ref(false);
const variante = ref(0);
const c = reactive(vacia());

function vacia() {
  return { activa: true, nombre: "", objetivo: "", tono: "cercano", ventana: { tipo: "libre", cuando: "", fecha: "", hasta: "" },
    productos: { regla: "manual", n: 3, filtro: "" }, estilo: "", musica: null, voz: { locutor: "", ritmo: "normal" },
    textos: { titular: "", bajada: "", etiqueta: "", vozIntro: "", vozItem: "", vozCierre: "", llamado: "", caption: "" } };
}
function cargar(x) {
  const v = vacia();
  Object.assign(c, v, JSON.parse(JSON.stringify({
    activa: x.activa !== false, nombre: x.nombre, objetivo: x.objetivo || "", tono: x.tono || "cercano",
    ventana: { ...v.ventana, ...x.ventana }, productos: { ...v.productos, ...x.productos },
    estilo: x.estilo, musica: x.musica ?? null, voz: { ...v.voz, ...x.voz }, textos: { ...v.textos, ...x.textos },
  })));
}
watch(etapa, (e) => emit("revisando", e !== "pedido"), { immediate: true });

const estilos = computed(() => props.recursos.estilos || []);
const musicas = computed(() => props.recursos.musicas || []);
const voces = computed(() => props.recursos.voces || []);
const hayLugar = computed(() => (props.estado.autonomia?.quedan ?? 1) > 0);
const tieneEstrategia = computed(() => RESUMEN.some(([k]) => props.estado.perfil?.[k]));
const valida = computed(() => c.nombre.trim().length >= 2 && (c.textos.titular.trim() || c.textos.vozIntro.trim())
  && (c.ventana.tipo !== "fija" || c.ventana.fecha) && (c.ventana.tipo !== "recurrente" || c.ventana.cuando.trim().length >= 2)
  && (c.productos.regla !== "categoria" || c.productos.filtro.trim()));
// Una voz o un estilo que la pantalla no ofrece (habilitados de otro rubro) pasan al primero que sí.
function ajustar() {
  if (voces.value.length && !voces.value.some((v) => v.id === c.voz.locutor)) c.voz.locutor = (voces.value.find((v) => v.porDefecto) || voces.value[0]).id;
  if (estilos.value.length && !estilos.value.some((e) => e.id === c.estilo)) c.estilo = (estilos.value.find((e) => e.porDefecto) || estilos.value[0]).id;
}
if (props.editar) { cargar(props.editar); ajustar(); }
const numero = (n) => Number(n || 0).toFixed(2).replace(".", ",");

// Ideas a partir de lo que más vende el catálogo: las tres categorías con más productos.
const ideas = computed(() => {
  const n = {};
  for (const p of props.catalogo) if (p.categoria) n[p.categoria] = (n[p.categoria] || 0) + 1;
  const top = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k.toLowerCase());
  return [top[0] && `Promo de ${top[0]} esta semana`, top[1] && `Liquidación de ${top[1]}`, top[2] && `Llegaron ${top[2]} nuevos`].filter(Boolean);
});

// Productos de muestra según la regla (los reales los elige el creador al armar el video).
const muestra = computed(() => {
  const ps = props.catalogo.filter((p) => p.precio != null);
  const r = c.productos.regla;
  const claves = String(c.productos.filtro || "").toLowerCase().split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  let l = ps;
  if (r === "descuento") l = ps.filter((p) => p.precioAnterior > p.precio);
  else if (r === "conCuotas") l = ps.filter((p) => p.cuotas);
  else if (r === "categoria" && claves.length) l = ps.filter((p) => claves.some((k) => `${p.categoria} ${p.titulo}`.toLowerCase().includes(k)));
  else if (r === "masVendidos") l = [...ps].sort((a, b) => (b.vendidos30d || 0) - (a.vendidos30d || 0));
  return (l.length ? l : ps).slice(0, Math.min(6, Math.max(1, Number(c.productos.n) || 3)));
});
const local = computed(() => String(props.fuente?.marca?.nombre || "tu local").toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase()));
function llenarEj(t, p = muestra.value[0]) {
  const off = p && p.precioAnterior > p.precio ? Math.round((1 - p.precio / p.precioAnterior) * 100) : null;
  const x = { local: local.value, producto: p?.titulo, precio: p ? pesos(p.precio) : null, antes: off ? pesos(p.precioAnterior) : null, off,
    productos: muestra.value.map((m) => m.titulo).slice(0, 3).join(", "), n: muestra.value.length, categoria: p?.categoria?.toLowerCase() };
  return String(t || "").replace(/\{(\w+)\}/g, (m, k) => (x[k] != null ? String(x[k]) : m));
}

const muestraParaIa = () => props.catalogo.slice(0, 30).map((p) => ({ titulo: p.titulo, categoria: p.categoria || null }));
const mensaje = (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || "No se pudo.";

async function armar(otra = false) {
  if (pedido.value.trim().length < 4) return;
  error.value = "";
  if (!otra) etapa.value = "armando";
  try {
    const r = await armarBorrador(pedido.value.trim(), { productos: muestraParaIa(), variante: variante.value });
    cargar(r.campana);
    ajustar();
    origen.value = r.origen;
    etapa.value = "revision";
  } catch (e) {
    error.value = mensaje(e);
    if (!otra) etapa.value = "pedido";
  }
}
async function otraVersion() {
  armandoOtra.value = true;
  variante.value += 1;
  await armar(true);
  armandoOtra.value = false;
}

// Lo que viaja: sólo los campos de la ventana que corresponden a su tipo.
function cuerpo() {
  const v = c.ventana;
  const ventana = v.tipo === "fija" ? { tipo: "fija", fecha: v.fecha, ...(v.hasta ? { hasta: v.hasta } : {}) }
    : v.tipo === "recurrente" ? { tipo: "recurrente", cuando: v.cuando } : { tipo: "libre" };
  const p = c.productos;
  const productos = { regla: p.regla, n: Math.min(6, Math.max(1, Number(p.n) || 3)), ...(p.regla === "categoria" ? { filtro: p.filtro } : {}), ...(p.regla === "manual" && p.propone ? { propone: p.propone } : {}) };
  return { activa: c.activa, nombre: c.nombre.trim(), objetivo: c.objetivo, tono: c.tono, ventana, productos, estilo: c.estilo, musica: c.musica || null, voz: c.voz, textos: c.textos };
}
async function guardar(armarVideo) {
  error.value = "";
  guardando.value = true;
  try {
    const guardada = props.editar ? await guardarCampana(props.editar.id, cuerpo()) : await crearCampana(cuerpo());
    emit("guardada", { campana: guardada, armar: armarVideo });
    if (!props.editar) { etapa.value = "pedido"; pedido.value = ""; origen.value = ""; variante.value = 0; }
  } catch (e) {
    error.value = e?.response?.data?.codigo === "tope_campanas" ? `Tenés ${props.estado.autonomia?.tope} campañas prendidas, el máximo. Apagá una en Mis campañas o guardala apagada.` : mensaje(e);
  } finally { guardando.value = false; }
}
function cerrar() {
  if (props.editar) { emit("cerrar"); return; }
  etapa.value = "pedido";
  error.value = "";
}
</script>

<style>
/* Marca POS 360 como el creador (CreadorCampanas): primario #1488d1, piezas blancas. */
.cm { --cm-pri: #1488d1; --cm-bg: rgba(20, 136, 209, .1); --cm-mal: #c2271b; --cm-aviso: #8a5300; }
:is(.v-theme--dark, .v-theme--adminDark) .cm { --cm-pri: #3aa5e6; --cm-bg: rgba(58, 165, 230, .15); --cm-mal: #ff7a6e; --cm-aviso: #f2b45a; }
.cm .num { font-variant-numeric: tabular-nums; }
.cm button { font-family: inherit; }
.cm-pieza, .cm-tarjeta { background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 14px; padding: 18px 20px; }
.cm-tarjeta { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
.cm-tarjeta__izq { flex: 999 1 480px; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.cm-tarjeta__der { flex: 1 1 250px; display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 12px; background: var(--sp-hover); border: 1px solid var(--sp-linea); }
.cm-marca { align-self: flex-start; font-size: 12px; font-weight: 900; letter-spacing: .08em; color: var(--cm-pri); background: var(--cm-bg); padding: 4px 10px; border-radius: 6px; }
.cm h2 { margin: 0; font-size: 22px; font-weight: 900; line-height: 1.2; }
.cm h3 { margin: 0; font-size: 16px; font-weight: 900; }
.cm-rot { font-size: 12px; font-weight: 800; color: var(--sp-suave); letter-spacing: .04em; }
.cm-tarjeta textarea { width: 100%; box-sizing: border-box; resize: none; padding: 12px 14px; border-radius: 10px; border: 2px solid var(--cm-pri); background: var(--sp-caja); color: var(--sp-texto); font: 500 16px/1.4 Inter, sans-serif; outline: 0; }
.cm-ideas { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; font-weight: 700; color: var(--sp-suave); }
.cm-ideas button { min-height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--sp-borde); background: var(--sp-hover); color: var(--sp-texto); font-size: 14px; cursor: pointer; }
.cm-ideas button:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, .08); }
.cm-fila { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.cm-fila--entre { justify-content: space-between; }
.cm-fila--abajo { align-items: flex-end; }
.cm-ancho { flex: 1 1 240px; min-width: 0; }
.cm-pri { display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 0 20px; border: 0; border-radius: 10px; background: var(--cm-pri); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; }
.cm-pri:disabled { opacity: .5; cursor: default; }
.cm-sec { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font-size: 14px; font-weight: 800; cursor: pointer; }
.cm-sec--alto { min-height: 46px; padding: 0 18px; font-size: 15px; }
.cm-sec:disabled { opacity: .5; cursor: default; }
.cm-lnk { border: 0; background: none; color: var(--cm-pri); font-weight: 800; font-size: 14px; cursor: pointer; padding: 0; }
.cm-pri:focus-visible, .cm-sec:focus-visible, .cm-lnk:focus-visible, .cm-ideas button:focus-visible, .cm-seg button:focus-visible { outline: 2px solid var(--cm-pri); outline-offset: 2px; }
.cm-s { font-size: 14px; color: var(--sp-suave); }
.cm-dato { font-size: 14px; line-height: 1.45; color: var(--sp-suave); }
.cm-dato b { color: var(--sp-texto); }
.cm-aviso { margin: 0; font-size: 14px; font-weight: 700; color: var(--cm-aviso); }
.cm-mal { margin: 0; font-size: 14px; font-weight: 700; color: var(--cm-mal); }
.cm-grande { font-size: 19px; }
.cm-armando { flex-direction: column; gap: 12px; }
.cm-hueso { height: 14px; border-radius: 7px; background: var(--sp-linea); }
.cm-rev { display: flex; flex-direction: column; gap: 14px; }
.cm-cab { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.cm-cab__t { flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cm-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800; color: var(--cm-pri); background: var(--cm-bg); padding: 6px 10px; border-radius: 8px; }
.cm-chip--gris { color: var(--sp-suave); background: var(--sp-hover); }
.cm-cuerpo { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
.cm-col { flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.cm-col .cm-pieza { display: flex; flex-direction: column; gap: 10px; }
.cm-lado { flex: 1 1 270px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; position: sticky; top: 76px; }
.cm-seg { display: inline-flex; border: 1px solid var(--sp-borde); border-radius: 10px; overflow: hidden; }
.cm-seg button { min-height: 40px; padding: 0 14px; border: 0; background: var(--sp-caja); color: var(--sp-suave); font-size: 14px; font-weight: 800; cursor: pointer; }
.cm-seg button.is-on { background: var(--cm-pri); color: #fff; }
.cm-sel { height: 40px; padding: 0 10px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 600 14px Inter, sans-serif; min-width: 170px; }
.cm-prods { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
.cm-prod { display: flex; gap: 10px; align-items: center; padding: 8px; border-radius: 10px; border: 1px solid var(--sp-linea); font-size: 14px; }
.cm-prod b { display: block; font-size: 14px; line-height: 1.2; }
.cm-prod__img { width: 48px; height: 48px; border-radius: 8px; background: #fff; flex-shrink: 0; overflow: hidden; }
.cm-prod__img img { width: 100%; height: 100%; object-fit: contain; }
.cm-ej { font-size: 13px; color: var(--sp-suave); }
.cm-pie { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
@media (max-width: 900px) { .cm-lado { position: static; } }
</style>
