<!-- /admin/contenidos — Gestión de contenidos: reels 9:16 hechos por el servicio
     de contenidos con el catálogo de la tienda (maqueta aprobada 10/10).
     Nuevo reel: catálogo con categorías, guion escena por escena (portada,
     productos, cierre) con la voz de cada una, vista previa y sonido.
     Videos: lo generado, con su avance. Vista completa, sin modales; la clave
     del servicio la pone la API. -->
<template>
  <div class="sp ct">
    <div class="sp-cab ct-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Gestión de contenidos</h1>
        <span class="sp-cab__sub">{{ vista === "videos" ? `${piezas.length} ${piezas.length === 1 ? "video" : "videos"}` : "Reel 9:16 para Instagram, Facebook y WhatsApp" }}</span>
      </div>
      <div class="ct-tabs" role="tablist">
        <button type="button" role="tab" :class="{ 'is-on': vista === 'nuevo' }" @click="irA('nuevo')">Nuevo reel</button>
        <button type="button" role="tab" :class="{ 'is-on': vista === 'videos' }" @click="irA('videos')">Videos <span v-if="piezas.length" class="num">{{ piezas.length }}</span></button>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" closable @click:close="error = ''">{{ error }}</v-alert>

    <!-- NUEVO REEL -->
    <div v-if="vista === 'nuevo'" class="ct-armar">
      <!-- Catálogo -->
      <section class="ct-col ct-cat">
        <label class="sp-busca__campo">
          <v-icon size="20" class="sp-busca__ic">mdi-magnify</v-icon>
          <input v-model="buscar" class="sp-busca__input" type="search" placeholder="Buscar por nombre, marca o código" />
        </label>
        <div class="ct-chips">
          <button type="button" class="ct-chip" :class="{ 'is-on': !categoria }" @click="categoria = null">Todas<b class="num">{{ catalogo.length }}</b></button>
          <button v-for="c in categoriasVisibles" :key="c.nombre" type="button" class="ct-chip" :class="{ 'is-on': categoria === c.nombre }" @click="categoria = c.nombre">{{ c.texto }}<b class="num">{{ c.cantidad }}</b></button>
          <v-menu v-if="categoriasResto.length" location="bottom start">
            <template #activator="{ props: p }">
              <button type="button" class="ct-chip" :class="{ 'is-on': categoriaEnResto }" v-bind="p">{{ categoriaEnResto ? textoCategoria(categoria) : "Más categorías" }}<v-icon size="18">mdi-chevron-down</v-icon></button>
            </template>
            <v-list density="compact" max-height="360">
              <v-list-item v-for="c in categoriasResto" :key="c.nombre" @click="categoria = c.nombre">
                <v-list-item-title>{{ c.texto }} <span class="ct-menu-n num">{{ c.cantidad }}</span></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <div class="ct-cuenta"><span class="num">{{ cargandoCatalogo ? "Cargando productos…" : `${filtrados.length} con stock` }}</span><span class="num">{{ seleccion.length }} de {{ TOPE }} en el reel</span></div>
        <div class="ct-grilla">
          <button
            v-for="p in visibles"
            :key="p.id"
            type="button"
            class="ct-prod"
            :class="{ 'is-on': ordenDe(p.id), 'is-lleno': !ordenDe(p.id) && seleccion.length >= TOPE }"
            :title="p.nombre"
            @click="alternar(p)"
          >
            <span v-if="ordenDe(p.id)" class="ct-prod__n">{{ ordenDe(p.id) }}</span>
            <span v-else class="ct-prod__mas"><v-icon size="20">mdi-plus</v-icon></span>
            <img :src="p.imagen" alt="" loading="lazy" />
            <span class="ct-prod__t">{{ p.titulo }}</span>
            <span class="ct-prod__p num">{{ pesos(p.precio) }}</span>
            <span class="ct-prod__s num">{{ p.cuotas ? `${p.cuotas.cantidad} cuotas de ${pesos(p.cuotas.valor)} · ` : "" }}stock {{ p.stock }}</span>
          </button>
        </div>
        <div v-if="visibles.length < filtrados.length" v-intersect="masProductos" class="ct-sentinela"></div>
        <div v-if="!cargandoCatalogo && !filtrados.length" class="ct-vacio">Sin productos</div>
      </section>

      <!-- Guion -->
      <section class="ct-col ct-guion">
        <div class="sp-caja">
          <div class="se-banda"><span>Guion del reel</span><small class="num">{{ seleccion.length }} {{ seleccion.length === 1 ? "escena" : "escenas" }} · {{ fmtSeg(duracion) }} s</small></div>

          <!-- Portada -->
          <div class="ct-es" :class="{ 'is-on': activa === 'intro' }" @click="activa = 'intro'">
            <div class="ct-es__th"><EscenaReel tipo="intro" :fuente="fuente" :ancho="54" /></div>
            <div class="ct-es__cuerpo">
              <span class="ct-es__k">Portada · {{ fmtSeg(T.intro) }} s</span>
              <b class="ct-es__h">Logo de la marca</b>
              <div v-if="activa === 'intro' && opciones.voz" class="ct-campo" @click.stop>
                <label><v-icon size="15">mdi-account-voice</v-icon> Voz</label>
                <textarea v-model="guion.intro" rows="2" maxlength="300" @input="guion.introEditada = true"></textarea>
              </div>
              <span v-else-if="opciones.voz && guion.intro" class="ct-es__v">“{{ guion.intro }}”</span>
            </div>
          </div>

          <!-- Productos -->
          <div
            v-for="(p, i) in seleccion"
            :key="p.id"
            class="ct-es"
            :class="{ 'is-on': activa === p.id, 'is-arrastrando': arrastrando === i, 'is-destino': destino === i && arrastrando !== i }"
            draggable="true"
            @click="activa = p.id"
            @dragstart="arrastrando = i"
            @dragover.prevent="destino = i"
            @drop.prevent="soltar(i)"
            @dragend="arrastrando = null; destino = null"
          >
            <div class="ct-es__th"><EscenaReel tipo="item" :item="encargoItem(p)" :fuente="fuente" :ancho="54" :con-cuotas="opciones.cuotas" /></div>
            <div class="ct-es__cuerpo">
              <span class="ct-es__k">Escena {{ i + 1 }} · {{ fmtSeg(T.item) }} s</span>
              <b class="ct-es__h">{{ p.titulo || "Sin título" }}</b>
              <div v-if="activa === p.id" class="ct-editor" @click.stop>
                <div class="ct-campo"><label>Título</label><input v-model="p.titulo" maxlength="90" /></div>
                <div class="ct-campo"><label>Marca y modelo</label><input v-model="p.etiqueta" maxlength="80" /></div>
                <div class="ct-campo">
                  <label>Precio</label>
                  <div class="ct-precio">
                    <b class="num">{{ pesos(p.precio) }}</b>
                    <s v-if="p.precioAnterior > p.precio" class="num">{{ pesos(p.precioAnterior) }}</s>
                    <span v-if="p.precioAnterior > p.precio" class="num">{{ Math.round((1 - p.precio / p.precioAnterior) * 100) }} % OFF</span>
                  </div>
                </div>
                <div class="ct-campo"><label>Características, una por renglón</label><textarea v-model="p.caracteristicas" rows="3" @input="limitarCaracteristicas(p)"></textarea></div>
                <div v-if="opciones.voz" class="ct-campo"><label><v-icon size="15">mdi-account-voice</v-icon> Voz</label><textarea v-model="p.voz" rows="2" maxlength="400" @input="p.vozEditada = true"></textarea></div>
              </div>
              <span v-else-if="opciones.voz && p.voz" class="ct-es__v">“{{ p.voz }}”</span>
            </div>
            <div class="ct-es__ctl">
              <v-icon size="20" class="ct-es__drag" title="Arrastrar para ordenar">mdi-drag</v-icon>
              <button type="button" title="Quitar" @click.stop="quitar(p.id)"><v-icon size="20">mdi-close</v-icon></button>
            </div>
          </div>
          <div v-if="!seleccion.length" class="ct-es ct-es--vacia">
            <div class="ct-es__th ct-es__th--vacia"><v-icon size="22">mdi-plus</v-icon></div>
            <span>Elegir productos del catálogo</span>
          </div>

          <!-- Cierre -->
          <div class="ct-es" :class="{ 'is-on': activa === 'cierre' }" @click="activa = 'cierre'">
            <div class="ct-es__th"><EscenaReel tipo="cierre" :fuente="fuente" :ancho="54" /></div>
            <div class="ct-es__cuerpo">
              <span class="ct-es__k">Cierre · {{ fmtSeg(T.cierre) }} s</span>
              <b class="ct-es__h">{{ fuente?.textos?.llamado || "Cierre" }}</b>
              <div v-if="activa === 'cierre' && opciones.voz" class="ct-campo" @click.stop>
                <label><v-icon size="15">mdi-account-voice</v-icon> Voz</label>
                <textarea v-model="guion.cierre" rows="3" maxlength="400" @input="guion.cierreEditada = true"></textarea>
              </div>
              <span v-else-if="opciones.voz && guion.cierre" class="ct-es__v">“{{ guion.cierre }}”</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Vista previa y sonido -->
      <section class="ct-col ct-prev">
        <div class="ct-prev__tel">
          <EscenaReel :tipo="tipoActiva" :item="itemActivo" :fuente="fuente" :ancho="240" :con-cuotas="opciones.cuotas" />
        </div>
        <div class="ct-linea">
          <button type="button" class="is-ext" :class="{ 'is-on': activa === 'intro' }" :style="{ flex: T.intro }" @click="activa = 'intro'">Portada</button>
          <button v-for="(p, i) in seleccion" :key="p.id" type="button" :class="{ 'is-on': activa === p.id }" :style="{ flex: T.item }" @click="activa = p.id">{{ i + 1 }}</button>
          <button type="button" class="is-ext" :class="{ 'is-on': activa === 'cierre' }" :style="{ flex: T.cierre }" @click="activa = 'cierre'">Cierre</button>
        </div>
        <div class="sp-caja ct-sonido">
          <span class="ct-lab">Música</span>
          <div class="ct-seg">
            <button v-for="o in MUSICAS" :key="String(o.v)" type="button" :class="{ 'is-on': opciones.musica === o.v }" @click="opciones.musica = o.v">{{ o.t }}</button>
          </div>
          <label class="ct-sw"><span>Voz en off</span><input v-model="opciones.voz" type="checkbox" @change="sugerir" /><i></i></label>
          <div v-if="opciones.voz" class="ct-seg">
            <button v-for="o in RITMOS" :key="o.v" type="button" :class="{ 'is-on': opciones.ritmo === o.v }" @click="opciones.ritmo = o.v">{{ o.t }}</button>
          </div>
          <label class="ct-sw"><span>Cuotas y medios de pago</span><input v-model="opciones.cuotas" type="checkbox" @change="sugerir" /><i></i></label>
          <label class="ct-sw ct-sw--ultimo"><span>Efectos de sonido</span><input v-model="opciones.efectos" type="checkbox" /><i></i></label>
        </div>
        <button type="button" class="ct-generar" :disabled="!seleccion.length || !fuente || creando" @click="generar">
          <v-progress-circular v-if="creando" indeterminate size="22" width="3" />
          <v-icon v-else size="24">mdi-movie-open-outline</v-icon>Generar video
        </button>
      </section>
    </div>

    <!-- VIDEOS -->
    <div v-else class="ct-videos">
      <div v-if="!piezas.length" class="sp-caja ct-vacio">Sin videos</div>
      <div v-for="v in piezas" :key="v.id" class="sp-caja ct-video">
        <div class="ct-video__cab">
          <span class="num">{{ fecha(v.creada) }}</span>
          <b :class="`is-${v.estado}`">{{ estadoTexto(v) }}</b>
        </div>
        <div v-if="v.estado === 'en_cola' || v.estado === 'renderizando'" class="ct-video__barra"><span :style="{ width: `${v.progreso || 0}%` }"></span></div>
        <div class="ct-video__vis">
          <video v-if="v.estado === 'lista'" :src="v.video" :poster="v.portada" controls playsinline preload="none"></video>
          <div v-else class="ct-video__vacio" :class="{ 'is-error': v.estado === 'error' }">
            <v-icon size="44">{{ v.estado === "error" ? "mdi-movie-off-outline" : "mdi-movie-open-outline" }}</v-icon>
            <b>{{ v.estado === "error" ? "Sin video" : "Armando el video" }}</b>
          </div>
        </div>
        <div class="ct-video__pie">
          <a v-if="v.estado === 'lista'" :href="v.video" download class="ct-bajar"><v-icon size="20">mdi-download</v-icon>Bajar MP4</a>
          <span v-else class="ct-video__esp"></span>
          <button v-if="v.estado === 'lista' || v.estado === 'error'" type="button" class="ct-borrar" :class="{ 'is-confirmar': confirmar === v.id }" :title="confirmar === v.id ? 'Confirmar' : 'Eliminar'" @click="borrar(v)">
            <v-icon size="20">mdi-delete-outline</v-icon><span v-if="confirmar === v.id">Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import EscenaReel from "@/modules/admin/components/contenidos/EscenaReel.vue";
import { borrarPieza, buscarProductos, crearPieza, getFuente, listarPiezas, sugerirGuion, verPieza } from "@/modules/admin/services/contenidos.service";
import "@/modules/products/styles/proveedores.css";

const TOPE = 6;
const POR_TANDA = 48;
const MUSICAS = [
  { v: "pulso", t: "Pulso" },
  { v: "calma", t: "Calma" },
  { v: "urbano", t: "Urbano" },
  { v: null, t: "Sin música" },
];
const RITMOS = [
  { v: 0.9, t: "Pausada" },
  { v: 1, t: "Normal" },
  { v: 1.12, t: "Ágil" },
];

const route = useRoute();
const router = useRouter();
const vista = computed(() => (route.query.vista === "videos" ? "videos" : "nuevo"));
function irA(v) { router.replace({ query: { ...route.query, vista: v === "videos" ? "videos" : undefined } }); }

const fuente = ref(null);
const catalogo = ref([]);
const cargandoCatalogo = ref(true);
const buscar = ref("");
const categoria = ref(null);
const cuantos = ref(POR_TANDA);
const seleccion = ref([]);
const activa = ref("intro");
const guion = reactive({ intro: "", introEditada: false, cierre: "", cierreEditada: false });
const opciones = reactive({ musica: "pulso", voz: true, ritmo: 1, cuotas: true, efectos: true });
const piezas = ref([]);
const error = ref("");
const creando = ref(false);
const confirmar = ref(null);
const arrastrando = ref(null);
const destino = ref(null);

const pesos = (n) => (n == null ? "" : `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`);
const fmtSeg = (s) => Number(s).toLocaleString("es-AR", { maximumFractionDigits: 1 });
const fecha = (iso) => {
  const d = new Date(iso);
  const hoy = new Date();
  const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === hoy.toDateString() ? `Hoy ${hora}` : `${d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} ${hora}`;
};
const estadoTexto = (v) => ({ lista: "Listo", error: "No se pudo generar", en_cola: "En cola" }[v.estado] || `Generando ${v.progreso || 0} %`);
const mensaje = (e) => e?.response?.data?.error || e?.response?.data?.message || "No se pudo completar la operación.";

/* Catálogo: se baja entero (todas las páginas) para filtrar por categoría al instante. */
const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const textoCategoria = (c) => { const s = String(c || "").toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
const categorias = computed(() => {
  const m = new Map();
  for (const p of catalogo.value) if (p.categoria) m.set(p.categoria, (m.get(p.categoria) || 0) + 1);
  return [...m.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad, texto: textoCategoria(nombre) })).sort((a, b) => b.cantidad - a.cantidad);
});
const categoriasVisibles = computed(() => categorias.value.slice(0, 5));
const categoriasResto = computed(() => categorias.value.slice(5).sort((a, b) => a.texto.localeCompare(b.texto)));
const categoriaEnResto = computed(() => categoriasResto.value.some((c) => c.nombre === categoria.value));
const filtrados = computed(() => {
  const q = normalizar(buscar.value).trim();
  return catalogo.value.filter((p) => (!categoria.value || p.categoria === categoria.value) && (!q || normalizar(`${p.titulo} ${p.nombre} ${p.etiqueta}`).includes(q)));
});
const visibles = computed(() => filtrados.value.slice(0, cuantos.value));
function masProductos(visible) { if (visible) cuantos.value += POR_TANDA; }
watch([buscar, categoria], () => { cuantos.value = POR_TANDA; });

async function cargarCatalogo() {
  cargandoCatalogo.value = true;
  try {
    const r = await buscarProductos("");
    const resto = await Promise.all(Array.from({ length: Math.max(0, (r.paginas || 1) - 1) }, (_, i) => buscarProductos("", i + 2)));
    catalogo.value = [r, ...resto].flatMap((x) => x.items || []);
  } catch (e) { error.value = mensaje(e); } finally { cargandoCatalogo.value = false; }
}

/* Selección y guion */
const ordenDe = (id) => { const i = seleccion.value.findIndex((p) => p.id === id); return i >= 0 ? i + 1 : 0; };
function alternar(p) {
  if (ordenDe(p.id)) return quitar(p.id);
  if (seleccion.value.length >= TOPE) return;
  const caracteristicas = String(p.descripcion || "").split(/\s*·\s*|\.\s+/).map((x) => x.trim()).filter(Boolean).slice(0, 3).join("\n");
  seleccion.value.push({ ...p, caracteristicas, voz: "", vozEditada: false });
  activa.value = p.id;
  sugerir();
}
function quitar(id) {
  seleccion.value = seleccion.value.filter((p) => p.id !== id);
  if (activa.value === id) activa.value = "intro";
  sugerir();
}
function soltar(i) {
  const desde = arrastrando.value;
  arrastrando.value = null;
  destino.value = null;
  if (desde == null || desde === i) return;
  const l = seleccion.value.slice();
  const [x] = l.splice(desde, 1);
  l.splice(i, 0, x);
  seleccion.value = l;
  sugerir();
}
function limitarCaracteristicas(p) {
  const r = String(p.caracteristicas || "").split("\n");
  if (r.length > 3) p.caracteristicas = r.slice(0, 3).join("\n");
}
// Las características viajan como la descripción que el servicio parte en renglones.
const descripcionDe = (p) => String(p.caracteristicas || "").split("\n").map((x) => x.trim().replace(/[.·]+$/, "")).filter(Boolean).join(" · ").slice(0, 300);
const encargoItem = (p) => ({
  titulo: String(p.titulo || "").trim() || p.nombre,
  descripcion: descripcionDe(p) || undefined,
  etiqueta: p.etiqueta || undefined,
  precio: p.precio,
  precioAnterior: p.precioAnterior,
  imagen: p.imagen,
  cuotas: opciones.cuotas ? p.cuotas : undefined,
});
const tipoActiva = computed(() => (activa.value === "intro" || activa.value === "cierre" ? activa.value : "item"));
const itemActivo = computed(() => { const p = seleccion.value.find((x) => x.id === activa.value); return p ? encargoItem(p) : null; });

// Duraciones de la plantilla (sin voz): portada 2,6 s, 3 s por producto (7 s si es uno solo), cierre 3,4 s.
const T = computed(() => ({ intro: 2.6, item: seleccion.value.length === 1 ? 7 : 3, cierre: 3.4 }));
const duracion = computed(() => T.value.intro + T.value.item * seleccion.value.length + T.value.cierre);

function armarEncargo() {
  const f = fuente.value;
  const items = seleccion.value.map(encargoItem);
  return {
    cuenta: f.cuenta,
    plantilla: items.length === 1 ? "producto" : "destacados",
    ajuste: f.ajuste,
    marca: f.marca,
    estilo: f.estilo,
    sellos: f.sellos,
    textos: f.textos,
    mediosDePago: opciones.cuotas ? f.mediosDePago || [] : [],
    sucursales: f.sucursales || [],
    redes: f.redes || [],
    musica: opciones.musica || undefined,
    efectos: opciones.efectos,
    items,
    voz: {
      activa: opciones.voz,
      velocidad: opciones.ritmo,
      guion: {
        intro: guion.intro.trim() || undefined,
        items: seleccion.value.map((p) => (p.voz || "").trim()),
        cierre: guion.cierre.trim() || undefined,
      },
    },
  };
}

// La voz sugerida por el servicio, sin pisar lo que se escribió a mano.
let demoraGuion;
function sugerir() {
  clearTimeout(demoraGuion);
  demoraGuion = setTimeout(async () => {
    if (!fuente.value || !seleccion.value.length || !opciones.voz) return;
    try {
      const e = armarEncargo();
      delete e.voz;
      const g = await sugerirGuion(e);
      if (!guion.introEditada) guion.intro = g.intro || "";
      if (!guion.cierreEditada) guion.cierre = g.cierre || "";
      seleccion.value.forEach((p, i) => { if (!p.vozEditada) p.voz = g.items?.[i] || ""; });
    } catch { /* la sugerencia es opcional */ }
  }, 250);
}

async function generar() {
  creando.value = true;
  error.value = "";
  try {
    const p = await crearPieza(armarEncargo());
    piezas.value = [p, ...piezas.value];
    seguir();
    irA("videos");
  } catch (e) { error.value = mensaje(e); } finally { creando.value = false; }
}

/* Videos */
async function borrar(v) {
  if (confirmar.value !== v.id) {
    confirmar.value = v.id;
    setTimeout(() => { if (confirmar.value === v.id) confirmar.value = null; }, 4000);
    return;
  }
  confirmar.value = null;
  try {
    await borrarPieza(v.id);
    piezas.value = piezas.value.filter((x) => x.id !== v.id);
  } catch (e) {
    if (e?.response?.status === 404) piezas.value = piezas.value.filter((x) => x.id !== v.id);
    else error.value = mensaje(e);
  }
}

// Mientras haya videos generándose, se consultan cada 3 segundos.
let reloj;
function seguir() {
  clearTimeout(reloj);
  const pendientes = piezas.value.filter((v) => v.estado === "en_cola" || v.estado === "renderizando");
  if (!pendientes.length) return;
  reloj = setTimeout(async () => {
    for (const v of pendientes) {
      try {
        const n = await verPieza(v.id);
        const i = piezas.value.findIndex((x) => x.id === v.id);
        if (i >= 0) piezas.value[i] = n;
      } catch (e) {
        // Un video que ya no existe sale de la lista; otro error se reintenta.
        if (e?.response?.status === 404) piezas.value = piezas.value.filter((x) => x.id !== v.id);
      }
    }
    seguir();
  }, 3000);
}

onMounted(async () => {
  try {
    fuente.value = await getFuente();
  } catch (e) { error.value = mensaje(e); }
  cargarCatalogo();
  try {
    piezas.value = await listarPiezas(30);
    seguir();
  } catch (e) { error.value = mensaje(e); }
});
onBeforeUnmount(() => { clearTimeout(reloj); clearTimeout(demoraGuion); });
</script>

<style>
.sp.ct > * { max-width: 1440px; }
.ct-cab { align-items: center; flex-wrap: wrap; }
.ct-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); }
.ct-tabs button { height: 40px; padding: 0 18px; border: 0; border-radius: 10px; background: transparent; font: 800 15px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; }
.ct-tabs button:hover:not(.is-on) { background: #cfe5f5; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-tabs button:hover:not(.is-on) { background: #1a2a3a; }
.ct-tabs button.is-on { background: #0f6fae; color: #fff; }
.ct-tabs button span { margin-left: 4px; opacity: .8; }

.ct-armar { display: grid; grid-template-columns: minmax(380px, 470px) minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.ct-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ct-cat, .ct-prev { position: sticky; top: 12px; }
.ct-cat { max-height: calc(100vh - 90px); overflow-y: auto; padding-right: 4px; }
.ct-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ct-chip { display: inline-flex; align-items: center; gap: 4px; padding: 7px 12px; border-radius: 9999px; background: var(--sp-caja); border: 1px solid var(--sp-borde); font: 700 13px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; white-space: nowrap; }
.ct-chip b { font-weight: 700; color: var(--sp-suave); }
.ct-chip:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-chip:hover:not(.is-on) { background: #1a2a3a; }
.ct-chip.is-on { background: #0f6fae; border-color: #0f6fae; color: #fff; }
.ct-chip.is-on b { color: rgba(255, 255, 255, .85); }
.ct-menu-n { color: #64748b; margin-left: 6px; font-size: 13px; }
.ct-cuenta { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: var(--sp-suave); }
.ct-grilla { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.ct-prod { position: relative; text-align: left; background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; color: var(--sp-texto); font-family: Inter, sans-serif; transition: background .12s, border-color .12s; }
.ct-prod img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 8px; background: #fff; }
.ct-prod__t { font-size: 13px; font-weight: 700; line-height: 1.25; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ct-prod__p { font-size: 16px; font-weight: 800; }
.ct-prod__s { font-size: 12px; color: var(--sp-suave); }
.ct-prod__n, .ct-prod__mas { position: absolute; top: 8px; z-index: 1; width: 30px; height: 30px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; background: #0f6fae; color: #fff; }
.ct-prod__n { left: 8px; font-size: 15px; font-weight: 900; box-shadow: 0 2px 6px rgba(0, 0, 0, .25); }
.ct-prod__mas { right: 8px; opacity: 0; transition: opacity .12s; }
.ct-prod__mas .v-icon { color: #fff; }
.ct-prod:hover:not(.is-lleno) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-prod:hover:not(.is-lleno) { background: #1a2a3a; }
.ct-prod:hover:not(.is-on):not(.is-lleno) .ct-prod__mas { opacity: 1; }
.ct-prod.is-on { border: 2px solid #0f6fae; box-shadow: 0 0 0 3px #cfe5f5; padding: 7px; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-prod.is-on { box-shadow: 0 0 0 3px #12304a; }
.ct-prod.is-lleno { opacity: .5; cursor: default; }
.ct-sentinela { height: 1px; }
.ct-vacio { padding: 36px 16px; text-align: center; font-size: 15px; font-weight: 600; color: var(--sp-suave); }

.ct-es { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--sp-linea); background: var(--sp-caja); cursor: pointer; }
.ct-es:last-child { border-bottom: 0; }
.ct-es:hover:not(.is-on) { background: var(--sp-hover); }
.ct-es.is-on { background: var(--sp-hover); box-shadow: inset 4px 0 0 #0f6fae; align-items: flex-start; cursor: default; }
.ct-es.is-arrastrando { opacity: .4; }
.ct-es.is-destino { box-shadow: inset 0 3px 0 #0f6fae; }
.ct-es__th { width: 54px; flex-shrink: 0; }
.ct-es__th .er { border-radius: 6px; box-shadow: none; border: 1px solid var(--sp-borde); }
.ct-es__th--vacia { height: 96px; border-radius: 6px; border: 2px dashed var(--sp-borde); display: flex; align-items: center; justify-content: center; color: var(--sp-suave); }
.ct-es--vacia { cursor: default; font-size: 15px; font-weight: 700; color: var(--sp-suave); }
.ct-es__cuerpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.ct-es__k { font-size: 12px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--sp-suave); }
.ct-es__h { font-size: 16px; font-weight: 800; }
.ct-es__v { font-size: 13px; font-style: italic; color: var(--sp-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-es__ctl { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--sp-suave); }
.ct-es__drag { cursor: grab; }
.ct-es__ctl button { border: 0; background: transparent; color: var(--sp-suave); cursor: pointer; padding: 2px; border-radius: 6px; display: inline-flex; }
.ct-es__ctl button:hover { color: #c2413a; background: rgba(194, 65, 58, .1); }
.ct-editor { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.ct-campo { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.ct-campo label { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 800; color: var(--sp-suave); }
.ct-campo input, .ct-campo textarea { width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 500 14px/1.4 Inter, sans-serif; outline: 0; resize: vertical; }
.ct-campo input:focus, .ct-campo textarea:focus { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, .18); }
.ct-precio { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; padding: 2px; }
.ct-precio b { font-size: 22px; font-weight: 800; }
.ct-precio s { font-size: 14px; color: var(--sp-suave); }
.ct-precio span { font-size: 13px; font-weight: 800; color: var(--sp-acento); }

.ct-prev__tel { display: flex; justify-content: center; }
.ct-linea { display: flex; gap: 2px; height: 34px; border-radius: 8px; overflow: hidden; }
.ct-linea button { min-width: 0; border: 0; background: #3f8fc6; color: #fff; font: 800 12px Inter, sans-serif; cursor: pointer; white-space: nowrap; overflow: hidden; }
.ct-linea button.is-ext { background: #8cc0e3; color: #0a466e; }
.ct-linea button.is-on { background: #0a466e; color: #fff; }
.ct-sonido { padding: 4px 14px 6px; }
.ct-lab { display: block; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--sp-suave); margin: 10px 0 6px; }
.ct-seg { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); margin: 6px 0; }
.ct-seg button { flex: 1; padding: 8px 4px; border: 0; border-radius: 9px; background: transparent; font: 700 13px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; white-space: nowrap; }
.ct-seg button:hover:not(.is-on) { background: var(--sp-hover); }
.ct-seg button.is-on { background: #0f6fae; color: #fff; }
.ct-sw { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--sp-linea); font-size: 15px; font-weight: 700; cursor: pointer; }
.ct-sw--ultimo { border-bottom: 0; }
.ct-sw input { display: none; }
.ct-sw i { width: 40px; height: 22px; border-radius: 9999px; background: #c9d5e1; position: relative; transition: background .15s; flex-shrink: 0; }
.ct-sw i::after { content: ""; position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left .15s; }
.ct-sw input:checked + i { background: #0f6fae; }
.ct-sw input:checked + i::after { left: 21px; }
.ct-generar { height: 56px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 12px; background: #0f6fae; color: #fff !important; font: 800 17px Inter, sans-serif; cursor: pointer; }
.ct-generar .v-icon { color: #fff !important; }
.ct-generar:hover:not(:disabled) { background: #0a5a90; }
.ct-generar:disabled { opacity: .5; cursor: default; }

.ct-videos { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
.ct-videos > .ct-vacio { grid-column: 1 / -1; }
.ct-video { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ct-video__cab { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; font-weight: 800; color: var(--sp-suave); }
.ct-video__cab b { color: #0f6fae; }
.ct-video__cab b.is-lista { color: #2E9E7B; }
.ct-video__cab b.is-error { color: #c2413a; }
.ct-video__barra { height: 6px; border-radius: 9999px; background: var(--sp-linea); overflow: hidden; }
.ct-video__barra span { display: block; height: 100%; background: #0f6fae; transition: width .4s; }
.ct-video__vis { aspect-ratio: 9 / 16; border-radius: 10px; overflow: hidden; background: #071c2f; }
.ct-video__vis video { width: 100%; height: 100%; display: block; background: #000; }
.ct-video__vacio { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #fff; }
.ct-video__vacio .v-icon { color: #fff; }
.ct-video__vacio.is-error { background: #2a1416; }
.ct-video__pie { display: flex; gap: 8px; }
.ct-video__esp { flex: 1; }
.ct-bajar { flex: 1; height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: #0f6fae; color: #fff !important; font: 800 15px Inter, sans-serif; text-decoration: none; white-space: nowrap; }
.ct-bajar .v-icon { color: #fff !important; }
.ct-bajar:hover { background: #0a5a90; }
.ct-borrar { height: 42px; min-width: 42px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: #c2413a; font: 800 14px Inter, sans-serif; cursor: pointer; }
.ct-borrar .v-icon { color: #c2413a; }
.ct-borrar.is-confirmar { background: #c2413a; border-color: #c2413a; color: #fff; }
.ct-borrar.is-confirmar .v-icon { color: #fff; }

@media (max-width: 1280px) {
  .ct-armar { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ct-prev { grid-column: 1 / -1; position: static; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; align-items: start; }
  .ct-prev .ct-linea, .ct-prev .ct-sonido, .ct-prev .ct-generar { grid-column: 2; }
  .ct-prev__tel { grid-row: 1 / span 3; }
}
@media (max-width: 900px) {
  .ct-armar { grid-template-columns: minmax(0, 1fr); }
  .ct-cat { position: static; max-height: none; overflow: visible; }
  .ct-prev { display: flex; }
  .ct-grilla { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
