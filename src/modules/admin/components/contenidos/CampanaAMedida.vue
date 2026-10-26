<!-- Campaña a medida (lienzo aprobado 26/10, https://claude.ai/artifact/L7RB6tkZ67n9FnD8Qmr2JW:
     1 · la idea, 2 · revisión con productos, 3 · revisión de kit o servicio). El comercio
     cuenta en una frase qué quiere ofrecer y ve en el momento qué productos de su stock
     coinciden; la IA elige productos concretos por id (no una categoría), dice qué no
     encontró y escribe los textos. La revisión pide sólo Nombre, Qué ofrece el video,
     Precio y Vigencia: los textos, la música y la voz se ajustan al armar el video.
     Con `editar` abre una campaña ya guardada. Vista completa, sin modales. -->
<template>
  <!-- 1 · La idea -->
  <section v-if="etapa === 'pedido'" class="cm cm-tarjeta" aria-labelledby="cm-t">
    <div class="cm-tarjeta__izq">
      <span class="cm-marca">CAMPAÑA A MEDIDA</span>
      <label id="cm-t" for="cm-pedido" class="cm-pregunta">¿Qué querés ofrecer?</label>
      <textarea id="cm-pedido" v-model="pedido" rows="2" maxlength="300" placeholder="Ej.: fundas para celular, o cerco eléctrico instalado" @keydown.enter.exact.prevent="armar()"></textarea>
      <div v-if="!pedido.trim() && ideas.length" class="cm-ideas">
        <span>Ideas:</span>
        <button v-for="i in ideas" :key="i" type="button" @click="pedido = i">{{ i }}</button>
      </div>

      <div v-if="palabras.length" class="cm-bloque">
        <span class="cm-rot">EN TU STOCK</span>
        <div v-if="coinciden.length" class="cm-prods">
          <div v-for="p in coinciden.slice(0, 6)" :key="p.id" class="cm-prod cm-prod--on">
            <span class="cm-prod__img"><img v-if="p.imagen" :src="p.imagen" alt="" loading="lazy" /></span>
            <span><b>{{ p.titulo }}</b><span class="cm-s num">{{ unidades(p) }}{{ p.precio != null ? ` · ${pesos(p.precio)}` : "" }}</span></span>
          </div>
        </div>
        <span class="cm-s">{{ coinciden.length
          ? `Coinciden ${coinciden.length} ${coinciden.length === 1 ? "producto" : "productos"} con lo que escribiste. La campaña arranca con estos; después sumás o sacás.`
          : "Ningún producto del stock tiene esas palabras en el nombre. La IA busca entre parecidos y, si no hay, te avisa." }}</span>
      </div>

      <div class="cm-bloque">
        <span class="cm-rot">EL VIDEO OFRECE</span>
        <div class="cm-modos" role="group" aria-label="Qué ofrece el video">
          <button v-for="m in QUIERE" :key="m.v" type="button" class="cm-modo" :class="{ 'cm-modo--ia': m.v === 'ia' }" :aria-pressed="quiere === m.v" @click="quiere = m.v">
            <b>{{ m.t }}</b><span>{{ m.d }}</span>
          </button>
        </div>
      </div>

      <div class="cm-fila">
        <button type="button" class="cm-pri cm-pri--alto" :disabled="pedido.trim().length < 4 || !hayLugar" @click="armar()"><v-icon size="20">mdi-creation-outline</v-icon>Armar la campaña</button>
        <span class="cm-s">{{ estado.ia?.activa ? `Con IA · quedan USD ${numero(estado.ia.quedaUsd)} este mes` : "Sin IA: sale de plantilla con los productos que coinciden" }}</span>
      </div>
      <p v-if="!hayLugar" class="cm-aviso">Tenés {{ estado.autonomia.tope }} campañas prendidas, el máximo. Apagá una en Mis campañas para sumar otra.</p>
      <p v-if="error" class="cm-mal" role="alert">{{ error }}</p>
    </div>
    <aside class="cm-tarjeta__der">
      <div class="cm-lado-caja">
        <b>Lo que hace la IA</b>
        <ol class="cm-pasos">
          <li>Elige del stock los productos que nombraste, con su foto, su precio y cuántos quedan.</li>
          <li>Si no hay alguno, te lo dice en vez de poner otra cosa.</li>
          <li>Escribe el nombre, la portada, lo que dice la voz y la publicación con tu estrategia.</li>
        </ol>
      </div>
      <div class="cm-lado-caja cm-lado-caja--gris">
        <div class="cm-fila cm-fila--entre"><b>Estrategia</b><button type="button" class="cm-lnk" @click="$emit('estrategia')">Editar</button></div>
        <template v-if="tieneEstrategia">
          <div v-for="[k, t] in RESUMEN" v-show="estado.perfil?.[k]" :key="k" class="cm-dato"><b>{{ t }}</b> {{ estado.perfil?.[k] }}</div>
        </template>
        <p v-else class="cm-s" style="margin: 0">Contanos qué vendés y qué te distingue: cada campaña va a hablar como vos.</p>
      </div>
    </aside>
  </section>

  <section v-else-if="etapa === 'armando'" class="cm cm-tarjeta cm-armando" aria-live="polite">
    <div class="cm-fila"><v-progress-circular indeterminate size="26" width="3" color="#1488d1" /><b class="cm-grande">Armando tu campaña…</b></div>
    <span class="cm-s">Eligiendo productos de tu stock y escribiendo lo que dice el video.</span>
    <div class="cm-hueso" style="width: 70%"></div><div class="cm-hueso" style="width: 90%"></div><div class="cm-hueso" style="width: 55%"></div>
  </section>

  <!-- 2 y 3 · La revisión -->
  <div v-else class="cm cm-rev">
    <div class="cm-cab">
      <button type="button" class="cm-sec" @click="cerrar"><v-icon size="18">mdi-chevron-left</v-icon>{{ editar ? "Mis campañas" : "Volver a la idea" }}</button>
      <div class="cm-cab__t">
        <label for="cm-nombre" class="cm-rot">NOMBRE</label>
        <input id="cm-nombre" v-model="c.nombre" class="cm-nombre" maxlength="40" />
      </div>
      <span v-if="origen" class="cm-chip" :class="{ 'cm-chip--gris': origen !== 'ia' }"><v-icon v-if="origen === 'ia'" size="15">mdi-creation-outline</v-icon>{{ origen === "ia" ? "Armada con IA" : "De plantilla" }}</span>
    </div>

    <div v-if="avisoIa" class="cm-nota" :class="{ 'cm-nota--ambar': !elegidos.length || faltan }" role="status">
      <v-icon size="20">{{ origen === "ia" ? "mdi-creation-outline" : "mdi-information-outline" }}</v-icon>
      <span><b>{{ origen === "ia" ? "La IA dice:" : "Aviso:" }}</b> {{ avisoIa }}</span>
    </div>
    <div v-if="perdidos" class="cm-nota cm-nota--ambar" role="status">
      <v-icon size="20">mdi-information-outline</v-icon>
      <span>{{ perdidos === 1 ? "Un producto de esta campaña ya no está" : `${perdidos} productos de esta campaña ya no están` }} en stock: quedó afuera. Elegí otro abajo.</span>
    </div>

    <div class="cm-cuerpo">
      <div class="cm-col">
        <section class="cm-pieza">
          <div class="cm-fila cm-fila--entre">
            <h3>Qué ofrece el video</h3>
            <div class="cm-seg" role="group" aria-label="Qué ofrece el video">
              <button type="button" :class="{ 'is-on': c.modo === 'productos' }" :aria-pressed="c.modo === 'productos'" @click="ponerModo('productos')">Productos</button>
              <button type="button" :class="{ 'is-on': c.modo === 'kit' }" :aria-pressed="c.modo === 'kit'" @click="ponerModo('kit')">Kit o servicio</button>
            </div>
          </div>

          <!-- Productos sueltos: una escena cada uno, en este orden -->
          <template v-if="c.modo === 'productos'">
            <div v-if="elegidos.length" class="cm-lista">
              <div v-for="(p, i) in elegidos" :key="p.id" class="cm-fila-prod">
                <span class="cm-n num">{{ i + 1 }}</span>
                <span class="cm-prod__img cm-prod__img--g"><img v-if="p.imagen" :src="p.imagen" alt="" loading="lazy" /></span>
                <span class="cm-fila-prod__t"><b>{{ p.titulo }}</b><span class="cm-s">{{ [p.categoria, unidades(p)].filter(Boolean).join(" · ") }}</span></span>
                <span class="cm-precio num" :class="{ 'is-off': !c.conPrecio }">{{ pesos(p.precio) }}</span>
                <button type="button" class="cm-ico" :aria-label="`Quitar ${p.titulo}`" @click="quitar(p)"><v-icon size="18">mdi-close</v-icon></button>
              </div>
            </div>
            <p v-else class="cm-mal" role="status">Todavía no hay productos. Buscalos en el stock.</p>
            <p v-if="elegidos.length > TOPE" class="cm-aviso">El video muestra hasta {{ TOPE }} productos: van los primeros {{ TOPE }}.</p>
          </template>

          <!-- Kit o servicio: una escena con lo que incluye -->
          <template v-else>
            <div class="ct-campo"><label for="cm-kit">Nombre del kit o servicio</label><input id="cm-kit" v-model="c.kit.nombre" maxlength="90" :placeholder="c.nombre" /></div>
            <div class="cm-bloque">
              <span class="cm-rot">INCLUYE, DEL STOCK</span>
              <div class="cm-prods">
                <label v-for="p in candidatosKit" :key="p.id" class="cm-prod cm-prod--tilde" :class="{ 'cm-prod--on': incluido(p) }">
                  <input type="checkbox" :checked="incluido(p)" @change="alternar(p)" />
                  <span class="cm-prod__img"><img v-if="p.imagen" :src="p.imagen" alt="" loading="lazy" /></span>
                  <span><b>{{ p.titulo }}</b><span class="cm-s num">{{ unidades(p) }}</span></span>
                </label>
              </div>
            </div>
            <div class="ct-campo"><label for="cm-extra">Y además (servicio)</label><input id="cm-extra" v-model="c.kit.extra" maxlength="120" placeholder="Instalación y garantía" /></div>
            <div v-if="fotos.length" class="cm-bloque">
              <span class="cm-rot">FOTO DEL VIDEO</span>
              <div class="cm-fotos">
                <button v-for="p in fotos" :key="p.id" type="button" class="cm-foto" :aria-pressed="fotoKit?.id === p.id" :aria-label="`Usar la foto de ${p.titulo}`" @click="c.kit.foto = String(p.id)"><img :src="p.imagen" alt="" loading="lazy" /></button>
              </div>
            </div>
            <p v-else-if="elegidos.length" class="cm-mal">Ninguno de los incluidos tiene foto: sumá uno con foto, el video la necesita.</p>
          </template>

          <!-- Agregar del stock (los dos modos) -->
          <div class="cm-buscar">
            <label class="cm-busca"><v-icon size="18">mdi-magnify</v-icon><input v-model="buscar" type="search" aria-label="Agregar del stock" placeholder="Agregar del stock: buscá por nombre" /></label>
            <div v-if="encontrados.length" class="cm-prods">
              <button v-for="p in encontrados" :key="p.id" type="button" class="cm-prod cm-prod--btn" @click="agregar(p)">
                <span class="cm-prod__img"><img v-if="p.imagen" :src="p.imagen" alt="" loading="lazy" /></span>
                <span><b>{{ p.titulo }}</b><span class="cm-s num">{{ unidades(p) }}{{ p.precio != null ? ` · ${pesos(p.precio)}` : "" }}</span></span>
                <v-icon size="18" class="cm-mas">mdi-plus</v-icon>
              </button>
            </div>
            <span v-else-if="buscar.trim().length >= 2" class="cm-s">Nada en el stock con “{{ buscar }}”.</span>
            <span v-else-if="sugeridos.length && c.modo === 'productos'" class="cm-s">Sugeridos:
              <template v-for="(p, i) in sugeridos" :key="p.id"><button type="button" class="cm-lnk" @click="agregar(p)">{{ p.titulo }}</button>{{ i < sugeridos.length - 1 ? " · " : "" }}</template>
            </span>
          </div>
        </section>

        <section class="cm-pieza cm-pieza--fila">
          <div class="cm-bloque">
            <h3>Precio</h3>
            <div class="cm-seg" role="group" aria-label="Precio">
              <button type="button" :class="{ 'is-on': c.conPrecio }" :aria-pressed="c.conPrecio" @click="ponerPrecio(true)">{{ c.modo === "kit" ? "Precio del kit" : "Se muestra" }}</button>
              <button type="button" :class="{ 'is-on': !c.conPrecio }" :aria-pressed="!c.conPrecio" @click="ponerPrecio(false)">Sin precio</button>
            </div>
            <div v-if="c.modo === 'kit' && c.conPrecio" class="ct-campo cm-angosto"><label for="cm-pk">Precio del kit</label><input id="cm-pk" v-model.number="c.kit.precio" class="num" type="number" min="0" inputmode="numeric" /></div>
            <span class="cm-s cm-angosto">{{ !c.conPrecio ? "El video no dice ningún monto e invita a consultar." : c.modo === "kit" ? `La suma de lo incluido es ${pesos(sumaKit)}.` : "El de cada producto, al día en que se arma el video." }}</span>
          </div>
          <div class="cm-bloque">
            <h3>Vigencia</h3>
            <div class="cm-seg" role="group" aria-label="Vigencia">
              <button v-for="(t, k) in VENTANAS" :key="k" type="button" :class="{ 'is-on': c.ventana.tipo === k }" :aria-pressed="c.ventana.tipo === k" @click="c.ventana.tipo = k">{{ t }}</button>
            </div>
            <div v-if="c.ventana.tipo === 'recurrente'" class="ct-campo"><label for="cm-cuando">Cuándo</label><input id="cm-cuando" v-model="c.ventana.cuando" maxlength="60" placeholder="todos los viernes" /></div>
            <div v-if="c.ventana.tipo === 'fija'" class="cm-fila">
              <div class="ct-campo"><label for="cm-desde">Desde</label><input id="cm-desde" v-model="c.ventana.fecha" type="date" :min="hoy" /></div>
              <div class="ct-campo"><label for="cm-hasta">Hasta</label><input id="cm-hasta" v-model="c.ventana.hasta" type="date" :min="c.ventana.fecha || hoy" /></div>
            </div>
          </div>
        </section>
      </div>

      <aside class="cm-lado" aria-label="Vista previa">
        <span class="cm-rot">{{ c.modo === "kit" ? "LA ESCENA DEL KIT" : "ASÍ ARRANCA EL VIDEO" }}</span>
        <EscenaReel v-if="c.modo === 'kit' && fotoKit" tipo="item" :item="escenaKit" :con-cuotas="false" :fuente="fuente" :ancho="250" />
        <EscenaReel v-else tipo="intro" :apertura="{ titular: llenarEj(c.textos.titular) || c.nombre, bajada: llenarEj(c.textos.bajada) }" :foto="elegidos.find((p) => p.imagen)?.imagen || ''" :fuente="fuente" :ancho="250" />
        <div class="cm-lado-caja cm-voz">
          <b>Lo que dice la voz</b>
          <span v-for="(v, i) in vozMuestra" :key="i">“{{ v }}”</span>
          <span class="cm-s">Los textos, la música y la voz se ajustan al armar el video.</span>
        </div>
        <button v-if="!editar" type="button" class="cm-sec" :disabled="armandoOtra" @click="otraVersion"><v-progress-circular v-if="armandoOtra" indeterminate size="16" width="2" /><v-icon v-else size="18">mdi-refresh</v-icon>Otra versión</button>
      </aside>
    </div>

    <div class="cm-pieza cm-pie">
      <span class="cm-s cm-ancho">{{ editar ? "Los videos ya hechos con esta campaña no cambian." : "Queda en Mis campañas: la usás cuando quieras y la apagás cuando termina." }}</span>
      <p v-if="error" class="cm-mal" role="alert">{{ error }}</p>
      <span v-else-if="falta" class="cm-s">{{ falta }}</span>
      <button type="button" class="cm-sec cm-sec--alto" :disabled="guardando || !valida" @click="guardar(false)">Guardar</button>
      <button type="button" class="cm-pri cm-pri--alto" :disabled="guardando || !valida" @click="guardar(true)"><v-progress-circular v-if="guardando" indeterminate size="18" width="2" />Guardar y armar el video<v-icon size="18">mdi-chevron-right</v-icon></button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import EscenaReel from "@/modules/admin/components/contenidos/EscenaReel.vue";
import { pesos, puntaje, palabrasDe, propuestos, TOPE_PRODUCTOS } from "@/modules/admin/components/contenidos/campanas";
import { armarBorrador, crearCampana, guardarCampana } from "@/modules/admin/services/contenidos.service";

const props = defineProps({
  fuente: { type: Object, default: null },
  // videos de GET /recursos (estilos, voces y músicas habilitados)
  recursos: { type: Object, required: true },
  // El stock (contenido /fuente/productos, con stock): { id, titulo, categoria, precio, stock, imagen }
  catalogo: { type: Array, default: () => [] },
  // GET /campanas: { autonomia, perfil, ia }
  estado: { type: Object, required: true },
  // Una campaña suya para editar (de GET /campanas); null = nueva desde una frase.
  editar: { type: Object, default: null },
});
const emit = defineEmits(["guardada", "revisando", "estrategia", "cerrar"]);

const TOPE = TOPE_PRODUCTOS;
const TOPE_KIT = 12;
const VENTANAS = { libre: "Siempre", recurrente: "Cada tanto", fija: "Con fecha" };
const QUIERE = [
  { v: "productos", t: "Productos", d: "Una escena por producto, con su foto y su precio si querés." },
  { v: "kit", t: "Un kit o un servicio", d: "Varios productos juntos o un trabajo (instalación, reparación). Precio opcional." },
  { v: "ia", t: "Que decida la IA", d: "Lo elige según lo que escribiste." },
];
const RESUMEN = [["vende", "Vendés"], ["distingue", "Te distingue"], ["contacto", "Contacto"], ["evitar", "Nunca decimos"]];
const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

const etapa = ref(props.editar ? "revision" : "pedido");
const pedido = ref("");
const quiere = ref("ia");
const origen = ref("");
const avisoIa = ref("");
const error = ref("");
const guardando = ref(false);
const armandoOtra = ref(false);
const variante = ref(0);
const buscar = ref("");
const perdidos = ref(0);
const c = reactive(vacia());

function vacia() {
  return { activa: true, nombre: "", objetivo: "", tono: "cercano", ventana: { tipo: "libre", cuando: "", fecha: "", hasta: "" },
    productos: { regla: "manual", n: 3, filtro: "" }, ids: [], modo: "productos", conPrecio: true,
    kit: { nombre: "", precio: null, extra: "", foto: null },
    estilo: "", musica: null, voz: { locutor: "", ritmo: "normal" },
    textos: { titular: "", bajada: "", etiqueta: "", vozIntro: "", vozItem: "", vozCierre: "", llamado: "", caption: "" } };
}
const porId = (id) => props.catalogo.find((p) => String(p.id) === String(id));
function cargar(x) {
  const v = vacia();
  Object.assign(c, v, JSON.parse(JSON.stringify({
    activa: x.activa !== false, nombre: x.nombre, objetivo: x.objetivo || "", tono: x.tono || "cercano",
    ventana: { ...v.ventana, ...x.ventana }, productos: { ...v.productos, ...x.productos },
    modo: x.modo === "kit" ? "kit" : "productos", conPrecio: x.conPrecio !== false, kit: { ...v.kit, ...(x.kit || {}) },
    estilo: x.estilo, musica: x.musica ?? null, voz: { ...v.voz, ...x.voz }, textos: { ...v.textos, ...x.textos },
  })));
  c.ids = (x.productos?.ids || []).map(String);
  resolverIds();
}
// Los ids que ya no están en el stock se sacan y se avisa. Una campaña vieja (sin ids,
// con una regla) arranca con los que su regla propone hoy.
function resolverIds() {
  if (!props.catalogo.length) return;
  if (!c.ids.length && c.productos.regla !== "manual") {
    c.ids = propuestos({ productos: c.productos }, props.catalogo).slice(0, c.modo === "kit" ? 4 : Math.min(TOPE, c.productos.n || 3)).map((p) => String(p.id));
  }
  const antes = c.ids.length;
  c.ids = c.ids.filter((id) => porId(id));
  perdidos.value = antes - c.ids.length;
  if (c.modo === "kit") ajustarKit();
}
watch(etapa, (e) => emit("revisando", e !== "pedido"), { immediate: true });
// Editar con el catálogo todavía cargando: se resuelve cuando llega.
watch(() => props.catalogo.length, (n, antes) => { if (!antes && n && props.editar) resolverIds(); });

const estilos = computed(() => props.recursos.estilos || []);
const voces = computed(() => props.recursos.voces || []);
const hayLugar = computed(() => (props.estado.autonomia?.quedan ?? 1) > 0);
const tieneEstrategia = computed(() => RESUMEN.some(([k]) => props.estado.perfil?.[k]));
// Una voz o un estilo que la pantalla no ofrece (habilitados de otro rubro) pasan al primero que sí.
function ajustar() {
  if (voces.value.length && !voces.value.some((v) => v.id === c.voz.locutor)) c.voz.locutor = (voces.value.find((v) => v.porDefecto) || voces.value[0]).id;
  if (estilos.value.length && !estilos.value.some((e) => e.id === c.estilo)) c.estilo = (estilos.value.find((e) => e.porDefecto) || estilos.value[0]).id;
}
if (props.editar) { cargar(props.editar); ajustar(); }
const numero = (n) => Number(n || 0).toFixed(2).replace(".", ",");
const unidades = (p) => (Number.isFinite(Number(p.stock)) ? `${Number(p.stock)} en stock` : "");
const vendidos = (p) => Number(p?.vendidos30d) || 0;

/* ── 1 · La idea ── */
// Ideas a partir del catálogo: las tres categorías con más productos.
const ideas = computed(() => {
  const n = {};
  for (const p of props.catalogo) if (p.categoria) n[p.categoria] = (n[p.categoria] || 0) + 1;
  const top = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k.toLowerCase());
  return [top[0] && `Promo de ${top[0]} esta semana`, top[1] && `${top[1]} con instalación`, top[2] && `Llegaron ${top[2]} nuevos`].filter(Boolean);
});
const palabras = computed(() => palabrasDe(pedido.value));
// Lo que el pedido nombra EN EL NOMBRE del producto (no en la categoría: "accesorios
// varios" traía auriculares en una campaña de fundas). La primera palabra es la que
// nombra el producto: si alguno la tiene, van sólo esos ("fundas para tu celu" no trae
// los soportes de celular).
const coinciden = computed(() => {
  if (!palabras.value.length) return [];
  const conPuntaje = props.catalogo.map((p) => ({ p, s: puntaje(pedido.value, { titulo: p.titulo }), primera: puntaje(palabras.value[0], { titulo: p.titulo }) > 0 }))
    .filter((x) => x.s > 0);
  const lista = conPuntaje.some((x) => x.primera) ? conPuntaje.filter((x) => x.primera) : conPuntaje;
  return lista.sort((a, b) => b.s - a.s || vendidos(b.p) - vendidos(a.p) || (Number(b.p.stock) || 0) - (Number(a.p.stock) || 0)).map((x) => x.p);
});
// Lo que ve la IA: los que coinciden (marcados) y después los de sus mismas categorías y
// los que comparten palabras con la categoría, para que pueda completar un kit.
function stockParaIa() {
  const nombrados = coinciden.value.slice(0, 20);
  const ids = new Set(nombrados.map((p) => p.id));
  const cats = new Set(nombrados.map((p) => p.categoria).filter(Boolean));
  const vecinos = props.catalogo
    .filter((p) => !ids.has(p.id) && (cats.has(p.categoria) || puntaje(pedido.value, { categoria: p.categoria }) > 0))
    .sort((a, b) => vendidos(b) - vendidos(a))
    .slice(0, 40 - nombrados.length);
  return [...nombrados.map((p) => ({ ...item(p), coincide: true })), ...vecinos.map(item)];
}
const item = (p) => ({ id: String(p.id), titulo: p.titulo, categoria: p.categoria || null, precio: p.precio ?? null, stock: p.stock ?? null });

const mensaje = (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || "No se pudo.";
async function armar(otra = false) {
  if (pedido.value.trim().length < 4) return;
  error.value = "";
  if (!otra) etapa.value = "armando";
  try {
    const r = await armarBorrador(pedido.value.trim(), { productos: stockParaIa(), quiere: quiere.value, variante: variante.value });
    cargar(r.campana);
    ajustar();
    // Sin ids del servicio (plantilla vieja), los que coinciden.
    if (!c.ids.length && coinciden.value.length) {
      c.ids = coinciden.value.slice(0, c.modo === "kit" ? 4 : 3).map((p) => String(p.id));
      if (c.modo === "kit") ajustarKit();
    }
    origen.value = r.origen;
    avisoIa.value = r.aviso || (r.origen !== "ia" && !c.ids.length ? "No encontré productos del stock con esas palabras: elegilos abajo." : "");
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

/* ── 2 y 3 · La revisión ── */
const elegidos = computed(() => c.ids.map(porId).filter(Boolean));
const faltan = computed(() => /no (encontr|hay|teng)/i.test(avisoIa.value));
const incluido = (p) => c.ids.includes(String(p.id));
function quitar(p) { c.ids = c.ids.filter((id) => id !== String(p.id)); }
function agregar(p) {
  if (!incluido(p)) c.ids.push(String(p.id));
  buscar.value = "";
  if (c.modo === "kit") ajustarKit();
}
function alternar(p) {
  if (incluido(p)) quitar(p);
  else c.ids.push(String(p.id));
  ajustarKit();
}
const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const encontrados = computed(() => {
  const q = normalizar(buscar.value).trim();
  if (q.length < 2) return [];
  return props.catalogo.filter((p) => !incluido(p) && normalizar(`${p.titulo} ${p.nombre || ""} ${p.categoria || ""}`).includes(q)).slice(0, 8);
});
// Afines a lo elegido: los que comparten palabras del nombre con lo elegido, el nombre de
// la campaña o el pedido ("cerco" junta energizador, cable y cartel); a igual puntaje,
// los de la misma categoría y los más vendidos. La categoría sola no alcanza: en
// ACCESORIOS VARIOS hay fundas y bolsos de notebook.
const afines = computed(() => {
  const claves = [...new Set(palabrasDe([pedido.value, c.nombre, c.kit.nombre, ...elegidos.value.map((p) => p.titulo)].join(" ")))];
  if (!claves.length) return [];
  const cats = new Set(elegidos.value.map((p) => p.categoria).filter(Boolean));
  return props.catalogo
    .filter((p) => !incluido(p))
    .map((p) => ({ p, s: puntaje(claves.join(" "), { titulo: p.titulo }) + (cats.has(p.categoria) ? 0.5 : 0) }))
    .filter((x) => x.s >= 1)
    .sort((a, b) => b.s - a.s || vendidos(b.p) - vendidos(a.p))
    .map((x) => x.p);
});
const sugeridos = computed(() => afines.value.slice(0, 3));

// Kit: para tildar, los incluidos y sus afines (hasta 12).
const candidatosKit = computed(() => [...elegidos.value, ...afines.value].slice(0, Math.max(TOPE_KIT, elegidos.value.length)));
const fotos = computed(() => elegidos.value.filter((p) => p.imagen));
const fotoKit = computed(() => fotos.value.find((p) => String(p.id) === String(c.kit.foto)) || fotos.value[0] || null);
const sumaKit = computed(() => Math.round(elegidos.value.reduce((a, p) => a + (Number(p.precio) || 0), 0)));
let sumaAnterior = null;
// El precio del kit sigue a la suma mientras nadie lo cambie a mano; la foto, a lo incluido.
function ajustarKit() {
  if (c.kit.precio == null || c.kit.precio === sumaAnterior) c.kit.precio = sumaKit.value || null;
  sumaAnterior = sumaKit.value;
  if (!fotos.value.some((p) => String(p.id) === String(c.kit.foto))) c.kit.foto = fotos.value[0] ? String(fotos.value[0].id) : null;
}
function ponerModo(m) {
  if (c.modo === m) return;
  c.modo = m;
  if (m === "kit") {
    c.kit.nombre = c.kit.nombre || c.nombre;
    sumaAnterior = null;
    c.kit.precio = null;
    ajustarKit();
  }
}
function ponerPrecio(v) {
  c.conPrecio = v;
  if (v && c.modo === "kit" && !c.kit.precio) c.kit.precio = sumaKit.value || null;
}
const escenaKit = computed(() => {
  const inc = [...elegidos.value.map((p) => p.titulo), ...(c.kit.extra.trim() ? [c.kit.extra.trim()] : [])];
  return { titulo: c.kit.nombre.trim() || c.nombre, imagen: fotoKit.value?.imagen || "", etiqueta: "",
    precio: c.conPrecio && Number(c.kit.precio) > 0 ? Number(c.kit.precio) : undefined, descripcion: inc.length ? `Incluye: ${inc.join(" · ")}` : "" };
});

// La vista previa de la voz: los textos guía de la campaña con el primer producto (o el kit).
const local = computed(() => String(props.fuente?.marca?.nombre || "tu local").toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase()));
function llenarEj(t, p = c.modo === "kit" ? escenaKit.value : elegidos.value[0]) {
  const precio = c.conPrecio && p?.precio != null ? pesos(p.precio) : null;
  const x = { local: local.value, producto: p?.titulo, precio, productos: elegidos.value.map((m) => m.titulo).slice(0, 3).join(", "),
    n: elegidos.value.length, categoria: p?.categoria?.toLowerCase(), caracteristica: c.modo === "kit" ? escenaKit.value.descripcion.replace(/^Incluye: /, "") : undefined };
  return String(t || "").replace(/\{(\w+)\}/g, (m, k) => (x[k] != null ? String(x[k]) : "")).replace(/\s+([.,:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
}
const vozMuestra = computed(() => [llenarEj(c.textos.vozIntro), llenarEj(c.textos.vozItem), llenarEj(c.textos.vozCierre)].filter((v) => v && v.length > 2));

const falta = computed(() => {
  if (c.nombre.trim().length < 2) return "Falta el nombre.";
  if (!elegidos.value.length) return "Elegí al menos un producto del stock.";
  if (c.modo === "kit" && !fotoKit.value) return "El kit necesita un producto con foto.";
  if (c.ventana.tipo === "fija" && !c.ventana.fecha) return "Falta desde cuándo.";
  if (c.ventana.tipo === "recurrente" && c.ventana.cuando.trim().length < 2) return "Falta cuándo se repite.";
  return "";
});
const valida = computed(() => !falta.value);

// Lo que viaja: sólo los campos de la ventana que corresponden a su tipo.
function cuerpo() {
  const v = c.ventana;
  const ventana = v.tipo === "fija" ? { tipo: "fija", fecha: v.fecha, ...(v.hasta ? { hasta: v.hasta } : {}) }
    : v.tipo === "recurrente" ? { tipo: "recurrente", cuando: v.cuando } : { tipo: "libre" };
  const kit = c.modo === "kit";
  const ids = elegidos.value.map((p) => String(p.id)).slice(0, kit ? TOPE_KIT : TOPE);
  const productos = { regla: "manual", n: kit ? 1 : Math.max(1, ids.length), ids };
  // Un texto guía que nombra montos no sirve sin precio: el servicio lo vuelve a armar en cada video.
  return {
    activa: c.activa, nombre: c.nombre.trim(), objetivo: c.objetivo, tono: c.tono, ventana, productos,
    modo: c.modo, conPrecio: c.conPrecio,
    ...(kit ? { kit: { nombre: c.kit.nombre.trim(), precio: c.conPrecio && Number(c.kit.precio) > 0 ? Number(c.kit.precio) : null, extra: c.kit.extra.trim(), foto: fotoKit.value ? String(fotoKit.value.id) : null } } : {}),
    estilo: c.estilo, musica: c.musica || null, voz: c.voz, textos: c.textos,
  };
}
async function guardar(armarVideo) {
  error.value = "";
  guardando.value = true;
  try {
    const guardada = props.editar ? await guardarCampana(props.editar.id, cuerpo()) : await crearCampana(cuerpo());
    emit("guardada", { campana: guardada, armar: armarVideo });
    if (!props.editar) { etapa.value = "pedido"; pedido.value = ""; origen.value = ""; avisoIa.value = ""; variante.value = 0; }
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
.cm { --cm-pri: #1488d1; --cm-bg: rgba(20, 136, 209, .1); --cm-mal: #c2271b; --cm-aviso: #8a5300; --cm-ambar-bg: #fff7e8; --cm-ambar-borde: #f0d49a; }
:is(.v-theme--dark, .v-theme--adminDark) .cm { --cm-pri: #3aa5e6; --cm-bg: rgba(58, 165, 230, .15); --cm-mal: #ff7a6e; --cm-aviso: #f2b45a; --cm-ambar-bg: rgba(242, 180, 90, .12); --cm-ambar-borde: rgba(242, 180, 90, .4); }
.cm .num { font-variant-numeric: tabular-nums; }
.cm button { font-family: inherit; }
.cm-pieza, .cm-tarjeta { background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 16px; padding: 20px 22px; }
.cm-tarjeta { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
.cm-tarjeta__izq { flex: 999 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.cm-tarjeta__der { flex: 1 1 260px; display: flex; flex-direction: column; gap: 12px; }
.cm-lado-caja { display: flex; flex-direction: column; gap: 8px; padding: 16px 18px; border-radius: 14px; border: 1px solid var(--sp-borde); background: var(--sp-caja); font-size: 14px; }
.cm-lado-caja--gris { background: var(--sp-hover); border-color: var(--sp-linea); }
.cm-pasos { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; line-height: 1.45; color: var(--sp-suave); }
.cm-marca { align-self: flex-start; font-size: 12px; font-weight: 900; letter-spacing: .08em; color: var(--cm-pri); background: var(--cm-bg); padding: 4px 10px; border-radius: 6px; }
.cm-pregunta { font-size: 20px; font-weight: 900; }
.cm h3 { margin: 0; font-size: 17px; font-weight: 900; }
.cm-rot { font-size: 12px; font-weight: 800; color: var(--sp-suave); letter-spacing: .04em; }
.cm-tarjeta textarea { width: 100%; box-sizing: border-box; resize: none; padding: 14px 16px; border-radius: 12px; border: 2px solid var(--cm-pri); background: var(--sp-caja); color: var(--sp-texto); font: 500 18px/1.4 Inter, sans-serif; outline: 0; }
.cm-ideas { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; font-weight: 700; color: var(--sp-suave); }
.cm-ideas button { min-height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--sp-borde); background: var(--sp-hover); color: var(--sp-texto); font-size: 14px; cursor: pointer; }
.cm-bloque { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.cm-modos { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.cm-modo { text-align: left; display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); cursor: pointer; }
.cm-modo b { font-size: 15px; }
.cm-modo span { font-size: 13px; line-height: 1.35; color: var(--sp-suave); }
.cm-modo--ia { border-style: dashed; }
.cm-modo[aria-pressed="true"] { border: 2px solid var(--cm-pri); background: var(--cm-bg); padding: 13px 15px; }
.cm-fila { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.cm-fila--entre { justify-content: space-between; }
.cm-ancho { flex: 1 1 240px; min-width: 0; }
.cm-angosto { max-width: 300px; }
.cm-pri { display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 0 20px; border: 0; border-radius: 12px; background: var(--cm-pri); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; }
.cm-pri--alto { min-height: 50px; padding: 0 24px; font-size: 16px; }
.cm-pri:disabled { opacity: .5; cursor: default; }
.cm-sec { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font-size: 14px; font-weight: 800; cursor: pointer; }
.cm-sec--alto { min-height: 50px; padding: 0 20px; font-size: 15px; }
.cm-sec:disabled { opacity: .5; cursor: default; }
.cm-lnk { border: 0; background: none; color: var(--cm-pri); font-weight: 800; font-size: 14px; cursor: pointer; padding: 0; }
.cm-ico { width: 44px; height: 44px; flex-shrink: 0; display: grid; place-items: center; border-radius: 10px; border: 1px solid var(--sp-linea); background: var(--sp-caja); color: var(--sp-suave); cursor: pointer; }
.cm :is(.cm-pri, .cm-sec, .cm-lnk, .cm-ico, .cm-modo, .cm-ideas button, .cm-seg button, .cm-foto, .cm-prod--btn):focus-visible { outline: 2px solid var(--cm-pri); outline-offset: 2px; }
.cm-s { font-size: 14px; color: var(--sp-suave); }
.cm-dato { font-size: 14px; line-height: 1.45; color: var(--sp-suave); }
.cm-dato b { color: var(--sp-texto); }
.cm-aviso { margin: 0; font-size: 14px; font-weight: 700; color: var(--cm-aviso); }
.cm-mal { margin: 0; font-size: 14px; font-weight: 700; color: var(--cm-mal); }
.cm-grande { font-size: 19px; }
.cm-armando { flex-direction: column; gap: 12px; }
.cm-hueso { height: 14px; border-radius: 7px; background: var(--sp-linea); }
.cm-rev { display: flex; flex-direction: column; gap: 16px; }
.cm-cab { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.cm-cab__t { flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cm-nombre { max-width: 560px; border: 0; border-bottom: 2px dashed var(--sp-borde); background: transparent; color: var(--sp-texto); font: 900 24px Inter, sans-serif; padding: 2px 0; outline: 0; }
.cm-nombre:focus { border-bottom-color: var(--cm-pri); }
.cm-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800; color: var(--cm-pri); background: var(--cm-bg); padding: 7px 11px; border-radius: 8px; }
.cm-chip--gris { color: var(--sp-suave); background: var(--sp-hover); }
.cm-nota { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 12px; background: var(--cm-bg); border: 1px solid var(--sp-borde); font-size: 14px; line-height: 1.45; color: var(--sp-texto); }
.cm-nota--ambar { background: var(--cm-ambar-bg); border-color: var(--cm-ambar-borde); }
.cm-cuerpo { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.cm-col { flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.cm-col .cm-pieza { display: flex; flex-direction: column; gap: 14px; }
.cm-col .cm-pieza--fila { flex-direction: row; flex-wrap: wrap; gap: 28px; }
.cm-lado { flex: 1 1 280px; display: flex; flex-direction: column; gap: 12px; align-items: center; position: sticky; top: 76px; }
.cm-lado > .cm-rot, .cm-lado > .cm-lado-caja { align-self: stretch; }
.cm-voz span:not(.cm-s) { line-height: 1.45; }
.cm-seg { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--sp-borde); border-radius: 10px; overflow: hidden; align-self: flex-start; }
.cm-seg button { min-height: 40px; padding: 0 16px; border: 0; background: var(--sp-caja); color: var(--sp-suave); font-size: 14px; font-weight: 800; cursor: pointer; }
.cm-seg button.is-on { background: var(--cm-pri); color: #fff; }
.cm-lista { display: flex; flex-direction: column; gap: 8px; }
.cm-fila-prod { display: flex; gap: 12px; align-items: center; padding: 8px 10px; border-radius: 12px; border: 1px solid var(--sp-linea); }
.cm-fila-prod__t { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cm-fila-prod__t b { font-size: 15px; line-height: 1.25; }
.cm-n { width: 18px; text-align: center; font-size: 13px; font-weight: 900; color: var(--sp-suave); }
.cm-precio { font-size: 15px; font-weight: 800; }
.cm-precio.is-off { color: var(--sp-suave); text-decoration: line-through; font-weight: 600; }
.cm-prods { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
.cm-prod { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 12px; border: 1px solid var(--sp-linea); background: var(--sp-caja); color: var(--sp-texto); font-size: 14px; text-align: left; }
.cm-prod b { display: block; font-size: 14px; line-height: 1.25; }
.cm-prod--on { border: 2px solid var(--cm-pri); background: var(--cm-bg); padding: 7px 9px; }
.cm-prod--tilde, .cm-prod--btn { cursor: pointer; }
.cm-prod--tilde input { width: 20px; height: 20px; flex-shrink: 0; accent-color: var(--cm-pri); }
.cm-prod--btn:hover { border-color: var(--cm-pri); }
.cm-mas { margin-left: auto; color: var(--cm-pri); }
.cm-prod__img { width: 48px; height: 48px; border-radius: 8px; background: #fff; border: 1px solid var(--sp-linea); flex-shrink: 0; overflow: hidden; }
.cm-prod__img--g { width: 56px; height: 56px; }
.cm-prod__img img { width: 100%; height: 100%; object-fit: contain; }
.cm-buscar { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 12px; background: var(--sp-hover); border: 1px solid var(--sp-linea); }
.cm-busca { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-suave); }
.cm-busca input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sp-texto); font: 500 15px Inter, sans-serif; }
.cm-fotos { display: flex; flex-wrap: wrap; gap: 8px; }
.cm-foto { width: 64px; height: 64px; padding: 0; border-radius: 10px; border: 1px solid var(--sp-linea); background: #fff; overflow: hidden; cursor: pointer; }
.cm-foto[aria-pressed="true"] { border: 3px solid var(--cm-pri); }
.cm-foto img { width: 100%; height: 100%; object-fit: contain; }
.cm-pie { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
@media (max-width: 900px) { .cm-lado { position: static; } }
</style>
