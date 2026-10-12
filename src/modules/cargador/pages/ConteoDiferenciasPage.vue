<!--
  Diferencias del conteo (maqueta, "conteo-revisar"): los productos con
  diferencia, el motivo y un solo botón. Dueño: "Aplicar conteo" (fija el
  stock y registra el ajuste). Cajero: "Enviar para aprobar".
-->
<template>
  <MovilVista titulo="Diferencias" :volver="{ name: 'conteo' }">
    <div v-if="error" class="m-error">{{ error }}</div>
    <div class="m-pz">
      <div class="m-pz-h"><h3>{{ deposito ? rotuloDeposito(deposito) : "Depósito" }}</h3><span class="num">{{ productos(lineas.length) }}</span></div>
      <div v-if="!lineas.length" class="m-ln"><span class="tx"><b>Sin diferencias</b></span></div>
      <div v-for="l in lineas" :key="l.product_id" class="m-ln">
        <Miniatura :src="l.image || ''" />
        <span class="tx"><b>{{ l.name }}</b><small class="num">Sistema {{ cant(l.sistema) }} · Contado {{ cant(l.contado) }}</small></span>
        <span class="m-dif num" :style="{ color: diferencia(l) < 0 ? 'var(--m-rojo)' : 'var(--m-ocre)' }">{{ (diferencia(l) > 0 ? "+" : "−") + cant(Math.abs(diferencia(l))) }}</span>
      </div>
    </div>
    <div class="m-cmp">
      <label for="cd-mot">Motivo</label>
      <input id="cd-mot" v-model="conteo.motivo" class="m-inp" placeholder="Conteo de góndola" />
    </div>
    <template #pie>
      <button type="button" class="m-btn" :disabled="enviando || !conteo.lineas.length || !String(conteo.motivo || '').trim()" @click="cerrar">{{ esAdmin ? "Aplicar conteo" : "Enviar para aprobar" }}</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import Miniatura from "../components/Miniatura.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { cant, productos } from "../lib/formato";
import { avisar } from "../lib/aviso";
import { cargarDepositos, depositos, rotuloDeposito } from "../lib/depositos";
import { aplicarConteo, enviarConteo, fijarStock, textoError } from "../services/conteos.service";
import { conDiferencia, conteo, diferencia, nuevoConteo, refrescarConteo } from "../state/conteo";

const router = useRouter();
const auth = useAuthStore();
const esAdmin = computed(() => auth.isAdmin === true);
const enviando = ref(false);
const error = ref("");
const deposito = computed(() => depositos.value.find((w) => Number(w.id) === Number(conteo.warehouseId)) || null);
const lineas = computed(() => conDiferencia());

async function cerrar() {
  enviando.value = true;
  error.value = "";
  const motivo = String(conteo.motivo || "").trim();
  try {
    if (conteo.local) {
      // API sin conteos: el dueño fija el stock producto por producto.
      if (!esAdmin.value) { error.value = "Sin aprobación de conteos en el servidor"; return; }
      for (const l of conDiferencia()) await fijarStock({ product_id: l.product_id, warehouse_id: conteo.warehouseId, qty: l.contado });
    } else if (esAdmin.value) {
      await aplicarConteo(conteo.servidorId, motivo);
    } else {
      await enviarConteo(conteo.servidorId, motivo);
    }
    const dep = conteo.warehouseId;
    nuevoConteo(dep);
    avisar(esAdmin.value ? "Conteo aplicado" : "Conteo enviado");
    router.replace({ name: "home" });
  } catch (e) {
    error.value = textoError(e, "No se pudo cerrar el conteo");
  } finally {
    enviando.value = false;
  }
}

onMounted(() => {
  cargarDepositos();
  refrescarConteo();
});
</script>
