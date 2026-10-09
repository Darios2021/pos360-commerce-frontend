<!-- src/modules/pos/pages/PosPrinterSettingsPage.vue
     Impresion del ticket en ESTA computadora: por el navegador o directa a la
     termica con el programa local. Los ajustes viven en el navegador de cada
     mostrador (utils/impresion.js). -->
<template>
  <div class="imp">
    <AppPageHeader
      icon="mdi-printer-pos-outline"
      title="Impresión"
      subtitle="Ticket de venta en esta computadora"
    />

    <div class="imp-grid">
      <v-card class="imp-card" rounded="lg" elevation="0">
        <div class="imp-section">
          <div class="imp-label">Modo</div>
          <v-btn-toggle v-model="ajustes.modo" mandatory density="comfortable" color="primary" variant="outlined" divided>
            <v-btn value="navegador">Navegador</v-btn>
            <v-btn value="directa">Directa</v-btn>
          </v-btn-toggle>
        </div>

        <div class="imp-section">
          <div class="imp-label">Ancho del rollo</div>
          <v-btn-toggle v-model="ajustes.anchoPapel" mandatory density="comfortable" color="primary" variant="outlined" divided>
            <v-btn :value="80">80 mm</v-btn>
            <v-btn :value="58">58 mm</v-btn>
          </v-btn-toggle>
        </div>

        <div class="imp-section">
          <div class="imp-label">Programa de impresión</div>
          <div class="imp-estado" :class="estado ? 'is-ok' : 'is-off'">
            <v-icon size="18">{{ estado ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
            <span v-if="estado">Conectado · {{ estado.impresora || 'sin impresora' }}</span>
            <span v-else>No instalado en esta computadora</span>
            <v-btn variant="text" size="small" icon="mdi-refresh" :loading="consultando" @click="consultar" />
          </div>
        </div>

        <div class="imp-section">
          <div class="imp-label">Instalación en Windows (PowerShell)</div>
          <div class="imp-comando">
            <code>{{ COMANDO_INSTALAR }}</code>
            <v-btn variant="text" size="small" icon="mdi-content-copy" @click="copiar" />
          </div>
        </div>

        <div class="imp-section">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-printer" :loading="imprimiendo" @click="prueba">
            Ticket de prueba
          </v-btn>
        </div>
      </v-card>

      <v-card class="imp-card" rounded="lg" elevation="0">
        <div class="imp-label">Vista del ticket directo</div>
        <pre class="imp-vista" :style="{ width: `${columnas + 2}ch` }"><template v-for="(r, i) in renglones" :key="i"><span :class="{ 'is-b': r.negrita, 'is-d': r.doble }">{{ alinear(r) }}</span>
</template></pre>
      </v-card>
    </div>

    <!-- El ticket de prueba por el navegador sale de este elemento -->
    <div id="pos-ticket" class="imp-oculto">
      <pre>{{ renglones.map(alinear).join('\n') }}</pre>
    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import { armarTicket, columnasDe } from "../utils/escpos";
import {
  COMANDO_INSTALAR,
  estadoProgramaLocal,
  guardarAjustesImpresion,
  imprimirTicket,
  leerAjustesImpresion,
} from "../utils/impresion";

const ajustes = reactive(leerAjustesImpresion());
watch(ajustes, (a) => guardarAjustesImpresion({ ...a }));

const PRUEBA = {
  id: 0,
  sale_number: "PRUEBA",
  sold_at: new Date().toISOString(),
  customer_name: "Consumidor Final",
  total: 15500,
  paid_total: 20000,
  change_total: 4500,
  items: [
    { product_name_snapshot: "Mouse inalámbrico", product_sku_snapshot: "MOU-001", qty: 1, unit_price: 9500 },
    { product_name_snapshot: "Cable USB-C 1 m", qty: 2, unit_price: 3000 },
  ],
  payments: [{ method: "CASH", amount: 15500 }],
};
const datosPrueba = { sale: PRUEBA, companyName: "San Juan Tecnología", branchName: "" };

const columnas = computed(() => columnasDe(ajustes.anchoPapel));
const renglones = computed(() => armarTicket(datosPrueba, columnas.value));

function alinear(r) {
  const ancho = r.doble ? Math.floor(columnas.value / 2) : columnas.value;
  if (!r.centro) return r.texto;
  return " ".repeat(Math.max(0, Math.floor((ancho - r.texto.length) / 2))) + r.texto;
}

const estado = ref(null);
const consultando = ref(false);
async function consultar() {
  consultando.value = true;
  estado.value = await estadoProgramaLocal();
  consultando.value = false;
}
onMounted(consultar);

const snack = ref({ show: false, text: "", color: "success" });

async function copiar() {
  try {
    await navigator.clipboard.writeText(COMANDO_INSTALAR);
    snack.value = { show: true, text: "Comando copiado.", color: "success" };
  } catch {
    snack.value = { show: true, text: "No se pudo copiar.", color: "error" };
  }
}

const imprimiendo = ref(false);
async function prueba() {
  imprimiendo.value = true;
  try {
    const por = await imprimirTicket(datosPrueba, porElNavegador);
    if (por === "directa") {
      snack.value = { show: true, text: "Ticket de prueba enviado a la impresora.", color: "success" };
    } else if (ajustes.modo === "directa") {
      snack.value = { show: true, text: "El programa de impresión no respondió: salió por el navegador.", color: "warning" };
    }
  } finally {
    imprimiendo.value = false;
  }
}

function porElNavegador() {
  const el = document.getElementById("pos-ticket");
  if (!el) return;
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(f);
  const d = f.contentDocument;
  d.open();
  d.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0}
    body{width:${ajustes.anchoPapel}mm;padding:3mm 2mm}
    pre{font-family:'Courier New',Courier,monospace;font-size:${ajustes.anchoPapel === 58 ? 9 : 10}px;white-space:pre}
    @media print{@page{margin:0;size:${ajustes.anchoPapel}mm auto}}
  </style></head><body>${el.innerHTML}</body></html>`);
  d.close();
  setTimeout(() => {
    f.contentWindow.focus();
    f.contentWindow.print();
    setTimeout(() => f.remove(), 1000);
  }, 300);
}
</script>

<style scoped>
.imp {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}
.imp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}
.imp-card {
  padding: 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.imp-section + .imp-section { margin-top: 20px; }
.imp-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: rgba(var(--v-theme-on-surface), .6);
  margin-bottom: 8px;
}
.imp-estado {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.imp-estado.is-ok .v-icon { color: rgb(var(--v-theme-success)); }
.imp-estado.is-off .v-icon { color: rgba(var(--v-theme-on-surface), .45); }
.imp-comando {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 6px 6px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), .05);
  max-width: 100%;
}
.imp-comando code {
  font-size: 12px;
  overflow-x: auto;
  white-space: nowrap;
  flex: 1;
}
.imp-vista {
  margin: 0;
  padding: 12px;
  background: #fff;
  color: #000;
  border: 1px solid #ddd;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.35;
  white-space: pre;
  overflow-x: auto;
  max-width: 100%;
  box-sizing: content-box;
}
.imp-vista .is-b { font-weight: 700; }
.imp-vista .is-d { font-size: 2em; line-height: 1.1; }
.imp-oculto { display: none; }

@media (max-width: 1280px) {
  .imp-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .imp { padding: 12px; }
  .imp-vista { font-size: 9px; }
}
</style>
