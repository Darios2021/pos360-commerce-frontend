<!-- Nuevo reel por campañas (spec VIDEOS-campanas-diseno.md, frente C; maqueta aprobada
     11/10). Dos estados en la misma pestaña: Campañas (tarjetas por cercanía) y Armado
     (guion entero editable en línea + reel vivo + Generar). Todo lo escribe el sistema:
     2 clics y 0 campos para lanzar. Lo que la consola no habilita no aparece: las
     campañas, estilos y voces salen de GET /recursos. Sin modales: el selector de
     productos se abre en la misma fila.
     Editar video (contrato CONTENIDO-editar-video): con `edicion` abre el armado con el
     encargo del video ya hecho, sin pedir textos nuevos, y Generar lo rehace sobre la
     misma pieza (deRevision): no mira el cupo. -->
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
            <v-icon v-else size="22">mdi-movie-open-outline</v-icon>{{ textoGenerar }}
          </button>
          <span v-if="sinCupo && !editaMisma" class="cc-cupo">Límite de {{ cupo?.nombreMes }} alcanzado</span>
          <span v-else-if="!cargando && vozVacia" class="cc-cupo">Falta escribir lo que dice la voz en alguna escena.</span>
        </aside>

        <div class="cc-col">
          <div class="cc-pieza cc-cab">
            <div class="cc-cab__t"><b>{{ editando ? editando.titulo || camp.nombre : camp.nombre }}</b><span v-if="editaMisma" class="cc-chip num">Edición {{ editando.numero }} de {{ editando.tope }}</span><span v-else-if="camp.chip" class="cc-chip">{{ camp.chip }}</span></div>
            <button v-if="editando" type="button" class="cc-lnk" @click="descartar">Descartar</button>
            <button v-else type="button" class="cc-lnk" @click="cerrar">Otra campaña</button>
          </div>

          <div class="cc-pieza cc-guion">
            <div class="cc-banda">
              <span>Guion</span>
              <span class="cc-banda__der">
                <span class="cc-modo" role="group" aria-label="Qué vende el video">
                  <button type="button" class="cc-pas" :aria-pressed="!enKit" @click="modoProductos">Productos sueltos</button>
                  <button type="button" class="cc-pas" :aria-pressed="enKit" @click="modoKit">Kit o servicio</button>
                </span>
                <button type="button" class="cc-pas" :aria-pressed="conPrecio" @click="alternarPrecio">Con precio</button>
                <small class="num">{{ enKit ? `kit de ${kit.incluye.length}` : `${cuantos} ${cuantos === 1 ? "producto" : "productos"}` }} · {{ seg(total) }}</small>
              </span>
            </div>
            <!-- Escena del local (contenido/escenaLocal.js): sólo si el comercio tiene tomas cargadas -->
            <div v-if="hayLocal" class="cc-local">
              <span class="cc-local__t"><b>Fondo</b><small>el local en movimiento detrás de la portada y de cada producto</small></span>
              <span class="cc-modo" role="group" aria-label="Fondo del video">
                <button type="button" class="cc-pas" :aria-pressed="conLocal" @click="conLocal = true">Con el local</button>
                <button type="button" class="cc-pas" :aria-pressed="!conLocal" @click="conLocal = false">Sin el local</button>
              </span>
            </div>
            <div v-for="(e, i) in esc" :key="e.k" class="cc-esc" :class="{ 'is-activa': i === actual }">
              <button type="button" class="cc-esc__mini" aria-label="Ver escena" @click="irA(i)"><EscenaReel v-bind="reelDe(e, 52)" /></button>
              <div class="cc-esc__cuerpo">
                <template v-if="e.tipo === 'portada'">
                  <div class="cc-esc__rot">Portada · {{ seg(durDe(e)) }}</div>
                  <input v-model="e.titular" class="cc-in cc-in--tit" maxlength="40" aria-label="Titular" :class="{ 'is-cargando': cargando && !e.titular }" @input="editar(e, 'titular', i)" />
                  <input v-model="e.bajada" class="cc-in cc-in--baj" maxlength="60" aria-label="Bajada" @input="editar(e, 'bajada', i)" />
                </template>
                <template v-else-if="e.tipo === 'item' && enKit">
                  <div class="cc-esc__rot">Kit o servicio · {{ seg(durDe(e)) }}</div>
                  <div class="cc-kit">
                    <label class="cc-kit__campo cc-kit__ancho"><span>Nombre</span><input v-model="kit.nombre" class="cc-in" maxlength="90" placeholder="Kit cerco eléctrico instalado" @input="actualizarKit" @change="refrescar()" /></label>
                    <label v-if="conPrecio" class="cc-kit__campo"><span>Precio</span><input v-model.number="kit.precio" class="cc-in num" type="number" min="0" inputmode="numeric" @input="actualizarKit" @change="refrescar()" /></label>
                  </div>
                  <div class="cc-kit__campo">
                    <span>Incluye</span>
                    <div class="cc-kit__inc">
                      <button v-for="p in candidatosKit" :key="p.id" type="button" class="cc-pas" :aria-pressed="kit.incluye.includes(p.id)" @click="alternarIncluido(p)">{{ p.titulo }}</button>
                    </div>
                    <input v-model="kit.extra" class="cc-in" maxlength="120" placeholder="Y además (ej. instalación y garantía)" @input="actualizarKit" @change="refrescar()" />
                  </div>
                  <span v-if="kitSinFoto" class="cc-cupo">Para el video hace falta incluir al menos un producto con foto.</span>
                  <div v-if="fotosKit.length > 1" class="cc-kit__campo">
                    <span>Foto</span>
                    <div class="cc-kit__fotos">
                      <button v-for="p in fotosKit" :key="p.id" type="button" class="cc-kit__foto" :aria-pressed="kit.foto === p.id" :aria-label="`Usar la foto de ${p.titulo}`" @click="kit.foto = p.id; actualizarKit()"><img :src="p.imagen" alt="" loading="lazy" /></button>
                    </div>
                  </div>
                </template>
                <template v-else-if="e.tipo === 'item'">
                  <div class="cc-esc__rot">Producto {{ nItem(i) }} · {{ seg(durDe(e)) }}</div>
                  <div class="cc-esc__prod">
                    <span class="cc-esc__nom">{{ e.prod.titulo }}</span>
                    <template v-if="conPrecio">
                      <span class="num">{{ pesos(e.prod.precio) }}</span>
                      <template v-if="descuentoDe(e.prod)"><s class="num">{{ pesos(e.prod.precioAnterior) }}</s><span class="cc-off num">-{{ descuentoDe(e.prod) }} %</span></template>
                      <span v-if="tienePlan(e.prod)" class="cc-cuo num">{{ e.prod.cuotas.cantidad }} x {{ pesos(e.prod.cuotas.valor) }}</span>
                    </template>
                  </div>
                  <input v-model="e.etiqueta" class="cc-in cc-in--eti" maxlength="24" aria-label="Etiqueta" @input="editar(e, 'etiqueta', i)" />
                  <input :value="(e.caracteristicas || []).join(' · ')" class="cc-in cc-in--car" maxlength="160" aria-label="Características (separadas por ·)" placeholder="Características, separadas por ·" @input="editarCaracteristicas(e, i, $event)" />
                </template>
                <template v-else>
                  <div class="cc-esc__rot">Cierre · {{ seg(durDe(e)) }}</div>
                  <input v-model="e.llamado" class="cc-in cc-in--tit" maxlength="30" aria-label="Llamado" @input="editar(e, 'llamado', i)" />
                  <div class="cc-esc__datos">
                    <label class="cc-dato"><v-icon size="17">mdi-map-marker-outline</v-icon><input v-model="e.sucursal" class="cc-in" maxlength="40" aria-label="Sucursal" @input="editar(e, 'sucursal', i)" /></label>
                    <label class="cc-dato"><v-icon size="17">mdi-whatsapp</v-icon><input v-model="e.whatsapp" class="cc-in num" maxlength="40" inputmode="tel" aria-label="WhatsApp" @input="editar(e, 'whatsapp', i)" /></label>
                  </div>
                </template>
              </div>
              <div class="cc-esc__acc">
                <button type="button" class="cc-ico" title="Otra versión" aria-label="Otra versión" @click="otraVersion(i)"><v-icon size="19">mdi-refresh</v-icon></button>
                <template v-if="e.tipo === 'item' && !enKit">
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
            <button v-if="!enKit && cuantos < TOPE_PRODUCTOS" type="button" class="cc-mas" @click="agregar"><v-icon size="19">mdi-plus</v-icon>Producto</button>
          </div>

          <!-- Lo que dice la voz, todo junto y en orden: es exactamente lo que se va a decir.
               Cada escena dura lo que su voz (como en el render: la voz nunca se corta). -->
          <div v-if="conVoz" class="cc-pieza cc-guionvoz">
            <div class="cc-banda"><span>Lo que dice la voz</span><small class="num">{{ seg(total) }} en total</small></div>
            <div v-for="(e, i) in esc" :key="`v-${e.k}`" class="cc-linea" :class="{ 'is-activa': i === actual }">
              <button type="button" class="cc-linea__rot" :aria-label="`Ver ${rotulo(e, i)}`" @click="irA(i)">{{ rotulo(e, i) }}<small class="num">{{ seg(durDe(e)) }}</small></button>
              <div class="cc-linea__txt">
                <textarea v-model="e.voz" class="cc-in" rows="1" maxlength="200" :aria-label="`Voz de ${rotulo(e, i)}`" :class="{ 'is-cargando': cargando && !e.voz }" @input="editar(e, 'voz', i, $event)"></textarea>
                <small v-if="comoSeDice(e.voz)" class="cc-linea__dice">Se dice: “{{ comoSeDice(e.voz) }}”</small>
                <small v-if="larga(e)" class="cc-linea__larga">Larga: esta escena dura {{ seg(durDe(e)) }} para que entre. Si querés el ritmo del estilo, acortala.</small>
              </div>
              <button type="button" class="cc-ico" title="Otra versión" :aria-label="`Otra versión de ${rotulo(e, i)}`" @click="otraVersion(i)"><v-icon size="19">mdi-refresh</v-icon></button>
            </div>
          </div>

          <div class="cc-pieza cc-pub">
            <div class="cc-banda"><span>Publicación</span><small>lo que acompaña al video en Instagram, Facebook y WhatsApp</small></div>
            <label class="cc-kit__campo"><span>Título</span><input v-model="publicacion.titulo" class="cc-in" maxlength="80" /></label>
            <label class="cc-kit__campo"><span>Texto</span><textarea v-model="publicacion.texto" class="cc-in cc-in--pub" rows="3" maxlength="2200" :class="{ 'is-cargando': cargando && !publicacion.texto }"></textarea></label>
          </div>

          <div class="cc-pieza cc-sonido">
            <div class="cc-banda"><span>Sonido</span><small>{{ nombreMusica }}</small></div>
            <div v-if="estilos.length" class="cc-son-fila">
              <span>Estilo</span>
              <div class="cc-son-op"><button v-for="s in estilos" :key="s.id" type="button" class="cc-pas" :aria-pressed="son.paquete === s.id" @click="elegirEstilo(s)">{{ s.nombre }}</button></div>
            </div>
            <div class="cc-son-fila">
              <span>Música</span>
              <div class="cc-voces" role="radiogroup" aria-label="Música">
                <span v-for="m in musicas" :key="m.id" class="cc-vozop" :aria-pressed="son.musica === m.id">
                  <b role="radio" tabindex="0" :aria-checked="son.musica === m.id" @click="elegirMusica(m.id)" @keydown.enter.prevent="elegirMusica(m.id)" @keydown.space.prevent="elegirMusica(m.id)">{{ m.nombre || m.id }}</b>
                  <button v-if="m.muestra" type="button" class="cc-oir" :class="{ 'is-sonando': sonando === `mus:${m.id}` }" :aria-label="`${sonando === `mus:${m.id}` ? 'Detener' : 'Escuchar'} ${m.nombre || m.id}`" @click="oir(`mus:${m.id}`, m.muestra)"><v-icon size="16">{{ sonando === `mus:${m.id}` ? "mdi-stop" : "mdi-play" }}</v-icon></button>
                </span>
                <span class="cc-vozop" :aria-pressed="!son.musica">
                  <b role="radio" tabindex="0" :aria-checked="!son.musica" @click="elegirMusica(null)" @keydown.enter.prevent="elegirMusica(null)" @keydown.space.prevent="elegirMusica(null)">Sin música</b>
                </span>
              </div>
            </div>
            <div v-if="conVoz" class="cc-son-fila">
              <span>Voz</span>
              <div class="cc-voces">
                <span v-for="v in voces" :key="v.id" class="cc-vozop" :aria-pressed="son.locutor === v.id">
                  <b role="button" tabindex="0" @click="elegirVoz(v.id)" @keydown.enter.prevent="elegirVoz(v.id)" @keydown.space.prevent="elegirVoz(v.id)">{{ v.nombre || v.id }}</b>
                  <button v-if="v.muestra" type="button" class="cc-oir" :class="{ 'is-sonando': sonando === `voz:${v.id}` }" :aria-label="`${sonando === `voz:${v.id}` ? 'Detener' : 'Escuchar'} ${v.nombre || v.id}`" @click="oir(`voz:${v.id}`, v.muestra)"><v-icon size="16">{{ sonando === `voz:${v.id}` ? "mdi-stop" : "mdi-play" }}</v-icon></button>
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
          <v-icon v-else size="22">mdi-movie-open-outline</v-icon>{{ textoGenerar }}
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
  GRUPOS, LIBRE, RITMOS, TOPE_PRODUCTOS, contexto, descuentoDe, etiquetaDe, conTelefonoDicho, durEscena, durVoz, esNuevo, llenar, pesos,
  opcionesSonido, primeraQueEntra, propuestos, seg, sugeridos, textosLocales, tienePlan, variantesCierre, variantesItem, variantesPortada, contextoItem,
} from "@/modules/admin/components/contenidos/campanas";

const props = defineProps({
  fuente: { type: Object, default: null },
  // videos de GET /recursos: { campanas, estilos, voces, musicas, ... }
  recursos: { type: Object, required: true },
  catalogo: { type: Array, default: () => [] },
  promoIds: { type: Object, default: () => new Set() },
  cupo: { type: Object, default: null },
  // Editar video: { id, titulo, encargo, pantalla?, ediciones } (GET /piezas/:id/encargo).
  edicion: { type: Object, default: null },
});
const emit = defineEmits(["generado", "error", "no-habilitado", "descartar"]);
const route = useRoute();
const router = useRouter();

/* ── Campañas: las habilitadas, ya ordenadas por el servicio; "Libre" al final de Siempre ── */
const campanas = computed(() => [...(props.recursos.campanas || []), LIBRE]);
// Las propias del comercio (Campaña a medida) van juntas primero, en "Mis campañas".
const grupos = computed(() => [{ k: "mias", t: "Mis campañas", l: campanas.value.filter((c) => c.propia) },
  ...GRUPOS.map((g) => ({ ...g, l: campanas.value.filter((c) => !c.propia && (c.grupo || "siempre") === g.k) }))].filter((g) => g.l.length));
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
// Todo lo que habilitó la consola, sin recortes: la campaña y el estilo sólo preeligen.
const sonido = computed(() => opcionesSonido(props.recursos));
const estilos = computed(() => sonido.value.estilos);
const voces = computed(() => sonido.value.voces);
const musicas = computed(() => sonido.value.musicas);
const conVoz = computed(() => voces.value.length > 0);
const son = reactive({ paquete: null, musica: null, locutor: null, ritmo: "normal" });
const musicaDe = (id) => musicas.value.find((m) => m.id === id);
const nombreMusica = computed(() => (son.musica ? musicaDe(son.musica)?.nombre || String(son.musica).replace(/^./, (x) => x.toUpperCase()) : "Sin música"));
const cps = computed(() => voces.value.find((v) => v.id === son.locutor)?.cps);
const medir = (t) => durVoz(t, { cps: cps.value, ritmo: son.ritmo });

function sonidoDe(c) {
  const est = estilos.value.find((e) => e.id === c.estilo) || estilos.value.find((e) => e.porDefecto) || estilos.value[0] || null;
  son.paquete = est?.id || null;
  son.musica = c.musica !== undefined ? c.musica : est?.musica ?? musicas.value.find((m) => m.porDefecto)?.id ?? null;
  const loc = c.voz?.locutor || est?.voz?.locutor;
  son.locutor = voces.value.some((v) => v.id === loc) ? loc : (voces.value.find((v) => v.porDefecto) || voces.value[0])?.id || null;
  son.ritmo = c.voz?.ritmo || est?.voz?.ritmo || "normal";
}
function elegirEstilo(s) {
  son.paquete = s.id;
  son.musica = s.id === camp.value?.estilo && camp.value?.musica !== undefined ? camp.value.musica : s.musica ?? null;
}
function elegirMusica(id) { son.musica = id; }
function elegirVoz(id) { son.locutor = id; reajustar(); }
function elegirRitmo(v) { son.ritmo = v; reajustar(); }

/* ── Armado ── */
const camp = ref(null);
// Video que se está editando: { id, titulo, numero, tope, nuevo }. null = video nuevo.
// Con `nuevo` ("Nuevo video desde este") se precarga igual pero sale otro video, que usa cupo.
const editando = ref(null);
const editaMisma = computed(() => Boolean(editando.value && !editando.value.nuevo));
const esc = ref([]);
const cargando = ref(false);
const creando = ref(false);
const eligiendo = ref(null);
const filtro = ref("sug");
const buscar = ref("");
const publicacion = reactive({ titulo: "", texto: "", fija: false });
let serie = 0;
const items = computed(() => esc.value.filter((e) => e.tipo === "item"));
const cuantos = computed(() => items.value.length);
const enReel = computed(() => new Set(items.value.map((e) => e.prod.id)));
// Como el render (contenido, plantillas/vertical.js `ritmo`): la escena dura lo suyo o lo que
// tarda su voz, lo que sea más. Antes la pantalla medía contra el tiempo fijo y bloqueaba
// Generar con una voz que el render igual hacía entrar.
const VOZ_ESCENA = { portada: [0.5, 0.5], item: [0.4, 0.5], cierre: [0.35, 0.9] };
const baseDe = (e) => durEscena(e?.tipo, cuantos.value);
const durDe = (e) => {
  const b = baseDe(e);
  if (!conVoz.value || !String(e?.voz || "").trim()) return b;
  const [antes, despues] = VOZ_ESCENA[e.tipo] || [0.4, 0.5];
  return Math.max(b, Math.round((antes + medir(e.voz) + despues) * 10) / 10);
};
const larga = (e) => conVoz.value && durDe(e) > baseDe(e) * 1.6;
const rotulo = (e, i) => (e.tipo === "portada" ? "Portada" : e.tipo === "cierre" ? "Cierre" : enKit.value ? "Kit" : `Producto ${nItem(i)}`);
const comoSeDice = (t) => { const d = conTelefonoDicho(t); return d !== String(t || "") ? d : ""; };
const total = computed(() => esc.value.reduce((a, e) => a + durDe(e), 0));
const nItem = (i) => esc.value.slice(0, i).filter((e) => e.tipo === "item").length + 1;
const sinCupo = computed(() => props.cupo?.limite != null && props.cupo.quedan <= 0);
// El servicio pide foto en cada ítem: un kit necesita al menos un producto incluido con foto.
const kitSinFoto = computed(() => enKit.value && !items.value[0]?.prod?.imagen);
// Nada sale sin que el comercio lo vea: con el guion todavía escribiéndose o una voz vacía,
// no se genera (antes Generar andaba durante la carga y el servicio ponía textos que nadie vio).
const vozVacia = computed(() => conVoz.value && esc.value.some((e) => !String(e.voz || "").trim()));
const puedeGenerar = computed(() => !creando.value && !cargando.value && !vozVacia.value && (editaMisma.value || !sinCupo.value) && cuantos.value > 0 && Boolean(props.fuente) && !kitSinFoto.value);
const textoGenerar = computed(() => (cargando.value ? "Escribiendo el guion…" : "Generar video"));
const nueva = (tipo, extra = {}) => ({ k: ++serie, tipo, voz: "", variante: 0, editado: {}, ...extra });
const escenaItem = (p) => nueva("item", { prod: p, etiqueta: "", caracteristicas: [] });
// Cierre: la primera sucursal y el WhatsApp salen del comercio y se editan por video;
// vacío = no se muestra.
const datosComercio = () => {
  const f = props.fuente || {};
  return { sucursal: (f.sucursales || [])[0]?.nombre || "", whatsapp: (f.redes || []).find((r) => r.red === "whatsapp")?.texto || "" };
};
function datosCierre() {
  const f = props.fuente || {};
  const sucursales = [...(f.sucursales || [])];
  const redes = [...(f.redes || [])];
  const e = esc.value.at(-1);
  if (e?.tipo !== "cierre") return { sucursales, redes };
  const nom = String(e.sucursal ?? "").trim();
  if (!sucursales.length) { if (nom) sucursales.push({ nombre: nom, direccion: "" }); }
  else if (nom) sucursales[0] = { ...sucursales[0], nombre: nom };
  else sucursales.shift();
  const wa = String(e.whatsapp ?? "").trim();
  const k = redes.findIndex((r) => r.red === "whatsapp");
  if (k < 0) { if (wa) redes.unshift({ red: "whatsapp", texto: wa }); }
  else if (wa) redes[k] = { ...redes[k], texto: wa };
  else redes.splice(k, 1);
  return { sucursales, redes };
}
// Sin precio: el producto viaja sin precio, precio anterior ni cuotas (la escena, la voz y el video).
const conPrecio = ref(true);
// Escena del local: el servicio pone las tomas del comercio de fondo (contenido/escenaLocal.js).
const hayLocal = computed(() => Boolean(props.recursos.escenaLocal));
const conLocal = ref(false);
const prodDe = (p) => (conPrecio.value ? p : { ...p, precio: undefined, precioAnterior: undefined, cuotas: undefined });
function alternarPrecio() {
  conPrecio.value = !conPrecio.value;
  for (const e of esc.value) if (!e.editado.voz) e.variante = 0;
  pedirTextos();
}
/* ── Kit o servicio (2026-10-25, pedido del usuario: "no necesariamente los videos deben
   ser vendiendo los productos individuales sino el servicio o el kit, y el precio lo puede
   asignar el usuario"; "dejale las opciones"). Una sola escena con un ítem armado acá:
   nombre, precio a mano, lo que incluye (productos del catálogo + texto libre) y la foto
   de uno de ellos. El servicio lo recibe como cualquier ítem (titulo, precio, descripcion,
   imagen): no hace falta nada del otro lado. */
const ID_KIT = "kit";
const enKit = ref(false);
const kit = reactive({ nombre: "", precio: 0, incluye: [], extra: "", foto: null });
const porId = (id) => props.catalogo.find((p) => String(p.id) === String(id));
// Para tildar: los que propone la campaña (y los que ya estaban), hasta 12.
const candidatosKit = computed(() => {
  if (!camp.value) return [];
  const base = propuestos(camp.value, props.catalogo, promo()).slice(0, 12);
  const extra = kit.incluye.map(porId).filter((p) => p && !base.some((b) => b.id === p.id));
  return [...extra, ...base];
});
const fotosKit = computed(() => kit.incluye.map(porId).filter((p) => p?.imagen));
const sumaIncluidos = () => Math.round(kit.incluye.map(porId).reduce((a, p) => a + (Number(p?.precio) || 0), 0));
function prodKit() {
  const inc = kit.incluye.map(porId).filter(Boolean);
  const nombres = inc.map((p) => p.titulo);
  const extra = kit.extra.trim();
  const lista = [...nombres, ...(extra ? [extra] : [])];
  const foto = porId(kit.foto) || inc.find((p) => p.imagen) || null;
  return {
    id: ID_KIT, titulo: kit.nombre.trim() || camp.value?.nombre || "Kit", nombre: kit.nombre.trim(),
    precio: Number(kit.precio) > 0 ? Number(kit.precio) : undefined,
    descripcion: lista.length ? `Incluye: ${lista.join(" · ")}`.slice(0, 300) : undefined,
    categoria: inc[0]?.categoria, imagen: foto?.imagen || "",
  };
}
function actualizarKit() {
  const e = items.value[0];
  if (e) e.prod = prodKit();
}
function alternarIncluido(p) {
  const i = kit.incluye.indexOf(p.id);
  const sumaAntes = sumaIncluidos();
  if (i >= 0) kit.incluye.splice(i, 1);
  else kit.incluye.push(p.id);
  // El precio sigue a la suma mientras nadie lo haya cambiado a mano.
  if (!kit.precio || kit.precio === sumaAntes) kit.precio = sumaIncluidos();
  if (!kit.incluye.includes(kit.foto)) kit.foto = kit.incluye.find((id) => porId(id)?.imagen) ?? null;
  actualizarKit();
  refrescar();
}
function modoKit() {
  if (enKit.value || !camp.value) return;
  const prods = items.value.map((e) => e.prod).filter((p) => p.id !== ID_KIT);
  kit.incluye = prods.map((p) => p.id);
  kit.nombre = kit.nombre || camp.value.nombre || "";
  kit.precio = sumaIncluidos();
  kit.extra = "";
  kit.foto = prods.find((p) => p.imagen)?.id ?? null;
  enKit.value = true;
  const e = escenaItem(prodKit());
  esc.value = [esc.value[0], e, esc.value.at(-1)];
  eligiendo.value = null;
  refrescar();
}
function modoProductos() {
  if (!enKit.value) return;
  enKit.value = false;
  const prods = kit.incluye.map(porId).filter(Boolean).slice(0, TOPE_PRODUCTOS);
  const lista = prods.length ? prods : propuestos(camp.value, props.catalogo, promo()).slice(0, Math.min(TOPE_PRODUCTOS, camp.value.productos?.n || 3));
  esc.value = [esc.value[0], ...lista.map(escenaItem), esc.value.at(-1)];
  refrescar();
}

// Cierre con cuotas y medios de pago: lo decide la campaña (si habla de cuotas).
const hablaDeCuotas = (c) => c?.productos?.regla === "conCuotas" || /\{(cuotas|valorCuota)\}/.test(Object.values(c?.textos || {}).join(" "));

function abrir(c, { conRuta = true } = {}) {
  cortarMuestra();
  camp.value = c;
  sonidoDe(c);
  // Con productos elegidos (Campaña a medida), todos los que siguen en stock; si no, los de la regla.
  const elegidos = (c.productos?.ids || []).map(porId).filter(Boolean);
  const prods = (elegidos.length ? elegidos : propuestos(c, props.catalogo, promo())).slice(0, Math.min(TOPE_PRODUCTOS, elegidos.length || c.productos?.n || 3));
  conPrecio.value = c.conPrecio !== false;
  conLocal.value = false;
  enKit.value = false;
  Object.assign(kit, { nombre: "", precio: 0, incluye: [], extra: "", foto: null });
  esc.value = [nueva("portada", { titular: "", bajada: "" }), ...prods.map(escenaItem), nueva("cierre", { llamado: "", ...datosComercio() })];
  // Una campaña de kit o servicio arranca armada como kit, con lo que guardó el local.
  if (c.modo === "kit" && elegidos.length) {
    Object.assign(kit, { nombre: c.kit?.nombre || c.nombre || "", extra: c.kit?.extra || "", incluye: elegidos.map((p) => p.id) });
    kit.precio = Number(c.kit?.precio) > 0 ? Number(c.kit.precio) : sumaIncluidos();
    const foto = porId(c.kit?.foto);
    kit.foto = foto?.imagen ? foto.id : elegidos.find((p) => p.imagen)?.id ?? null;
    enKit.value = true;
    esc.value = [esc.value[0], escenaItem(prodKit()), esc.value.at(-1)];
  }
  publicacion.fija = false;
  if (c.propia && c.autor === "local") textosDeLaCampana(c);
  eligiendo.value = null;
  t.value = 0;
  play.value = true;
  if (conRuta && route.query.campana !== c.id) router.replace({ query: { ...route.query, vista: "nuevo", campana: c.id } });
  pedirTextos();
  window.scrollTo({ top: 0 });
}
// Los textos que el comercio revisó en su campaña (Campaña a medida) van tal cual, con los
// datos de cada producto, y cuentan como escritos: la IA de /guion sólo completa lo que
// la campaña no dice (características, una voz vacía).
const sinStock = (v) => String(v || "").replace(/[^.!?]*\{stock\}[^.!?]*[.!?]?/g, "").trim();
function textosDeLaCampana(c) {
  // Las unidades en stock no se dicen ("quedan 3"): la frase que las nombra se saca.
  const t = Object.fromEntries(Object.entries(c.textos || {}).map(([k, v]) => [k, sinStock(v)]));
  const prods = items.value.map((e) => prodDe(e.prod));
  const base = contexto(c, prods, props.fuente);
  const pon = (e, campo, v, max) => { const x = String(v || "").trim().slice(0, max); if (x) { e[campo] = x; e.editado[campo] = true; } };
  const portada = esc.value[0];
  const cierre = esc.value.at(-1);
  pon(portada, "titular", llenar(t.titular, base), 40);
  pon(portada, "bajada", llenar(t.bajada, base), 60);
  pon(portada, "voz", llenar(t.vozIntro, base), 200);
  items.value.forEach((e) => {
    const x = contextoItem(base, prodDe(e.prod));
    pon(e, "voz", llenar(t.vozItem, x), 200);
    if (t.etiqueta) pon(e, "etiqueta", etiquetaDe(c, x), 24);
  });
  pon(cierre, "llamado", llenar(t.llamado, base), 30);
  pon(cierre, "voz", llenar(t.vozCierre, base), 200);
  if (t.caption) { publicacion.titulo = c.nombre; publicacion.texto = llenar(t.caption, base); publicacion.fija = true; }
}
function cerrar() {
  camp.value = null;
  editando.value = null;
  esc.value = [];
  cortarMuestra();
  const { campana, vista, ...resto } = route.query;
  router.replace({ query: resto });
}

/* ── Editar video: el armado con el encargo guardado, sin pedir textos al servicio ──
   La campaña sale del estado que guardó la pantalla o del encargo; si ya no está
   habilitada, Libre. Los productos se buscan en el catálogo por id (precio y stock de
   hoy); si no están, se arman con lo que dice el encargo. Lo que se precarga cuenta
   como escrito: sólo "Otra versión" o un producto nuevo piden textos. */
function abrirEdicion(ed) {
  const enc = ed.encargo || {};
  const pan = ed.pantalla?.creador === "campanas" ? ed.pantalla : null;
  const idCamp = pan ? pan.campana : enc.campana;
  const c = campanas.value.find((x) => x.id === idCamp) || LIBRE;
  cortarMuestra();
  camp.value = c;
  sonidoDe(c);
  if (enc.paquete && estilos.value.some((e) => e.id === enc.paquete)) son.paquete = enc.paquete;
  if (enc.musica === null || musicas.value.some((m) => m.id === enc.musica)) son.musica = enc.musica;
  if (voces.value.some((v) => v.id === enc.voz?.locutor)) son.locutor = enc.voz.locutor;
  const vel = Number(enc.voz?.velocidad);
  if (vel) son.ritmo = RITMOS.reduce((a, r) => (Math.abs(r.velocidad - vel) < Math.abs(a.velocidad - vel) ? r : a)).v;
  const g = enc.voz?.guion || {};
  const escrito = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v).map(([k]) => [k, true]));
  const variantes = pan?.variantes || [];
  const portada = { titular: enc.apertura?.titular || "", bajada: enc.apertura?.bajada || "", voz: g.intro || "" };
  const cierre = { llamado: enc.textos?.llamado || "", voz: g.cierre || "" };
  const datos = { sucursal: (enc.sucursales || [])[0]?.nombre || "", whatsapp: (enc.redes || []).find((r) => r.red === "whatsapp")?.texto || "" };
  conPrecio.value = pan?.conPrecio ?? (!(enc.items || []).length || (enc.items || []).some((it) => it.precio != null));
  conLocal.value = Boolean(pan?.escenaLocal ?? enc.escenaLocal);
  enKit.value = Boolean(pan?.kit);
  Object.assign(kit, pan?.kit ? { nombre: "", extra: "", foto: null, ...pan.kit, incluye: [...(pan.kit.incluye || [])] } : { nombre: "", precio: 0, incluye: [], extra: "", foto: null });
  const its = (enc.items || []).slice(0, TOPE_PRODUCTOS).map((it, i) => {
    const prod = props.catalogo.find((p) => it.id != null && String(p.id) === String(it.id))
      || { id: it.id ?? `encargo-${i}`, titulo: it.titulo, nombre: it.titulo, precio: it.precio, precioAnterior: it.precioAnterior, imagen: it.imagen, cuotas: it.cuotas, descripcion: it.descripcion, categoria: it.categoria, stock: it.stock };
    const txt = { etiqueta: it.etiqueta || "", voz: g.items?.[i] || "" };
    const caracteristicas = String(it.descripcion || "").split(/\s*·\s*/).filter(Boolean).slice(0, 3);
    return nueva("item", { prod, ...txt, caracteristicas, editado: escrito(txt), variante: variantes[i + 1] || 0 });
  });
  esc.value = [
    nueva("portada", { ...portada, editado: escrito(portada), variante: variantes[0] || 0 }),
    ...its,
    nueva("cierre", { ...cierre, ...datos, editado: escrito(cierre), variante: variantes.at(-1) || 0 }),
  ];
  publicacion.titulo = enc.titulo || ed.titulo || c.nombre;
  publicacion.texto = enc.descripcion || "";
  editando.value = { id: ed.id, titulo: ed.titulo || enc.titulo || "", numero: (ed.ediciones?.hechas || 0) + 1, tope: ed.ediciones?.tope || 2, nuevo: Boolean(ed.nuevo) };
  eligiendo.value = null;
  cargando.value = false;
  pedido++;
  t.value = 0;
  play.value = true;
  nextTick(crecer);
  window.scrollTo({ top: 0 });
}
function descartar() {
  camp.value = null;
  esc.value = [];
  editando.value = null;
  cortarMuestra();
  emit("descartar");
}

/* Textos: los escribe el servicio (POST /guion con la campaña); sin `textos` en la respuesta
   (servicio viejo, o "Libre", que no viaja), las plantillas de la campaña con las mismas reglas. */
const itemGuion = (p) => ({
  id: p.id, titulo: p.titulo, precio: p.precio, precioAnterior: p.precioAnterior,
  ...(tienePlan(p) ? { cuotas: { cantidad: p.cuotas.cantidad, valor: p.cuotas.valor } } : {}),
  descripcion: p.descripcion || undefined, categoria: p.categoria || undefined,
  imagen: p.imagen,
});
function encargoBase() {
  const f = props.fuente || {};
  const c = camp.value;
  const cuotas = conPrecio.value && hablaDeCuotas(c);
  return {
    ...(c.libre ? { tipo: "destacados" } : { campana: c.id }),
    cuenta: f.cuenta, ajuste: f.ajuste, marca: f.marca, estilo: f.estilo, sellos: f.sellos, textos: f.textos,
    mediosDePago: cuotas ? f.mediosDePago || [] : [],
    ...datosCierre(),
    cierre: { sucursales: true, redes: true, cuotas, llamado: true },
    ritmo: son.ritmo, locutor: son.locutor || undefined,
  };
}
let pedido = 0;
async function guion(variante = 0) {
  const prods = items.value.map((e) => prodDe(e.prod));
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
      if (Array.isArray(s.caracteristicas) && !e.editado.caracteristicas) e.caracteristicas = s.caracteristicas.filter(Boolean).slice(0, 3);
    }
  }
  if (!solo && !editando.value) {
    if (!publicacion.fija) {
      publicacion.titulo = tx.titulo || camp.value.nombre;
      publicacion.texto = tx.publicacion || "";
    }
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
// Al cambiar ritmo o voz no hace falta pedir textos: cada escena se estira con su voz (durDe).
function reajustar() {}

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

function editarCaracteristicas(e, i, ev) {
  e.caracteristicas = String(ev.target.value).split(/\s*·\s*/).map((x) => x.trim()).filter(Boolean).slice(0, 3);
  e.editado.caracteristicas = true;
  if (actual.value !== i) irA(i);
}
function editar(e, campo, i, ev) {
  e.editado[campo] = true;
  if (ev?.target) crecerUno(ev.target);
  if (actual.value !== i) irA(i);
}
const crecerUno = (el) => { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; };
function crecer() { document.querySelectorAll(".cc-linea textarea").forEach(crecerUno); }

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
const descripcionDe = (e) => (e.prod?.id === ID_KIT ? e.prod.descripcion || "" : e.caracteristicas?.length ? e.caracteristicas.join(" · ") : e.prod?.descripcion || "");
function reelDe(e, ancho) {
  if (!e) return { tipo: "intro", fuente: props.fuente, ancho };
  if (e.tipo === "portada") return { tipo: "intro", apertura: e.titular ? { titular: e.titular, bajada: e.bajada } : null, foto: items.value[0]?.prod.imagen || "", fuente: props.fuente, ancho };
  if (e.tipo === "cierre") return { tipo: "cierre", cierre: { sucursales: true, redes: true, llamado: e.llamado || true }, fuente: { ...props.fuente, ...datosCierre() }, ancho };
  const p = prodDe(e.prod);
  return { tipo: "item", item: { ...p, etiqueta: e.etiqueta, descripcion: descripcionDe(e) }, conCuotas: tienePlan(p), fuente: props.fuente, ancho };
}

/* ── Muestras de música y voz: un solo reproductor. La clave lleva el tipo (mus:/voz:)
   porque una música y una voz pueden compartir id. ── */
const sonando = ref(null);
let reproductor = null;
function cortarMuestra() {
  if (reproductor) { reproductor.pause(); reproductor.removeAttribute("src"); reproductor.load(); }
  sonando.value = null;
}
function oir(clave, muestra) {
  if (sonando.value === clave) return cortarMuestra();
  cortarMuestra();
  if (!reproductor) {
    reproductor = new Audio();
    reproductor.preload = "none";
    reproductor.addEventListener("ended", () => { sonando.value = null; });
  }
  reproductor.src = muestra;
  sonando.value = clave;
  reproductor.play().catch(() => { if (sonando.value === clave) sonando.value = null; });
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
    ...(conLocal.value && hayLocal.value ? { escenaLocal: true } : {}),
    titulo: (publicacion.titulo || c.nombre).slice(0, 80),
    descripcion: publicacion.texto ? publicacion.texto.slice(0, 2200) : undefined,
    apertura: { titular: portada.titular.trim(), bajada: portada.bajada.trim() },
    textos: { ...(f.textos || {}), llamado: cierre.llamado.trim() || f.textos?.llamado },
    ...(son.paquete ? { paquete: son.paquete, musica: son.musica ?? null } : { musica: son.musica || undefined }),
    items: items.value.map((e) => ({
      ...itemGuion(prodDe(e.prod)),
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
  // Lo que la pantalla necesita para reabrir este armado tal cual (Editar video).
  const pantalla = { creador: "campanas", campana: c.id, variantes: esc.value.map((e) => e.variante || 0), conPrecio: conPrecio.value, escenaLocal: conLocal.value && hayLocal.value,
    ...(enKit.value ? { kit: { nombre: kit.nombre, precio: kit.precio, incluye: kit.incluye, extra: kit.extra, foto: kit.foto } } : {}) };
  try {
    const p = await crearPieza({ ...encargo, pantalla, ...(editaMisma.value ? { deRevision: editando.value.id } : {}) });
    camp.value = null;
    esc.value = [];
    editando.value = null;
    emit("generado", p);
  } catch (e) {
    if (e?.response?.status === 403 && e.response.data?.codigo === "recurso_no_habilitado") { emit("no-habilitado"); cerrar(); }
    else emit("error", e);
  } finally { creando.value = false; }
}

/* Recargar la página con ?campana= vuelve al armado cuando ya está el catálogo. */
watch(() => [route.query.campana, props.catalogo.length, campanas.value.length], ([id]) => {
  if (props.edicion) return;
  if (!id) { if (camp.value) { camp.value = null; esc.value = []; } return; }
  if (camp.value?.id === id || !props.catalogo.length) return;
  const c = campanas.value.find((x) => x.id === id);
  if (c) abrir(c, { conRuta: false });
}, { immediate: true });
watch(() => props.recursos, () => { if (camp.value && !editando.value && !campanas.value.some((c) => c.id === camp.value.id)) cerrar(); });
watch(() => props.edicion, (ed) => {
  if (ed) abrirEdicion(ed);
  else if (editando.value) { camp.value = null; esc.value = []; editando.value = null; }
}, { immediate: true });

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
.cc-esc__datos { display: flex; flex-wrap: wrap; gap: 2px 14px; }
.cc-dato { flex: 1 1 180px; min-width: 0; display: flex; align-items: center; gap: 4px; color: var(--sp-suave); }
.cc-dato .v-icon { color: inherit; flex: none; }
.cc-dato .cc-in { margin-left: 0; font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.cc-banda__der { display: inline-flex; align-items: center; gap: 10px; }
.cc-in { width: 100%; box-sizing: border-box; border: 1px solid transparent; background: transparent; border-radius: 8px; padding: 4px 8px; margin-left: -8px; color: var(--sp-texto); font: inherit; outline: 0; transition: border-color .15s, background .15s; }
.cc-in:hover { border-color: var(--sp-borde); }
.cc-in:focus { border-color: var(--cc-pri); background: var(--sp-caja); }
.cc-in--tit { font-size: 19px; font-weight: 900; letter-spacing: -.01em; }
.cc-in--baj { font-size: 14.5px; font-weight: 600; color: var(--sp-suave); }
.cc-local { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--sp-linea); }
.cc-local__t { display: flex; flex-direction: column; gap: 2px; }
.cc-local__t small { font-size: 13px; color: var(--sp-suave); }
.cc-in--car { font-size: 13px; color: var(--sp-suave); }
.cc-pub { display: flex; flex-direction: column; gap: 10px; }
.cc-pub .cc-kit__campo { padding: 0 16px; }
.cc-pub .cc-kit__campo:last-child { padding-bottom: 14px; }
.cc-in--pub { resize: vertical; min-height: 70px; }
.cc-in--eti { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; color: var(--cc-pri); }
.cc-in.is-cargando { background: linear-gradient(90deg, var(--sp-linea) 0%, var(--sp-hover) 50%, var(--sp-linea) 100%); background-size: 200% 100%; animation: cc-esqueleto 1.2s linear infinite; min-height: 28px; }
@keyframes cc-esqueleto { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.cc-vozop { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--sp-borde); background: var(--sp-caja); border-radius: 9px; padding: 3px 4px 3px 10px; font-size: 13px; font-weight: 700; color: var(--sp-suave); white-space: nowrap; }
.cc-vozop b { font-weight: 700; cursor: pointer; }
.cc-vozop[aria-pressed="true"] { border-color: var(--cc-pri); color: var(--cc-pri); background: var(--cc-pri-bg); }
.cc-guionvoz { display: flex; flex-direction: column; }
.cc-linea { display: grid; grid-template-columns: 120px minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 10px 16px; border-top: 1px solid var(--sp-linea); }
.cc-linea.is-activa { background: var(--cc-pri-bg); }
.cc-linea__rot { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; border: 0; background: none; padding: 6px 0; text-align: left; font: 800 13px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; }
.cc-linea__rot small { font-size: 12px; font-weight: 700; color: var(--sp-suave); }
.cc-linea__txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cc-linea .cc-in { font-size: 15px; font-weight: 600; resize: none; overflow: hidden; line-height: 1.4; padding: 6px 8px; min-height: 34px; border-radius: 8px; border: 1px solid var(--sp-borde); background: var(--sp-caja); }
.cc-linea__dice { font-size: 12.5px; color: var(--sp-suave); }
.cc-linea__larga { font-size: 12.5px; font-weight: 700; color: var(--cc-aviso, #8a5300); }
@media (max-width: 640px) { .cc-linea { grid-template-columns: minmax(0, 1fr) auto; } .cc-linea__rot { grid-column: 1 / -1; flex-direction: row; gap: 8px; padding: 0; } }
.cc-esc__acc { display: flex; flex-direction: column; gap: 4px; }
.cc-ico { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); display: grid; place-items: center; color: var(--sp-suave); cursor: pointer; }
.cc-ico .v-icon { color: inherit; }
.cc-ico:hover, .cc-ico.is-on { color: var(--cc-pri); border-color: var(--cc-pri); }

.cc-elegir { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 12px; border: 1px dashed var(--sp-borde); }
.cc-filtros { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cc-modo { display: inline-flex; gap: 4px; margin-right: 6px; }
.cc-kit { display: flex; gap: 10px; flex-wrap: wrap; }
.cc-kit__campo { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
.cc-kit__campo > span { font-size: 12px; font-weight: 700; color: var(--sp-suave); }
.cc-kit__ancho { flex: 1 1 220px; }
.cc-kit__inc { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-kit__fotos { display: flex; gap: 6px; flex-wrap: wrap; }
.cc-kit__foto { width: 52px; height: 52px; padding: 2px; border-radius: 10px; border: 2px solid var(--sp-borde); background: #fff; cursor: pointer; }
.cc-kit__foto[aria-pressed="true"] { border-color: var(--cc-pri); }
.cc-kit__foto img { width: 100%; height: 100%; object-fit: contain; }
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
/* Todas las opciones a la vista: envuelven en filas, sin tira con scroll oculto. */
.cc-voces { display: flex; flex-wrap: wrap; gap: 6px; }
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
