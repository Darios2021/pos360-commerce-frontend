<!-- Nuevo reel por campañas (spec VIDEOS-campanas-diseno.md, frente C; maqueta aprobada
     11/10). Dos estados en la misma pestaña: Campañas (tarjetas por cercanía) y Armado
     (guion entero editable en línea + reel vivo + Generar). Todo lo escribe el sistema:
     2 clics y 0 campos para lanzar. Lo que la consola no habilita no aparece: las
     campañas, estilos y voces salen de GET /recursos. Sin modales: el selector de
     productos se abre en la misma fila. -->
<template>
  <div class="cc">
    <!-- ESTADO 1: campañas -->
    <div v-if="!camp" class="cc-camps">
      <div v-for="g in grupos" :key="g.k" class="cc-grupo">
        <h2>{{ g.t }}</h2>
        <div class="cc-grilla" :class="{ 'cc-grilla--ahora': g.k === 'ahora' }">
          <button v-for="c in g.l" :key="c.id" type="button" class="cc-camp" @click="abrir(c)">
            <span class="cc-camp__mini"><EscenaReel tipo="intro" :apertura="tarjetas[c.id]?.apertura" :foto="tarjetas[c.id]?.foto" :fuente="fuente" :ancho="g.k === 'ahora' ? 96 : 62" /></span>
            <span class="cc-camp__t"><b>{{ c.nombre }}</b><span v-if="c.chip" class="cc-chip" :class="{ 'cc-chip--gris': g.k !== 'ahora' }">{{ c.chip }}</span></span>
          </button>
        </div>
      </div>
    </div>

    <!-- ESTADO 2: armado -->
    <template v-else>
      <div class="cc-armado">
        <aside class="cc-lado">
          <div class="cc-tel">
            <div class="cc-tel__pantalla">
              <div class="cc-barras"><span v-for="(e, k) in esc" :key="k" :style="{ flex: durDe(e) }"><i :style="{ width: `${avance(k)}%` }"></i></span></div>
              <EscenaReel :key="`${actual}-${clave(esc[actual])}`" class="cc-entra" v-bind="reelDe(esc[actual], angosto ? 196 : 256)" />
            </div>
          </div>
          <div v-if="conVoz" class="cc-subt"><v-icon size="18">mdi-microphone-outline</v-icon><span>{{ esc[actual]?.voz }}</span></div>
          <div class="cc-mandos">
            <button type="button" class="cc-ico" :aria-label="play ? 'Detener' : 'Reproducir'" @click="play = !play"><v-icon size="20">{{ play ? "mdi-stop" : "mdi-play" }}</v-icon></button>
            <span class="num">{{ seg(total) }}</span>
          </div>
          <button type="button" class="cc-generar cc-generar--ancho" :disabled="!puedeGenerar" @click="generar">
            <v-progress-circular v-if="creando" indeterminate size="20" width="3" />
            <v-icon v-else size="22">mdi-movie-open-outline</v-icon>Generar video
          </button>
          <span v-if="sinCupo" class="cc-cupo">Límite de {{ cupo?.nombreMes }} alcanzado</span>
        </aside>

        <div class="cc-col">
          <div class="cc-pieza cc-cab">
            <div class="cc-cab__t"><b>{{ camp.nombre }}</b><span v-if="camp.chip" class="cc-chip">{{ camp.chip }}</span></div>
            <button type="button" class="cc-lnk" @click="cerrar">Otra campaña</button>
          </div>

          <div class="cc-pieza cc-guion">
            <div class="cc-banda"><span>Guion</span><small class="num">{{ cuantos }} {{ cuantos === 1 ? "producto" : "productos" }} · {{ seg(total) }}</small></div>
            <div v-for="(e, i) in esc" :key="e.k" class="cc-esc" :class="{ 'is-activa': i === actual }">
              <button type="button" class="cc-esc__mini" aria-label="Ver escena" @click="irA(i)"><EscenaReel v-bind="reelDe(e, 52)" /></button>
              <div class="cc-esc__cuerpo">
                <template v-if="e.tipo === 'portada'">
                  <div class="cc-esc__rot">Portada · {{ seg(durDe(e)) }}</div>
                  <input v-model="e.titular" class="cc-in cc-in--tit" maxlength="40" aria-label="Titular" :class="{ 'is-cargando': cargando && !e.titular }" @input="editar(e, 'titular', i)" />
                  <input v-model="e.bajada" class="cc-in cc-in--baj" maxlength="60" aria-label="Bajada" @input="editar(e, 'bajada', i)" />
                </template>
                <template v-else-if="e.tipo === 'item'">
                  <div class="cc-esc__rot">Producto {{ nItem(i) }} · {{ seg(durDe(e)) }}</div>
                  <div class="cc-esc__prod">
                    <span class="cc-esc__nom">{{ e.prod.titulo }}</span>
                    <span class="num">{{ pesos(e.prod.precio) }}</span>
                    <template v-if="descuentoDe(e.prod)"><s class="num">{{ pesos(e.prod.precioAnterior) }}</s><span class="cc-off num">-{{ descuentoDe(e.prod) }} %</span></template>
                    <span v-if="tienePlan(e.prod)" class="cc-cuo num">{{ e.prod.cuotas.cantidad }} x {{ pesos(e.prod.cuotas.valor) }}</span>
                  </div>
                  <input v-model="e.etiqueta" class="cc-in cc-in--eti" maxlength="24" aria-label="Etiqueta" @input="editar(e, 'etiqueta', i)" />
                </template>
                <template v-else>
                  <div class="cc-esc__rot">Cierre · {{ seg(durDe(e)) }}</div>
                  <input v-model="e.llamado" class="cc-in cc-in--tit" maxlength="30" aria-label="Llamado" @input="editar(e, 'llamado', i)" />
                  <div class="cc-esc__dato">{{ datoCierre }}</div>
                </template>
                <div v-if="conVoz" class="cc-voz">
                  <v-icon size="18">mdi-microphone-outline</v-icon>
                  <textarea v-model="e.voz" class="cc-in" rows="1" maxlength="200" aria-label="Voz" :class="{ 'is-cargando': cargando && !e.voz }" @input="editar(e, 'voz', i, $event)"></textarea>
                  <div class="cc-medidor" :class="{ 'is-pasa': pasa(e) }">
                    <span class="cc-medidor__b"><i :style="{ width: `${Math.min(100, Math.round((medir(e.voz) / durDe(e)) * 100))}%` }"></i></span>
                    <span class="num">{{ seg(Math.round(medir(e.voz) * 10) / 10) }} de {{ seg(durDe(e)) }}</span>
                  </div>
                </div>
              </div>
              <div class="cc-esc__acc">
                <button type="button" class="cc-ico" title="Otra versión" aria-label="Otra versión" @click="otraVersion(i)"><v-icon size="19">mdi-refresh</v-icon></button>
                <template v-if="e.tipo === 'item'">
                  <button type="button" class="cc-ico" :class="{ 'is-on': eligiendo === e.k }" title="Cambiar producto" aria-label="Cambiar producto" @click="alternarSelector(e)"><v-icon size="19">mdi-swap-horizontal</v-icon></button>
                  <button v-if="cuantos > 1" type="button" class="cc-ico" title="Quitar" aria-label="Quitar" @click="quitar(i)"><v-icon size="19">mdi-close</v-icon></button>
                </template>
              </div>

              <!-- Selector de productos, en la misma fila -->
              <div v-if="eligiendo === e.k" class="cc-elegir">
                <div class="cc-filtros">
                  <button v-for="f in filtros" :key="f.v" type="button" class="cc-pas" :aria-pressed="filtro === f.v" @click="filtro = f.v">{{ f.t }}</button>
                  <label class="cc-busca"><v-icon size="17">mdi-magnify</v-icon><input v-model="buscar" type="search" aria-label="Buscar producto" /></label>
                </div>
                <div class="cc-prods">
                  <button v-for="p in opciones" :key="p.id" type="button" class="cc-prod" :class="{ 'is-en': enReel.has(p.id) }" :disabled="enReel.has(p.id) && p.id !== e.prod.id" @click="elegirProducto(i, p)">
                    <span class="cc-prod__img"><img :src="p.imagen" alt="" loading="lazy" /></span>
                    <em v-if="descuentoDe(p)">-{{ descuentoDe(p) }}%</em><em v-else-if="esNuevo(p)">Nuevo</em>
                    <b>{{ p.titulo }}</b><span class="num">{{ pesos(p.precio) }}</span>
                  </button>
                  <div v-if="!opciones.length" class="cc-vacio">Sin productos</div>
                </div>
              </div>
            </div>
            <button v-if="cuantos < TOPE_PRODUCTOS" type="button" class="cc-mas" @click="agregar"><v-icon size="19">mdi-plus</v-icon>Producto</button>
          </div>

          <div class="cc-pieza cc-sonido">
            <div class="cc-banda"><span>Sonido</span><small>{{ nombreMusica }}</small></div>
            <div v-if="estilos.length" class="cc-son-fila">
              <span>Estilo</span>
              <div class="cc-son-op"><button v-for="s in estilos" :key="s.id" type="button" class="cc-pas" :aria-pressed="son.paquete === s.id" @click="elegirEstilo(s)">{{ s.nombre }}</button></div>
            </div>
            <div v-if="conVoz" class="cc-son-fila">
              <span>Voz</span>
              <div class="cc-voces">
                <span v-for="v in voces" :key="v.id" class="cc-vozop" :aria-pressed="son.locutor === v.id">
                  <b role="button" tabindex="0" @click="elegirVoz(v.id)" @keydown.enter.prevent="elegirVoz(v.id)" @keydown.space.prevent="elegirVoz(v.id)">{{ v.nombre }}</b>
                  <button v-if="v.muestra" type="button" class="cc-oir" :class="{ 'is-sonando': sonando === v.id }" :aria-label="`${sonando === v.id ? 'Detener' : 'Escuchar'} ${v.nombre}`" @click="oir(v)"><v-icon size="16">{{ sonando === v.id ? "mdi-stop" : "mdi-play" }}</v-icon></button>
                </span>
              </div>
            </div>
            <div v-if="conVoz" class="cc-son-fila">
              <span>Ritmo</span>
              <div class="cc-son-op"><button v-for="r in RITMOS" :key="r.v" type="button" class="cc-pas" :aria-pressed="son.ritmo === r.v" @click="elegirRitmo(r.v)">{{ r.t }}</button></div>
            </div>
          </div>
        </div>
      </div>
      <div class="cc-pie-tel">
        <button type="button" class="cc-generar" :disabled="!puedeGenerar" @click="generar">
          <v-progress-circular v-if="creando" indeterminate size="20" width="3" />
          <v-icon v-else size="22">mdi-movie-open-outline</v-icon>Generar video
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import EscenaReel from "@/modules/admin/components/contenidos/EscenaReel.vue";
import { crearPieza, sugerirGuion } from "@/modules/admin/services/contenidos.service";
import {
  GRUPOS, LIBRE, RITMOS, TOPE_PRODUCTOS, contexto, descuentoDe, durEscena, durVoz, esNuevo, llenar, pesos,
  primeraQueEntra, propuestos, seg, sugeridos, textosLocales, tienePlan, variantesCierre, variantesItem, variantesPortada, contextoItem,
} from "@/modules/admin/components/contenidos/campanas";

const props = defineProps({
  fuente: { type: Object, default: null },
  // videos de GET /recursos: { campanas, estilos, voces, musicas, ... }
  recursos: { type: Object, required: true },
  catalogo: { type: Array, default: () => [] },
  promoIds: { type: Object, default: () => new Set() },
  cupo: { type: Object, default: null },
});
const emit = defineEmits(["generado", "error", "no-habilitado"]);
const route = useRoute();
const router = useRouter();

/* ── Campañas: las habilitadas, ya ordenadas por el servicio; "Libre" al final de Siempre ── */
const campanas = computed(() => [...(props.recursos.campanas || []), LIBRE]);
const grupos = computed(() => GRUPOS.map((g) => ({ ...g, l: campanas.value.filter((c) => (c.grupo || "siempre") === g.k) })).filter((g) => g.l.length));
const promo = () => ({ promoIds: props.promoIds });
// Tarjeta: la portada de la campaña ya llena, con la foto del primer producto propuesto.
const tarjetas = computed(() => {
  const out = {};
  for (const c of campanas.value) {
    const prods = propuestos(c, props.catalogo, promo()).slice(0, c.productos?.n || 3);
    const base = contexto(c, prods, props.fuente);
    const t = textosLocales(c, prods, props.fuente, () => 0);
    out[c.id] = { apertura: { titular: t.apertura.titular || llenar(c.nombre, base), bajada: t.apertura.bajada }, foto: prods[0]?.imagen || "" };
  }
  return out;
});

/* ── Sonido: estilos y voces habilitados; la campaña los preelige ── */
const estilos = computed(() => (props.recursos.estilos || []).filter((e) => e?.animacion));
const voces = computed(() => props.recursos.voces || []);
const conVoz = computed(() => voces.value.length > 0);
const son = reactive({ paquete: null, musica: null, locutor: null, ritmo: "normal" });
const musicaDe = (id) => (props.recursos.musicas || []).find((m) => m.id === id);
const nombreMusica = computed(() => (son.musica ? musicaDe(son.musica)?.nombre || String(son.musica).replace(/^./, (x) => x.toUpperCase()) : "Sin música"));
const cps = computed(() => voces.value.find((v) => v.id === son.locutor)?.cps);
const medir = (t) => durVoz(t, { cps: cps.value, ritmo: son.ritmo });

function sonidoDe(c) {
  const est = estilos.value.find((e) => e.id === c.estilo) || estilos.value.find((e) => e.porDefecto) || estilos.value[0] || null;
  son.paquete = est?.id || null;
  son.musica = c.musica !== undefined ? c.musica : est?.musica ?? (props.recursos.musicas || []).find((m) => m.porDefecto)?.id ?? null;
  const loc = c.voz?.locutor || est?.voz?.locutor;
  son.locutor = voces.value.some((v) => v.id === loc) ? loc : (voces.value.find((v) => v.porDefecto) || voces.value[0])?.id || null;
  son.ritmo = c.voz?.ritmo || est?.voz?.ritmo || "normal";
}
function elegirEstilo(s) {
  son.paquete = s.id;
  son.musica = s.id === camp.value?.estilo && camp.value?.musica !== undefined ? camp.value.musica : s.musica ?? null;
}
function elegirVoz(id) { son.locutor = id; reajustar(); }
function elegirRitmo(v) { son.ritmo = v; reajustar(); }

/* ── Armado ── */
const camp = ref(null);
const esc = ref([]);
const cargando = ref(false);
const creando = ref(false);
const eligiendo = ref(null);
const filtro = ref("sug");
const buscar = ref("");
const publicacion = reactive({ titulo: "", texto: "" });
let serie = 0;
const items = computed(() => esc.value.filter((e) => e.tipo === "item"));
const cuantos = computed(() => items.value.length);
const enReel = computed(() => new Set(items.value.map((e) => e.prod.id)));
const durDe = (e) => durEscena(e?.tipo, cuantos.value);
const total = computed(() => esc.value.reduce((a, e) => a + durDe(e), 0));
const nItem = (i) => esc.value.slice(0, i).filter((e) => e.tipo === "item").length + 1;
const pasa = (e) => conVoz.value && medir(e.voz) > durDe(e) + 0.05;
const sinCupo = computed(() => props.cupo?.limite != null && props.cupo.quedan <= 0);
const puedeGenerar = computed(() => !creando.value && !sinCupo.value && cuantos.value > 0 && Boolean(props.fuente) && !esc.value.some(pasa));
const nueva = (tipo, extra = {}) => ({ k: ++serie, tipo, voz: "", variante: 0, editado: {}, ...extra });
const escenaItem = (p) => nueva("item", { prod: p, etiqueta: "", caracteristicas: [] });
const datoCierre = computed(() => {
  const f = props.fuente || {};
  const wa = (f.redes || []).find((r) => r.red === "whatsapp")?.texto;
  return [(f.sucursales || [])[0]?.nombre, wa ? `WhatsApp ${wa}` : ""].filter(Boolean).join(" · ");
});
// Cierre con cuotas y medios de pago: lo decide la campaña (si habla de cuotas).
const hablaDeCuotas = (c) => c?.productos?.regla === "conCuotas" || /\{(cuotas|valorCuota)\}/.test(Object.values(c?.textos || {}).join(" "));

function abrir(c, { conRuta = true } = {}) {
  cortarMuestra();
  camp.value = c;
  sonidoDe(c);
  const prods = propuestos(c, props.catalogo, promo()).slice(0, Math.min(TOPE_PRODUCTOS, c.productos?.n || 3));
  esc.value = [nueva("portada", { titular: "", bajada: "" }), ...prods.map(escenaItem), nueva("cierre", { llamado: "" })];
  eligiendo.value = null;
  t.value = 0;
  play.value = true;
  if (conRuta && route.query.campana !== c.id) router.replace({ query: { ...route.query, vista: "nuevo", campana: c.id } });
  pedirTextos();
  window.scrollTo({ top: 0 });
}
function cerrar() {
  camp.value = null;
  esc.value = [];
  cortarMuestra();
  const { campana, vista, ...resto } = route.query;
  router.replace({ query: resto });
}

/* Textos: los escribe el servicio (POST /guion con la campaña); sin `textos` en la respuesta
   (servicio viejo, o "Libre", que no viaja), las plantillas de la campaña con las mismas reglas. */
const itemGuion = (p) => ({
  id: p.id, titulo: p.titulo, precio: p.precio, precioAnterior: p.precioAnterior,
  ...(tienePlan(p) ? { cuotas: { cantidad: p.cuotas.cantidad, valor: p.cuotas.valor } } : {}),
  descripcion: p.descripcion || undefined, categoria: p.categoria || undefined,
  stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : undefined, imagen: p.imagen,
});
function encargoBase() {
  const f = props.fuente || {};
  const c = camp.value;
  const cuotas = hablaDeCuotas(c);
  return {
    ...(c.libre ? { tipo: "destacados" } : { campana: c.id }),
    cuenta: f.cuenta, ajuste: f.ajuste, marca: f.marca, estilo: f.estilo, sellos: f.sellos, textos: f.textos,
    mediosDePago: cuotas ? f.mediosDePago || [] : [],
    sucursales: f.sucursales || [], redes: f.redes || [],
    cierre: { sucursales: true, redes: true, cuotas, llamado: true },
    ritmo: son.ritmo, locutor: son.locutor || undefined,
  };
}
let pedido = 0;
async function guion(variante = 0) {
  const prods = items.value.map((e) => e.prod);
  let textos = null;
  if (!camp.value.libre) {
    try {
      const g = await sugerirGuion({ ...encargoBase(), variante, items: prods.map(itemGuion) });
      if (g?.textos?.apertura) textos = g.textos;
    } catch (e) {
      if (e?.response?.status === 403 && e.response.data?.codigo === "recurso_no_habilitado") { emit("no-habilitado"); cerrar(); return null; }
    }
  }
  return textos || variantesLocales(prods, variante);
}
// Plantillas con rotación de variantes (respaldo de "Otra versión").
function variantesLocales(prods, variante) {
  const c = camp.value;
  const t = textosLocales(c, prods, props.fuente, medir);
  if (!variante) return t;
  const base = contexto(c, prods, props.fuente);
  // Rota entre las versiones que entran en la escena.
  const rota = (l, d) => { const ok = l.filter((x) => medir(x) <= d); const m = ok.length ? ok : l; return m[variante % Math.max(1, m.length)] || ""; };
  t.apertura.voz = rota(variantesPortada(c, base, t.apertura.titular, t.apertura.bajada), durEscena("portada"));
  t.cierre.voz = rota(variantesCierre(c, base, t.cierre.llamado), durEscena("cierre"));
  t.escenas = t.escenas.map((s, i) => ({ ...s, voz: rota(variantesItem(c, contextoItem(base, prods[i])), durEscena("item", prods.length)) }));
  return t;
}
// Aplica los textos sin pisar lo escrito a mano. `solo`: una escena (Otra versión, Cambiar producto).
function aplicar(tx, solo = null) {
  const pon = (e, campo, v) => { if (v != null && !e.editado[campo]) e[campo] = String(v); };
  for (const e of esc.value) {
    if (solo && e !== solo) continue;
    if (e.tipo === "portada") { pon(e, "titular", tx.apertura?.titular); pon(e, "bajada", tx.apertura?.bajada); pon(e, "voz", tx.apertura?.voz); }
    else if (e.tipo === "cierre") { pon(e, "llamado", tx.cierre?.llamado); pon(e, "voz", tx.cierre?.voz); }
    else {
      const s = (tx.escenas || []).find((x) => String(x.id) === String(e.prod.id));
      if (!s) continue;
      pon(e, "etiqueta", s.etiqueta);
      pon(e, "voz", s.voz);
      if (Array.isArray(s.caracteristicas)) e.caracteristicas = s.caracteristicas.filter(Boolean).slice(0, 3);
    }
  }
  if (!solo) {
    publicacion.titulo = tx.titulo || camp.value.nombre;
    publicacion.texto = tx.publicacion || "";
  }
  nextTick(crecer);
}
// Sólo vale la última respuesta completa (los pedidos de una escena no la cancelan).
async function pedirTextos(solo = null) {
  const n = solo ? pedido : ++pedido;
  const delArmado = camp.value;
  if (!solo) cargando.value = true;
  const tx = await guion(solo?.variante || 0);
  if (camp.value !== delArmado || (!solo && n !== pedido)) return;
  if (!solo) cargando.value = false;
  if (tx) aplicar(tx, solo);
}
function otraVersion(i) {
  const e = esc.value[i];
  e.variante += 1;
  e.editado = {};
  pedirTextos(e);
  irA(i);
}
// Al cambiar ritmo o voz: si una línea del sistema deja de entrar, se pide de nuevo.
function reajustar() {
  if (esc.value.some((e) => !e.editado.voz && pasa(e))) pedirTextos();
}

/* Productos */
const filtros = computed(() => [
  { v: "sug", t: "Sugeridos" }, { v: "vend", t: "Más vendidos" }, { v: "off", t: "Con descuento" }, { v: "nue", t: "Nuevos" }, { v: "cuo", t: "Con cuotas" },
]);
const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const opciones = computed(() => {
  if (eligiendo.value == null) return [];
  const l = filtro.value === "sug" ? sugeridos(camp.value, props.catalogo, promo()) : propuestos(camp.value, props.catalogo, { ...promo(), filtro: filtro.value });
  const q = normalizar(buscar.value).trim();
  return (q ? l.filter((p) => normalizar(`${p.titulo} ${p.nombre} ${p.etiqueta}`).includes(q)) : l).slice(0, 36);
});
function alternarSelector(e) {
  eligiendo.value = eligiendo.value === e.k ? null : e.k;
  filtro.value = "sug";
  buscar.value = "";
}
function elegirProducto(i, p) {
  const vieja = esc.value[i];
  if (vieja.prod.id !== p.id) {
    const e = escenaItem(p);
    esc.value.splice(i, 1, e);
    refrescar(e);
  }
  eligiendo.value = null;
  irA(i);
}
function quitar(i) {
  if (cuantos.value <= 1) return;
  esc.value.splice(i, 1);
  eligiendo.value = null;
  refrescar();
}
function agregar() {
  const p = propuestos(camp.value, props.catalogo, promo()).find((x) => !enReel.value.has(x.id));
  if (!p) return;
  const e = escenaItem(p);
  esc.value.splice(esc.value.length - 1, 0, e);
  eligiendo.value = e.k;
  filtro.value = "sug";
  buscar.value = "";
  refrescar(e);
  irA(esc.value.length - 2);
}
// Cambian los productos: textos nuevos para todo lo que no se escribió a mano (portada y
// cierre dependen de los elegidos: descuento máximo, categoría).
function refrescar() {
  for (const e of esc.value) if (!Object.keys(e.editado).length) e.variante = 0;
  t.value = Math.min(t.value, Math.max(0, total.value - 0.01));
  pedirTextos();
}

function editar(e, campo, i, ev) {
  e.editado[campo] = true;
  if (ev?.target) crecerUno(ev.target);
  if (actual.value !== i) irA(i);
}
const crecerUno = (el) => { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; };
function crecer() { document.querySelectorAll(".cc-voz textarea").forEach(crecerUno); }

/* ── Vista previa viva ── */
const t = ref(0);
const play = ref(true);
const actual = computed(() => {
  let a = 0;
  for (let i = 0; i < esc.value.length; i++) { const d = durDe(esc.value[i]); if (t.value < a + d) return i; a += d; }
  return Math.max(0, esc.value.length - 1);
});
function avance(k) {
  let a = 0;
  for (let i = 0; i < k; i++) a += durDe(esc.value[i]);
  return Math.max(0, Math.min(1, (t.value - a) / durDe(esc.value[k]))) * 100;
}
function irA(i) {
  let a = 0;
  for (let k = 0; k < i; k++) a += durDe(esc.value[k]);
  t.value = a + 0.01;
}
const reloj = setInterval(() => {
  if (!camp.value || !play.value || !esc.value.length) return;
  t.value += 0.1;
  if (t.value >= total.value) t.value = 0;
}, 100);
// El teléfono mide 270 px (210 en pantallas angostas): la escena se dibuja a ese ancho.
const consulta = window.matchMedia("(max-width: 979px)");
const angosto = ref(consulta.matches);
const alCambiarAncho = (ev) => { angosto.value = ev.matches; };
consulta.addEventListener("change", alCambiarAncho);
const clave = (e) => (e ? `${e.k}` : "");
const descripcionDe = (e) => (e.caracteristicas?.length ? e.caracteristicas.join(" · ") : e.prod?.descripcion || "");
function reelDe(e, ancho) {
  if (!e) return { tipo: "intro", fuente: props.fuente, ancho };
  if (e.tipo === "portada") return { tipo: "intro", apertura: e.titular ? { titular: e.titular, bajada: e.bajada } : null, foto: items.value[0]?.prod.imagen || "", fuente: props.fuente, ancho };
  if (e.tipo === "cierre") return { tipo: "cierre", cierre: { sucursales: true, redes: true, llamado: e.llamado || true }, fuente: props.fuente, ancho };
  return { tipo: "item", item: { ...e.prod, etiqueta: e.etiqueta, descripcion: descripcionDe(e) }, conCuotas: tienePlan(e.prod), fuente: props.fuente, ancho };
}

/* ── Muestras de voz: un solo reproductor ── */
const sonando = ref(null);
let reproductor = null;
function cortarMuestra() {
  if (reproductor) { reproductor.pause(); reproductor.removeAttribute("src"); reproductor.load(); }
  sonando.value = null;
}
function oir(v) {
  if (sonando.value === v.id) return cortarMuestra();
  cortarMuestra();
  if (!reproductor) {
    reproductor = new Audio();
    reproductor.preload = "none";
    reproductor.addEventListener("ended", () => { sonando.value = null; });
  }
  reproductor.src = v.muestra;
  sonando.value = v.id;
  reproductor.play().catch(() => { if (sonando.value === v.id) sonando.value = null; });
}

/* ── Generar ── */
async function generar() {
  if (!puedeGenerar.value) return;
  creando.value = true;
  const f = props.fuente;
  const c = camp.value;
  const portada = esc.value[0];
  const cierre = esc.value[esc.value.length - 1];
  const base = encargoBase();
  delete base.ritmo;
  delete base.locutor;
  const encargo = {
    ...base,
    plantilla: cuantos.value === 1 ? "producto" : "destacados",
    titulo: (publicacion.titulo || c.nombre).slice(0, 80),
    descripcion: publicacion.texto ? publicacion.texto.slice(0, 2200) : undefined,
    apertura: { titular: portada.titular.trim(), bajada: portada.bajada.trim() },
    textos: { ...(f.textos || {}), llamado: cierre.llamado.trim() || f.textos?.llamado },
    ...(son.paquete ? { paquete: son.paquete, musica: son.musica ?? null } : { musica: son.musica || undefined }),
    items: items.value.map((e) => ({
      ...itemGuion(e.prod),
      etiqueta: e.etiqueta.trim() || undefined,
      descripcion: descripcionDe(e).slice(0, 300) || undefined,
    })),
    voz: {
      activa: conVoz.value,
      locutor: son.locutor || undefined,
      velocidad: RITMOS.find((r) => r.v === son.ritmo)?.velocidad ?? 1,
      guion: { intro: portada.voz.trim() || undefined, items: items.value.map((e) => e.voz.trim()), cierre: cierre.voz.trim() || undefined },
    },
  };
  try {
    const p = await crearPieza(encargo);
    camp.value = null;
    esc.value = [];
    emit("generado", p);
  } catch (e) {
    if (e?.response?.status === 403 && e.response.data?.codigo === "recurso_no_habilitado") { emit("no-habilitado"); cerrar(); }
    else emit("error", e);
  } finally { creando.value = false; }
}

/* Recargar la página con ?campana= vuelve al armado cuando ya está el catálogo. */
watch(() => [route.query.campana, props.catalogo.length, campanas.value.length], ([id]) => {
  if (!id) { if (camp.value) { camp.value = null; esc.value = []; } return; }
  if (camp.value?.id === id || !props.catalogo.length) return;
  const c = campanas.value.find((x) => x.id === id);
  if (c) abrir(c, { conRuta: false });
}, { immediate: true });
watch(() => props.recursos, () => { if (camp.value && !campanas.value.some((c) => c.id === camp.value.id)) cerrar(); });

function alOcultar() { if (document.hidden) cortarMuestra(); }
document.addEventListener("visibilitychange", alOcultar);
onBeforeUnmount(() => { clearInterval(reloj); cortarMuestra(); document.removeEventListener("visibilitychange", alOcultar); consulta.removeEventListener("change", alCambiarAncho); });
</script>

<style>
/* Marca POS 360: primario #1488d1 (#3aa5e6 en oscuro), piezas blancas sobre el canvas del sistema. */
.cc { --cc-pri: #1488d1; --cc-pri-ink: #fff; --cc-pri-bg: rgba(20, 136, 209, .1); --cc-sel: #ecf6fd; --cc-ok: #157f4a; --cc-mal: #c2271b; display: flex; flex-direction: column; gap: 14px; }
:is(.v-theme--dark, .v-theme--adminDark) .cc { --cc-pri: #3aa5e6; --cc-pri-bg: rgba(58, 165, 230, .15); --cc-sel: #1d2a37; --cc-ok: #4cc485; --cc-mal: #ff7a6e; }
.cc .num { font-variant-numeric: tabular-nums; }
.cc button { font-family: inherit; }

/* Campañas */
.cc-camps { display: flex; flex-direction: column; gap: 18px; }
.cc-grupo h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; font-weight: 900; color: var(--sp-suave); margin: 0 0 8px; }
.cc-grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: 10px; }
.cc-grilla--ahora { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.cc-camp { display: flex; gap: 12px; align-items: center; text-align: left; padding: 10px; background: var(--sp-caja); border: 1.5px solid var(--sp-borde); border-radius: 14px; color: var(--sp-texto); cursor: pointer; transition: border-color .15s, transform .15s; }
.cc-camp:hover { border-color: var(--cc-pri); }
.cc-camp:active { transform: scale(.99); }
.cc-camp__mini { flex: none; display: flex; }
.cc-camp__mini .er { border-radius: 6px; box-shadow: none; }
.cc-camp__t { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.cc-camp__t b { font-size: 16px; font-weight: 800; line-height: 1.15; }
.cc-grilla--ahora .cc-camp__t b { font-size: 19px; }
.cc-chip { align-self: flex-start; display: inline-flex; padding: 2px 8px; border-radius: 7px; font-size: 12px; font-weight: 800; background: var(--cc-pri-bg); color: var(--cc-pri); white-space: nowrap; }
.cc-camp .cc-chip { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.cc-chip--gris { background: var(--sp-linea); color: var(--sp-suave); }

/* Armado */
.cc-armado { display: grid; gap: 14px; grid-template-columns: minmax(0, 1fr); align-items: start; }
.cc-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.cc-lado { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.cc-pieza { background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 14px; }
.cc-cab { display: flex; align-items: center; gap: 12px; padding: 10px 12px; }
.cc-cab__t { min-width: 0; flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; }
.cc-cab__t b { font-size: 20px; font-weight: 900; line-height: 1.1; }
.cc-cab__t .cc-chip { align-self: center; }
.cc-lnk { border: 0; background: transparent; color: var(--cc-pri); font-weight: 800; font-size: 13.5px; padding: 6px 8px; border-radius: 8px; white-space: nowrap; cursor: pointer; }
.cc-lnk:hover { background: var(--cc-pri-bg); }
.cc-guion { overflow: hidden; }
.cc-banda { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 1px solid var(--sp-linea); font-size: 13px; font-weight: 900; }
.cc-banda small { font-weight: 700; color: var(--sp-suave); font-size: 12.5px; }
.cc-esc { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; gap: 12px; padding: 12px; border-bottom: 1px solid var(--sp-linea); align-items: start; transition: background .15s; }
.cc-esc.is-activa { background: var(--cc-sel); }
.cc-esc__mini { width: 52px; border: 0; padding: 0; background: none; cursor: pointer; display: flex; }
.cc-esc__mini .er { border-radius: 5px; box-shadow: none; border: 1px solid var(--sp-borde); }
.cc-esc__cuerpo { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cc-esc__rot { font-size: 11.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; color: var(--sp-suave); }
.cc-esc__prod { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: 14px; font-weight: 700; }
.cc-esc__nom { min-width: 0; }
.cc-esc__prod s { color: var(--sp-suave); font-weight: 600; }
.cc-off { color: var(--cc-mal); font-weight: 900; }
.cc-cuo { color: var(--sp-suave); }
.cc-esc__dato { font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.cc-in { width: 100%; box-sizing: border-box; border: 1px solid transparent; background: transparent; border-radius: 8px; padding: 4px 8px; margin-left: -8px; color: var(--sp-texto); font: inherit; outline: 0; transition: border-color .15s, background .15s; }
.cc-in:hover { border-color: var(--sp-borde); }
.cc-in:focus { border-color: var(--cc-pri); background: var(--sp-caja); }
.cc-in--tit { font-size: 19px; font-weight: 900; letter-spacing: -.01em; }
.cc-in--baj { font-size: 14.5px; font-weight: 600; color: var(--sp-suave); }
.cc-in--eti { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; color: var(--cc-pri); }
.cc-in.is-cargando { background: linear-gradient(90deg, var(--sp-linea) 0%, var(--sp-hover) 50%, var(--sp-linea) 100%); background-size: 200% 100%; animation: cc-esqueleto 1.2s linear infinite; min-height: 28px; }
@keyframes cc-esqueleto { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.cc-voz { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 4px 6px; align-items: start; background: var(--cc-pri-bg); border-radius: 10px; padding: 6px 8px 7px; }
.cc-voz > .v-icon { margin-top: 6px; color: var(--cc-pri); }
.cc-voz .cc-in { margin-left: 0; font-size: 14.5px; font-weight: 600; resize: none; overflow: hidden; line-height: 1.35; padding: 4px 6px; min-height: 30px; display: block; }
.cc-medidor { grid-column: 2; display: flex; align-items: center; gap: 8px; padding: 0 6px; }
.cc-medidor__b { flex: 1; height: 4px; border-radius: 2px; background: var(--sp-linea); overflow: hidden; max-width: 220px; }
.cc-medidor__b i { display: block; height: 100%; background: var(--cc-ok); border-radius: 2px; transition: width .2s; }
.cc-medidor span:last-child { font-size: 12px; font-weight: 800; color: var(--cc-ok); white-space: nowrap; }
.cc-medidor.is-pasa .cc-medidor__b i { background: var(--cc-mal); }
.cc-medidor.is-pasa span:last-child { color: var(--cc-mal); }
.cc-esc__acc { display: flex; flex-direction: column; gap: 4px; }
.cc-ico { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); display: grid; place-items: center; color: var(--sp-suave); cursor: pointer; }
.cc-ico .v-icon { color: inherit; }
.cc-ico:hover, .cc-ico.is-on { color: var(--cc-pri); border-color: var(--cc-pri); }

.cc-elegir { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 12px; border: 1px dashed var(--sp-borde); }
.cc-filtros { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cc-pas { border: 1px solid var(--sp-borde); background: var(--sp-caja); border-radius: 9px; padding: 4px 10px; font-size: 13px; font-weight: 700; color: var(--sp-suave); cursor: pointer; }
.cc-pas[aria-pressed="true"] { background: var(--cc-pri); border-color: var(--cc-pri); color: var(--cc-pri-ink); }
.cc-busca { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--sp-borde); border-radius: 9px; padding: 2px 8px; background: var(--sp-caja); color: var(--sp-suave); }
.cc-busca .v-icon { color: inherit; }
.cc-busca input { width: 130px; border: 0; outline: 0; background: transparent; color: var(--sp-texto); font: 600 13px Inter, sans-serif; padding: 3px 0; }
.cc-prods { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; max-height: 420px; overflow-y: auto; }
.cc-prod { border: 1.5px solid var(--sp-borde); border-radius: 10px; padding: 5px; background: var(--sp-caja); text-align: left; display: flex; flex-direction: column; gap: 3px; position: relative; color: var(--sp-texto); cursor: pointer; }
.cc-prod:hover:not(:disabled) { border-color: var(--cc-pri); }
.cc-prod:disabled { opacity: .5; cursor: default; }
.cc-prod.is-en { border-color: var(--cc-pri); background: var(--cc-sel); }
.cc-prod__img { aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #fff; display: grid; place-items: center; }
.cc-prod__img img { width: 100%; height: 100%; object-fit: contain; display: block; }
.cc-prod b { font-size: 12.5px; line-height: 1.15; font-weight: 800; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cc-prod span { font-size: 12.5px; font-weight: 700; color: var(--sp-suave); }
.cc-prod em { position: absolute; top: 9px; left: 9px; font-style: normal; font-size: 10.5px; font-weight: 900; padding: 1px 5px; border-radius: 5px; background: var(--cc-pri); color: var(--cc-pri-ink); }
.cc-vacio { grid-column: 1 / -1; padding: 18px; text-align: center; font-weight: 700; color: var(--sp-suave); }
.cc-mas { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 0; background: transparent; color: var(--cc-pri); font-weight: 800; font-size: 14px; width: 100%; cursor: pointer; }
.cc-mas .v-icon { color: inherit; }
.cc-mas:hover { background: var(--cc-pri-bg); }

.cc-son-fila { display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 10px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--sp-linea); }
.cc-son-fila:last-child { border-bottom: 0; }
.cc-son-fila > span { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; color: var(--sp-suave); }
.cc-son-op { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cc-voces { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.cc-voces::-webkit-scrollbar { display: none; }
.cc-vozop { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--sp-borde); background: var(--sp-caja); border-radius: 9px; padding: 3px 4px 3px 10px; font-size: 13px; font-weight: 700; color: var(--sp-suave); white-space: nowrap; }
.cc-vozop b { font-weight: 700; cursor: pointer; }
.cc-vozop[aria-pressed="true"] { border-color: var(--cc-pri); color: var(--cc-pri); background: var(--cc-pri-bg); }
.cc-oir { width: 24px; height: 24px; border-radius: 6px; border: 0; display: grid; place-items: center; background: transparent; color: inherit; cursor: pointer; }
.cc-oir .v-icon { color: inherit; }
.cc-oir.is-sonando { background: var(--cc-pri); color: var(--cc-pri-ink); }

/* Teléfono */
.cc-tel { width: 270px; max-width: 100%; border-radius: 14px; padding: 7px; background: #0e0e10; }
.cc-tel__pantalla { position: relative; border-radius: 9px; overflow: hidden; display: flex; }
.cc-tel__pantalla .er { width: 100% !important; height: auto !important; aspect-ratio: 9 / 16; border-radius: 0; box-shadow: none; }
.cc-barras { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; gap: 3px; z-index: 5; }
.cc-barras span { height: 3px; border-radius: 2px; background: rgba(255, 255, 255, .45); overflow: hidden; }
.cc-barras i { display: block; height: 100%; background: #fff; }
.cc-entra { animation: cc-entra .35s ease-out both; }
@keyframes cc-entra { from { opacity: .3; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .cc-entra, .cc-in.is-cargando { animation: none; } }
.cc-subt { width: 270px; max-width: 100%; display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 6px; font-size: 13.5px; font-weight: 600; min-height: 40px; }
.cc-subt .v-icon { color: var(--cc-pri); margin-top: 1px; }
.cc-mandos { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--sp-suave); }
.cc-generar { width: 100%; max-width: 320px; border: 0; border-radius: 12px; background: var(--cc-pri); color: var(--cc-pri-ink) !important; font-weight: 900; font-size: 16px; padding: 14px 16px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: filter .15s; }
.cc-generar .v-icon { color: inherit !important; }
.cc-generar:hover:not(:disabled) { filter: brightness(1.08); }
.cc-generar:disabled { opacity: .45; cursor: default; }
.cc-cupo { font-size: 12.5px; font-weight: 800; color: var(--cc-mal); }
.cc-pie-tel { display: none; }

@media (min-width: 980px) {
  .cc-armado { grid-template-columns: minmax(0, 1fr) 320px; }
  .cc-lado { position: sticky; top: 70px; order: 2; }
}
@media (max-width: 979px) {
  .cc-tel, .cc-subt { width: 210px; }
  .cc-generar--ancho { display: none; }
  /* Barra fija al pie (el layout de la app corta el sticky); en el teléfono va sobre la navegación del sistema. */
  .cc-pie-tel { display: flex; justify-content: center; position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; background: var(--sp-fondo); padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -6px 16px rgba(0, 0, 0, .08); }
  .pos-main--mobile .cc-pie-tel { bottom: calc(72px + env(safe-area-inset-bottom, 0px)); padding-bottom: 10px; }
  .cc:has(.cc-pie-tel) { padding-bottom: 84px; }
}
@media (max-width: 600px) {
  .cc-grilla, .cc-grilla--ahora { grid-template-columns: minmax(0, 1fr); }
  .cc-esc { grid-template-columns: 44px minmax(0, 1fr) auto; gap: 10px; padding: 10px; }
  .cc-esc__mini { width: 44px; }
  .cc-busca { margin-left: 0; }
}
</style>
