<!-- src/modules/pos/components/PosClienteVenta.vue
     Cliente de la ficha para la venta en curso. Se elige en el carrito, antes
     de cobrar, porque define el precio: si es mayorista, todo el carrito pasa
     a precio Revendedor (pos.store: setClienteVenta). -->
<template>
  <div class="cv">
    <v-autocomplete
      :model-value="posStore?.clienteVenta || null"
      v-model:search="busqueda"
      :items="opciones"
      :loading="buscando"
      :disabled="disabled"
      item-title="display_name"
      item-value="id"
      return-object
      no-filter
      clearable
      hide-details
      density="compact"
      variant="outlined"
      placeholder="Cliente"
      prepend-inner-icon="mdi-account-search-outline"
      no-data-text="Sin resultados"
      @update:model-value="elegir"
    >
      <template #item="{ props: ip, item }">
        <v-list-item v-bind="ip" :subtitle="item.raw.doc_number || item.raw.phone || ''">
          <template #append>
            <span v-if="esMayorista(item.raw)" class="cv-tag">Mayorista</span>
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>
    <span v-if="mayorista" class="cv-tag cv-tag--on" :class="{ 'is-off': !aplicado }">
      {{ aplicado ? "Precio revendedor aplicado" : "Cliente mayorista: precio normal" }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { listCustomers } from "@/modules/admin/services/customers.service";
import { esMayorista } from "@/app/utils/clienteMayorista";

const props = defineProps({
  posStore: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
});

const busqueda = ref("");
const opciones = ref([]);
const buscando = ref(false);
const mayorista = computed(() => esMayorista(props.posStore?.clienteVenta));
const aplicado = computed(() => mayorista.value && props.posStore?.usarPrecioMayorista !== false);

let reloj = null;
let turno = 0;
watch(busqueda, (q) => {
  clearTimeout(reloj);
  const texto = String(q || "").trim();
  const elegido = props.posStore?.clienteVenta?.display_name;
  if (texto.length < 2 || texto === elegido) return;
  reloj = setTimeout(async () => {
    const mio = ++turno;
    buscando.value = true;
    try {
      const { data } = await listCustomers({ q: texto, limit: 15, is_active: 1 });
      if (mio === turno) opciones.value = data?.data || [];
    } catch {
      if (mio === turno) opciones.value = [];
    } finally {
      if (mio === turno) buscando.value = false;
    }
  }, 300);
});

function elegir(c) {
  props.posStore?.setClienteVenta?.(c && c.id ? c : null);
  if (c?.id) opciones.value = [c];
}
</script>

<style scoped>
.cv {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px 0;
}
.cv-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), .12);
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
}
.cv-tag--on {
  align-self: flex-start;
  font-size: 12px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.cv-tag--on.is-off {
  background: rgba(var(--v-theme-on-surface), .08);
  color: rgba(var(--v-theme-on-surface), .7);
}
</style>
