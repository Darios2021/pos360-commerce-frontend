<!-- Mis campañas (maqueta aprobada 25/10, artboard 3): las campañas que armó el comercio,
     para prenderlas, apagarlas, editarlas o borrarlas, las que le armó la plataforma
     (sólo para ver) y su estrategia. Los datos son los de GET /campanas; acá no se
     decide nada que no decida el servicio (tope, autonomía). -->
<template>
  <div class="cm mc">
    <section class="cm-pieza mc-lista" aria-labelledby="mc-t">
      <div class="cm-fila">
        <h2 id="mc-t" class="mc-t">Tus campañas</h2>
        <div class="mc-uso">
          <span class="num">{{ estado.autonomia.usadas }} de {{ estado.autonomia.tope }} prendidas</span>
          <div class="mc-pista"><i :class="{ lleno: !estado.autonomia.quedan }" :style="{ width: pct + '%' }"></i></div>
        </div>
        <button type="button" class="cm-pri mc-nueva" @click="$emit('nueva')"><v-icon size="18">mdi-plus</v-icon>Nueva campaña</button>
      </div>
      <p v-if="error" class="cm-mal" role="alert">{{ error }}</p>
      <div v-if="!suyas.length" class="cm-s mc-vacio">Todavía no armaste ninguna. Contá tu idea en Nuevo reel y queda acá.</div>
      <div v-else class="mc-tabla" role="table" aria-label="Tus campañas">
        <div class="mc-fila mc-fila--cab" role="row"><span role="columnheader">Campaña</span><span role="columnheader">Cuándo</span><span role="columnheader">Prendida</span><span role="columnheader"></span></div>
        <div v-for="c in suyas" :key="c.id" class="mc-fila" :class="{ 'is-off': c.activa === false }" role="row">
          <button type="button" class="mc-nombre" role="cell" @click="$emit('editar', c)">{{ c.nombre }}</button>
          <span role="cell" class="cm-s">{{ cuando(c) }}</span>
          <label role="cell" class="ct-sw ct-sw--ultimo mc-sw"><span class="sr">Prendida</span><input type="checkbox" :checked="c.activa !== false" :disabled="cambiando === c.id" @change="prender(c, $event)" /><i></i></label>
          <span role="cell" class="mc-acc">
            <button type="button" class="cm-lnk" @click="$emit('editar', c)">Editar</button>
            <button type="button" class="cm-lnk mc-borrar" @click="borrar(c)">{{ borrando === c.id ? "Confirmar" : "Borrar" }}</button>
          </span>
        </div>
      </div>

      <template v-if="dePlataforma.length">
        <h3 class="mc-sub">ARMADAS PARA VOS</h3>
        <div class="mc-tabla">
          <div v-for="c in dePlataforma" :key="c.id" class="mc-fila mc-fila--plat">
            <b>{{ c.nombre }}</b><span class="cm-s">{{ cuando(c) }}</span><span class="cm-s">{{ c.activa === false ? "Apagada" : "Disponible" }}</span><span></span>
          </div>
        </div>
      </template>
    </section>

    <section class="cm-pieza mc-estrategia" aria-labelledby="mc-e">
      <h2 id="mc-e" class="mc-t">Tu estrategia</h2>
      <p class="cm-s" style="margin: 0">Con esto armamos cada campaña para que hable como vos.</p>
      <div v-for="[k, t, ej, max] in CAMPOS" :key="k" class="ct-campo"><label :for="'mc-' + k">{{ t }}</label><input :id="'mc-' + k" v-model="perfil[k]" :maxlength="max" :placeholder="ej" /></div>
      <div class="cm-fila">
        <button type="button" class="cm-sec cm-sec--alto" :disabled="!cambioPerfil || guardandoPerfil" @click="guardar">Guardar estrategia</button>
        <span v-if="guardadoPerfil" class="cm-s">Guardada</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { borrarCampana, guardarCampana, guardarPerfil } from "@/modules/admin/services/contenidos.service";

const props = defineProps({
  // GET /campanas: { campanas, autonomia, perfil, ia }
  estado: { type: Object, required: true },
});
const emit = defineEmits(["nueva", "editar", "cambio"]);

const CAMPOS = [
  ["vende", "Qué vendés", "cámaras, alarmas y redes", 200],
  ["publico", "A quién", "hogares y comercios de San Juan", 160],
  ["distingue", "Qué te distingue", "instalación incluida y garantía oficial", 200],
  ["tono", "Cómo hablás", "técnico y cercano", 60],
  ["contacto", "Cómo te contactan", "WhatsApp", 80],
  ["evitar", "Qué no decir nunca", "envío gratis", 160],
];
const error = ref("");
const cambiando = ref("");
const borrando = ref("");
const perfil = reactive({});
const original = ref("");
const guardandoPerfil = ref(false);
const guardadoPerfil = ref(false);
watch(() => props.estado.perfil, (p) => { Object.assign(perfil, Object.fromEntries(CAMPOS.map(([k]) => [k, p?.[k] || ""]))); original.value = JSON.stringify(perfil); }, { immediate: true });
const cambioPerfil = computed(() => JSON.stringify(perfil) !== original.value);

const suyas = computed(() => (props.estado.campanas || []).filter((c) => c.editable));
const dePlataforma = computed(() => (props.estado.campanas || []).filter((c) => !c.editable));
const pct = computed(() => { const a = props.estado.autonomia; return a.tope ? Math.min(100, Math.max(a.usadas ? 4 : 0, (a.usadas / a.tope) * 100)) : 0; });
const fecha = (s) => (s ? `${Number(s.slice(8, 10))}/${Number(s.slice(5, 7))}` : "");
function cuando(c) {
  const v = c.ventana || {};
  if (v.tipo === "fija") {
    const rango = v.hasta ? `${fecha(v.fecha)} al ${fecha(v.hasta)}` : fecha(v.fecha);
    return c.activa !== false && !c.hoy ? `terminó el ${fecha(v.hasta || v.fecha)}` : rango;
  }
  return v.tipo === "recurrente" ? v.cuando : "siempre";
}
const mensaje = (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || "No se pudo.";

// Lo que acepta el servicio al guardar: la campaña sin lo que agrega él (id, autor, fechas, hoy).
function entrada(c) {
  const { id, propia, autor, creada, actualizada, editable, hoy, rubro, escenas, ...resto } = c;
  return resto;
}
async function prender(c, ev) {
  error.value = "";
  cambiando.value = c.id;
  try {
    await guardarCampana(c.id, { ...entrada(c), activa: ev.target.checked });
    emit("cambio");
  } catch (e) {
    ev.target.checked = !ev.target.checked;
    error.value = e?.response?.data?.codigo === "tope_campanas" ? `Ya tenés ${props.estado.autonomia.tope} prendidas: apagá otra primero.` : mensaje(e);
  } finally { cambiando.value = ""; }
}
let espera;
async function borrar(c) {
  if (borrando.value !== c.id) { borrando.value = c.id; clearTimeout(espera); espera = setTimeout(() => { borrando.value = ""; }, 4000); return; }
  error.value = "";
  try { await borrarCampana(c.id); emit("cambio"); } catch (e) { error.value = mensaje(e); } finally { borrando.value = ""; }
}
async function guardar() {
  guardandoPerfil.value = true;
  error.value = "";
  try {
    await guardarPerfil({ ...perfil });
    original.value = JSON.stringify(perfil);
    guardadoPerfil.value = true;
    setTimeout(() => { guardadoPerfil.value = false; }, 2500);
    emit("cambio");
  } catch (e) { error.value = mensaje(e); } finally { guardandoPerfil.value = false; }
}
</script>

<style>
.mc { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
.mc-lista { flex: 999 1 600px; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.mc-estrategia { flex: 1 1 320px; display: flex; flex-direction: column; gap: 8px; }
.mc-t { margin: 0; font-size: 18px; font-weight: 900; }
.mc-uso { display: flex; flex-direction: column; gap: 4px; min-width: 160px; font-size: 14px; font-weight: 700; color: var(--sp-suave); }
.mc-pista { height: 8px; border-radius: 4px; background: var(--sp-linea); overflow: hidden; }
.mc-pista i { display: block; height: 100%; border-radius: 4px; background: var(--cm-pri); }
.mc-pista i.lleno { background: #c77700; }
.mc-nueva { margin-left: auto; }
.mc-vacio { padding: 18px 0; }
.mc-tabla { display: flex; flex-direction: column; }
.mc-fila { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1.3fr) 90px 150px; gap: 12px; align-items: center; padding: 12px 4px; border-bottom: 1px solid var(--sp-linea); }
.mc-fila--cab { font-size: 13px; font-weight: 800; color: var(--sp-suave); padding-top: 4px; }
.mc-fila.is-off .mc-nombre { color: var(--sp-suave); }
.mc-nombre { text-align: left; border: 0; background: none; padding: 0; color: var(--sp-texto); font-size: 16px; font-weight: 800; cursor: pointer; }
.mc-nombre:hover { text-decoration: underline; }
.mc-sw { border: 0; padding: 0; justify-content: flex-start; position: relative; width: 40px; }
/* La casilla real queda encima del dibujo (invisible): se usa con el teclado y la lee un lector. */
.mc .mc-sw input { display: block; position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
.mc .mc-sw input:focus-visible + i { outline: 2px solid var(--cm-pri); outline-offset: 2px; }
.mc-acc { display: flex; gap: 14px; justify-content: flex-end; }
.mc-borrar { color: var(--cm-mal); }
.mc-sub { margin: 8px 0 0; font-size: 13px; font-weight: 900; letter-spacing: .08em; color: var(--sp-suave); }
.mc-fila--plat b { font-size: 15px; }
.mc .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
@media (max-width: 640px) { .mc-fila { grid-template-columns: minmax(0, 1fr) auto; } .mc-fila--cab { display: none; } .mc-fila > :nth-child(2) { grid-column: 1; } }
</style>
