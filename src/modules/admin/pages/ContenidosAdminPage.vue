<!-- /admin/contenidos — Gestión de contenidos: videos para redes (reels 9:16)
     hechos por el servicio de contenidos con el catálogo de la tienda.
     Vista completa, sin modales. La clave del servicio la pone la API. -->

<template>
  <v-container class="mx-auto" style="max-width: 1280px">
    <AppPageHeader icon="mdi-movie-open-play-outline" title="Gestión de contenidos" />

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <!-- Catálogo -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="2" class="pa-4">
          <div class="cont-sub">Productos</div>
          <v-text-field
            v-model="buscar"
            placeholder="Buscar producto"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            rounded="lg"
            clearable
            class="mb-2"
          />
          <div class="cont-total">{{ totalTexto }}</div>
          <div class="cont-grilla">
            <button
              v-for="p in productos"
              :key="p.id"
              type="button"
              class="cont-prod"
              :class="{ 'cont-prod--elegido': elegidos.has(p.id) }"
              :title="p.nombre"
              @click="alternar(p)"
            >
              <img :src="p.imagen" alt="" loading="lazy" />
              <span class="cont-prod__titulo">{{ p.titulo }}</span>
              <span class="cont-prod__precio">{{ pesos(p.precio) }}</span>
              <v-icon v-if="elegidos.has(p.id)" class="cont-prod__check" size="20">mdi-check-circle</v-icon>
            </button>
          </div>
        </v-card>
      </v-col>

      <!-- Video -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="2" class="pa-4">
          <div class="cont-sub">Video <span class="cont-cant">{{ seleccion.length }} de 6</span></div>
          <div v-if="!seleccion.length" class="cont-vacio">Sin productos elegidos.</div>

          <div v-for="p in seleccion" :key="p.id" class="cont-sel">
            <img :src="p.imagen" alt="" />
            <div class="cont-sel__campos">
              <v-text-field v-model="p.titulo" label="Título" density="compact" variant="outlined" hide-details rounded="lg" maxlength="70" />
              <v-textarea v-model="p.descripcion" label="Características" density="compact" variant="outlined" hide-details rounded="lg" rows="2" auto-grow maxlength="160" class="mt-2" />
              <v-textarea
                v-if="opciones.voz"
                v-model="p.voz"
                label="Voz"
                density="compact"
                variant="outlined"
                hide-details
                rounded="lg"
                rows="2"
                auto-grow
                maxlength="240"
                class="mt-2"
                @update:model-value="p.vozEditada = true"
              />
              <div class="cont-sel__pie">
                <span>{{ precioSel(p) }}</span>
                <a href="#" @click.prevent="quitar(p.id)">Quitar</a>
              </div>
            </div>
          </div>

          <v-divider class="my-3" />
          <v-select v-model="opciones.musica" :items="musicas" label="Música" density="compact" variant="outlined" hide-details rounded="lg" class="mb-2" />
          <v-select v-if="opciones.voz" v-model="opciones.ritmo" :items="ritmos" label="Ritmo de la voz" density="compact" variant="outlined" hide-details rounded="lg" class="mb-1" />
          <v-switch v-model="opciones.voz" label="Voz en off" color="primary" density="compact" hide-details @update:model-value="sugerir" />
          <v-switch v-model="opciones.cuotas" label="Cuotas y medios de pago" color="primary" density="compact" hide-details @update:model-value="sugerir" />
          <v-switch v-model="opciones.efectos" label="Efectos de sonido" color="primary" density="compact" hide-details />

          <v-btn color="primary" variant="flat" rounded="lg" block class="mt-3" :loading="creando" :disabled="!seleccion.length || !fuente" @click="generar">
            Generar video
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Videos generados -->
    <v-card rounded="lg" elevation="2" class="pa-4 mt-4">
      <div class="cont-sub">Videos</div>
      <div v-if="!piezas.length" class="cont-vacio">Sin videos.</div>
      <div class="cont-videos">
        <div v-for="v in piezas" :key="v.id" class="cont-video">
          <div class="cont-video__cabeza">
            <span>{{ fecha(v.creada) }}</span>
            <span :class="'cont-estado cont-estado--' + v.estado">{{ estadoTexto(v) }}</span>
          </div>
          <v-progress-linear v-if="v.estado !== 'lista' && v.estado !== 'error'" :model-value="v.progreso || 0" color="primary" rounded height="6" class="my-2" />
          <video v-if="v.estado === 'lista'" :src="v.video" :poster="v.portada" controls playsinline preload="metadata" />
          <div v-if="v.estado === 'error'" class="cont-error">No se pudo generar el video.</div>
          <div class="cont-video__pie">
            <a v-if="v.estado === 'lista'" :href="v.video" download>Bajar MP4</a>
            <span v-else />
            <a v-if="v.estado === 'lista' || v.estado === 'error'" href="#" :class="{ 'cont-borrar--confirmar': confirmar === v.id }" @click.prevent="borrar(v)">
              {{ confirmar === v.id ? "Confirmar eliminación" : "Eliminar" }}
            </a>
          </div>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import { borrarPieza, buscarProductos, crearPieza, getFuente, listarPiezas, sugerirGuion, verPieza } from "@/modules/admin/services/contenidos.service";

const fuente = ref(null);
const buscar = ref("");
const productos = ref([]);
const total = ref(null);
const seleccion = ref([]);
const piezas = ref([]);
const error = ref("");
const creando = ref(false);
const confirmar = ref(null);
const opciones = reactive({ musica: "pulso", voz: true, ritmo: 1, cuotas: true, efectos: true });
const musicas = [
  { title: "Pulso", value: "pulso" },
  { title: "Calma", value: "calma" },
  { title: "Urbano", value: "urbano" },
  { title: "Sin música", value: null },
];
const ritmos = [
  { title: "Pausado", value: 0.9 },
  { title: "Normal", value: 1 },
  { title: "Ágil", value: 1.12 },
];

const elegidos = computed(() => new Set(seleccion.value.map((p) => p.id)));
const totalTexto = computed(() => (total.value == null ? "" : `${total.value} productos con stock`));
const pesos = (n) => (n == null ? "" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n));
const precioSel = (p) => [pesos(p.precio), p.cuotas && opciones.cuotas ? `${p.cuotas.cantidad} cuotas de ${pesos(p.cuotas.valor)}` : ""].filter(Boolean).join(" · ");
const fecha = (iso) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const estadoTexto = (v) => ({ lista: "Listo", error: "Error", en_cola: "En cola" }[v.estado] || (v.progreso ? `Generando ${v.progreso} %` : "Preparando voz e imágenes"));
const mensaje = (e) => e?.response?.data?.message || e?.response?.data?.error || "No se pudo completar la operación.";

let demora;
watch(buscar, (v) => { clearTimeout(demora); demora = setTimeout(() => cargarProductos(v || ""), 300); });

async function cargarProductos(texto) {
  try {
    const r = await buscarProductos(texto);
    productos.value = r.items || [];
    total.value = r.total ?? null;
  } catch (e) { error.value = mensaje(e); }
}

function alternar(p) {
  if (elegidos.value.has(p.id)) return quitar(p.id);
  if (seleccion.value.length >= 6) return;
  seleccion.value.push({ ...p, voz: "", vozEditada: false });
  sugerir();
}
function quitar(id) {
  seleccion.value = seleccion.value.filter((p) => p.id !== id);
  sugerir();
}

function armarEncargo() {
  const f = fuente.value;
  const items = seleccion.value.map(({ titulo, descripcion, etiqueta, precio, precioAnterior, imagen, cuotas }) => ({
    titulo: String(titulo || "").trim(), descripcion: descripcion?.trim() || undefined, etiqueta, precio, precioAnterior, imagen,
    cuotas: opciones.cuotas ? cuotas : undefined,
  }));
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
    voz: { activa: opciones.voz, velocidad: opciones.ritmo, guion: { items: seleccion.value.map((p) => (p.voz || "").trim()) } },
  };
}

// El texto de la voz sugerido por el servicio, sin pisar lo que se escribió a mano.
async function sugerir() {
  if (!fuente.value || !seleccion.value.length || !opciones.voz) return;
  try {
    const e = armarEncargo();
    delete e.voz;
    const g = await sugerirGuion(e);
    seleccion.value.forEach((p, i) => { if (!p.vozEditada) p.voz = g.items?.[i] || ""; });
  } catch { /* la sugerencia es opcional */ }
}

async function generar() {
  creando.value = true;
  error.value = "";
  try {
    const p = await crearPieza(armarEncargo());
    piezas.value = [p, ...piezas.value];
    seguir();
  } catch (e) { error.value = mensaje(e); } finally { creando.value = false; }
}

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
  } catch (e) { error.value = mensaje(e); }
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
      } catch { /* se reintenta en la próxima vuelta */ }
    }
    seguir();
  }, 3000);
}

onMounted(async () => {
  try {
    fuente.value = await getFuente();
    await Promise.all([cargarProductos(""), (async () => { piezas.value = await listarPiezas(30); })()]);
    seguir();
  } catch (e) { error.value = mensaje(e); }
});
onBeforeUnmount(() => { clearTimeout(reloj); clearTimeout(demora); });
</script>

<style scoped>
.cont-sub { font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; opacity: .7; margin-bottom: 12px; }
.cont-cant { text-transform: none; letter-spacing: 0; font-weight: 500; margin-left: 6px; }
.cont-total { font-size: 13px; opacity: .65; margin-bottom: 10px; }
.cont-vacio { font-size: 14px; opacity: .6; }
.cont-grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.cont-prod { position: relative; text-align: left; border: 1px solid rgba(0,0,0,.12); border-radius: 10px; padding: 8px; background: #fff; cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
.cont-prod img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 6px; background: #fff; }
.cont-prod--elegido { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 2px rgb(var(--v-theme-primary)) inset; }
.cont-prod__titulo { font-size: 12.5px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cont-prod__precio { font-size: 13px; font-weight: 700; }
.cont-prod__check { position: absolute; top: 10px; right: 10px; color: rgb(var(--v-theme-primary)); background: #fff; border-radius: 50%; }
.cont-sel { display: grid; grid-template-columns: 64px 1fr; gap: 10px; padding: 10px 0; border-top: 1px solid rgba(0,0,0,.08); }
.cont-sel:first-of-type { border-top: 0; }
.cont-sel img { width: 64px; height: 64px; object-fit: contain; background: #fff; border-radius: 6px; border: 1px solid rgba(0,0,0,.08); }
.cont-sel__pie { display: flex; justify-content: space-between; font-size: 12.5px; opacity: .8; margin-top: 6px; }
.cont-videos { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.cont-video { border: 1px solid rgba(0,0,0,.1); border-radius: 10px; padding: 10px; }
.cont-video__cabeza, .cont-video__pie { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.cont-video video { width: 100%; aspect-ratio: 9 / 16; background: #000; border-radius: 8px; margin: 8px 0; display: block; }
.cont-estado { font-weight: 600; opacity: .75; }
.cont-estado--lista { color: rgb(var(--v-theme-success)); opacity: 1; }
.cont-estado--error { color: rgb(var(--v-theme-error)); opacity: 1; }
.cont-error { font-size: 13px; color: rgb(var(--v-theme-error)); margin: 8px 0; }
.cont-borrar--confirmar { color: rgb(var(--v-theme-error)); font-weight: 600; }
</style>
