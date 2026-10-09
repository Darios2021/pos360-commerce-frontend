<!-- src/modules/pos/components/PosClienteVenta.vue
     Cliente de la ficha para la venta en curso. Se elige en el carrito, antes
     de cobrar, porque define el precio: si es mayorista, todo el carrito pasa
     a precio Revendedor (pos.store: setClienteVenta / setUsarPrecioMayorista).
     Diseño de Zondito: sin cliente, el campo; con cliente, la ficha verde y,
     si es mayorista, el selector de precio con el estilo de Retiro/Delivery. -->
<template>
  <div class="cv">
    <template v-if="cliente">
      <div class="cv-ficha">
        <span class="cv-avatar">{{ inicial }}</span>
        <span class="cv-datos">
          <span class="cv-nombre-fila">
            <span class="cv-nombre">{{ cliente.display_name }}</span>
            <v-icon size="15" class="cv-ok">mdi-account-check</v-icon>
          </span>
          <span class="cv-sub">{{ subtitulo }}</span>
        </span>
        <button
          type="button"
          class="cv-sacar"
          :disabled="disabled"
          title="Sacar el cliente de esta venta"
          aria-label="Sacar el cliente de esta venta"
          @click="elegir(null)"
        >
          <v-icon size="19">mdi-account-remove-outline</v-icon>
        </button>
      </div>

      <div v-if="mayorista" class="cv-precio" role="group" aria-label="Precio de la venta">
        <button
          type="button"
          class="cv-seg"
          :class="{ 'is-on': aplicado }"
          :disabled="disabled"
          @click="usarRevendedor(true)"
        >
          <v-icon size="22">mdi-tag-outline</v-icon>
          Revendedor
        </button>
        <button
          type="button"
          class="cv-seg"
          :class="{ 'is-on': !aplicado }"
          :disabled="disabled"
          @click="usarRevendedor(false)"
        >
          <v-icon size="22">mdi-cash</v-icon>
          Precio normal
        </button>
      </div>
    </template>

    <v-autocomplete
      v-else
      :model-value="null"
      v-model:search="busqueda"
      :items="opciones"
      :loading="buscando"
      :disabled="disabled"
      item-title="display_name"
      item-value="id"
      return-object
      no-filter
      hide-details
      density="compact"
      variant="outlined"
      placeholder="Cliente (consumidor final)"
      prepend-inner-icon="mdi-account-search-outline"
      no-data-text="Sin resultados"
      class="cv-campo"
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

const cliente = computed(() => props.posStore?.clienteVenta || null);
const mayorista = computed(() => esMayorista(cliente.value));
const aplicado = computed(() => mayorista.value && props.posStore?.usarPrecioMayorista !== false);
const inicial = computed(() => String(cliente.value?.display_name || "?").trim().charAt(0).toUpperCase());
const subtitulo = computed(() => {
  const c = cliente.value || {};
  if (mayorista.value) return "Cliente mayorista";
  return [c.doc_number, c.phone].filter(Boolean).join(" · ") || "Cliente de la ficha";
});

let reloj = null;
let turno = 0;
watch(busqueda, (q) => {
  clearTimeout(reloj);
  const texto = String(q || "").trim();
  if (texto.length < 2) return;
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
  busqueda.value = "";
  opciones.value = [];
}

function usarRevendedor(activo) {
  props.posStore?.setUsarPrecioMayorista?.(activo);
}
</script>

<style scoped>
.cv {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--z-linea, rgba(15, 23, 42, 0.06));
}

.cv-ficha {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.28);
}
.cv-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #10b981;
  color: #ffffff;
  font: 900 15px Inter, sans-serif;
}
.cv-datos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.cv-nombre-fila {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.cv-nombre {
  font: 700 14px Inter, sans-serif;
  color: var(--z-texto, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cv-ok { color: #10b981 !important; flex-shrink: 0; }
.cv-sub {
  font-size: 12px;
  color: var(--z-suave, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cv-sacar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cv-sacar:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.cv-sacar :deep(.v-icon) { color: inherit; }

/* Selector de precio: el mismo grupo que Retiro/Delivery/Mesa en Zondito. */
.cv-precio {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.05);
}
.cv-seg {
  flex: 1;
  min-width: 0;
  height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--z-texto2, #334155);
  font: 700 12px Inter, sans-serif;
  cursor: pointer;
  transition: background 0.15s ease;
}
.cv-seg :deep(.v-icon) { color: inherit; }
.cv-seg.is-on {
  background: #0f6fae;
  color: #ffffff;
}
.cv-seg:disabled { opacity: 0.5; cursor: default; }

.cv-campo :deep(.v-field) {
  border-radius: 8px;
  min-height: 42px;
  font-size: 14px;
  background: var(--z-campo, #ffffff);
}
.cv-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(15, 111, 174, 0.12);
  color: #0f6fae;
  white-space: nowrap;
}
</style>
