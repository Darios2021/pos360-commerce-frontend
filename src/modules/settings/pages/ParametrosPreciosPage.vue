<!-- src/modules/settings/pages/ParametrosPreciosPage.vue -->
<!-- Parámetros de precios (Sistema, maqueta aprobada 10/10): IIBB, recargo
     sobre la ganancia y reparto franquicia/local. Se guardan en el servidor
     (vale para todos) y los usa el reporte de ganancia. El ejemplo repite la
     cuenta de la planilla del negocio con los valores de la pantalla. -->
<template>
  <div class="sp pp-pg">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Parámetros de precios</h1>
        <span class="sp-cab__sub">Los usa el reporte de ganancia</span>
      </div>
      <v-btn color="primary" variant="flat" class="sp-nuevo" :loading="guardando" :disabled="!cambiado" @click="guardar">Guardar cambios</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="se-grilla">
      <section class="sp-caja">
        <div class="se-banda"><span>Impuestos y recargos</span></div>
        <div class="se-campos">
          <label class="se-campo"><span>IIBB</span>
            <v-text-field v-model.number="form.iibb" type="number" min="0" step="0.1" suffix="%" density="comfortable" variant="outlined" hide-details />
          </label>
          <label class="se-campo"><span>Recargo sobre la ganancia</span>
            <v-text-field v-model.number="form.recargo" type="number" min="0" step="0.1" suffix="%" density="comfortable" variant="outlined" hide-details />
          </label>
        </div>
      </section>

      <section class="sp-caja">
        <div class="se-banda"><span>Reparto de la ganancia</span></div>
        <div class="se-campos">
          <label class="se-campo"><span>Franquicia</span>
            <v-text-field v-model.number="form.franquicia" type="number" min="0" max="100" suffix="%" density="comfortable" variant="outlined" hide-details />
          </label>
          <label class="se-campo"><span>Local</span>
            <v-text-field :model-value="local" suffix="%" density="comfortable" variant="outlined" hide-details disabled />
          </label>
          <div class="se-campo--ancho pp-barra"><span :style="{ width: `${fr}%` }"></span><span :style="{ width: `${100 - fr}%` }"></span></div>
        </div>
      </section>
    </div>

    <section class="sp-caja">
      <div class="se-banda"><span>Cómo queda un producto de $ 1.000 de costo</span><small>con 50 % de ganancia e IVA 21 %</small></div>
      <div class="pp-ej num">
        <template v-for="(p, i) in ejemplo" :key="p.t">
          <span class="pp-paso" :class="{ 'is-fin': i === ejemplo.length - 1 }"><small>{{ p.t }}</small><b>{{ p.v }}</b></span>
          <v-icon v-if="i < ejemplo.length - 1" size="22" class="pp-flecha">mdi-chevron-right</v-icon>
        </template>
        <span class="pp-reparto">Ganancia $ 500 · franquicia {{ pesos(500 * fr / 100) }} / local {{ pesos(500 * (100 - fr) / 100) }}</span>
      </div>
    </section>

    <v-snackbar v-model="aviso" :timeout="2400">Parámetros guardados</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useParametrosPrecios } from "@/modules/reports/composables/useParametrosPrecios";
import "@/modules/products/styles/proveedores.css";

const { parametros, cargar, guardar: guardarParametros } = useParametrosPrecios();
const form = reactive({ iibb: 3.5, recargo: 11, franquicia: 60 });
const guardando = ref(false);
const error = ref("");
const aviso = ref(false);

const n = (v) => Number(v || 0);
const fr = computed(() => Math.round(Math.min(100, Math.max(0, n(form.franquicia)))));
const local = computed(() => 100 - fr.value);
const cambiado = computed(() => n(form.iibb) !== n(parametros.iibb) || n(form.recargo) !== n(parametros.recargo) || fr.value !== Math.round(n(parametros.franquicia)));
const pesos = (v) => `$ ${n(v).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const ejemplo = computed(() => {
  const g = 1500;
  const r = g * (1 + n(form.recargo) / 100);
  const ib = r * (1 + n(form.iibb) / 100);
  const fin = ib * 1.21;
  return [
    { t: "Costo", v: pesos(1000) },
    { t: "+ 50 % ganancia", v: pesos(g) },
    { t: `+ ${n(form.recargo).toLocaleString("es-AR")} %`, v: pesos(r) },
    { t: `+ IIBB ${n(form.iibb).toLocaleString("es-AR")} %`, v: pesos(ib) },
    { t: "Precio final", v: pesos(fin) },
  ];
});

async function guardar() {
  guardando.value = true;
  error.value = "";
  try {
    await guardarParametros({ iibb: n(form.iibb), recargo: n(form.recargo), franquicia: fr.value });
    aviso.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron guardar los parámetros";
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  await cargar();
  Object.assign(form, { iibb: parametros.iibb, recargo: parametros.recargo, franquicia: parametros.franquicia });
});
</script>

<style>
.pp-barra { height: 14px; border-radius: 9999px; overflow: hidden; display: flex; background: var(--sp-linea); }
.pp-barra span:first-child { background: #0f6fae; }
.pp-barra span:last-child { background: #8cc0e3; }
.pp-ej { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 18px 16px; }
.pp-paso { display: flex; flex-direction: column; padding: 10px 14px; border-radius: 10px; background: var(--sp-hover); border: 1px solid var(--sp-linea); }
.pp-paso small { font-size: 12px; font-weight: 700; color: var(--sp-suave); }
.pp-paso b { font-size: 20px; font-weight: 900; }
.pp-paso.is-fin { background: rgba(15, 111, 174, 0.08); border: 2px solid #0f6fae; }
.pp-flecha { color: var(--sp-tenue) !important; }
.pp-reparto { flex-basis: 100%; font-size: 14px; font-weight: 600; color: var(--sp-suave); }
</style>
